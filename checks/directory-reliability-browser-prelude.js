(() => {
 const nativeFetch=window.fetch.bind(window), timer=window.setTimeout.bind(window);
 let held=false;
 window.setTimeout=(fn,ms,...args)=>timer(fn,ms===15000?100:ms,...args);
 window.fetch=(url,options)=>{
  if(!held && document.currentScript?.src.endsWith('/directory.js')){held=true;return new Promise(resolve=>{window.directoryLateResponse=resolve;});}
  return nativeFetch(url,options);
 };
})();
