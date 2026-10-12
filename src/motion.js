/* SURCO motion: presentation-only. Domain actions never wait for this module. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SurcoMotion=api;})(globalThis,()=>{
'use strict';
const tokens=Object.freeze({ack:110,control:180,context:280,transfer:380,extract:420,mount:520,return:380,stagger:30,staggerMax:150,lift:10,magnify:1.035,omega:18,epsilon:.0002,velocityEpsilon:.002,ease:'cubic-bezier(.22,.68,.18,1)'});
function spring(x,v,target,omega,dt){if(![x,v,target,omega,dt].every(Number.isFinite)||omega<=0||dt<0)throw new RangeError('Invalid spring state');const d=x-target,b=v+omega*d,e=Math.exp(-omega*dt);return[target+(d+b*dt)*e,(v-omega*b*dt)*e];}
function nearestAngle(from,to){return from+Math.atan2(Math.sin(to-from),Math.cos(to-from));}
function delay(index){return Math.min(Math.max(0,index)*tokens.stagger,tokens.staggerMax);}
class Director{
 constructor({reduced=false}={}){this.reduced=reduced;this.active=new Map();this.serial=0;}
 run(key,el,frames,options={},cleanup=()=>{}){
  this.cancel(key);
  if(this.reduced||typeof el?.animate!=='function'){cleanup();return Promise.resolve('skipped');}
  return new Promise(resolve=>{
   let animation,done=false;
   const entry={finish:result=>{if(done)return;done=true;if(this.active.get(key)===entry)this.active.delete(key);try{animation?.cancel();}catch{}try{cleanup();}finally{resolve(result);}}};
   try{animation=el.animate(frames,{duration:tokens.control,easing:tokens.ease,fill:'both',...options});this.active.set(key,entry);animation.finished.then(()=>entry.finish('finished'),error=>{if(error?.name!=='AbortError')console.warn('SURCO motion fallback:',error);entry.finish('cancelled');});}catch(error){console.warn('SURCO motion unavailable:',error);entry.finish('skipped');}
  });
 }
 cancel(key){this.active.get(key)?.finish('cancelled');}
 cancelAll(){for(const entry of [...this.active.values()])entry.finish('cancelled');}
 setReduced(value){this.reduced=!!value;if(this.reduced)this.cancelAll();}
 fade(key,element){return this.run(key,element,[{opacity:.55},{opacity:1}],{duration:tokens.control});}
 capture(container){return new Map([...container.children].map(el=>[el.dataset.key,{rect:el.getBoundingClientRect(),el}]));}
 layout(container,before,{sameContext=true}={}){
  for(const el of container.children)this.cancel('card:'+el.dataset.key);
  const after=[...container.children].map(el=>({el,rect:el.getBoundingClientRect()}));let fresh=0;
  for(const{el,rect}of after){const id=el.dataset.key,old=sameContext?before.get(id):null,key='card:'+id;
   if(old){const x=old.rect.left-rect.left,y=old.rect.top-rect.top;this.cancel(key);if(Math.abs(x)+Math.abs(y)>.5)this.run(key,el,[{transform:`translate(${x}px,${y}px)`},{transform:'translate(0,0)'}],{duration:tokens.context});}
   else if(rect.right>0&&rect.left<innerWidth&&rect.top<innerHeight&&rect.bottom>0){this.run(key,el,[{transform:`translateY(${tokens.lift}px)`,opacity:.5},{transform:'translateY(0)',opacity:1}],{duration:tokens.context,delay:delay(fresh++)});}
  }
  for(const[id,{el}]of before)if(!el.isConnected)this.cancel('card:'+id);
 }
 transfer(image,destination,hide=()=>{},restore=()=>{}){
  this.cancel('sleeve-transfer');
  const a=image?.getBoundingClientRect(),b=destination;
  if(this.reduced||!a||!b||!a.width||!b.width||a.top<0||a.bottom>innerHeight||b.top<0||b.top+b.height>innerHeight)return false;
  const ghost=image.cloneNode(false);ghost.removeAttribute('id');ghost.alt='';ghost.setAttribute('aria-hidden','true');ghost.inert=true;ghost.className='motion-sleeve';
  Object.assign(ghost.style,{position:'fixed',left:a.left+'px',top:a.top+'px',width:a.width+'px',height:a.height+'px',pointerEvents:'none',zIndex:'20',transformOrigin:'0 0'});
  document.body.append(ghost);hide();
  this.run('sleeve-transfer',ghost,[{transform:'translate(0,0) scale(1)',opacity:1},{offset:.8,opacity:1},{transform:`translate(${b.left-a.left}px,${b.top-a.top}px) scale(${b.width/a.width},${b.height/a.height})`,opacity:0}],{duration:tokens.transfer},()=>{ghost.remove();restore();});return true;
 }
 installTokens(){if(typeof document==='undefined')return;const root=document.documentElement;for(const name of ['ack','control','context','transfer','extract','mount','return'])root.style.setProperty('--motion-'+name,tokens[name]+'ms');root.style.setProperty('--motion-ease',tokens.ease);root.style.setProperty('--motion-magnify',String(tokens.magnify));}
}
return{tokens,spring,delay,nearestAngle,Director};
});
