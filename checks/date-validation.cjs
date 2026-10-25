const fs=require('fs'),vm=require('vm'),assert=require('assert');
let day=24,month=9,year=2026,validation='',prevented=false,stopped=false;
const handlers={},windowHandlers={},docHandlers={};
const el={value:'',max:'',form:{addEventListener(k,fn){handlers['form:'+k]=fn;}},addEventListener(k,fn){handlers[k]=fn;},setCustomValidity(s){validation=s;},checkValidity(){return !validation;},reportValidity(){this.reported=true;},focus(){this.focused=true;}};
class LocalDate{getFullYear(){return year;}getMonth(){return month;}getDate(){return day;}}
const doc={visibilityState:'visible',getElementById:()=>el,addEventListener(k,fn){docHandlers[k]=fn;}};
vm.runInNewContext(fs.readFileSync('src/source-date-validation.js','utf8'),{document:doc,window:{addEventListener(k,fn){windowHandlers[k]=fn;}},Date:LocalDate});
assert.equal(el.max,'2026-10-24');el.value='2026-10-25';handlers.input();assert(validation.includes('future'));
day=25;handlers.focus();assert.equal(el.max,'2026-10-25');assert.equal(validation,'');
day=26;windowHandlers.focus();assert.equal(el.max,'2026-10-26');
day=27;docHandlers.visibilitychange();assert.equal(el.max,'2026-10-27');
doc.visibilityState='hidden';day=28;docHandlers.visibilitychange();assert.equal(el.max,'2026-10-27');
el.value='2026-10-29';handlers['form:submit']({preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;}});assert(prevented&&stopped&&el.reported&&el.focused);
el.value='';handlers.change();assert.equal(validation,'');
month=11;day=31;handlers.focus();assert.equal(el.max,'2026-12-31');year=2027;month=0;day=1;windowHandlers.focus();assert.equal(el.max,'2027-01-01');
console.log('PASS: local date, future rejection, optional date, resumed focus/visibility, midnight/year rollover and submit validation');
