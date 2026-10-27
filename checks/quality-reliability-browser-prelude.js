(() => {
 const nativeFetch=window.fetch.bind(window), timer=window.setTimeout.bind(window);
 let held=false;
 window.addEventListener('mp-quality-ready',e=>{window.qualityProbeRecords=e.detail.records;});
 window.setTimeout=(fn,ms,...args)=>timer(fn,ms===15000&&document.currentScript?.src.endsWith('/data-quality.js')?100:ms,...args);
 window.fetch=(url,options)=>{
  if(!held && document.currentScript?.src.endsWith('/data-quality.js')){held=true;return new Promise(resolve=>{window.qualityLateResponse=resolve;});}
  return nativeFetch(url,options);
 };
})();
