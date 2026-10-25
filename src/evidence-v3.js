(function(){
"use strict";
function start(){
 const $=id=>document.getElementById(id);
 if(!$("chips")||typeof records==="undefined")return;
 const years=[...new Set(records.map(r=>{const match=String(r.date||"").match(/\b20(?:1\d|2\d)\b/);return match?match[0]:"unknown"}))].sort((a,b)=>b.localeCompare(a));
 const controls=document.createElement("div");controls.id="mmp-year-tools";controls.setAttribute("aria-label","Extra explorer tools");
 const wrapper=document.createElement("label");wrapper.textContent="Report year";
 const select=document.createElement("select");select.id="mmp-report-year";select.setAttribute("aria-label","Filter by year shown on source report");select.appendChild(new Option("All report years","all"));
 for(const value of years)select.appendChild(new Option(value==="unknown"?"Date unspecified":value,value));
 wrapper.appendChild(select);controls.appendChild(wrapper);
 const exportButton=document.createElement("button");exportButton.type="button";exportButton.textContent="↓ Visible GeoJSON";exportButton.title="Download only the currently filtered approximate research project points";controls.appendChild(exportButton);
 const resetButton=document.createElement("button");resetButton.type="button";resetButton.textContent="↺ Reset all";controls.appendChild(resetButton);
 const count=document.createElement("span");count.id="mmp-year-summary";count.setAttribute("role","status");count.setAttribute("aria-live","polite");controls.appendChild(count);
 $("chips").insertAdjacentElement("afterend",controls);
 const urlParams=new URLSearchParams(location.search);
 const param=urlParams.get("year");if(years.includes(param))select.value=param;
 const originalFilter=filtered;
 filtered=function(){const existing=originalFilter();if(select.value==="all")return existing;return existing.filter(r=>{const match=String(r.date||"").match(/\b20(?:1\d|2\d)\b/);const val=match?match[0]:"unknown";return val===select.value})};
 const originalGet=getFilterUrl;
 getFilterUrl=function(){const u=new URL(originalGet());u.searchParams.delete("year");if(select.value!=="all")u.searchParams.set("year",select.value);return u.toString()};
 const originalWrite=writeUrlState;
 writeUrlState=function(){originalWrite();const u=new URL(location.href);u.searchParams.delete("year");if(select.value!=="all")u.searchParams.set("year",select.value);try{history.replaceState(null,"",u.pathname+u.search+u.hash)}catch(e){}};
 const previousRender=render;render=function(){previousRender();count.textContent=filtered().length+" source-linked project reports visible"};
 function update(){activeId=null;render();writeUrlState()}
 select.addEventListener("change",update);
 $("reset").addEventListener("click",()=>{select.value="all"},true);
 resetButton.addEventListener("click",()=>{$("reset").click()});
 function filteredGeoJSON(){return {type:"FeatureCollection",properties:{origin:"MicroportMap",notice:"All coordinates are approximate regional representatives and not landing sites or flight permissions.",filterYear:select.value},features:filtered().map(r=>({type:"Feature",geometry:{type:"Point",coordinates:[r.lng,r.lat]},properties:{id:r.id,name:r.name,country:r.country,region:r.region,source:r.url,precision:r.scope,approximate:true}}))}};
 exportButton.addEventListener("click",()=>{const blob=new Blob([JSON.stringify(filteredGeoJSON(),null,2)],{type:"application/geo+json"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="MicroportMap-visible-approximate.geojson";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
 const fromSource=new WeakMap();
 document.addEventListener("keydown",event=>{if(event.key==="Escape"&&event.target===$("search")&&$("search").value){event.preventDefault();$("search").value="";$("search").dispatchEvent(new Event("input",{bubbles:true}))}},true);
 const previousClose=closeModal;let lastFocused=null;
 $("submitBtn").addEventListener("click",()=>{lastFocused=document.activeElement},true);
 closeModal=function(){previousClose();if(lastFocused&&typeof lastFocused.focus==="function")lastFocused.focus()};
 document.addEventListener("keydown",event=>{if(event.key!=="Tab"||!$("modalBg")?.classList.contains("show"))return;const items=[...$("modalBg").querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),a[href]')].filter(e=>e.getClientRects().length);if(items.length<2)return;const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}},true);
 const src=$("facilitySource");src?.setAttribute("pattern","https://.*");src?.setAttribute("title","A public HTTPS link to your source is required");
 src?.addEventListener("input",()=>src.setCustomValidity(""));
 $("suggestForm")?.addEventListener("submit",event=>{try{const u=new URL(src.value);if(u.protocol!=="https:")throw Error("Not HTTPS")}catch(e){event.preventDefault();event.stopImmediatePropagation();src.setCustomValidity("Please enter a valid HTTPS public source URL");src.reportValidity()}},true);
 const countEl=$("resultsCount");if(countEl){countEl.setAttribute("role","status");countEl.setAttribute("aria-live","polite");countEl.setAttribute("aria-atomic","true")}
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();