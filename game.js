(() => {
'use strict';
const canvas=document.getElementById('world'),ctx=canvas.getContext('2d');
const mindEl=document.getElementById('mind'),doorsEl=document.getElementById('doors'),hint=document.getElementById('hint'),interaction=document.getElementById('interaction'),modal=document.getElementById('question-modal'),answers=document.getElementById('answers');
const doorName=document.getElementById('door-name'),question=document.getElementById('question'),ending=document.getElementById('ending'),endingTitle=document.getElementById('ending-title'),endingText=document.getElementById('ending-text'),endingStats=document.getElementById('ending-stats');
let W=innerWidth,H=innerHeight; canvas.width=W*devicePixelRatio;canvas.height=H*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);
const world={w:2600,h:1900},player={x:1300,y:1600,r:16,speed:3.5};
const keys=new Set();let activeDoor=null,completed=0,mind=50,answersChosen=[];
const scores={};
const doors=[
 {x:1300,y:1300,q:0},{x:820,y:930,q:1},{x:1780,y:920,q:2},{x:550,y:1420,q:3},
 {x:2050,y:1420,q:4},{x:650,y:420,q:5},{x:1950,y:410,q:6},{x:1300,y:260,q:7}
];
function resize(){W=innerWidth;H=innerHeight;canvas.width=W*devicePixelRatio;canvas.height=H*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}addEventListener('resize',resize);
function nearDoor(){let best=null,dist=Infinity;for(const d of doors)if(!d.done){const z=Math.hypot(player.x-d.x,player.y-d.y);if(z<dist){dist=z;best=d}}return dist<90?best:null}
function openDoor(d){activeDoor=d;const q=QUESTIONS[d.q];doorName.textContent=q.name;question.textContent=q.q;answers.innerHTML='';q.a.forEach((item,i)=>{const b=document.createElement('button');b.className='answer';b.textContent=item[0];b.onclick=()=>choose(i);answers.appendChild(b)});modal.classList.remove('hidden');hint.classList.add('hidden');interaction.classList.add('hidden')}
function choose(i){const q=QUESTIONS[activeDoor.q],choice=q.a[i];answersChosen.push({q:q.name,i});for(const [k,v] of Object.entries(choice[1]))scores[k]=(scores[k]||0)+v;mind=Math.max(0,Math.min(100,mind+(choice[1].peace||0)-(choice[1].truth<0?2:0)));activeDoor.done=true;completed++;doorsEl.textContent=`${completed} / ${doors.length}`;mindEl.textContent=mind;modal.classList.add('hidden');if(completed===doors.length)setTimeout(showEnding,700)}
function showEnding(){let best=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0]||['curiosity',0];const e=ENDINGS[best[0]]||ENDINGS.curiosity;endingTitle.textContent=e[0];endingText.textContent=e[1];endingStats.innerHTML=`<div><b>${completed}</b><span>doors crossed</span></div><div><b>${best[1]}</b><span>dominant score</span></div><div><b>${mind}</b><span>mind</span></div>`;ending.classList.remove('hidden')}
document.getElementById('restart').onclick=()=>location.reload();
addEventListener('keydown',e=>{keys.add(e.key.toLowerCase());if(e.key.toLowerCase()==='e'&&activeDoor===null){const d=nearDoor();if(d)openDoor(d)}if(e.key==='Escape')modal.classList.add('hidden')});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function update(){if(!modal.classList.contains('hidden')||!ending.classList.contains('hidden'))return;let dx=0,dy=0;if(keys.has('w')||keys.has('arrowup'))dy--;if(keys.has('s')||keys.has('arrowdown'))dy++;if(keys.has('a')||keys.has('arrowleft'))dx--;if(keys.has('d')||keys.has('arrowright'))dx++;if(dx||dy){const n=Math.hypot(dx,dy);player.x+=dx/n*player.speed;player.y+=dy/n*player.speed;player.x=Math.max(50,Math.min(world.w-50,player.x));player.y=Math.max(50,Math.min(world.h-50,player.y))}const d=nearDoor();if(d){interaction.classList.remove('hidden');interaction.innerHTML='Press <b>E</b> to enter the door'}else interaction.classList.add('hidden')}
function draw(){ctx.clearRect(0,0,W,H);const camX=Math.max(0,Math.min(world.w-W,player.x-W/2)),camY=Math.max(0,Math.min(world.h-H,player.y-H/2));ctx.save();ctx.translate(-camX,-camY);drawWorld();ctx.restore();requestAnimationFrame(draw)}
function drawWorld(){ctx.fillStyle='#080a12';ctx.fillRect(0,0,world.w,world.h);for(let x=0;x<world.w;x+=100){for(let y=0;y<world.h;y+=100){ctx.fillStyle=((x+y)/100%2?'#0b0d16':'#0a0c14');ctx.fillRect(x,y,98,98)}}ctx.strokeStyle='#242538';ctx.lineWidth=2;for(let x=50;x<world.w;x+=100){ctx.beginPath();ctx.moveTo(x,50);ctx.lineTo(x,world.h-50);ctx.stroke()}for(let y=50;y<world.h;y+=100){ctx.beginPath();ctx.moveTo(50,y);ctx.lineTo(world.w-50,y);ctx.stroke()}
ctx.fillStyle='#151727';ctx.fillRect(1180,200,240,1400);ctx.fillRect(400,1120,1800,220);
for(const d of doors){ctx.save();ctx.translate(d.x,d.y);ctx.shadowBlur=d.done?4:28;ctx.shadowColor=d.done?'#555':'#cba94f';ctx.fillStyle=d.done?'#34323b':'#b18d3d';ctx.fillRect(-27,-40,54,80);ctx.fillStyle='#0b0c13';ctx.fillRect(-19,-31,38,62);ctx.fillStyle='#d7c179';ctx.beginPath();ctx.arc(10,4,4,0,Math.PI*2);ctx.fill();ctx.restore()}
ctx.save();ctx.translate(player.x,player.y);ctx.shadowBlur=22;ctx.shadowColor='#8b78df';ctx.fillStyle='#d9d3c4';ctx.beginPath();ctx.arc(0,0,player.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8b78df';ctx.beginPath();ctx.arc(0,-2,8,0,Math.PI*2);ctx.fill();ctx.restore()}
update();draw();
})();
