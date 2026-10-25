(function(){
"use strict";
function setup(){
  var $=function(id){return document.getElementById(id)};
  var chips=$("chips");if(!chips || typeof records==="undefined")return;
  var sourceFrom=function(r){return /government report|government agency/i.test(r.source)?"authority":"industry"};
  var selected=new Set(), params=new URLSearchParams(location.search), maxCompare=3;
  var incoming=(params.get("compare")||"").split(",").filter(function(id){return records.some(function(r){return r.id===id})}).slice(0,maxCompare);incoming.forEach(function(id){selected.add(id)});
  var bar=document.createElement("div");bar.className="research-toolbar";bar.setAttribute("aria-label","Additional research tools");
  bar.innerHTML='<label for="research-source">Source type</label><select id="research-source" aria-label="Filter by original source type"><option value="all">All source types</option><option value="authority">Government reports</option><option value="industry">Other published reports</option></select>'+
  '<button type="button" id="research-fit">⌖ Fit map</button><button type="button" id="research-copy">↗ Share filtered view</button>'+
  '<span id="research-count" role="status" aria-live="polite"></span>';
  chips.insertAdjacentElement("afterend",bar);
  var panel=document.createElement("section");panel.className="research-panel";panel.id="research-compare";panel.setAttribute("aria-label","Compare selected project reports");panel.setAttribute("aria-live","polite");
  bar.insertAdjacentElement("afterend",panel);
  var notice=document.createElement("p");notice.className="research-caveat";notice.textContent="Map pins show reported projects, not verified landing sites. Equipment references do not imply technical compatibility.";
  panel.insertAdjacentElement("afterend",notice);
  var source=$("research-source"),count=$("research-count");
  if(["authority","industry"].includes(params.get("source")))source.value=params.get("source");
  function sanitize(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
  function csvQuote(s){return '"'+String(s||"").replace(/"/g,'""')+'"'}
  function comparisonURL(){
    var u=new URL(getFilterUrl());
    u.searchParams.delete("compare");
    if(selected.size)u.searchParams.set("compare",[...selected].join(","));
    u.hash="explore";return u.toString()
  }
  async function copyLink(){
    var str=comparisonURL();
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(str);$("research-copy").textContent="✓ Link copied"}
      else{var input=document.createElement("textarea");input.value=str;document.body.appendChild(input);input.select();var ok=document.execCommand("copy");input.remove();$("research-copy").textContent=ok?"✓ Link copied":"Copy URL from address bar"}
      setTimeout(function(){$("research-copy").textContent="↗ Share filtered view"},2500)
    }catch(e){$("research-copy").textContent="Copy URL from address bar";setTimeout(function(){$("research-copy").textContent="↗ Share filtered view"},3000)}
  }
  function downloadComparison(){
    var chosen=[...selected].map(function(id){return records.find(function(r){return r.id===id})}).filter(Boolean);
    var cols=["Name","Country","Type","Operator","Technology","Location precision","Evidence source","Source URL"];
    var lines=[cols.map(csvQuote).join(",")].concat(chosen.map(function(r){return [r.name,r.country,r.type,r.operator,r.tech,r.scope,r.source,r.url].map(csvQuote).join(",")}));
    var u=URL.createObjectURL(new Blob(["\ufeff"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"}));
    var a=document.createElement("a");a.href=u;a.download="MicroportMap-comparison.csv";a.click();setTimeout(function(){URL.revokeObjectURL(u)},1000)
  }
  var originalFiltered=filtered;
  filtered=function(){
    var arr=originalFiltered();
    if(source.value!=="all")arr=arr.filter(function(r){return sourceFrom(r)===source.value});
    return arr
  };
  var originalGet=getFilterUrl;
  getFilterUrl=function(){
    var u=new URL(originalGet());
    if(source.value!=="all")u.searchParams.set("source",source.value);
    var countryControl=$("mmpx-country"), sortControl=$("mmpx-sort");
    if(countryControl&&countryControl.value!=="all")u.searchParams.set("country",countryControl.value);
    if(sortControl&&sortControl.value!=="default")u.searchParams.set("sort",sortControl.value);
    return u.toString()
  };
  var originalWrite=writeUrlState;
  writeUrlState=function(){
    originalWrite();
    var u=new URL(location.href);
    u.searchParams.delete("source");u.searchParams.delete("compare");
    if(source.value!=="all")u.searchParams.set("source",source.value);
    var countryControl=$("mmpx-country"), sortControl=$("mmpx-sort");
    u.searchParams.delete("country");u.searchParams.delete("sort");
    if(countryControl&&countryControl.value!=="all")u.searchParams.set("country",countryControl.value);
    if(sortControl&&sortControl.value!=="default")u.searchParams.set("sort",sortControl.value);
    if(selected.size)u.searchParams.set("compare",[...selected].join(","));
    try{history.replaceState(null,"",u.pathname+u.search+u.hash)}catch(e){}
  };
  function compareTable(){
    var chosen=[...selected].map(function(id){return records.find(function(r){return r.id===id})}).filter(Boolean);
    panel.classList.toggle("visible",!!chosen.length);
    if(!chosen.length){panel.innerHTML="";return}
    function row(name,key){return '<tr><th scope="row">'+sanitize(name)+'</th>'+chosen.map(function(r){return '<td>'+sanitize(r[key])+'</td>'}).join("")+'</tr>'}
    panel.innerHTML='<div class="research-panel-head"><div><h3>Compare projects ('+chosen.length+'/'+maxCompare+')</h3><p>Reported characteristics only — no verified live status</p></div><div class="research-panel-actions"><button type="button" id="research-download">↓ CSV</button><button type="button" id="research-clear">Clear ×</button></div></div>'+
      '<div class="research-table-scroll"><table><thead><tr><th scope="col">Attribute</th>'+
      chosen.map(function(r){return '<th scope="col"><a href="/projects/'+encodeURIComponent(r.id)+'/">'+sanitize(r.name)+'</a></th>'}).join("")+
      '</tr></thead><tbody>'+row("Country","country")+row("Infrastructure type","type")+row("Reported operator","operator")+row("Reported equipment","tech")+row("Map precision","scope")+row("Evidence date label","date")+
      '<tr><th scope="row">Evidence</th>'+chosen.map(function(r){return '<td><a href="'+sanitize(r.url)+'" target="_blank" rel="noopener noreferrer">Original report ↗</a></td>'}).join("")+'</tr>'+
      '</tbody></table></div>';
    $("research-download").addEventListener("click",downloadComparison);
    $("research-clear").addEventListener("click",function(){selected.clear();render();writeUrlState()})
  }
  var priorRender=render;
  render=function(){
    priorRender();
    count.textContent=filtered().length+" of "+records.length+" reported projects";
    document.querySelectorAll("[data-record]").forEach(function(card){
      var id=card.dataset.record,record=records.find(function(r){return r.id===id});
      if(!record)return;
      var actions=document.createElement("div");actions.className="research-card-actions";
      var button=document.createElement("button");button.type="button";
      button.textContent=selected.has(id)?"✓ Comparing":"+ Compare";
      button.className="research-toggle";button.setAttribute("aria-pressed",String(selected.has(id)));
      button.setAttribute("aria-label","Compare "+record.name);
      if(!selected.has(id)&&selected.size>=maxCompare){button.disabled=true;button.title="Compare up to 3 projects"}
      button.addEventListener("click",function(e){
        e.stopPropagation();e.preventDefault();
        if(selected.has(id))selected.delete(id);else if(selected.size<maxCompare)selected.add(id);
        render();writeUrlState();
        var again=document.querySelector('[data-record="'+id+'"] .research-toggle');if(again)again.focus({preventScroll:true})
      });
      button.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" ")e.stopPropagation()});
      var evidence=document.createElement("span");evidence.className="research-source-label";
      evidence.textContent=sourceFrom(record)==="authority"?"Authority source":"Other publication";
      actions.append(button,evidence);
      var summary=card.querySelector(".desc");if(summary)summary.insertAdjacentElement("afterend",actions)
    });
    compareTable();
    if(!filtered().length){
      var empty=document.querySelector(".empty");
      if(empty){var b=document.createElement("button");b.type="button";b.className="research-reset";b.textContent="Reset filters";b.onclick=function(){$("reset").click()};empty.appendChild(b)}
    }
  };
  source.addEventListener("change",function(){activeId=null;render();writeUrlState()});
  $("reset").addEventListener("click",function(){source.value="all";selected.clear()},true);
  $("research-copy").addEventListener("click",copyLink);
  $("research-fit").addEventListener("click",function(){
    var visible=filtered();
    if(map&&window.L&&visible.length){map.fitBounds(L.latLngBounds(visible.map(function(r){return [r.lat,r.lng]})).pad(.25),{animate:false,maxZoom:5})}
    else document.querySelector(".map-wrap")?.scrollIntoView({behavior:"smooth",block:"nearest"})
  });
  render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup);else setup()
})();