(()=>{
 const timer=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>timer(fn,ms===5000?100:ms,...args);
 window.comparisonProbeCopies=[];
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText(value){return new Promise((resolve,reject)=>window.comparisonProbeCopies.push({value,resolve,reject}));}}});
})();
