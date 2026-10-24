import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const $ = (id) => document.getElementById(id);
const state = { scenario: null, baselineScenario: null, result: null, view: 'final', globe: null, chart: null, compare: null, stressMode: false, priorityMode: false };
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
function renderMetrics(result){
  const m=result.metrics; $('fitness-value').innerHTML=`${Number(m.fitness).toFixed(1)}<small>/ 100</small>`;
  $('coverage-value').innerHTML=`${Number(m.weighted_coverage_pct).toFixed(1)}<small>%</small>`; $('coverage-meter').style.width=`${m.weighted_coverage_pct}%`;
  $('coverage-note').textContent=`${m.covered_count} de ${m.total_regions} regiones alcanzadas`;
  $('regions-value').innerHTML=`${m.covered_count}<small>/ ${m.total_regions}</small>`;
  $('valid-value').textContent=m.valid?'VÁLIDA':'INVÁLIDA'; $('valid-value').style.color=m.valid?'var(--green)':'var(--red)';
  $('valid-note').textContent=m.valid?'Cero violaciones de exclusión':`${m.validation.violation_count} satélite(s) en zona prohibida`;
  $('solution-state').textContent=m.valid?(m.covered_count===m.total_regions?'OBJETIVO CUMPLIDO':'VÁLIDA / PARCIAL'):'REVISAR RESTRICCIONES';
  $('globe-state').textContent=m.valid?'CONFIGURACIÓN VÁLIDA':'CONFIGURACIÓN INVÁLIDA';
  $('legend-sat-count').textContent=result.best.length; $('legend-region-count').textContent=`${m.covered_count} / ${m.total_regions}`; $('legend-violations').textContent=m.validation.violation_count;
  renderRegions(m); renderSatellites(result.best,m); renderValidation(result); drawChart(result.history);
}
function renderRegions(metrics){
  const regions=state.scenario?.regions||[]; if(!regions.length)return;
  $('region-list').innerHTML=regions.map(r=>{
    const d=metrics?.regions?.find(x=>x.id===r.id); const covered=d?.covered;
    return `<div class="region-item"><div class="region-main"><div><div class="region-name">${esc(r.name)}</div><div class="region-coords">${r.lat.toFixed(1)}°, ${r.lon.toFixed(1)}° · PRIORIDAD ${esc(r.priority.toUpperCase())}</div></div><span class="region-status ${covered?'covered':''}">${metrics?(covered?'CUBIERTA':'SIN COBERTURA'):'PENDIENTE'}</span></div><div class="region-distance">${d?`Satélite más cercano: ${esc(d.nearest_satellite||'—')} · ${d.nearest_distance_km.toLocaleString('es-MX')} km`:'Radio requerido: 300 km'}</div></div>`;
  }).join('');
}
function renderSatellites(sats,metrics){
  $('satellite-table').innerHTML=sats.map(s=>{const v=metrics.validation.violations.find(x=>x.satellite===s.id);return `<tr><td class="sat-id">${esc(s.id)}</td><td>${Number(s.lat).toFixed(3)}°</td><td>${Number(s.lon).toFixed(3)}°</td><td style="color:${v?'var(--red)':'var(--green)'}">${v?'VIOLACIÓN':'DENTRO DE LÍMITES'}</td></tr>`}).join('');
}
function renderValidation(result){
  const {validation}=result.metrics;
  const items=[...state.scenario.restricted_zones.map(z=>({name:z.name,desc:`Radio de exclusión ${z.radius_deg}° · centro ${z.lat}°, ${z.lon}°`,type:'zone'})),...state.scenario.occupied_objects.map(o=>({name:o.name,desc:`Radio de exclusión ${o.radius_deg}° · centro ${o.lat}°, ${o.lon}°`,type:'object'}))];
  $('validation-list').innerHTML=items.map(item=>`<div class="validation-item ${validation.valid?'':'fail'}"><div class="validation-icon">${validation.valid?'✓':'!'}</div><div class="validation-copy"><b>${esc(item.name)} — ${validation.valid?'SIN INFRACCIONES':'REVISAR CONFIGURACIÓN'}</b><span>${esc(item.desc)}</span></div></div>`).join('');
  $('validation-footer').textContent=validation.valid?'Resultado: todas las posiciones cumplen las restricciones espaciales.':'La configuración es inválida. Revisa las posiciones señaladas; la puntuación no anula las restricciones obligatorias.';
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
  $('chart-summary').textContent=`${history.length} puntos registrados · final ${vals[vals.length-1].toFixed(2)}`;
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
 clearMarkers(){for(const obj of [...this.earthGroup.children])if(obj.userData.dynamic)this.earthGroup.remove(obj)}
 marker(lat,lon,color,size=0.025,r=1.025){const mesh=new THREE.Mesh(new THREE.SphereGeometry(size,12,10),new THREE.MeshBasicMaterial({color}));mesh.position.copy(this.vec(lat,lon,r));mesh.userData.dynamic=true;this.earthGroup.add(mesh);return mesh.position.clone()}
 line(a,b,color,opacity=.6){const geo=new THREE.BufferGeometry().setFromPoints([a,b]);const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color,transparent:true,opacity}));line.userData.dynamic=true;this.earthGroup.add(line)}
 circle(lat,lon,radiusDeg,color){const center=this.vec(lat,lon,1.009);const normal=center.clone().normalize();let tangent=new THREE.Vector3(0,1,0).cross(normal);if(tangent.length()<.01)tangent=new THREE.Vector3(1,0,0).cross(normal);tangent.normalize();const bitangent=normal.clone().cross(tangent).normalize();const angle=THREE.MathUtils.degToRad(radiusDeg);const pts=[];for(let i=0;i<=100;i++){const a=i/100*Math.PI*2;const p=normal.clone().multiplyScalar(Math.cos(angle)).add(tangent.clone().multiplyScalar(Math.sin(angle)*Math.cos(a))).add(bitangent.clone().multiplyScalar(Math.sin(angle)*Math.sin(a))).multiplyScalar(1.012);pts.push(p)}const mesh=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color,transparent:true,opacity:.8}));mesh.userData.dynamic=true;this.earthGroup.add(mesh)}
 update(result,scenario,mode='final'){
  this.clearMarkers();const sats=mode==='initial'?result.initial:result.best;const m=mode==='initial'?null:result.metrics;
  for(const z of scenario.restricted_zones){this.circle(z.lat,z.lon,z.radius_deg,0xff5368);this.marker(z.lat,z.lon,0xff5368,.027,1.016)}
  for(const o of scenario.occupied_objects){this.circle(o.lat,o.lon,o.radius_deg,0xb18aff);this.marker(o.lat,o.lon,0xb18aff,.028,1.018)}
  for(const r of scenario.regions){const detail=m?.regions.find(x=>x.id===r.id);const col=detail?.covered?0x4cf5dd:0xffdc73;const p=this.marker(r.lat,r.lon,col,.032,1.022);if(detail?.covered){const nearest=sats.find(s=>s.id===detail.nearest_satellite);if(nearest){const q=this.vec(nearest.lat,nearest.lon,1.026);this.line(p,q,0x4cf5dd,.45)}}}
  for(const sat of sats){const p=this.marker(sat.lat,sat.lon,0x39ff88,.026,1.035);const label=this.marker(sat.lat,sat.lon,0x9cffbd,.011,1.055);}
 }
 reset(){this.root.rotation.set(0,0,0);this.camera.position.set(0,0,4.4);this.autoRotate=true}
 resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h)}
 animate(){this.frame=requestAnimationFrame(()=>this.animate());if(this.autoRotate)this.root.rotation.y+=.0015;this.renderer.render(this.scene,this.camera)}
}

