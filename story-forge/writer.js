const KEY='story-forge-v3';
const DRAFT='story-forge-draft';
const DEFAULT={characters:[],world:[],arcs:[],chapters:[],timeline:[],relationships:[],notes:[]};
let db=JSON.parse(localStorage.getItem(KEY)||'null')||DEFAULT;Object.keys(DEFAULT).forEach(k=>{if(!Array.isArray(db[k]))db[k]=[]});
const $=id=>document.getElementById(id);const fields=['title','chapter','location','draft'];
function stats(){const t=$('draft').value; $('words').textContent=t.trim()?t.trim().split(/\s+/).length:0;$('chars').textContent=t.length}
function persistDraft(){localStorage.setItem(DRAFT,JSON.stringify({title:$('title').value,chapter:$('chapter').value,location:$('location').value,draft:$('draft').value}));$('saved').textContent='مسودة محفوظة تلقائيًا'}
function load(){const x=JSON.parse(localStorage.getItem(DRAFT)||'null');if(x){fields.forEach(k=>$(k).value=x[k]||'')}stats()}
fields.forEach(k=>$(k).addEventListener('input',()=>{stats();persistDraft()}));
$('save').onclick=()=>{const title=$('title').value.trim();const draft=$('draft').value.trim();if(!title||!draft)return alert('اكتب عنوانًا ومحتوى الفصل أولًا.');db.chapters.push({id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(36),name:title,desc:draft,meta:`الفصل: ${$('chapter').value.trim()} | المكان/الزمن: ${$('location').value.trim()}`,chapter:$('chapter').value.trim(),location:$('location').value.trim(),createdAt:new Date().toISOString()});localStorage.setItem(KEY,JSON.stringify(db));$('saved').textContent='تم حفظ الفصل داخل الموسوعة ✓';localStorage.removeItem(DRAFT)};
$('clear').onclick=()=>{if(confirm('بدء مسودة جديدة؟')){fields.forEach(k=>$(k).value='');localStorage.removeItem(DRAFT);stats();$('saved').textContent='مسودة جديدة'}};load();