import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const $ = (id) => document.getElementById(id);
const state = { scenario: null, baselineScenario: null, result: null, view: 'final', globe: null, chart: null, compare: null, stressMode: false, priorityMode: false, busy: false };
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function log(message, kind='info') {
  const line = document.createElement('div');
  const time = new Date().toLocaleTimeString('es-MX', {hour12:false});
  const cls = kind === 'ok' ? 'log-ok' : kind === 'error' ? 'log-error' : kind === 'warn' ? 'log-warn' : '';
  line.innerHTML = `<span class="log-time">[${time}]</span> <span class="${cls}">${esc(message)}</span>`;
  $('terminal-log').appendChild(line); $('terminal-log').scrollTop = $('terminal-log').scrollHeight;
}
function setStatus(text, kind='info') { $('run-status').innerHTML = `<span class="pulse"></span> ${esc(text)}`; $('run-status').style.color = kind==='error'?'var(--red)':kind==='ok'?'var(--green)':'var(--muted)'; }
function updateLabels(){ $('generation-label').textContent=$('generations').value; $('population-label').textContent=$('population').value; $('mutation-label').textContent=Number($('mutation').value).toFixed(2); }

async function loadScenario(){
  const response = await fetch('/api/scenario'); if(!response.ok) throw new Error('No se pudo cargar el escenario.');
  state.scenario = await response.json(); state.baselineScenario = JSON.parse(JSON.stringify(state.scenario)); renderRegions(null); log('Escenario cargado: 8 satélites, 6 regiones, 5 exclusiones.','ok');
}
function renderMetrics(result,mode='final'){
  const m=mode==='initial'?result.initial_metrics:result.metrics;
  const sats=mode==='initial'?result.initial:result.best;
  $('fitness-label').textContent=mode==='initial'?'APTITUD INICIAL':'APTITUD FINAL'; $('fitness-value').innerHTML=`${Number(m.fitness).toFixed(1)}<small>/ 100</small>`;
  $('coverage-value').innerHTML=`${Number(m.weighted_coverage_pct).toFixed(1)}<small>%</small>`; $('coverage-meter').style.width=`${m.weighted_coverage_pct}%`;
  $('coverage-note').textContent=`${m.covered_count} de ${m.total_regions} regiones alcanzadas`;
  $('regions-value').innerHTML=`${m.covered_count}<small>/ ${m.total_regions}</small>`;
  $('valid-value').textContent=m.valid?'VÁLIDA':'INVÁLIDA'; $('valid-value').style.color=m.valid?'var(--green)':'var(--red)';
  $('valid-note').textContent=m.valid?'Cero violaciones de exclusión':`${m.validation.violation_count} satélite(s) en zona prohibida`;
  $('solution-state').textContent=m.valid?(m.covered_count===m.total_regions?'OBJETIVO CUMPLIDO':'VÁLIDA / PARCIAL'):'REVISAR RESTRICCIONES';
  $('globe-state').textContent=`${mode==='initial'?'INICIAL':'FINAL'} / ${m.valid?'VÁLIDA':'INVÁLIDA'}`;
  $('legend-sat-count').textContent=sats.length; $('legend-region-count').textContent=`${m.covered_count} / ${m.total_regions}`; $('legend-violations').textContent=m.validation.violation_count;
  $('summary-zone-count').textContent=String(result.scenario.restricted_zones.length).padStart(2,'0');
  $('summary-object-count').textContent=String(result.scenario.occupied_objects.length).padStart(2,'0');
  $('sidebar-exclusion-count').textContent=String(result.scenario.restricted_zones.length+result.scenario.occupied_objects.length).padStart(2,'0');
  renderRegions(m,result.scenario); renderSatellites(sats,m); renderValidation(m,result.scenario); drawChart(result.history);
}
function renderRegions(metrics,scenario=state.scenario){
  const regions=scenario?.regions||[]; if(!regions.length)return;
  $('region-list').innerHTML=regions.map(r=>{
    const d=metrics?.regions?.find(x=>x.id===r.id); const covered=d?.covered;
    return `<div class="region-item"><div class="region-main"><div><div class="region-name">${esc(r.name)}</div><div class="region-coords">${r.lat.toFixed(1)}°, ${r.lon.toFixed(1)}° · PRIORIDAD ${esc(r.priority.toUpperCase())}</div></div><span class="region-status ${covered?'covered':''}">${metrics?(covered?'CUBIERTA':'SIN COBERTURA'):'PENDIENTE'}</span></div><div class="region-distance">${d?`Satélite más cercano: ${esc(d.nearest_satellite||'—')} · ${d.nearest_distance_km.toLocaleString('es-MX')} km`:'Radio requerido: 300 km'}</div></div>`;
  }).join('');
}
function renderSatellites(sats,metrics){
  $('satellite-table').innerHTML=sats.map(s=>{const v=metrics.validation.violations.find(x=>x.satellite===s.id);return `<tr><td class="sat-id">${esc(s.id)}</td><td>${Number(s.lat).toFixed(3)}°</td><td>${Number(s.lon).toFixed(3)}°</td><td style="color:${v?'var(--red)':'var(--green)'}">${v?'VIOLACIÓN':'DENTRO DE LÍMITES'}</td></tr>`}).join('');
}
function renderValidation(metrics,scenario){
  const {validation}=metrics;
  const items=[...scenario.restricted_zones,...scenario.occupied_objects];
  $('validation-list').innerHTML=items.map(item=>{
    const fail=validation.violations.some(v=>v.zone_ids?v.zone_ids.includes(item.id):v.zones.includes(item.name));
    return `<div class="validation-item ${fail?'fail':''}"><div class="validation-icon">${fail?'!':'✓'}</div><div class="validation-copy"><b>${esc(item.name)} — ${fail?'CON INFRACCIONES':'SIN INFRACCIONES'}</b><span>Radio de exclusión ${item.radius_deg}° · centro ${item.lat}°, ${item.lon}°</span></div></div>`;
  }).join('');
  $('validation-footer').textContent=validation.valid?'Resultado: todas las posiciones cumplen las restricciones espaciales.':
    `La configuración es inválida. ${(validation.errors||[]).join(' ')} La puntuación no anula las restricciones obligatorias.`;
}
function drawChart(history){
  const canvas=$('evolution-chart'), wrap=canvas.parentElement; const rect=wrap.getBoundingClientRect(); if(!rect.width)return;
  const dpr=window.devicePixelRatio||1; canvas.width=rect.width*dpr; canvas.height=rect.height*dpr; const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const w=rect.width,h=rect.height,p={l:38,r:12,t:14,b:28};ctx.clearRect(0,0,w,h);
  if(!history?.length){$('chart-empty').style.display='grid';return;} $('chart-empty').style.display='none';
  const vals=history.map(x=>x.best_so_far);const min=Math.min(0,...vals),max=Math.max(100,...vals);const x=i=>p.l+i/Math.max(1,vals.length-1)*(w-p.l-p.r);const y=v=>h-p.b-(v-min)/(max-min||1)*(h-p.t-p.b);
  ctx.strokeStyle='#183322';ctx.lineWidth=1;ctx.fillStyle='#65836d';ctx.font='9px IBM Plex Mono, monospace';
  for(let i=0;i<=4;i++){const yy=p.t+i*(h-p.t-p.b)/4;ctx.beginPath();ctx.moveTo(p.l,yy);ctx.lineTo(w-p.r,yy);ctx.stroke();ctx.fillText(String(Math.round(max-(max-min)*i/4)),3,yy+3)}
  ctx.beginPath();vals.forEach((v,i)=>i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v)));ctx.lineTo(x(vals.length-1),h-p.b);ctx.lineTo(x(0),h-p.b);ctx.closePath();ctx.fillStyle='rgba(57,255,136,.07)';ctx.fill();
  ctx.beginPath();vals.forEach((v,i)=>i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v)));ctx.strokeStyle='#39ff88';ctx.lineWidth=2;ctx.shadowColor='#39ff88';ctx.shadowBlur=7;ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle='#65836d';ctx.fillText('GENERACIÓN 0',p.l,h-7);ctx.textAlign='right';ctx.fillText(`GENERACIÓN ${history[history.length-1].generation}`,w-p.r,h-7);ctx.textAlign='left';
  $('chart-summary').textContent=`${history.length} puntos de la ejecución completa · final ${vals[vals.length-1].toFixed(2)}`;
}