async function runOptimization(seedOverride=undefined,quiet=false){
 const btn=$('run-btn');btn.disabled=true;$('compare-btn').disabled=true;setStatus('EJECUTANDO MOTOR GENÉTICO...');log('Iniciando población y ciclo evolutivo.');
 const payload={generations:Number($('generations').value),population_size:Number($('population').value),mutation_rate:Number($('mutation').value),seed:seedOverride!==undefined?seedOverride:($('seed').value===''?null:Number($('seed').value)),regions:state.scenario.regions,restricted_zones:state.scenario.restricted_zones,occupied_objects:state.scenario.occupied_objects};
 try{
  const response=await fetch('/api/optimize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Falló la optimización.');
  state.result=result;state.view='final';renderMetrics(result);if(state.globe)state.globe.update(result,state.scenario,'final');$('show-final').classList.add('active');$('show-initial').classList.remove('active');$('globe-loading').classList.add('hidden');
  setStatus(`EJECUCIÓN COMPLETADA // ${result.metrics.covered_count}/6 REGIONES`,result.metrics.valid?'ok':'error');log(`Fin de ejecución: fitness ${result.metrics.fitness}, cobertura ponderada ${result.metrics.weighted_coverage_pct}%, regiones ${result.metrics.covered_count}/6.`,result.metrics.valid?'ok':'warn');
  log(result.metrics.valid?'Validación espacial: cero infracciones.':'Advertencia: la configuración no cumple todas las condiciones espaciales.','warn');
  if(result.saved_to)log(`Resultado guardado en ${result.saved_to}`,'ok');return result;
 }catch(err){setStatus('ERROR EN LA EJECUCIÓN', 'error');log(err.message,'error');if(!quiet)alert(err.message);throw err}
 finally{btn.disabled=false;$('compare-btn').disabled=false}
}
async function compareRuns(){
 $('compare-btn').disabled=true;const base=Number($('seed').value||100);const outcomes=[];log('Iniciando comparación de cinco semillas reproducibles.');
 try{for(let i=0;i<5;i++){setStatus(`COMPARACIÓN ${i+1}/5...`);const r=await runOptimization(base+i,true);outcomes.push({seed:base+i,fitness:r.metrics.fitness,coverage:r.metrics.weighted_coverage_pct,covered:r.metrics.covered_count,valid:r.metrics.valid});log(`Semilla ${base+i}: fitness ${r.metrics.fitness}, cobertura ${r.metrics.covered_count}/6, válida=${r.metrics.valid}.`,'ok')}
  state.compare=outcomes;const blob=new Blob([JSON.stringify({comparison:outcomes,parameters:{generations:$('generations').value,population:$('population').value,mutation:$('mutation').value}},null,2)],{type:'application/json'});downloadBlob(blob,'astroshield_comparacion_semillas.json');setStatus('COMPARACIÓN COMPLETADA','ok');log('Comparación exportada a JSON.','ok');
 }catch(e){log('La comparación se detuvo por un error.','error')}finally{$('compare-btn').disabled=false}
}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
function exportResult(){if(!state.result){alert('Primero ejecuta la optimización.');return}downloadBlob(new Blob([JSON.stringify(state.result,null,2)],{type:'application/json'}),'astroshield_resultado.json');log('Configuración y métricas exportadas en JSON.','ok')}
function updateClock(){ $('clock').textContent=new Date().toLocaleTimeString('es-MX',{hour12:false})+' LOCAL'; }

