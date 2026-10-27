(()=>{
 const native=window.fetch.bind(window),timer=window.setTimeout.bind(window);let held=false;
 window.setTimeout=(fn,ms,...args)=>timer(fn,ms===5000||(ms===15000&&document.currentScript?.src.endsWith('/equipment-explorer.js'))?100:ms,...args);
 window.fetch=(url,options)=>{if(!held&&document.currentScript?.src.endsWith('/equipment-explorer.js')){held=true;return new Promise(resolve=>{window.equipmentLateResponse=resolve;});}return native(url,options);};
 window.equipmentProbeCopies=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText(value){return new Promise((resolve,reject)=>window.equipmentProbeCopies.push({value,resolve,reject}));}}});
})();
