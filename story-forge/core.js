const SF_KEY='story-forge-v4';
const SF_LEGACY=['story-forge-v3','story-forge-v2','story-forge-v1'];
const SF_COLLECTIONS=['characters','factions','locations','lore','arcs','acts','chapters','scenes','events','relationships','states','timeline','foreshadows','mysteries','abilities','powerRules','notes'];
const SF_LABELS={characters:'الشخصيات',factions:'الفصائل',locations:'الأماكن',lore:'المعرفة والـLore',arcs:'الآركات',acts:'الأجزاء',chapters:'الفصول',scenes:'المشاهد',events:'الأحداث',relationships:'العلاقات',states:'حالات الشخصيات',timeline:'الخط الزمني',foreshadows:'التلميحات',mysteries:'الألغاز والأسرار',abilities:'القدرات',powerRules:'قواعد القوى',notes:'الملاحظات'};
const SF_META={version:4,title:'Story Forge',updatedAt:new Date().toISOString(),createdAt:new Date().toISOString()};
function sfId(){return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}
function sfBlank(){const o={...SF_META};SF_COLLECTIONS.forEach(k=>o[k]=[]);o.meta={title:'',author:'',genre:'',premise:'',version:4};return o}
function sfReadLegacy(){for(const k of SF_LEGACY){try{const x=JSON.parse(localStorage.getItem(k)||'null');if(x&&typeof x==='object')return x}catch{}}return null}
function sfNormalizeEntity(x={},type){const y={...x};if(!y.id)y.id=sfId();y.type=type;y.createdAt=y.createdAt||new Date().toISOString();y.updatedAt=new Date().toISOString();return y}
function sfMigrate(){let existing=null;try{existing=JSON.parse(localStorage.getItem(SF_KEY)||'null')}catch{};if(existing&&existing.version>=4){SF_COLLECTIONS.forEach(k=>{if(!Array.isArray(existing[k]))existing[k]=[]});if(!existing.meta)existing.meta=sfBlank().meta;return existing}
const old=existing||sfReadLegacy();const db=sfBlank();if(!old)return db;
for(const x of old.characters||[])db.characters.push(sfNormalizeEntity({...x,profile:x.profile||{},state:{status:x.status||'active'}},'character'));
for(const x of old.world||[]){const text=((x.name||'')+' '+(x.desc||'')+' '+(x.meta||'')).toLowerCase();const faction=/faction|organization|tribe|government|حزب|فصيل|قبيلة|حكومة/.test(text);const location=/city|town|region|place|موقع|مدينة|منطقة|مكان/.test(text);db[faction?'factions':location?'locations':'lore'].push(sfNormalizeEntity(x,faction?'faction':location?'location':'lore'));}
for(const x of old.arcs||[])db.arcs.push(sfNormalizeEntity(x,'arc'));
for(const x of old.chapters||[])db.chapters.push(sfNormalizeEntity({...x,arcId:x.arcId||'',sceneIds:x.sceneIds||[],characterIds:x.characterIds||[],eventIds:x.eventIds||[]},'chapter'));
for(const x of old.timeline||[])db.timeline.push(sfNormalizeEntity({...x,year:x.year||null,month:x.month||null,day:x.day||null},'timeline'));
for(const x of old.relationships||[])db.relationships.push(sfNormalizeEntity(x,'relationship'));
for(const x of old.notes||[])db.notes.push(sfNormalizeEntity(x,'note'));
return db}
let SF_DB=sfMigrate();
function sfSave(){SF_DB.version=4;SF_DB.updatedAt=new Date().toISOString();localStorage.setItem(SF_KEY,JSON.stringify(SF_DB))}
function sfAll(){return SF_COLLECTIONS.flatMap(c=>SF_DB[c].map(x=>({...x,collection:c,label:SF_LABELS[c]})))}
function sfName(id){if(!id)return '';const e=sfAll().find(x=>x.id===id);return e?e.name||e.title||'بدون اسم':''}
function sfGet(id){return sfAll().find(x=>x.id===id)||null}
function sfCreate(collection,data={}){const x=sfNormalizeEntity(data,collection);SF_DB[collection].push(x);sfSave();return x}
function sfUpdate(collection,id,data){const i=SF_DB[collection].findIndex(x=>x.id===id);if(i<0)return null;SF_DB[collection][i]={...SF_DB[collection][i],...data,updatedAt:new Date().toISOString()};sfSave();return SF_DB[collection][i]}
function sfRemove(collection,id){const i=SF_DB[collection].findIndex(x=>x.id===id);if(i<0)return false;SF_DB[collection].splice(i,1);for(const c of SF_COLLECTIONS){SF_DB[c]=SF_DB[c].map(x=>{const y={...x};for(const [k,v] of Object.entries(y)){if(k.endsWith('Id')&&v===id)y[k]='';if(k.endsWith('Ids')&&Array.isArray(v))y[k]=v.filter(a=>a!==id)}return y})}sfSave();return true}
function sfSearch(query){const q=String(query||'').trim().toLowerCase();if(!q)return[];return sfAll().filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(0,200)}
function sfRel(fromId,toId,type='related',note=''){return sfCreate('relationships',{name:type,from:fromId,to:toId,relationshipType:type,desc:note})}
function sfTimelineEvent(data){return sfCreate('timeline',data)}
function sfCharacterState(characterId,data){return sfCreate('states',{characterId,...data})}
function sfExport(){return JSON.stringify(SF_DB,null,2)}
function sfImport(raw){const incoming=typeof raw==='string'?JSON.parse(raw):raw;if(!incoming||typeof incoming!=='object')throw new Error('invalid');const next=sfBlank();SF_COLLECTIONS.forEach(c=>{if(Array.isArray(incoming[c]))next[c]=incoming[c].map(x=>sfNormalizeEntity(x,c))});next.meta=incoming.meta||next.meta;SF_DB=next;sfSave();return next}
function sfStats(){const r={};SF_COLLECTIONS.forEach(c=>r[c]=SF_DB[c].length);r.total=SF_COLLECTIONS.reduce((n,c)=>n+r[c],0);return r}
function sfCharacterAge(characterId,year,month=null,day=null){const c=sfGet(characterId);if(!c||!c.birthYear||year==null)return null;let age=Number(year)-Number(c.birthYear);if(c.birthMonth&&month&&Number(month)<Number(c.birthMonth))age--;return age}
function sfTimelineSort(){return [...SF_DB.timeline].sort((a,b)=>{const ak=[a.year??999999,a.month??99,a.day??99,a.order??999999];const bk=[b.year??999999,b.month??99,b.day??99,b.order??999999];for(let i=0;i<ak.length;i++){if(ak[i]!==bk[i])return ak[i]-bk[i]}return 0})}
function sfContinuity(){const issues=[];const chars=SF_DB.characters;const all=sfAll();const charById=id=>chars.find(c=>c.id===id);
const seen=new Map();chars.forEach(c=>{const n=(c.name||'').trim().toLowerCase();if(n){if(seen.has(n))issues.push({level:'warning',kind:'duplicate',message:`اسم شخصية مكرر: ${c.name}`,entities:[c.id,seen.get(n)]});seen.set(n,c.id)}});
SF_DB.chapters.forEach(c=>{if(!String(c.text||c.desc||'').trim())issues.push({level:'info',kind:'empty-chapter',message:`الفصل ${c.name||c.title||''} بلا نص محفوظ`,entities:[c.id]})});
const timeline=sfTimelineSort();for(let i=1;i<timeline.length;i++){if(timeline[i].year!=null&&timeline[i-1].year!=null&&Number(timeline[i].year)<Number(timeline[i-1].year))issues.push({level:'error',kind:'timeline-order',message:`ترتيب زمني غير منطقي قرب ${timeline[i].name}`,entities:[timeline[i-1].id,timeline[i].id]})}
const deaths={};timeline.forEach(e=>{if(e.characterId&&e.death===true)deaths[e.characterId]=e});SF_DB.chapters.forEach(c=>{for(const id of c.characterIds||[]){if(deaths[id]&&c.timelineYear&&Number(c.timelineYear)>Number(deaths[id].year))issues.push({level:'error',kind:'dead-character',message:`${sfName(id)} تظهر في ${c.name} بعد حدث موتها`,entities:[id,c.id,deaths[id].id]})}});
SF_DB.relationships.forEach(r=>{if(r.from===r.to)issues.push({level:'error',kind:'self-relationship',message:`علاقة ذاتية غير صالحة: ${sfName(r.from)}`,entities:[r.id]})});
SF_DB.abilities.forEach(a=>{if(a.status==='used'&&a.ruleId&&!SF_DB.powerRules.some(r=>r.id===a.ruleId))issues.push({level:'error',kind:'power-rule',message:`القدرة ${a.name} تشير إلى قاعدة قوة مفقودة`,entities:[a.id]})});
return issues}
window.StoryForge={get db(){return SF_DB},save:sfSave,collections:SF_COLLECTIONS,labels:SF_LABELS,all:sfAll,get:sfGet,name:sfName,create:sfCreate,update:sfUpdate,remove:sfRemove,search:sfSearch,rel:sfRel,timeline:sfTimelineEvent,state:sfCharacterState,export:sfExport,import:sfImport,stats:sfStats,characterAge:sfCharacterAge,timelineSorted:sfTimelineSort,continuity:sfContinuity};
sfSave();