$('generations').addEventListener('input',updateLabels);$('population').addEventListener('input',updateLabels);$('mutation').addEventListener('input',updateLabels);
$('run-btn').addEventListener('click',()=>runOptimization());$('compare-btn').addEventListener('click',compareRuns);$('export-btn').addEventListener('click',exportResult);
$('clear-log').addEventListener('click',()=>{$('terminal-log').innerHTML='';log('Registro limpiado.');});
$('show-initial').addEventListener('click',()=>{if(!state.result)return;state.view='initial';state.globe.update(state.result,state.scenario,'initial');$('show-initial').classList.add('active');$('show-final').classList.remove('active');$('globe-state').textContent='CONFIGURACIÓN INICIAL';log('Visualizando configuración inicial de la ejecución actual.')});
$('show-final').addEventListener('click',()=>{if(!state.result)return;state.view='final';state.globe.update(state.result,state.scenario,'final');$('show-final').classList.add('active');$('show-initial').classList.remove('active');$('globe-state').textContent=state.result.metrics.valid?'CONFIGURACIÓN VÁLIDA':'CONFIGURACIÓN INVÁLIDA'});
$('reset-view').addEventListener('click',()=>state.globe?.reset());
$('stress-btn').addEventListener('click',async()=>{
 if(!state.scenario)return;
 if(!state.stressMode){state.scenario.restricted_zones.push({id:'stress_yucatan',name:'Zona experimental sobre Yucatán',lat:20.5,lon:-89.0,radius_deg:6.0,kind:'Restricción experimental'});state.stressMode=true;$('stress-btn').classList.add('active');log('Modo espacio reducido activado: una exclusión experimental cubre el centro de Yucatán. Se espera pérdida de cobertura en esa región.','warn');}
 else {state.scenario.restricted_zones=state.scenario.restricted_zones.filter(z=>z.id!=='stress_yucatan');state.stressMode=false;$('stress-btn').classList.remove('active');log('Exclusión experimental retirada.','ok');}
 await runOptimization();
});
$('priority-btn').addEventListener('click',async()=>{
 if(!state.scenario)return;
 state.priorityMode=!state.priorityMode;
 const regions=state.scenario.regions;
 if(state.priorityMode){for(const r of regions){if(r.id==='yucatan'){r.priority='Normal';r.weight=1}if(r.id==='australia'){r.priority='Alta';r.weight=3}}$('priority-btn').classList.add('active');log('Prioridades modificadas: Yucatán pasa a Normal y Australia a Alta.','warn');}
 else {for(const r of regions){const original=state.baselineScenario.regions.find(x=>x.id===r.id);r.priority=original.priority;r.weight=original.weight}$('priority-btn').classList.remove('active');log('Prioridades originales restauradas.','ok');}
 renderRegions(null);await runOptimization();
});
$('restore-btn').addEventListener('click',async()=>{state.scenario=JSON.parse(JSON.stringify(state.baselineScenario));state.stressMode=false;state.priorityMode=false;$('stress-btn').classList.remove('active');$('priority-btn').classList.remove('active');renderRegions(null);log('Escenario, restricciones y prioridades restaurados a los valores iniciales.','ok');await runOptimization();});
window.addEventListener('resize',()=>{if(state.result)drawChart(state.result.history)});

(async()=>{updateLabels();updateClock();setInterval(updateClock,1000);try{await loadScenario();state.globe=new GlobeView($('globe-container'));$('globe-loading').classList.add('hidden');log('Renderizador WebGL listo. Arrastra el globo para rotarlo.','ok');}catch(e){$('globe-loading').innerHTML=`<span>ERROR DE INICIALIZACIÓN</span><span>${esc(e.message)}</span>`;log(e.message,'error')}})();
