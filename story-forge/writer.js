const KEY='story-forge-v3';
const DRAFT='story-forge-draft';
const REV='story-forge-revision';
const DEFAULT={characters:[],world:[],arcs:[],chapters:[],timeline:[],relationships:[],notes:[]};
let db=JSON.parse(localStorage.getItem(KEY)||'null')||DEFAULT;Object.keys(DEFAULT).forEach(k=>{if(!Array.isArray(db[k]))db[k]=[]});
const $=id=>document.getElementById(id);const fields=['title','chapter','location','draft'];
function stats(){const t=$('draft').value;const trimmed=t.trim();$('words').textContent=trimmed?trimmed.split(/\s+/).length:0;$('chars').textContent=t.length;$('paragraphs').textContent=trimmed?trimmed.split(/\n\s*\n/).filter(Boolean).length:0}
function setStatus(text){$('saved').textContent=text}
function persistDraft(manual=false){localStorage.setItem(DRAFT,JSON.stringify({title:$('title').value,chapter:$('chapter').value,location:$('location').value,draft:$('draft').value,updatedAt:new Date().toISOString()}));setStatus(manual?'تم حفظ المسودة ✓':'حفظ تلقائي ✓')}
function persistRevision(){localStorage.setItem(REV,$('revision').value)}
function load(){const x=JSON.parse(localStorage.getItem(DRAFT)||'null');if(x){fields.forEach(k=>$(k).value=x[k]||'');setStatus('استُعيدت آخر مسودة')}$('revision').value=localStorage.getItem(REV)||'';stats()}
let timer;fields.forEach(k=>$(k).addEventListener('input',()=>{stats();clearTimeout(timer);timer=setTimeout(()=>persistDraft(false),500)}));
$('revision').addEventListener('input',persistRevision);
$('saveDraft').onclick=()=>persistDraft(true);
$('save').onclick=()=>{const title=$('title').value.trim();const draft=$('draft').value.trim();if(!title||!draft)return alert('اكتب عنوانًا ومحتوى الفصل أولًا.');db.chapters.push({id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(36),name:title,desc:draft,meta:`الفصل: ${$('chapter').value.trim()} | المكان/الزمن: ${$('location').value.trim()}`,chapter:$('chapter').value.trim(),location:$('location').value.trim(),revision:$('revision').value,createdAt:new Date().toISOString()});localStorage.setItem(KEY,JSON.stringify(db));localStorage.removeItem(DRAFT);setStatus('تم حفظ النص كفصل ✓')};
$('clear').onclick=()=>{if(confirm('بدء مسودة جديدة؟ سيتم حذف المسودة الحالية من هذا المتصفح.')){fields.forEach(k=>$(k).value='');$('revision').value='';localStorage.removeItem(DRAFT);localStorage.removeItem(REV);stats();setStatus('مسودة جديدة')}};
$('clearRevision').onclick=()=>{$('revision').value='';localStorage.removeItem(REV);setStatus('تم مسح ملاحظات المراجعة')};
$('download').onclick=()=>{const text=`${$('title').value.trim()}\n${$('chapter').value.trim()}${$('location').value.trim()?' · '+$('location').value.trim():''}\n\n${$('draft').value}\n\n--- ملاحظات المراجعة ---\n${$('revision').value}`;const blob=new Blob([text],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(($('title').value.trim()||'story')+'.txt').replace(/[\\/:*?"<>|]/g,'-');a.click();URL.revokeObjectURL(a.href);setStatus('تم تصدير TXT ✓')};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();persistDraft(true)}});
load();