class GlobeView{
 constructor(container){
  this.container=container;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#050907');
  this.camera=new THREE.PerspectiveCamera(42,container.clientWidth/container.clientHeight,.1,1000);this.camera.position.set(0,0,4.4);
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));this.renderer.setSize(container.clientWidth,container.clientHeight);this.renderer.outputColorSpace=THREE.SRGBColorSpace;container.prepend(this.renderer.domElement);
  this.root=new THREE.Group();this.scene.add(this.root);this.earthGroup=new THREE.Group();this.root.add(this.earthGroup);
  this.scene.add(new THREE.AmbientLight(0x8ab99a,2.0));const light=new THREE.DirectionalLight(0x9effc1,2.7);light.position.set(4,3,5);this.scene.add(light);
  this.makeEarth();this.makeGrid();this.makeStars();this.drag={active:false,x:0,y:0};this.autoRotate=true;
  this.renderer.domElement.addEventListener('pointerdown',e=>{this.drag.active=true;this.drag.x=e.clientX;this.drag.y=e.clientY;this.autoRotate=false;this.renderer.domElement.setPointerCapture(e.pointerId)});
  this.renderer.domElement.addEventListener('pointermove',e=>{if(!this.drag.active)return;this.root.rotation.y+=(e.clientX-this.drag.x)*.006;this.root.rotation.x+=(e.clientY-this.drag.y)*.006;this.drag.x=e.clientX;this.drag.y=e.clientY});
  this.renderer.domElement.addEventListener('pointerup',()=>{this.drag.active=false});this.renderer.domElement.addEventListener('wheel',e=>{this.camera.position.z=Math.max(2.7,Math.min(7,this.camera.position.z+e.deltaY*.003));},{passive:true});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.animate();
 }
 makeEarth(){
  const geo=new THREE.SphereGeometry(1,72,48);const mat=new THREE.MeshPhongMaterial({color:0x123e2a,emissive:0x06190e,emissiveIntensity:.8,shininess:20,wireframe:false});this.earth=new THREE.Mesh(geo,mat);this.earthGroup.add(this.earth);
  const wire=new THREE.Mesh(new THREE.SphereGeometry(1.003,36,24),new THREE.MeshBasicMaterial({color:0x2b8852,wireframe:true,transparent:true,opacity:.12}));this.earthGroup.add(wire);
  const glow=new THREE.Mesh(new THREE.SphereGeometry(1.055,48,32),new THREE.MeshBasicMaterial({color:0x19d66b,transparent:true,opacity:.045,side:THREE.BackSide}));this.earthGroup.add(glow);
 }
 makeGrid(){const mat=new THREE.LineBasicMaterial({color:0x318a52,transparent:true,opacity:.42});
  for(let lat=-60;lat<=60;lat+=30){const pts=[];const phi=THREE.MathUtils.degToRad(90-lat);for(let j=0;j<=180;j++){const theta=j/180*Math.PI*2;pts.push(new THREE.Vector3(-Math.cos(theta)*Math.sin(phi),Math.cos(phi),Math.sin(theta)*Math.sin(phi)))}this.earthGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),mat));}
  for(let lon=0;lon<180;lon+=30){const pts=[];const theta=THREE.MathUtils.degToRad(lon);for(let j=0;j<=180;j++){const phi=j/180*Math.PI;pts.push(new THREE.Vector3(-Math.cos(theta)*Math.sin(phi),Math.cos(phi),Math.sin(theta)*Math.sin(phi)))}this.earthGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),mat));}
 }
 makeStars(){const points=[];for(let i=0;i<850;i++){const v=new THREE.Vector3((Math.random()-.5)*18,(Math.random()-.5)*11,(Math.random()-.5)*12);if(v.length()<2.5)v.multiplyScalar(2);points.push(v)}const geo=new THREE.BufferGeometry().setFromPoints(points);this.scene.add(new THREE.Points(geo,new THREE.PointsMaterial({color:0x3e8054,size:.018,transparent:true,opacity:.65})))}
 vec(lat,lon,r=1.015){const phi=THREE.MathUtils.degToRad(90-lat),theta=THREE.MathUtils.degToRad(lon+180);return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta))}
 clearMarkers(){for(const obj of [...this.earthGroup.children])if(obj.userData.dynamic){this.earthGroup.remove(obj);obj.geometry?.dispose();obj.material?.dispose()}}
 marker(lat,lon,color,size=0.025,r=1.025){const mesh=new THREE.Mesh(new THREE.SphereGeometry(size,12,10),new THREE.MeshBasicMaterial({color}));mesh.position.copy(this.vec(lat,lon,r));mesh.userData.dynamic=true;this.earthGroup.add(mesh);return mesh.position.clone()}
 line(a,b,color,opacity=.6){const geo=new THREE.BufferGeometry().setFromPoints([a,b]);const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color,transparent:true,opacity}));line.userData.dynamic=true;this.earthGroup.add(line)}
 circle(lat,lon,radiusDeg,color){const center=this.vec(lat,lon,1.009);const normal=center.clone().normalize();let tangent=new THREE.Vector3(0,1,0).cross(normal);if(tangent.length()<.01)tangent=new THREE.Vector3(1,0,0).cross(normal);tangent.normalize();const bitangent=normal.clone().cross(tangent).normalize();const angle=THREE.MathUtils.degToRad(radiusDeg);const pts=[];for(let i=0;i<=100;i++){const a=i/100*Math.PI*2;const p=normal.clone().multiplyScalar(Math.cos(angle)).add(tangent.clone().multiplyScalar(Math.sin(angle)*Math.cos(a))).add(bitangent.clone().multiplyScalar(Math.sin(angle)*Math.sin(a))).multiplyScalar(1.012);pts.push(p)}const mesh=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color,transparent:true,opacity:.8}));mesh.userData.dynamic=true;this.earthGroup.add(mesh)}
 update(result,scenario,mode='final'){
  this.clearMarkers();const sats=mode==='initial'?result.initial:result.best;const m=mode==='initial'?result.initial_metrics:result.metrics;
  for(const z of scenario.restricted_zones){this.circle(z.lat,z.lon,z.radius_deg,0xff5368);this.marker(z.lat,z.lon,0xff5368,.027,1.016)}
  for(const o of scenario.occupied_objects){this.circle(o.lat,o.lon,o.radius_deg,0xb18aff);this.marker(o.lat,o.lon,0xb18aff,.028,1.018)}
  for(const r of scenario.regions){const detail=m?.regions.find(x=>x.id===r.id);const col=detail?.covered?0x4cf5dd:0xffdc73;const p=this.marker(r.lat,r.lon,col,.032,1.022);if(detail?.covered){const nearest=sats.find(s=>s.id===detail.nearest_satellite);if(nearest){const q=this.vec(nearest.lat,nearest.lon,1.026);this.line(p,q,0x4cf5dd,.45)}}}
  for(const sat of sats){const p=this.marker(sat.lat,sat.lon,0x39ff88,.026,1.035);const label=this.marker(sat.lat,sat.lon,0x9cffbd,.011,1.055);}
 }
 reset(){this.root.rotation.set(0,0,0);this.camera.position.set(0,0,4.4);this.autoRotate=true}
 resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h)}
 animate(){this.frame=requestAnimationFrame(()=>this.animate());if(this.autoRotate)this.root.rotation.y+=.0015;this.renderer.render(this.scene,this.camera)}
}

