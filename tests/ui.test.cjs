// Behavior tests for the actual app script, with a small DOM/network substitute.
// These do not claim to render WebGL or verify browser appearance.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

function setup(){
  const elements=new Map();
  function element(id){
    if(!elements.has(id))elements.set(id,{value:{generations:'12',population:'20',mutation:'0.22',seed:'42'}[id]??'',
      textContent:'',innerHTML:'',style:{},disabled:false,events:{},classList:{toggle(){},add(){},remove(){}},
      addEventListener(name,fn){this.events[name]=fn},appendChild(){},scrollTop:0,scrollHeight:0});
    return elements.get(id);
  }
  const source=fs.readFileSync(path.join(__dirname,'../web/js/app.js'),'utf8')
    .replace(/^import .*;\r?\n/,'').split('(async()=>{setBusy(false);')[0];
  const context=vm.createContext({document:{getElementById:element,createElement:()=>element('temporary')},
    window:{addEventListener(){}},console,Blob,URL,fetch:()=>{throw Error('Unexpected request')},THREE:{}});
  vm.runInContext(source,context);
  vm.runInContext('drawChart = h => { globalThis.chartHistory=h }; downloadBlob=(b,n)=>{globalThis.download={blob:b,name:n}};',context);
  const result={schema_version:2,status:'complete',parameters:{seed:42},best:Array.from({length:8},(_,i)=>({id:`s${i}`,lat:i,lon:i})),
    initial:Array.from({length:8},(_,i)=>({id:`s${i}`,lat:-i,lon:-i})),scenario:{regions:[{id:'r',name:'Región',lat:0,lon:0,priority:'Alta',weight:3}],
    restricted_zones:[{id:'z',name:'Zona',lat:45,lon:-35,radius_deg:12}],occupied_objects:[]},history:[{generation:0,best_so_far:0},{generation:12,best_so_far:100}]};
  const metric=covered=>({fitness:covered?100:0,weighted_coverage_pct:covered?100:0,covered_count:covered?1:0,total_regions:1,
    valid:true,validation:{valid:true,violations:[],violation_count:0,errors:[]},regions:[{id:'r',covered,nearest_satellite:'s0',nearest_distance_km:covered?0:1000}]});
  result.metrics=metric(true);result.initial_metrics=metric(false);
  context.fixture=result;
  vm.runInContext('state.scenario=JSON.parse(JSON.stringify(fixture.scenario));state.result=fixture;state.globe={update(r,s,m){globalThis.globeCall={r,s,m}}};setBusy(false)',context);
  return {context,element,result,run:code=>vm.runInContext(code,context)};
}

test('initial/final synchronize metrics, positions, coverage, table, legend and full-run curve',()=>{
  const {context:c,element:e,result:r,run}=setup();
  run("state.scenario.regions[0].name='Scenario changed'");
  e('show-initial').events.click();
  assert.equal(e('fitness-label').textContent,'APTITUD INICIAL');
  assert.equal(e('legend-region-count').textContent,'0 / 1');
  assert.match(e('region-list').innerHTML,/SIN COBERTURA/);
  assert.doesNotMatch(e('region-list').innerHTML,/Scenario changed/);
  assert.match(e('satellite-table').innerHTML,/-1.000/);
  assert.equal(c.globeCall.s,r.scenario);
  assert.equal(c.globeCall.m,'initial');
  assert.equal(e('summary-zone-count').textContent,'01');
  assert.equal(e('sidebar-exclusion-count').textContent,'01');
  assert.equal(c.chartHistory,r.history);
  e('show-final').events.click();
  assert.equal(e('fitness-label').textContent,'APTITUD FINAL');
  assert.equal(e('legend-region-count').textContent,'1 / 1');
  assert.match(e('solution-state').textContent,/OBJETIVO CUMPLIDO/);
  assert.equal(c.globeCall.m,'final');
});

test('legacy initial view is explicitly unavailable, exports preserve original result',async()=>{
  const {context:c,element:e,result:r,run}=setup();
  delete r.initial_metrics;
  run("setBusy(false);showView('initial');exportResult()");
  assert.equal(e('show-initial').disabled,true);
  assert.equal(JSON.parse(await c.download.blob.text()).parameters.seed,42);
  assert.equal(JSON.parse(await c.download.blob.text()).scenario.regions[0].name,'Región');
});

test('comparison holds controls through all five requests and blocks scenario changes and overlaps',async()=>{
  const {context:c,element:e,result:r,run}=setup();
  let release;const payloads=[];
  c.fetch=(_url,options)=>{payloads.push(JSON.parse(options.body));return new Promise(resolve=>{release=()=>resolve({ok:true,json:async()=>r})})};
  const pending=run('compareRuns()');
  for(let i=0;i<5;i++){
    assert.equal(e('run-btn').disabled,true);
    assert.equal(e('compare-btn').disabled,true);
    assert.equal(e('stress-btn').disabled,true);
    assert.equal(e('generations').disabled,true);
    await e('stress-btn').events.click();
    await run('runOptimization()');
    await run('compareRuns()');
    assert.equal(payloads.length,i+1);
    assert.equal(payloads[i].seed,42+i);
    assert.equal(payloads[i].restricted_zones.length,1);
    release();await new Promise(resolve=>setImmediate(resolve));
  }
  await pending;
  assert.equal(e('run-btn').disabled,false);
  const comparison=JSON.parse(await c.download.blob.text()).comparison;
  assert.equal(comparison.length,5);
  assert.ok(comparison.every(x=>x.scenario&&x.parameters));
});

test('network failure restores controls and leaves previous identified result',async()=>{
  const {context:c,element:e,result:r,run}=setup();
  c.fetch=async()=>{throw Error('Network offline')};
  await run('runOptimization()');
  assert.equal(e('run-btn').disabled,false);
  assert.equal(e('priority-btn').disabled,false);
  assert.equal(run('state.result'),r);
  assert.match(e('run-status').innerHTML,/ERROR/);
  await run('compareRuns()');
  assert.equal(e('compare-btn').disabled,false);
});

test('partial coverage is never labelled objective fulfilled',async()=>{
  const {context:c,element:e,result:r,run}=setup();
  r.metrics=r.initial_metrics;r.status='partial';
  c.fetch=async()=>({ok:true,json:async()=>r});
  await run('runOptimization()');
  assert.match(e('run-status').innerHTML,/COBERTURA PARCIAL/);
  assert.equal(e('solution-state').textContent,'VÁLIDA / PARCIAL');
});

test('only the violated exclusion is marked when names repeat',()=>{
  const {element:e,result:r,run}=setup();
  r.scenario.restricted_zones.push({...r.scenario.restricted_zones[0],id:'other',lat:-45,lon:145});
  r.metrics.valid=false;r.metrics.validation={valid:false,errors:[],violation_count:1,
    violations:[{satellite:'s0',zones:['Zona'],zone_ids:['z']}]};
  run("showView('final')");
  assert.equal((e('validation-list').innerHTML.match(/CON INFRACCIONES/g)||[]).length,1);
  assert.equal((e('validation-list').innerHTML.match(/SIN INFRACCIONES/g)||[]).length,1);
});
