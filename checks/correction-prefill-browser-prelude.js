(()=>{
 const original=window.fetch.bind(window);window.__cpOriginalFetch=original;
 let captured=false;
 window.fetch=(...args)=>{
  if(!captured&&String(args[0])==='/data/projects.json'&&document.currentScript?.src?.endsWith('/correction-prefill.js')){
   captured=true;return new Promise(resolve=>{window.__cpReleaseLookup=resolve;});
  }
  return original(...args);
 };
})();
