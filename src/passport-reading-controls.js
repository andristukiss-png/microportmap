/* Passport Reading Comfort: ten optional non-destructive reading actions on original research pages. */
(()=>{
'use strict';
const match=location.pathname.match(/^\/projects\/([a-z0-9-]+)\/?$/);
if(!match||document.getElementById('mprc-controls'))return;
const id=match[1],main=document.querySelector('main');
if(!main)return;
const node=(tag,cls,caption)=>{
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(caption!==undefined)el.textContent=caption;
 return el;
};
let scale=1,spacing='normal',focused=false,actionCount=0;
const root=node('details','mprc-reader');
root.id='mprc-controls';
const head=node('summary','mprc-title','Reading controls · 10 actions');
head.setAttribute('aria-controls','mprc-action-grid');
const panel=node('div','mprc-panel');
const description=node('p','mprc-description',
 'Adjust how this research passport reads. These settings affect this page only; source text, research data and colors are unchanged.');
const controls=node('div','mprc-grid');
controls.id='mprc-action-grid';
controls.setAttribute('role','group');
controls.setAttribute('aria-label','Project reading preferences');
const status=node('p','mprc-status');
status.id='mprc-status';
status.setAttribute('role','status');
status.setAttribute('aria-live','polite');
const caveat=node('p','mprc-note',
 'Focus mode hides supplementary research tools temporarily, but never deletes them. Open “Show research tools” to restore them.');
panel.append(description,controls,status,caveat);
root.append(head,panel);
const hero=main.querySelector('.hero');
if(hero)hero.insertAdjacentElement('afterend',root);
else main.insertBefore(root,main.firstChild);
function announce(text){status.textContent=text;}
function refresh(){
 main.style.setProperty('--mprc-scale',String(scale));
 document.body.classList.toggle('mprc-active',scale!==1);
 document.body.classList.toggle('mprc-focus',focused);
 document.body.classList.toggle('mprc-comfort',spacing==='comfortable');
 document.body.classList.toggle('mprc-compact',spacing==='compact');
 for(const btn of controls.children){
  const k=btn.dataset.mprcAction;
  const pressed=k==='focus'&&focused||k==='tools'&&!focused||
    k==='normal-text'&&scale===1||k==='comfort'&&spacing==='comfortable'||k==='compact'&&spacing==='compact';
  btn.setAttribute('aria-pressed',String(pressed));
 }
}
function action(key){
 let message='';
 switch(key){
  case 'focus':focused=true;message='Focus mode: supplementary panels hidden, original passport visible.';break;
  case 'tools':focused=false;message='Research tools restored.';break;
  case 'larger':scale=Math.min(1.4,+(scale+.1).toFixed(2));message='Passport text increased to '+Math.round(scale*100)+'%.';break;
  case 'smaller':scale=Math.max(.9,+(scale-.1).toFixed(2));message='Passport text adjusted to '+Math.round(scale*100)+'%.';break;
  case 'normal-text':scale=1;message='Passport text restored to 100%.';break;
  case 'comfort':spacing=spacing==='comfortable'?'normal':'comfortable';message='Reading spacing: '+spacing+'.';break;
  case 'compact':spacing=spacing==='compact'?'normal':'compact';message='Reading spacing: '+spacing+'.';break;
  case 'expand':{
    const sections=[...main.querySelectorAll('details')].filter(d=>d!==root);
    sections.forEach(d=>{d.open=true;});
    message=sections.length+' additional research disclosures expanded.';break;
  }
  case 'collapse':{
    const sections=[...main.querySelectorAll('details')].filter(d=>d!==root);
    sections.forEach(d=>{d.open=false;});
    message=sections.length+' additional research disclosures collapsed.';break;
  }
  case 'print':{
    message='Opening the browser print dialog for the original research passport.';
    announce(message);refresh();
    if(typeof window.print==='function')window.print();
    return true;
  }
  default:return false;
 }
 refresh();announce(message);return true;
}
const buttons=[
 ['focus','Focus on project'],
 ['tools','Show research tools'],
 ['larger','Larger text'],
 ['smaller','Smaller text'],
 ['normal-text','Normal text'],
 ['comfort','Comfortable spacing'],
 ['compact','Compact spacing'],
 ['expand','Expand research sections'],
 ['collapse','Collapse research sections'],
 ['print','Print research passport']
];
for(const [key,title] of buttons){
 const button=node('button','mprc-button',title);
 button.type='button';
 button.dataset.mprcAction=key;
 button.setAttribute('aria-label',title);
 button.addEventListener('click',()=>action(key));
 controls.append(button);
}
refresh();
announce('Reading controls ready. Settings apply only to this page.');
root.dataset.mprcReady='true';
window.MicroportReading=Object.freeze({
 getState:()=>({projectId:id,ready:true,actions:controls.children.length,scale,spacing,focused}),
 getActions:()=>buttons.map(x=>x[0]),
 activate:action
});
})();