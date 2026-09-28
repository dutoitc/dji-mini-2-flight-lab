import {Flight,terrain,clamp} from './model.js';
const $=id=>document.getElementById(id),keys=new Set();
let T;
try{T=await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');}catch(e){$('centerMessage').textContent='Chargement 3D impossible. Vérifie la connexion à cdn.jsdelivr.net puis recharge.';throw e;}
let renderer;
try{renderer=new T.WebGLRenderer({canvas:$('flightCanvas'),antialias:true});}catch(e){$('centerMessage').textContent='WebGL indisponible : active l’accélération graphique du navigateur.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor('#acd2df');
const scene=new T.Scene();scene.fog=new T.Fog('#acd2df',220,820);
const camera=new T.PerspectiveCamera(64,1,.08,1600);
scene.add(new T.HemisphereLight('#e2f4ff','#51623a',2.6));
const sun=new T.DirectionalLight('#fff0cf',3);sun.position.set(-65,110,35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-110,right:110,top:110,bottom:-110,near:1,far:300});sun.shadow.bias=-.0006;scene.add(sun);
const geo=new T.PlaneGeometry(1500,1500,250,250);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,col=[];
for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),y=terrain(x,z);pos.setY(i,y);const c=new T.Color().setHSL(.23+.018*Math.sin(x*.1),.25,.29+.08*Math.sin(x*.032)*Math.cos(z*.037)+y*.0015);col.push(c.r,c.g,c.b);}
geo.setAttribute('color',new T.Float32BufferAttribute(col,3));geo.computeVertexNormals();const ground=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:1}));ground.receiveShadow=true;scene.add(ground);
const pad=new T.Mesh(new T.CylinderGeometry(3,3,.08,48),new T.MeshStandardMaterial({color:'#26363a'}));pad.position.y=.055;pad.receiveShadow=true;scene.add(pad);
const ring=new T.Mesh(new T.TorusGeometry(2.5,.065,8,60),new T.MeshBasicMaterial({color:'#ffd28a'}));ring.rotation.x=Math.PI/2;ring.position.y=.11;scene.add(ring);
for(const [x,z,w,l] of [[-1,0,.15,2],[1,0,.15,2],[0,0,2,.15]]){const h=new T.Mesh(new T.BoxGeometry(w,.03,l),new T.MeshBasicMaterial({color:'#fff0cf'}));h.position.set(x,.12,z);scene.add(h);}
let seed=7421;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const trees=[],dummy=new T.Object3D();
const trunks=new T.InstancedMesh(new T.CylinderGeometry(.2,.3,1,6),new T.MeshStandardMaterial({color:'#70553d'}),650);
const crowns=new T.InstancedMesh(new T.ConeGeometry(1,1,8),new T.MeshStandardMaterial({color:'#315c49',roughness:1}),650);
for(let i=0;i<650;i++){const angle=rand()*Math.PI*2,r=28+Math.sqrt(rand())*590,x=Math.cos(angle)*r,z=Math.sin(angle)*r,h=6+rand()*12,width=1.5+rand()*2;trees.push({x,z,h,r:width});const g=terrain(x,z);dummy.position.set(x,g+h*.2,z);dummy.scale.set(1,h*.4,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);dummy.position.y=g+h*.65;dummy.scale.set(width,h*.7,width);dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);crowns.setColorAt(i,new T.Color().setHSL(.36+rand()*.045,.24+rand()*.15,.19+rand()*.12));}
trunks.castShadow=crowns.castShadow=true;scene.add(trunks,crowns);
const drone=new T.Group(),body=new T.Group();drone.add(body);scene.add(drone);
function mesh(g,color,x,y,z){const m=new T.Mesh(g,new T.MeshStandardMaterial({color,roughness:.45}));m.position.set(x,y,z);m.castShadow=true;body.add(m);return m;}
mesh(new T.BoxGeometry(.16,.065,.23),'#d5d7d3',0,0,0);mesh(new T.BoxGeometry(.065,.045,.045),'#293638',0,-.025,-.13);
const rotors=[];for(const x of [-.14,.14])for(const z of [-.14,.14]){const arm=mesh(new T.BoxGeometry(.19,.025,.035),'#c5c9c4',x/2,0,z/2);arm.rotation.y=x*z>0?-Math.PI/4:Math.PI/4;mesh(new T.CylinderGeometry(.028,.024,.035,12),'#939b98',x,.015,z);const rotor=mesh(new T.BoxGeometry(.16,.006,.017),'#303638',x,.038,z);rotors.push(rotor);}
const model=new Flight(trees);let camMode=0,gimbal=-12,last=performance.now(),acc=0,paused=false,previous='';
const labels={ground:'AU SOL',takeoff:'DÉCOLLAGE',flying:'VOL GPS',landing:'ATTERRISSAGE',crashed:'CRASH'};
function msg(a,b=''){const el=$('centerMessage');el.replaceChildren();const s=document.createElement('span'),v=document.createElement('strong');s.textContent=a;v.textContent=b;el.append(s,v);el.style.opacity=1;clearTimeout(msg.timer);msg.timer=setTimeout(()=>el.style.opacity=0,4500);}
function reset(){keys.clear();model.reset();paused=false;camMode=0;gimbal=-12;msg('PRÊT À DÉCOLLER','Espace · vol stabilisé, commandes mode 2');}
$('takeoffButton').onclick=()=>model.takeoff();$('landButton').onclick=()=>model.land();$('resetButton').onclick=$('resetTop').onclick=reset;
const input=()=>({forward:+keys.has('ArrowUp')-keys.has('ArrowDown'),right:+keys.has('ArrowRight')-keys.has('ArrowLeft'),up:+keys.has('KeyW')-keys.has('KeyS'),yaw:+keys.has('KeyD')-keys.has('KeyA')});
addEventListener('keydown',e=>{if(e.target.matches('select,input,textarea'))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='Space')model.takeoff();if(e.code==='KeyL')model.land();if(e.code==='KeyR')reset();if(e.code==='KeyP'){paused=!paused;msg(paused?'PAUSE':'REPRISE');}if(e.code==='KeyC')camMode=(camMode+1)%2;if(e.key==='§'||e.code==='Backquote'){camMode=camMode===2?3:2;} });
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();paused=true;msg('PAUSE','P pour reprendre');});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();paused=true;}});
function resize(){const c=$('flightCanvas');renderer.setSize(c.clientWidth,c.clientHeight,false);camera.aspect=c.clientWidth/c.clientHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
const target=new T.Vector3();let hudTime=0;
function frame(now){requestAnimationFrame(frame);const delta=Math.min(.1,(now-last)/1000);last=now;
 if(!paused){acc+=delta;while(acc>=1/120){model.step(1/120,input());acc-=1/120;}if(keys.has('Digit1'))gimbal=clamp(gimbal-40*delta,-90,20);if(keys.has('Digit2'))gimbal=clamp(gimbal+40*delta,-90,20);}
 const s=model;drone.position.set(s.x,s.y,s.z);drone.rotation.y=-s.yaw;body.rotation.set(s.pitch,0,s.roll);if(!['ground','crashed'].includes(s.state)&&!paused)rotors.forEach((r,i)=>r.rotation.y+=(i%2?1:-1)*delta*100);
 const sy=Math.sin(s.yaw),cy=Math.cos(s.yaw),a=gimbal*Math.PI/180;
 camera.up.set(0,1,0);drone.visible=camMode!==0;
 if(camMode===0){camera.position.set(s.x,s.y+.03,s.z);target.set(s.x+sy*Math.cos(a),s.y+Math.sin(a),s.z-cy*Math.cos(a));}
 else if(camMode===1){camera.position.set(s.x-sy*3,s.y+1.25,s.z+cy*3);target.set(s.x+sy*2,s.y+.1,s.z-cy*2);}
 else{const sign=camMode===2?1:-1;camera.position.set(s.x,s.y+sign*12,s.z+.001);camera.up.set(sy,0,-cy);target.set(s.x,s.y,s.z);}
 camera.lookAt(target);renderer.render(scene,camera);
 if(s.state!==previous){if(s.state==='crashed')msg('CRASH',s.reason+' · R pour recommencer');if(s.state==='ground'&&previous)msg('AU SOL',s.reason||'Espace pour décoller');previous=s.state;}
 hudTime+=delta;if(hudTime<.1)return;hudTime=0;
 $('altitudeValue').textContent=Math.max(0,s.y-terrain(s.x,s.z)-.22).toFixed(1);$('speedValue').textContent=Math.hypot(s.vx,s.vz).toFixed(1);$('headingValue').textContent=String(Math.round((s.yaw*180/Math.PI%360+360)%360)).padStart(3,'0');$('positionValue').textContent=`E ${s.x.toFixed(1)} · N ${(-s.z).toFixed(1)} m`;
 $('distanceValue').textContent=`${Math.hypot(s.x,s.z).toFixed(1)} m · trajet ${s.distance.toFixed(1)} m`;
 $('batteryValue').textContent=Math.round(s.battery)+'%';$('batteryBar').style.width=s.battery+'%';$('modeValue').textContent=paused?'PAUSE':labels[s.state];$('flightStatus').textContent=labels[s.state];$('cameraValue').textContent=['CAMÉRA DRONE','POURSUITE','VUE DE DESSUS','VUE DE DESSOUS'][camMode]+` · ${Math.round(gimbal)}°`;
 $('attitudeBall').style.transform=`rotate(${-s.roll*180/Math.PI}deg)`;
}
reset();requestAnimationFrame(frame);
