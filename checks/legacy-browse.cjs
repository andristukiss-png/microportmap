const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/legacy-browse.js','utf8');
for(const [query,expected] of [['?year=2025#explore','year=2025'],['?region=Europe&country=Germany&q=dock#explore','region=Europe'],['?year=unknown&sort=recent','year=unknown']]){
 let redirect;vm.runInNewContext(source,{URL,location:{href:'https://microportmap.com/'+query,replace:u=>redirect=u}});let u=new URL(redirect);assert.equal(u.origin,'https://microportmap.com');assert.equal(u.pathname,'/directory/');assert.equal(u.hash,'#results');assert(u.search.includes(expected));
}
for(const query of ['?project=shenzhen&year=2025','?q=China','#explore']){let called=false;vm.runInNewContext(source,{URL,location:{href:'https://microportmap.com/'+query,replace:()=>called=true}});assert.equal(called,false)}
console.log('PASS: legacy year/region URLs route to directory with filters and results anchor; project and ordinary atlas URLs retain precedence');
