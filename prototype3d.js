import * as THREE from 'three';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x07080c);scene.fog=new THREE.FogExp2(0x07080c,.035);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,200);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x77809b,0x15110d,1.5));
const moon=new THREE.DirectionalLight(0xc7d0ff,2.1);moon.position.set(-10,18,8);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);scene.add(moon);
const playerLight=new THREE.PointLight(0xd9b65a,2.2,9);scene.add(playerLight);

const matWall=new THREE.MeshStandardMaterial({color:0x27262b,roughness:.92});
const matFloor=new THREE.MeshStandardMaterial({color:0x111217,roughness:1});
const matDoor=new THREE.MeshStandardMaterial({color:0x4a3420,roughness:.7,metalness:.1,emissive:0x261a08});
const matGold=new THREE.MeshStandardMaterial({color:0xd3ad4c,emissive:0x4a3508,emissiveIntensity:1.2});

const floor=new THREE.Mesh(new THREE.PlaneGeometry(90,90),matFloor);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const colliders=[];
function wall(x,z,w,d,h=3){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),matWall);m.position.set(x,h/2,z);m.castShadow=m.receiveShadow=true;scene.add(m);colliders.push(new THREE.Box3().setFromObject(m));return m}
// A real, navigable maze layout: outer shell + branching corridors.
wall(0,-30,60,1);wall(0,30,60,1);wall(-30,0,1,60);wall(30,0,1,60);
[[0,-20,40,1],[20,-10,1,20],[0,0,40,1],[-20,10,1,20],[0,20,40,1],[10,10,1,20],[-10,-10,1,20],[-20,-20,20,1],[20,20,20,1],[-10,10,12,1],[10,-10,12,1]].forEach(a=>wall(...a));

function pillar(x,z){const p=new THREE.Mesh(new THREE.CylinderGeometry(.45,.55,4,10),matWall);p.position.set(x,2,z);p.castShadow=true;scene.add(p)}
for(let x=-25;x<=25;x+=5)for(let z=-25;z<=25;z+=5)if((x*x+z*z)%25===0)pillar(x,z);

const player=new THREE.Group();
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.38,1.0,6,12),new THREE.MeshStandardMaterial({color:0xaaa7a0,roughness:.8}));body.position.y=1.05;body.castShadow=true;player.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.29,16,12),new THREE.MeshStandardMaterial({color:0xb9a58c,roughness:.9}));head.position.y=1.85;head.castShadow=true;player.add(head);scene.add(player);player.position.set(-24,0,-24);

const doorData=[
 {pos:[24,0,-29],title:'THE GATE OF TRUTH',text:'A stranger offers you a perfect memory. You know it never happened. Do you keep it?',choices:['Keep it. A meaningful memory does not need to be true.','Destroy it. A beautiful lie is still a lie.','Study it first. The truth can wait.']},
 {pos:[29,0,24],title:'THE GATE OF SACRIFICE',text:'One person can be saved. Five others can be saved if you make the first person pay the price. You have one minute.',choices:['Save the five.','Save the one.','Refuse the choice and search for another way.']},
 {pos:[-24,0,29],title:'THE GATE OF FREEDOM',text:'A door opens only if you surrender something you value. What do you give?',choices:['Safety.','The truth.','Someone else’s trust.']}
];
const doors=[];
for(const d of doorData){const g=new THREE.Group();const frame=new THREE.Mesh(new THREE.BoxGeometry(3.2,4.4,.45),matDoor);frame.position.y=2.2;frame.castShadow=true;g.add(frame);const rune=new THREE.Mesh(new THREE.TorusGeometry(.65,.045,8,32),matGold);rune.rotation.y=Math.PI/2;rune.position.set(0,2.2,-.25);g.add(rune);g.position.set(...d.pos);scene.add(g);doors.push({data:d,mesh:g,used:false});}

const keys={};addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==='e')interact()});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
let yaw=Math.PI/4,pitch=.18,dialogOpen=false,score={truth:0,freedom:0,sacrifice:0};
addEventListener('mousemove',e=>{if(dialogOpen)return;yaw-=e.movementX*.002;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0015,-.15,.65)});
renderer.domElement.addEventListener('click',()=>{if(!dialogOpen)renderer.domElement.requestPointerLock?.()});

function blocked(x,z){const r=.48;const box=new THREE.Box3(new THREE.Vector3(x-r,0,z-r),new THREE.Vector3(x+r,2,z+r));return colliders.some(c=>box.intersectsBox(c))}
function move(dt){let f=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0),s=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);if(!f&&!s)return;const len=Math.hypot(f,s);f/=len;s/=len;const speed=5.2;const dx=(Math.sin(yaw)*f+Math.cos(yaw)*s)*speed*dt;const dz=(Math.cos(yaw)*f-Math.sin(yaw)*s)*speed*dt;const nx=player.position.x+dx,nz=player.position.z+dz;if(!blocked(nx,player.position.z))player.position.x=nx;if(!blocked(player.position.x,nz))player.position.z=nz;player.rotation.y=yaw+Math.PI;playerLight.position.set(player.position.x,2,player.position.z)}

function nearestDoor(){let best=null,dist=99;for(const d of doors){const x=player.position.x-d.mesh.position.x,z=player.position.z-d.mesh.position.z;const q=Math.hypot(x,z);if(q<dist){dist=q;best=d}}return dist<4?best:null}
function interact(){if(dialogOpen)return;const d=nearestDoor();if(!d)return;openDialog(d)}
function openDialog(d){dialogOpen=true;document.exitPointerLock?.();document.getElementById('dialog').classList.remove('hidden');document.getElementById('dialogTag').textContent=d.data.title;document.getElementById('dialogTitle').textContent='The maze is listening.';document.getElementById('dialogText').textContent=d.data.text;const box=document.getElementById('choices');box.innerHTML='';d.data.choices.forEach((t,i)=>{const b=document.createElement('button');b.className='choice';b.textContent=t;b.onclick=()=>choose(d,i);box.appendChild(b)})}
function choose(d,i){score.truth+=i===1?2:0;score.freedom+=i===2?2:0;score.sacrifice+=i===0?2:0;d.used=true;document.getElementById('dialog').classList.add('hidden');dialogOpen=false;document.getElementById('objective').textContent='The door remembers your answer. Find the next one.';d.mesh.traverse(o=>{if(o.material?.emissive)o.material.emissive.setHex(0x5a4210)});if(doors.every(x=>x.used))document.getElementById('objective').textContent='The first chapter is complete. The maze has learned something about you.'}

const clock=new THREE.Clock();
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05);if(!dialogOpen)move(dt);const target=new THREE.Vector3(player.position.x,1.25,player.position.z);const camDist=5.8;const desired=new THREE.Vector3(player.position.x-Math.sin(yaw)*camDist,2.7+pitch*2,player.position.z-Math.cos(yaw)*camDist);camera.position.lerp(desired,1-Math.pow(.001,dt));camera.lookAt(target);const d=nearestDoor();if(!dialogOpen)document.getElementById('objective').textContent=d?'Press E to enter the door':'Explore the labyrinth and find a door';renderer.render(scene,camera)}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});loop();
