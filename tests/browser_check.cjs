// Optional real Chromium check. No npm packages. Run from the repository root.
// Creates an isolated headless profile under results/temp and saves real evidence.
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const assert=require('node:assert/strict');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function main(){
  const output=path.resolve(process.argv[2]||'results/browser_check_'+randomUUID());
  const executable=process.argv[3]||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const python=process.env.ASTROSHIELD_PYTHON||path.resolve('.venv/Scripts/python.exe');
  fs.mkdirSync(output,{recursive:true});
  const profile=path.resolve('results/temp/browser_'+randomUUID());
  const serverPort=5057, debugPort=9227;
  const base=`http://127.0.0.1:${serverPort}`;
  const report={started_at_utc:new Date().toISOString(),browser:executable,checks:[],errors:[]};
  let socket, browser, server;
  const pending=new Map();let seq=0;const events=[];
  function command(method,params={}){
    const id=++seq;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method))},15000);
      pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value)},reject:error=>{clearTimeout(timer);reject(error)}});
      socket.send(JSON.stringify({id,method,params}));
    });
  }
  async function until(fn,label,timeout=20000){
    const start=Date.now();
    while(Date.now()-start<timeout){const r=await fn();if(r)return r;await pause(100)}
    throw Error('Timeout: '+label);
  }
  async function evaluate(expression){
    const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  }
  async function screenshot(name){
    const clip=await evaluate(`(()=>{const r=document.querySelector('#globe-container canvas').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()`);
    const r=await command('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});
    fs.writeFileSync(path.join(output,name),Buffer.from(r.data,'base64'));
    return r.data;
  }
  try{
    const code=`import app; from functools import partial; from src.visualization.exporter import save_result; app.save_result=partial(save_result,output_dir=${JSON.stringify(output.replaceAll('\\','/'))}); app.app.run(host='127.0.0.1',port=${serverPort},debug=False)`;
    server=spawn(python,['-B','-c',code],{windowsHide:true,stdio:['ignore','ignore','pipe']});
    let serverLog='';server.stderr.on('data',x=>serverLog+=x.toString());
    await until(async()=>{try{return (await fetch(base+'/api/scenario')).ok}catch{return false}},'local Flask server');
    browser=spawn(executable,['--headless=new','--no-first-run','--no-default-browser-check',
      '--enable-unsafe-swiftshader',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'],
      {windowsHide:true,stdio:'ignore'});
    const target=await until(async()=>{try{return (await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(x=>x.type==='page')}catch{return false}},'Chromium debugging endpoint');
    socket=new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
    socket.onmessage=event=>{
      const m=JSON.parse(event.data);
      if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(p)m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}
      else{events.push(m);if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails)}
    };
    await command('Page.enable');await command('Runtime.enable');await command('Network.enable');
    await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1600,deviceScaleFactor:1,mobile:false});
    await command('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:output,eventsEnabled:true});
    await command('Page.navigate',{url:base});
    await until(()=>evaluate("document.querySelectorAll('#region-list .region-item').length===6 && !!document.querySelector('#globe-container canvas')"),'scenario and real WebGL');
    report.checks.push('Carga de seis regiones y canvas WebGL real');
    await evaluate("document.querySelector('#seed').value='42';document.querySelector('#run-btn').click()");
    await until(()=>evaluate("document.querySelectorAll('#satellite-table tr').length===8 && !document.querySelector('#run-btn').disabled"),'eight calculated satellites');
    const response=events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.url===base+'/api/optimize').at(-1);
    const result=JSON.parse((await command('Network.getResponseBody',{requestId:response.params.requestId})).body);
    assert.equal(result.best.length,8);assert.equal(result.status,'complete');
    const finalTable=await evaluate("Array.from(document.querySelectorAll('#satellite-table tr')).map(r=>r.textContent)");
    assert.ok(result.best.every((s,i)=>finalTable[i].includes(s.lat.toFixed(3))&&finalTable[i].includes(s.lon.toFixed(3))));
    assert.equal(await evaluate("document.querySelectorAll('#validation-list .validation-item').length"),5);
    assert.equal(await evaluate("document.querySelector('#legend-region-count').textContent"),'6 / 6');
    report.checks.push('Ocho coordenadas de la API coinciden con la tabla; cinco exclusiones; cobertura final 6/6');
    await evaluate("document.querySelector('#show-initial').click()");
    assert.equal(await evaluate("document.querySelector('#legend-region-count').textContent"),`${result.initial_metrics.covered_count} / 6`);
    const initialTable=await evaluate("Array.from(document.querySelectorAll('#satellite-table tr')).map(r=>r.textContent)");
    assert.ok(result.initial.every((s,i)=>initialTable[i].includes(s.lat.toFixed(3))));
    await screenshot('initial.png');
    await evaluate("document.querySelector('#show-final').click()");
    assert.equal(await evaluate("document.querySelector('#legend-region-count').textContent"),'6 / 6');
    report.checks.push('Vistas inicial y final sincronizan tabla e indicadores con métricas reales');
    const rect=await evaluate("(()=>{const r=document.querySelector('#globe-container canvas').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
    await command('Input.dispatchMouseEvent',{type:'mousePressed',x:rect.x,y:rect.y,button:'left',clickCount:1});
    await command('Input.dispatchMouseEvent',{type:'mouseReleased',x:rect.x,y:rect.y,button:'left',clickCount:1});
    await pause(150);const before=await screenshot('final.png');
    await command('Input.dispatchMouseEvent',{type:'mousePressed',x:rect.x,y:rect.y,button:'left',clickCount:1});
    await command('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x+90,y:rect.y+25,buttons:1});
    await command('Input.dispatchMouseEvent',{type:'mouseReleased',x:rect.x+90,y:rect.y+25,button:'left',clickCount:1});
    await pause(150);const dragged=await screenshot('dragged.png');
    assert.notEqual(before,dragged);
    await command('Input.dispatchMouseEvent',{type:'mouseWheel',x:rect.x,y:rect.y,deltaX:0,deltaY:-250});
    await pause(150);const zoomed=await screenshot('zoomed.png');assert.notEqual(dragged,zoomed);
    report.checks.push('Arrastre y rueda cambian la imagen renderizada, con rotación automática detenida');
    await evaluate("document.querySelector('#export-btn').click()");
    const exported=await until(()=>fs.existsSync(path.join(output,'astroshield_resultado.json')),'downloaded JSON');
    assert.ok(exported);assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output,'astroshield_resultado.json'),'utf8')),result);
    report.checks.push('Descarga JSON real idéntica al resultado recibido');
    report.status='passed';report.metrics={initial:result.initial_metrics,final:result.metrics};
    report.server_log=serverLog;
  }catch(error){report.status='failed_or_unavailable';report.error=String(error);console.error(error)}
  finally{
    if(socket?.readyState===1){try{await command('Browser.close')}catch{}socket.close()}
    if(browser&&!browser.killed)browser.kill();if(server&&!server.killed)server.kill();
    fs.writeFileSync(path.join(output,'browser_report.json'),JSON.stringify(report,null,2));
  }
  console.log(JSON.stringify({output,status:report.status,checks:report.checks,error:report.error},null,2));
  if(report.status!=='passed')process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1});
