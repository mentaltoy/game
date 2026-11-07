import {registerPaintedColours} from './display-grade.mjs';
import {createAscentGeometry} from './ascent-cycle.mjs';
import {getRoomStairs,drawForeground} from '../room-layout.js';
const canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d'),play=document.querySelector('#play'),slow=document.querySelector('#slow'),detail=document.querySelector('#detail');
const load=url=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Immagine non disponibile'));im.src=url;});
try{
const [room,atlas,meta]=await Promise.all([load('../assets/interior.png'),load('./atlas.png'),fetch('./frames.json').then(r=>{if(!r.ok)throw Error('Pose non disponibili');return r.json()})]);
const painted=Array.from({length:16},(_,i)=>{const c=document.createElement('canvas');c.width=500;c.height=620;c.getContext('2d').drawImage(atlas,i%4*500,Math.floor(i/4)*620,500,620,0,0,500,620);return c;});
const pixels=painted.map(c=>c.getContext('2d').getImageData(0,0,500,620));registerPaintedColours(pixels.map(p=>p.data));painted.forEach((c,i)=>c.getContext('2d').putImageData(pixels[i],0,0));
const nodes=getRoomStairs().slice(1,5),geometry=createAscentGeometry({nodes,frames:meta.frames,height:266,referenceHeight:500});

let phase=0,elapsed=0,running=false,last=0,rate=1,zoom=false;
const duration=.9;
function draw(){
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,1644,957);
 if(zoom){const scale=957/410;ctx.scale(scale,scale);ctx.translate(-800,-420);}
 ctx.drawImage(room,0,0,1644,957);
 const p=1+phase*2,d=geometry.placement(p),f=d.frameIndex;
 ctx.drawImage(painted[f],d.origin.x,d.origin.y,500*d.scale,620*d.scale);
 drawForeground(ctx,room);
 canvas.dataset.phase=phase.toFixed(4);canvas.dataset.frame=String(f);
}
function tick(now){if(running){const dt=Math.min(.05,(now-last)/1000||0);elapsed+=dt*rate;phase=Math.min(1,elapsed/duration);if(phase===1){running=false;play.textContent='Rivedi';}}last=now;draw();requestAnimationFrame(tick);}
play.onclick=()=>{if(running){running=false;play.textContent='Riprendi';}else{if(phase>=1){phase=0;elapsed=0;}running=true;last=performance.now();play.textContent='Pausa';}};
slow.onclick=()=>{rate=rate===1?.5:1;slow.setAttribute('aria-pressed',String(rate===.5));};
detail.onclick=()=>{zoom=!zoom;detail.setAttribute('aria-pressed',String(zoom));draw();};
play.disabled=slow.disabled=detail.disabled=false;document.querySelector('#loading').hidden=true;canvas.dataset.ready='true';requestAnimationFrame(tick);
}catch(error){document.querySelector('#loading').textContent='La prova non si è caricata. Ricarica la pagina.';console.error(error);}
