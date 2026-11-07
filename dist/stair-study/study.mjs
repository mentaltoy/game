import {registerPaintedColours} from './display-grade.mjs';
import {createSupportLockedAscent} from './support-locked-v13.mjs';
import {STAIR_STANDARD} from './stair-standard.mjs';
import {getRoomStairs,drawForeground} from '../room-layout.js';
const canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d'),play=document.querySelector('#play'),slow=document.querySelector('#slow'),detail=document.querySelector('#detail');
const load=url=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Immagine non disponibile'));im.src=url;});
try{
const [room,atlas,meta]=await Promise.all([load('../assets/interior.png'),load('./atlas.png'),fetch('./frames.json?v=13-support').then(r=>{if(!r.ok)throw Error('Pose non disponibili');return r.json()})]);
const painted=Array.from({length:16},(_,i)=>{const c=document.createElement('canvas');c.width=500;c.height=620;c.getContext('2d').drawImage(atlas,i%4*500,Math.floor(i/4)*620,500,620,0,0,500,620);return c;});
const pixels=painted.map(c=>c.getContext('2d').getImageData(0,0,500,620));registerPaintedColours(pixels.map(p=>p.data));painted.forEach((c,i)=>c.getContext('2d').putImageData(pixels[i],0,0));
const roomAnchor=getRoomStairs()[2],anchor={x:roomAnchor.x+20*266/500,y:roomAnchor.y},geometry=createSupportLockedAscent({anchor,frames:meta.frames,steps:2,height:266});

let phase=0,elapsed=0,running=false,last=0,rate=1,zoom=false;
const duration=2*STAIR_STANDARD.stepSeconds;
function draw(){
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,1644,957);
 if(zoom){const scale=957/410;ctx.scale(scale,scale);ctx.translate(-800,-420);}
 ctx.drawImage(room,0,0,1644,957);
 const d=geometry.placement(phase*2),f=d.frameIndex;
 ctx.drawImage(painted[f],d.origin.x,d.origin.y,500*d.scale,620*d.scale);
 drawForeground(ctx,room);
 canvas.dataset.phase=phase.toFixed(4);canvas.dataset.frame=String(f);
 canvas.dataset.revision='13-support';canvas.dataset.support=d.support;
 canvas.dataset.supportX=d.feet[d.support].x.toFixed(4);canvas.dataset.supportY=d.feet[d.support].y.toFixed(4);
}
function tick(now){if(running){const dt=Math.min(.05,(now-last)/1000||0);elapsed+=dt*rate;phase=Math.min(1,elapsed/duration);if(phase===1){running=false;play.textContent='Rivedi';}}last=now;draw();requestAnimationFrame(tick);}
play.onclick=()=>{if(running){running=false;play.textContent='Riprendi';}else{if(phase>=1){phase=0;elapsed=0;}running=true;last=performance.now();play.textContent='Pausa';}};
slow.onclick=()=>{rate=rate===1?.5:1;slow.setAttribute('aria-pressed',String(rate===.5));};
detail.onclick=()=>{zoom=!zoom;detail.setAttribute('aria-pressed',String(zoom));draw();};
play.disabled=slow.disabled=detail.disabled=false;document.querySelector('#loading').hidden=true;canvas.dataset.ready='true';requestAnimationFrame(tick);
}catch(error){document.querySelector('#loading').textContent='La prova non si è caricata. Ricarica la pagina.';console.error(error);}