const lockedControls=['run-btn','compare-btn','stress-btn','priority-btn','restore-btn','generations','population','mutation','seed','export-btn','show-initial','show-final'];
function setBusy(busy){
  state.busy=busy;
  for(const id of lockedControls)$(id).disabled=busy||!state.scenario;
  $('show-initial').disabled=busy||!state.result?.initial_metrics;
  $('show-final').disabled=busy||!state.result;
  $('export-btn').disabled=busy||!state.result;
}
function snapshotPayload(seedOverride){
  return JSON.parse(JSON.stringify({generations:Number($('generations').value),population_size:Number($('population').value),
    mutation_rate:Number($('mutation').value),seed:seedOverride!==undefined?seedOverride:($('seed').value===''?null:Number($('seed').value)),
    regions:state.scenario.regions,restricted_zones:state.scenario.restricted_zones,occupied_objects:state.scenario.occupied_objects}));
}
function showView(mode){
  if(state.busy||!state.result)return;
  if(mode==='initial'&&!state.result.initial_metrics){log('Resultado anterior sin métricas iniciales: comparación inicial no disponible.','warn');return;}
  renderView(state.result,mode);
}
function renderView(result,mode){
  if(!result.scenario)throw new Error('Resultado anterior sin escenario: no se puede visualizar de forma fiable.');
  state.view=mode;renderMetrics(result,mode);
  state.globe?.update(result,result.scenario,mode);
  $('show-final').classList.toggle('active',mode==='final');$('show-initial').classList.toggle('active',mode==='initial');
  if(!result.initial_metrics)log('Resultado anterior: solo métricas finales disponibles; vista inicial desactivada.','warn');
}
async function executePayload(payload){
  setStatus('EJECUTANDO MOTOR GENÉTICO...');log('Iniciando población y ciclo evolutivo.');
  const response=await fetch('/api/optimize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const result=await response.json();
  if(!response.ok)throw new Error(result.error||'Falló la optimización.');
  state.result=result;renderView(result,'final');$('globe-loading').classList.add('hidden');
  const complete=result.metrics.valid&&result.metrics.covered_count===result.metrics.total_regions;
  const label=!result.metrics.valid?'CONFIGURACIÓN INVÁLIDA':complete?'OBJETIVO CUMPLIDO':'COBERTURA PARCIAL';
  setStatus(`${label} // ${result.metrics.covered_count}/${result.metrics.total_regions} REGIONES`,complete?'ok':result.metrics.valid?'info':'error');
  log(`Semilla ${result.parameters.seed}: ${label}; aptitud ${result.metrics.fitness}, cobertura ${result.metrics.weighted_coverage_pct}%.`,complete?'ok':'warn');
  if(result.saved_to)log(`Resultado guardado en ${result.saved_to}`,'ok');
  return result;
}
function reportFailure(err){
  setStatus('ERROR EN LA EJECUCIÓN','error');
  log(`${err.message}${state.result?' Se conserva la última ejecución identificada en pantalla.':''}`,'error');
}
async function runOptimization(){
  if(state.busy||!state.scenario)return;
  const payload=snapshotPayload();setBusy(true);
  try{return await executePayload(payload)}catch(err){reportFailure(err)}finally{setBusy(false)}
}
async function compareRuns(){
  if(state.busy||!state.scenario)return;
  const payload=snapshotPayload();const base=payload.seed??100;
  setBusy(true);const outcomes=[];
  try{
    for(let i=0;i<5;i++){
      log(`Comparación ${i+1}/5.`);
      const r=await executePayload({...payload,seed:base+i});outcomes.push(r);
    }
    state.compare=outcomes;
    downloadBlob(new Blob([JSON.stringify({comparison:outcomes},null,2)],{type:'application/json'}),'astroshield_comparacion_semillas.json');
    const complete=outcomes.every(r=>r.metrics.valid&&r.metrics.covered_count===r.metrics.total_regions);
    setStatus(complete?'COMPARACIÓN COMPLETA // OBJETIVOS CUMPLIDOS':'COMPARACIÓN COMPLETA // REVISAR COBERTURAS',complete?'ok':'info');
    log('Comparación exportada con escenario y parámetros de cada ejecución.','ok');
  }catch(err){reportFailure(err)}finally{setBusy(false)}
}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
function exportResult(){if(!state.result){alert('Primero ejecuta la optimización.');return}downloadBlob(new Blob([JSON.stringify(state.result,null,2)],{type:'application/json'}),'astroshield_resultado.json');log('Configuración y métricas exportadas en JSON.','ok')}
function updateClock(){ $('clock').textContent=new Date().toLocaleTimeString('es-MX',{hour12:false})+' LOCAL'; }

$('generations').addEventListener('input',updateLabels);$('population').addEventListener('input',updateLabels);$('mutation').addEventListener('input',updateLabels);
$('run-btn').addEventListener('click',()=>runOptimization());$('compare-btn').addEventListener('click',compareRuns);$('export-btn').addEventListener('click',exportResult);
$('clear-log').addEventListener('click',()=>{$('terminal-log').innerHTML='';log('Registro limpiado.');});
$('show-initial').addEventListener('click',()=>showView('initial'));
$('show-final').addEventListener('click',()=>showView('final'));
$('reset-view').addEventListener('click',()=>state.globe?.reset());
$('stress-btn').addEventListener('click',async()=>{
 if(state.busy||!state.scenario)return;
 if(!state.stressMode){state.scenario.restricted_zones.push({id:'stress_yucatan',name:'Zona experimental sobre Yucatán',lat:20.5,lon:-89.0,radius_deg:6.0,kind:'Restricción experimental'});state.stressMode=true;$('stress-btn').classList.add('active');log('Modo espacio reducido activado: una exclusión experimental cubre el centro de Yucatán. Se espera pérdida de cobertura en esa región.','warn');}
 else {state.scenario.restricted_zones=state.scenario.restricted_zones.filter(z=>z.id!=='stress_yucatan');state.stressMode=false;$('stress-btn').classList.remove('active');log('Exclusión experimental retirada.','ok');}
 await runOptimization();
});
$('priority-btn').addEventListener('click',async()=>{
 if(state.busy||!state.scenario)return;
 state.priorityMode=!state.priorityMode;
 const regions=state.scenario.regions;
 if(state.priorityMode){for(const r of regions){if(r.id==='yucatan'){r.priority='Normal';r.weight=1}if(r.id==='australia'){r.priority='Alta';r.weight=3}}$('priority-btn').classList.add('active');log('Prioridades modificadas: Yucatán pasa a Normal y Australia a Alta.','warn');}
 else {for(const r of regions){const original=state.baselineScenario.regions.find(x=>x.id===r.id);r.priority=original.priority;r.weight=original.weight}$('priority-btn').classList.remove('active');log('Prioridades originales restauradas.','ok');}
 await runOptimization();
});
$('restore-btn').addEventListener('click',async()=>{if(state.busy||!state.scenario)return;state.scenario=JSON.parse(JSON.stringify(state.baselineScenario));state.stressMode=false;state.priorityMode=false;$('stress-btn').classList.remove('active');$('priority-btn').classList.remove('active');log('Escenario, restricciones y prioridades restaurados a los valores iniciales.','ok');await runOptimization();});
window.addEventListener('resize',()=>{if(state.result)drawChart(state.result.history)});

(async()=>{setBusy(false);updateLabels();updateClock();setInterval(updateClock,1000);try{await loadScenario();state.globe=new GlobeView($('globe-container'));$('globe-loading').classList.add('hidden');log('Renderizador WebGL listo. Arrastra el globo para rotarlo.','ok');}catch(e){$('globe-loading').innerHTML=`<span>ERROR DE INICIALIZACIÓN</span><span>${esc(e.message)}</span>`;log(e.message,'error')}finally{setBusy(false)}})();
