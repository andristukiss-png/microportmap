'use strict';
// Controlled Leaflet map-layer lifecycle test: no network, devices or tile imagery.
const fs=require('fs'),assert=require('assert');
const source=fs.readFileSync('src/site-redesign.js','utf8');
const start=source.indexOf('function setupMap(){');
const end=source.indexOf('\nfunction init(){',start);
assert(start!==-1&&end>start,'atlas setupMap must be present');
const implementation=source.slice(start,end);

function harness(){
  let zoom=8,tilesCreated=0,tilesAdded=0;
  const layers=new Set(),controls={},timers=[];
  const map={
    getZoom:()=>zoom,
    setZoom(value){zoom=value;},
    fitBounds(){},invalidateSize(){},
    removeLayer(layer){layers.delete(layer);}
  };
  const panel={appendChild(el){controls[el.id]=el;}};
  const checkbox=controls['mp-geography-detail']={
    checked:false,handlers:{},
    addEventListener(name,handler){this.handlers[name]=handler;},
    closest(){return panel;}
  };
  controls.map={style:{}};
  controls['map-fallback']={style:{}};
  function layer(type){
    return {type,handlers:{},
      addTo(target){assert.strictEqual(target,map);layers.add(this);if(type==='tiles')tilesAdded++;return this;},
      bringToBack(){return this;},
      on(event,handler){this.handlers[event]=handler;return this;}
    };
  }
  let atlas,tiles;
  function control(){return {addTo(){return this;}};}
  control.zoom=()=>({addTo(){}});
  const L={
    map:()=>map,
    imageOverlay:()=>{atlas=layer('atlas');return atlas;},
    tileLayer:()=>{tilesCreated++;tiles=layer('tiles');return tiles;},
    DomUtil:{create:()=>({style:{},innerHTML:''})},
    DomEvent:{disableClickPropagation(){},disableScrollPropagation(){}},
    control
  };
  const document={createElement:()=>({id:'',textContent:'',setAttribute(){}})};
  const lookup=id=>controls[id]||null;
  const restoreOfflineZoom=()=>{if(map.getZoom()>3)map.setZoom(3,{animate:false});};
  const runner=new Function('L','document','$','setTimeout','restoreOfflineZoom',
    'var map=null;\n'+implementation+'\nsetupMap();return map;');
  assert.strictEqual(runner(L,document,lookup,(fn,ms)=>timers.push(ms),restoreOfflineZoom),map);
  return {map,checkbox,layers,controls,get atlas(){return atlas;},get tiles(){return tiles;},
    get zoom(){return zoom;},get tilesCreated(){return tilesCreated;},get tilesAdded(){return tilesAdded;}};
}
function switchMode(x,on){
  x.checkbox.checked=on;
  x.checkbox.handlers.change.call(x.checkbox);
}
const x=harness();
assert(x.layers.has(x.atlas),'schematic geography starts active');
assert.strictEqual(x.controls['map-fallback'].style.display,'none');
switchMode(x,true);
assert(x.layers.has(x.tiles)&&!x.layers.has(x.atlas),'first online transition');
assert.strictEqual(x.tilesCreated,1);
assert.strictEqual(x.controls['mp-geography-notice'].textContent,'Loading detailed geography…');
x.tiles.handlers.tileload();
assert.strictEqual(x.controls['mp-geography-notice'].textContent,'Detailed map active');
switchMode(x,false);
assert(!x.layers.has(x.tiles)&&x.layers.has(x.atlas),'manual offline transition');
assert.strictEqual(x.zoom,3,'offline atlas caps stale detailed zoom');
switchMode(x,true);
assert(x.layers.has(x.tiles)&&!x.layers.has(x.atlas),'repeat online transition reattaches tiles');
assert.strictEqual(x.tilesCreated,1,'tile listeners and layer are reused');
assert.strictEqual(x.tilesAdded,2,'tile layer was attached a second time');
x.tiles.handlers.tileerror();
x.tiles.handlers.tileerror();
assert(x.checkbox.checked,'transient tile failures keep detail enabled');
assert.strictEqual(x.controls['mp-geography-notice'].textContent,'Some tiles could not load; retrying…');
x.tiles.handlers.tileload();
assert.strictEqual(x.controls['mp-geography-notice'].textContent,'Detailed map active');
x.tiles.handlers.tileerror();
x.tiles.handlers.tileerror();
x.tiles.handlers.tileerror();
assert(!x.checkbox.checked,'third consecutive tile failure disables online detail');
assert(x.layers.has(x.atlas)&&!x.layers.has(x.tiles),'tile failure restores schematic atlas');
assert.strictEqual(x.controls['mp-geography-notice'].textContent,'Map tiles unavailable. Showing offline atlas.');
switchMode(x,true);
assert(x.checkbox.checked&&x.layers.has(x.tiles)&&!x.layers.has(x.atlas),'manual retry reinstates detailed map');
assert.strictEqual(x.tilesCreated,1,'retry must not multiply tile layers');
x.tiles.handlers.tileload();
assert.strictEqual(x.controls['mp-geography-notice'].textContent,'Detailed map active');
switchMode(x,false);
assert(x.layers.has(x.atlas)&&!x.layers.has(x.tiles),'final offline transition');
console.log('PASS: atlas schematic/online toggle, repeated layer reuse, transient errors, automatic fallback and retry');
