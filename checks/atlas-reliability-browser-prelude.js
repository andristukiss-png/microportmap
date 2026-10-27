(()=>{
 const native=window.fetch.bind(window),timer=window.setTimeout.bind(window);let held=false;
 window.setTimeout=(fn,ms,...args)=>timer(fn,ms===15000?100:ms,...args);
 window.fetch=(url,options)=>{if(!held&&document.currentScript?.src.endsWith('/site-redesign.js')){held=true;return new Promise(resolve=>{window.atlasLateResponse=resolve;});}return native(url,options);};
})();
