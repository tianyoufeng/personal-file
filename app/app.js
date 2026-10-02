/* ============================================================
   个人家庭档案登记 App v1.0.0 — 核心逻辑
   纯本地离线 · IndexedDB 存储 · 软删除 + 回收站 · 自动保存
   ============================================================ */
'use strict';

const APP_VERSION = '1.0.0';

/* 安卓 APK 内的原生桥（浏览器环境为 null，走网页下载） */
const NATIVE = (function(){
  const n = window.ArchiveNative;
  return (n && typeof n === 'object' && typeof n.saveFile === 'function') ? n : null;
})();

/* ---------- 图标 ---------- */
const I = {
  person:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5"/></svg>',
  search:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  plus:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  plusS:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  back:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>',
  dots:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg>',
  trash:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>',
  folder:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  cal:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  pin:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 17v5M6 3h12l-2 7 3 3H5l3-3z"/></svg>',
  phone:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  clip:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.5l-8.5 8.5a6 6 0 0 1-8.5-8.5L12.5 4a4 4 0 0 1 5.7 5.7L10 18a2 2 0 0 1-2.8-2.8l7.8-7.8"/></svg>',
  export:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
  moon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 14A8.5 8.5 0 0 1 10 4a8 8 0 1 0 10 10z"/></svg>',
  info:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M12 11v5" stroke-linecap="round"/></svg>',
  lock:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  broom:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" stroke-linecap="round"/></svg>',
  check:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M5 13l4 4L19 7"/></svg>',
  edit:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 3l4 4L8 20l-5 1 1-5z"/></svg>',
  file:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  warn:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01" stroke-linecap="round"/></svg>'
};

/* ---------- 工具 ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const now = () => Date.now();
const fmtDate = ts => { if(!ts) return ''; const d=new Date(ts); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const fmtTime = ts => { if(!ts) return ''; const d=new Date(ts); return fmtDate(ts)+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); };
const fmtSize = n => n<1024 ? n+' B' : n<1048576 ? (n/1024).toFixed(1)+' KB' : (n/1048576).toFixed(1)+' MB';
const relTime = ts => {
  const diff = now()-ts, m=60000, h=3600000, d=86400000;
  if(diff<m) return '刚刚'; if(diff<h) return Math.floor(diff/m)+' 分钟前';
  if(diff<d) return Math.floor(diff/h)+' 小时前';
  if(diff<7*d) return Math.floor(diff/d)+' 天前';
  return fmtDate(ts);
};
function toast(msg, err){
  const t=document.createElement('div'); t.className='toast'+(err?' err':''); t.textContent=msg;
  document.body.appendChild(t); setTimeout(()=>t.remove(),2200);
}
function highlight(text, kw){
  const t=esc(text); if(!kw) return t;
  const ek=esc(kw).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return t.replace(new RegExp(ek,'gi'), m=>'<mark>'+m+'</mark>');
}
function snippet(text, kw, len){
  text=String(text||''); if(!text) return '';
  if(!kw) return text.slice(0,60);
  const i=text.toLowerCase().indexOf(kw.toLowerCase());
  if(i<0) return text.slice(0,60);
  const s=Math.max(0,i-20); return (s>0?'…':'')+text.slice(s, s+70);
}

/* ---------- IndexedDB ---------- */
let _db=null;
function openDB(){
  if(_db) return Promise.resolve(_db);
  return new Promise((res,rej)=>{
    const r=indexedDB.open('familyArchive',1);
    r.onupgradeneeded=e=>{
      const db=e.target.result;
      if(!db.objectStoreNames.contains('persons')) db.createObjectStore('persons',{keyPath:'id'});
      if(!db.objectStoreNames.contains('dirs')) db.createObjectStore('dirs',{keyPath:'id'});
      if(!db.objectStoreNames.contains('entries')) db.createObjectStore('entries',{keyPath:'id'});
      if(!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
    };
    r.onsuccess=()=>{_db=r.result;res(_db);};
    r.onerror=()=>rej(r.error);
  });
}
async function dbAll(store){
  const db=await openDB();
  return new Promise((res,rej)=>{
    const rq=db.transaction(store,'readonly').objectStore(store).getAll();
    rq.onsuccess=()=>res(rq.result||[]); rq.onerror=()=>rej(rq.error);
  });
}
async function dbGet(store,id){
  const db=await openDB();
  return new Promise((res,rej)=>{
    const rq=db.transaction(store,'readonly').objectStore(store).get(id);
    rq.onsuccess=()=>res(rq.result); rq.onerror=()=>rej(rq.error);
  });
}
async function dbPut(store,val){
  const db=await openDB();
  return new Promise((res,rej)=>{
    const rq=db.transaction(store,'readwrite').objectStore(store).put(val);
    rq.onsuccess=()=>res(val); rq.onerror=()=>rej(rq.error);
  });
}
async function dbDel(store,id){
  const db=await openDB();
  return new Promise((res,rej)=>{
    const rq=db.transaction(store,'readwrite').objectStore(store).delete(id);
    rq.onsuccess=()=>res(); rq.onerror=()=>rej(rq.error);
  });
}
async function metaGet(key,def){
  const db=await openDB();
  return new Promise((res,rej)=>{
    const rq=db.transaction('meta','readonly').objectStore('meta').get(key);
    rq.onsuccess=()=>res(rq.result===undefined?def:rq.result); rq.onerror=()=>rej(rq.error);
  });
}
async function metaSet(key,val){
  const db=await openDB();
  return new Promise((res,rej)=>{
    const rq=db.transaction('meta','readwrite').objectStore('meta').put(val,key);
    rq.onsuccess=()=>res(); rq.onerror=()=>rej(rq.error);
  });
}

/* ---------- 默认目录 ---------- */
const DEFAULT_DIRS=[
  {name:'基本信息'},
  {name:'家庭信息'},
  {name:'教育经历',children:['小学','初中','高中','大学/中专/大专']},
  {name:'工作经历'},
  {name:'婚姻情况'},
  {name:'个人大事记'},
  {name:'对新鲜事物的认知'},
  {name:'当下现状'},
  {name:'其他/自定义'}
];
async function createDefaultDirs(personId){
  let order=0;
  for(const def of DEFAULT_DIRS){
    const d={id:uid(),personId,parentId:'',name:def.name,sortOrder:order++,pinned:false,
      deleted:false,deletedAt:null,createdAt:now(),updatedAt:now()};
    await dbPut('dirs',d);
    if(def.children){
      let co=0;
      for(const c of def.children){
        await dbPut('dirs',{id:uid(),personId,parentId:d.id,name:c,sortOrder:co++,pinned:false,
          deleted:false,deletedAt:null,createdAt:now(),updatedAt:now()});
      }
    }
  }
}

/* ---------- 应用状态 ---------- */
const S={
  persons:[],dirs:[],entries:[],
  curPersonId:null,curDirId:null,
  searchKw:'',searchScope:'global',searchDirFilter:'',
  binTab:'entry',
  editingEntry:null, saveTimer:null,
  theme:'auto', retention:30, autoClean:true
};
const GENDER={m:'男',f:'女',o:'其他'};

async function loadAll(){
  S.persons=await dbAll('persons');
  S.dirs=await dbAll('dirs');
  S.entries=await dbAll('entries');
}
const personById = id => S.persons.find(p=>p.id===id && !p.deleted);
const livePersons = () => S.persons.filter(p=>!p.deleted).sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0));
const liveDirs = pid => S.dirs.filter(d=>d.personId===pid && !d.deleted);
const liveEntries = (pid,did) => S.entries.filter(e=>!e.deleted && e.personId===pid && (!did||e.dirId===did));
function dirPath(d){
  const parts=[d.name]; let cur=d;
  while(cur.parentId){
    const p=S.dirs.find(x=>x.id===cur.parentId); if(!p) break;
    parts.unshift(p.name); cur=p;
  }
  return parts;
}
function entryPath(e){
  const d=S.dirs.find(x=>x.id===e.dirId);
  const person=personById(e.personId);
  const pName=person?person.name:'（已删人员）';
  return pName+(d?' · '+dirPath(d).join(' / '):'');
}

/* ---------- 主题 / 自动清理 ---------- */
async function applyTheme(){
  const pref=await metaGet('theme','auto');
  S.theme=pref;
  const dark = pref==='dark' || (pref==='auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark?'dark':'light';
  const mc=document.querySelector('meta[name=theme-color]');
  if(mc) mc.content = dark?'#1B1714':'#A85B2A';
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{ if(S.theme==='auto') applyTheme(); });

async function autoClean(){
  if(!await metaGet('autoClean',true)) return;
  const days=await metaGet('retention',30);
  const limit=now()-days*86400000;
  const persons=S.persons.filter(p=>p.deleted&&p.deletedAt&&p.deletedAt<limit);
  const dirs=S.dirs.filter(d=>d.deleted&&d.deletedAt&&d.deletedAt<limit);
  const entries=S.entries.filter(e=>e.deleted&&e.deletedAt&&e.deletedAt<limit);
  for(const e of entries) await hardDeleteEntry(e);
  for(const d of dirs) await hardDeleteDir(d,false);
  for(const p of persons) await hardDeletePerson(p,false);
  if(persons.length+dirs.length+entries.length>0){
    await loadAll();
    toast('回收站已自动清理 '+ (persons.length+dirs.length+entries.length) +' 项（超过 '+days+' 天）');
  }
}

/* ---------- 硬删除（级联） ---------- */
async function hardDeleteEntry(e){ await dbDel('entries',e.id); }
async function hardDeleteDir(d,deep=true){
  if(deep){
    const subs=S.dirs.filter(x=>x.parentId===d.id);
    for(const s of subs) await hardDeleteDir(s,true);
    const es=S.entries.filter(x=>x.dirId===d.id);
    for(const e of es) await hardDeleteEntry(e);
  }
  await dbDel('dirs',d.id);
}
async function hardDeletePerson(p,deep=true){
  if(deep){
    const ds=S.dirs.filter(x=>x.personId===p.id);
    for(const d of ds) await hardDeleteDir(d,true);
    const es=S.entries.filter(x=>x.personId===p.id);
    for(const e of es) await hardDeleteEntry(e);
  }
  await dbDel('persons',p.id);
}

/* ---------- 弹层系统 ---------- */
function sheet(html, onMount){
  const ov=document.createElement('div'); ov.className='overlay';
  ov.innerHTML='<div class="sheet">'+html+'</div>';
  ov.addEventListener('click',e=>{ if(e.target===ov) ov.remove(); });
  document.body.appendChild(ov);
  if(onMount) onMount(ov);
  return ov;
}
function confirmSheet(title, bodyHtml, okText, danger){
  return new Promise(res=>{
    const ov=sheet(
      '<h3>'+esc(title)+'</h3><div class="confirm-body">'+bodyHtml+'</div>'+
      '<div class="sheet-actions"><button class="btn-secondary" data-a="0">取消</button>'+
      '<button class="btn-primary '+(danger?'btn-danger':'')+'" data-a="1">'+esc(okText||'确定')+'</button></div>',
      ov=>{
        ov.querySelector('[data-a="0"]').onclick=()=>{ov.remove();res(false);};
        ov.querySelector('[data-a="1"]').onclick=()=>{ov.remove();res(true);};
      });
    ov.querySelector('.btn-primary').classList.toggle('btn-danger',!!danger);
  });
}
function closeTopOverlay(){ const o=document.querySelector('.overlay:last-of-type'); if(o) o.remove(); }

/* ---------- 人员表单 ---------- */
function personForm(existing, onDone){
  const p=existing||{name:'',relation:'',gender:'m',birthday:'',phone:'',note:''};
  sheet(
    '<h3>'+(existing?'编辑人员':'新增人员')+'<button class="sheet-x" data-x>✕</button></h3>'+
    '<div class="field"><label>姓名 *</label><input id="pf-name" value="'+esc(p.name)+'" placeholder="如：王建国"></div>'+
    '<div class="row2">'+
      '<div class="field"><label>关系</label><input id="pf-rel" value="'+esc(p.relation)+'" placeholder="如：爸爸 / 自己"></div>'+
      '<div class="field"><label>性别</label><select id="pf-gender">'+
        ['m','f','o'].map(g=>'<option value="'+g+'"'+(p.gender===g?' selected':'')+'>'+GENDER[g]+'</option>').join('')+
      '</select></div>'+
    '</div>'+
    '<div class="field"><label>生日</label><input id="pf-birth" type="date" value="'+esc(p.birthday||'')+'"></div>'+
    '<div class="field"><label>电话</label><input id="pf-phone" type="tel" value="'+esc(p.phone||'')+'" placeholder="选填"></div>'+
    '<div class="field"><label>备注</label><textarea id="pf-note" style="min-height:64px" placeholder="选填">'+esc(p.note||'')+'</textarea></div>'+
    '<div class="sheet-actions"><button class="btn-secondary" data-cancel>取消</button><button class="btn-primary" data-ok>保存</button></div>',
    ov=>{
      ov.querySelector('[data-x]').onclick=()=>ov.remove();
      ov.querySelector('[data-cancel]').onclick=()=>ov.remove();
      ov.querySelector('[data-ok]').onclick=async()=>{
        const name=ov.querySelector('#pf-name').value.trim();
        if(!name){ toast('请填写姓名',true); return; }
        const rec=existing||{id:uid(),sortOrder:now(),deleted:false,deletedAt:null,createdAt:now()};
        rec.name=name;
        rec.relation=ov.querySelector('#pf-rel').value.trim();
        rec.gender=ov.querySelector('#pf-gender').value;
        rec.birthday=ov.querySelector('#pf-birth').value;
        rec.phone=ov.querySelector('#pf-phone').value.trim();
        rec.note=ov.querySelector('#pf-note').value.trim();
        rec.updatedAt=now();
        await dbPut('persons',rec);
        if(!existing){ await createDefaultDirs(rec.id); toast('已创建「'+name+'」的档案，默认目录已生成'); }
        else toast('已保存');
        await loadAll(); ov.remove(); if(onDone) onDone(rec); render();
      };
      setTimeout(()=>ov.querySelector('#pf-name').focus(),80);
    });
}

/* ============ 页面：人员列表 ============ */
function renderPersonListReal(){
  const kw=S.searchKw.trim().toLowerCase();
  let ps=livePersons();
  if(kw) ps=ps.filter(p=>p.name.toLowerCase().includes(kw)||(p.relation||'').toLowerCase().includes(kw));
  const eCount={},dCount={};
  S.entries.forEach(e=>{ if(!e.deleted) eCount[e.personId]=(eCount[e.personId]||0)+1; });
  S.dirs.forEach(d=>{ if(!d.deleted) dCount[d.personId]=(dCount[d.personId]||0)+1; });
  const cards=ps.map(p=>{
    const updBg=S.entries.filter(e=>e.personId===p.id&&!e.deleted).reduce((m,e)=>Math.max(m,e.updatedAt||e.createdAt||0),p.updatedAt||0);
    return '<div class="person-card" data-open="'+p.id+'">'+
      '<div class="pbadge">'+I.person+'</div>'+
      '<div class="pcard-info">'+
        '<div class="pcard-name-row"><span class="pcard-name">'+highlight(p.name,S.searchKw)+'</span>'+
          (p.relation?'<span class="rel-tag">'+highlight(p.relation,S.searchKw)+'</span>':'')+'</div>'+
        '<div class="pcard-meta">'+
          '<span class="m">'+(GENDER[p.gender]||'')+(p.birthday?' · '+p.birthday.slice(0,4)+' 年生':'')+'</span>'+
          (p.phone?'<span class="m">'+I.phone+esc(p.phone.slice(0,3))+'****'+esc(p.phone.slice(-4))+'</span>':'')+
        '</div>'+
        '<div class="pcard-foot"><span>'+(eCount[p.id]||0)+' 条登记</span><span>·</span><span>'+(dCount[p.id]||0)+' 个目录</span>'+
          (updBg?'<span>·</span><span>'+relTime(updBg)+'更新</span>':'')+'</div>'+
      '</div>'+
      '<button class="icbtn" data-pmenu="'+p.id+'">'+I.dots+'</button>'+
    '</div>';
  }).join('');
  return '<div class="topbar"><h1>家庭档案</h1>'+
      '<button class="icbtn" data-go="#/bin" title="回收站">'+I.trash+'</button>'+
      '<button class="icbtn" data-go="#/settings" title="设置">'+I.dots+'</button></div>'+
    '<div class="searchbar">'+I.search+
      '<input id="pl-search" placeholder="搜索姓名、关系…" value="'+esc(S.searchKw)+'">'+
      (S.searchKw?'<button class="clear" id="pl-clear">清除</button>':'')+
    '</div>'+
    '<div class="scrollarea">'+(ps.length?cards:'<div class="empty-tip">'+(kw?'没有匹配的人员':'还没有人员档案<br>点击右下角 + 创建第一个家庭成员')+'</div>')+'</div>'+
    '<button class="fab" id="pl-add" title="新增人员">'+I.plus+'</button>';
}

/* ============ 页面：人员档案 ============ */
function dirTreeNode(d,depth){
  const subs=liveDirs(d.personId).filter(x=>x.parentId===d.id).sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||(a.sortOrder??0)-(b.sortOrder??0));
  const cnt=liveEntries(d.personId,d.id).length;
  const on=S.curDirId===d.id;
  let html=depth===0
    ?'<button class="titem'+(on?' on':'')+'" data-dir="'+d.id+'">'+I.folder+
       '<span class="tname">'+(d.pinned?'📌 ':'')+esc(d.name)+'</span>'+
       '<span class="tcount">'+cnt+'</span></button>'
    :'<button class="tsub'+(on?' on':'')+'" data-dir="'+d.id+'">'+esc(d.name)+
       '<span class="tcount" style="margin-left:auto;padding-left:6px;">'+cnt+'</span></button>';
  if(subs.length) html+=subs.map(s=>dirTreeNode(s,depth+1)).join('');
  return html;
}
function renderPersonPage(pid){
  const p=personById(pid);
  if(!p) return '<div class="empty-tip">人员不存在或已删除</div>';
  const roots=liveDirs(pid).filter(d=>!d.parentId).sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||(a.sortOrder??0)-(b.sortOrder??0));
  if(!S.curDirId||!roots.length){
    const first=roots.find(r=>true);
    if(!S.curDirId&&first) S.curDirId=first.id;
  }
  const curDir=S.dirs.find(d=>d.id===S.curDirId&&d.personId===pid&&!d.deleted)||roots[0];
  if(curDir) S.curDirId=curDir.id;
  const entries=curDir?liveEntries(pid,curDir.id).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)):[];
  const entryCards=entries.map(e=>
    '<button class="entry-card" data-entry="'+e.id+'">'+
      '<div class="et"><span class="dot"></span><span class="etitle">'+esc(e.title||'未命名条目')+'</span></div>'+
      (e.content?'<div class="es">'+esc(e.content)+'</div>':'')+
      '<div class="ef">'+
        (e.time?'<span>'+esc(e.time)+'</span><span>·</span>':'')+
        (e.location?'<span>'+esc(e.location)+'</span><span>·</span>':'')+
        ((e.attachments&&e.attachments.length)?'<span class="chip att">'+I.clip+' '+e.attachments.length+' 附件</span>':'')+
        '<span style="margin-left:auto;">'+relTime(e.updatedAt||e.createdAt)+'</span>'+
      '</div>'+
    '</button>').join('');
  const tree=roots.map(r=>dirTreeNode(r,0)).join('');
  return '<div class="topbar">'+
      '<button class="icbtn" data-go="#/list">'+I.back+'</button>'+
      '<h1>'+esc(p.name)+'的档案</h1>'+
      '<button class="icbtn" data-go="#/search?person='+p.id+'" title="档案内搜索">'+I.search+'</button>'+
      '<button class="icbtn" data-pmenu="'+p.id+'">'+I.dots+'</button>'+
    '</div>'+
    '<div class="profile-head">'+
      '<div class="pname">'+esc(p.name)+(p.relation?'<span class="rel-tag">'+esc(p.relation)+'</span>':'')+'</div>'+
      '<div class="pinfo"><span>'+(GENDER[p.gender]||'')+(p.birthday?' · '+p.birthday:'')+'</span>'+
        (p.phone?'<span>'+esc(p.phone)+'</span>':'')+'</div>'+
    '</div>'+
    '<div class="archive-body" style="min-height:340px;">'+
      '<div class="dir-tree">'+tree+
        '<button class="titem add" data-adddir="'+pid+'">'+I.plusS+' 新建目录</button>'+
      '</div>'+
      '<div class="entries-col">'+
        (curDir?'<div class="dir-ops"><button data-dirmenu="'+curDir.id+'">'+I.dots.replace('17','13')+' 目录操作</button></div>':'')+
        (entries.length?entryCards:'<div class="empty-tip" style="padding:40px 10px;">该目录还没有条目<br>点击右下角 + 登记</div>')+
      '</div>'+
    '</div>'+
    '<button class="fab" data-newentry="'+pid+'">'+I.plus+'</button>';
}

/* ============ 页面：条目编辑 ============ */
function renderEntryEditor(entryId){
  const e=S.editingEntry&&S.editingEntry.id===entryId?S.editingEntry:S.entries.find(x=>x.id===entryId);
  if(!e) return '<div class="empty-tip">条目不存在</div>';
  S.editingEntry=e;
  const p=personById(e.personId); const d=S.dirs.find(x=>x.id===e.dirId);
  const path=(p?p.name:'')+(d?' · '+dirPath(d).join(' / '):'');
  const atts=(e.attachments||[]).map(a=>
    '<div class="afile" data-att="'+a.id+'">'+
      I.file+'<span class="aname">'+esc(a.name)+'</span><span class="asize">'+fmtSize(a.size)+'</span>'+
      '<button class="aop" data-viewatt="'+a.id+'">查看</button>'+
      '<button class="aop del" data-delatt="'+a.id+'">删除</button>'+
    '</div>').join('');
  return '<div class="topbar">'+
      '<button class="icbtn" data-back-entry="'+e.personId+'">'+I.back+'</button>'+
      '<h1 style="font-size:16px;">编辑条目'+(path?' · '+esc(path):'')+'</h1>'+
      '<button class="icbtn danger" data-deentry="'+e.id+'" title="删除条目">'+I.trash+'</button>'+
    '</div>'+
    '<div class="scrollarea"><div class="form">'+
      '<div class="field"><label>标题</label><input id="ef-title" data-save value="'+esc(e.title)+'" placeholder="如：小学入学登记"></div>'+
      '<div class="row2">'+
        '<div class="field"><label>时间</label><input id="ef-time" data-save type="date" value="'+esc(e.time||'')+'"></div>'+
        '<div class="field"><label>地点</label><input id="ef-loc" data-save value="'+esc(e.location||'')+'" placeholder="选填"></div>'+
      '</div>'+
      '<div class="field"><label>相关人</label><input id="ef-rel" data-save value="'+esc(e.relatedPeople||'')+'" placeholder="如：爸爸、妈妈，用顿号分隔"></div>'+
      '<div class="field"><label>内容</label><textarea id="ef-content" data-save placeholder="记录具体内容…">'+esc(e.content||'')+'</textarea></div>'+
      '<div class="field"><label>附件（图片 / PDF / Word 等）</label><div class="attach-list">'+atts+
        '<button class="afile add" id="ef-addatt">'+I.plusS+' 添加附件</button></div></div>'+
      '<div class="field"><label>备注</label><textarea id="ef-note" data-save style="min-height:64px" placeholder="选填">'+esc(e.note||'')+'</textarea></div>'+
      '<div style="height:20px;"></div>'+
    '</div></div>'+
    '<div class="savebar"><div class="status" id="save-status"></div>'+
      '<button class="btn-primary" data-back-entry="'+e.personId+'">完成</button></div>';
}
function updateSaveStatus(saved){
  const el=$('#save-status'); if(!el) return;
  const e=S.editingEntry; if(!e) return;
  el.innerHTML=saved
    ?'<span class="ok">'+I.check+'已自动保存</span><span style="color:var(--ink3);">· 修改于 '+fmtTime(e.updatedAt).slice(11)+'</span>'
    :'<span style="color:var(--ink3);">编辑中…停止输入后自动保存</span>';
}
function scheduleSave(){
  const e=S.editingEntry; if(!e) return;
  e.title=$('#ef-title')?$('#ef-title').value:e.title;
  e.time=$('#ef-time')?$('#ef-time').value:e.time;
  e.location=$('#ef-loc')?$('#ef-loc').value:e.location;
  e.relatedPeople=$('#ef-rel')?$('#ef-rel').value:e.relatedPeople;
  e.content=$('#ef-content')?$('#ef-content').value:e.content;
  e.note=$('#ef-note')?$('#ef-note').value:e.note;
  updateSaveStatus(false);
  clearTimeout(S.saveTimer);
  S.saveTimer=setTimeout(async()=>{
    e.updatedAt=now();
    await dbPut('entries',e);
    const idx=S.entries.findIndex(x=>x.id===e.id);
    if(idx>=0) S.entries[idx]=e;
    updateSaveStatus(true);
  },600);
}

/* ============ 页面：搜索 ============ */
function renderSearchPage(){
  const fromPerson=S.curPersonId?personById(S.curPersonId):null;
  const scopePerson=S.searchScope==='person'&&fromPerson;
  const kw=S.searchKw.trim();
  const kwl=kw.toLowerCase();
  let entries=S.entries.filter(e=>!e.deleted);
  let dirs=S.dirs.filter(d=>!d.deleted);
  let persons=livePersons();
  let chips='<button class="fchip'+(S.searchDirFilter===''?' on':'')+'" data-sfilter="">'+(scopePerson?'全部目录':'全部人员')+'</button>';
  if(scopePerson){
    const roots=liveDirs(fromPerson.id).filter(d=>!d.parentId).sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0));
    roots.forEach(r=>{
      chips+='<button class="fchip'+(S.searchDirFilter===r.id?' on':'')+'" data-sfilter="'+r.id+'">'+esc(r.name)+'</button>';
    });
    if(S.searchDirFilter){
      const subtree=[S.searchDirFilter];
      for(let i=0;i<subtree.length;i++){
        dirs.filter(d=>d.parentId===subtree[i]).forEach(d=>subtree.push(d.id));
      }
      entries=entries.filter(e=>subtree.includes(e.dirId));
    }
    entries=entries.filter(e=>e.personId===fromPerson.id);
    dirs=dirs.filter(d=>d.personId===fromPerson.id);
    persons=[];
  }else{
    if(S.searchDirFilter){
      entries=entries.filter(e=>e.personId===S.searchDirFilter);
      dirs=dirs.filter(d=>d.personId===S.searchDirFilter);
      persons=persons.filter(p=>p.id===S.searchDirFilter);
    }
    persons.forEach(p=>{ chips+='<button class="fchip'+(S.searchDirFilter===p.id?' on':'')+'" data-sfilter="'+p.id+'">'+esc(p.name)+'</button>'; });
  }
  const matchEntry=e=>!kwl||['title','content','note','location','relatedPeople'].some(k=>String(e[k]||'').toLowerCase().includes(kwl));
  const matchDir=d=>!kwl||d.name.toLowerCase().includes(kwl);
  const matchPerson=p=>!kwl||[p.name,p.relation,p.note].some(x=>String(x||'').toLowerCase().includes(kwl));
  const eHits=entries.filter(matchEntry).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0,30);
  const dHits=dirs.filter(matchDir).slice(0,10);
  const pHits=persons.filter(matchPerson).slice(0,10);
  const total=eHits.length+dHits.length+pHits.length;
  const eHtml=eHits.map(e=>
    '<button class="r-item" data-entry="'+e.id+'">'+
      '<div class="rt">'+highlight(e.title||'未命名条目',kw)+'</div>'+
      (e.content||e.note?'<div class="rs">'+highlight(snippet(e.content||e.note,kw),kw)+'</div>':'')+
      '<div class="rf">'+esc(entryPath(e))+(e.time?' · '+esc(e.time):'')+'</div>'+
    '</button>').join('');
  const dHtml=dHits.map(d=>
    '<button class="r-item" data-dir="'+d.id+'" data-dirperson="'+d.personId+'">'+
      '<div class="rt">📁 '+highlight(dirPath(d).join(' / '),kw)+'</div>'+
      '<div class="rf">'+esc((personById(d.personId)||{name:'?'}).name)+'的档案 · '+liveEntries(d.personId,d.id).length+' 条条目</div>'+
    '</button>').join('');
  const pHtml=pHits.map(p=>
    '<button class="r-item" data-open="'+p.id+'">'+
      '<div class="rt">'+highlight(p.name,kw)+(p.relation?'<span class="rel-tag" style="margin-left:8px;">'+highlight(p.relation,kw)+'</span>':'')+'</div>'+
      '<div class="rf">'+(GENDER[p.gender]||'')+(p.birthday?' · '+p.birthday:'')+(p.phone?' · '+esc(p.phone):'')+'</div>'+
    '</button>').join('');
  return '<div class="topbar">'+
      '<button class="icbtn" data-go="'+(fromPerson?'#/person/'+fromPerson.id:'#/list')+'">'+I.back+'</button>'+
      '<h1>搜索</h1></div>'+
    '<div class="searchbar" style="border-color:var(--accent);">'+I.search+
      '<input id="sp-search" placeholder="搜索标题、正文、备注…" value="'+esc(S.searchKw)+'" autofocus>'+
      (S.searchKw?'<button class="clear" id="sp-clear">清除</button>':'')+'</div>'+
    '<div class="seg">'+
      '<button data-sscope="global"'+(S.searchScope==='global'?' class="on"':'')+'>全局搜索</button>'+
      '<button data-sscope="person"'+(S.searchScope==='person'?' class="on"':'')+'>仅'+(fromPerson?esc(fromPerson.name):'当前人员')+'</button>'+
    '</div>'+
    '<div class="filters">'+chips+'</div>'+
    '<div class="scrollarea">'+
      (!kw?'<div class="empty-tip">输入关键词开始搜索<br>标题、正文、备注均可命中</div>'
        :total===0?'<div class="empty-tip">没有找到与「'+esc(kw)+'」相关的内容</div>'
        :'<div class="result-group">'+
          (eHits.length?'<div class="rg-title">条目 · '+eHits.length+' 条结果</div>'+eHtml:'')+
          (dHits.length?'<div class="rg-title">目录 · '+dHits.length+' 条结果</div>'+dHtml:'')+
          (pHits.length?'<div class="rg-title">人员 · '+pHits.length+' 条结果</div>'+pHtml:'')+
        '</div>')+
    '</div>';
}

/* ============ 页面：回收站 ============ */
function renderBin(){
  const tabs=[['person','人员'],['dir','目录'],['entry','条目']];
  const delPersons=S.persons.filter(p=>p.deleted).sort((a,b)=>b.deletedAt-a.deletedAt);
  const delDirs=S.dirs.filter(d=>d.deleted).sort((a,b)=>b.deletedAt-a.deletedAt);
  const delEntries=S.entries.filter(e=>e.deleted).sort((a,b)=>b.deletedAt-a.deletedAt);
  const counts={person:delPersons.length,dir:delDirs.length,entry:delEntries.length};
  const days=S.retention;
  let items='';
  if(S.binTab==='person'){
    items=delPersons.map(p=>
      '<div class="bin-item"><div class="bt"><span class="type-tag p">人员</span>'+esc(p.name)+
        '<span class="from">'+(p.relation||'')+'</span></div>'+
        '<div class="bs">删除于 '+fmtDate(p.deletedAt)+'</div>'+
        '<div class="ops"><button class="obtn restore" data-restore="person|'+p.id+'">恢复</button>'+
        '<button class="obtn kill" data-kill="person|'+p.id+'">彻底删除</button></div></div>').join('');
  }else if(S.binTab==='dir'){
    items=delDirs.map(d=>{
      const pn=S.persons.find(x=>x.id===d.personId);
      return '<div class="bin-item"><div class="bt"><span class="type-tag d">目录</span>'+esc(d.name)+
        '<span class="from">'+(pn?pn.name:'')+(d.parentId?'（含子目录）':'')+'</span></div>'+
        '<div class="bs">删除于 '+fmtDate(d.deletedAt)+'</div>'+
        '<div class="ops"><button class="obtn restore" data-restore="dir|'+d.id+'">恢复</button>'+
        '<button class="obtn kill" data-kill="dir|'+d.id+'">彻底删除</button></div></div>';
    }).join('');
  }else{
    items=delEntries.map(e=>
      '<div class="bin-item"><div class="bt"><span class="type-tag e">条目</span>'+esc(e.title||'未命名条目')+'</div>'+
        '<div class="bs">'+esc(entryPath(e))+' · 删除于 '+fmtDate(e.deletedAt)+'</div>'+
        '<div class="ops"><button class="obtn restore" data-restore="entry|'+e.id+'">恢复</button>'+
        '<button class="obtn kill" data-kill="entry|'+e.id+'">彻底删除</button></div></div>').join('');
  }
  return '<div class="topbar">'+
      '<button class="icbtn" data-go="#/list">'+I.back+'</button><h1>回收站</h1></div>'+
    '<div class="seg">'+tabs.map(t=>'<button data-bintab="'+t[0]+'"'+(S.binTab===t[0]?' class="on"':'')+'>'+t[1]+' · '+counts[t[0]]+'</button>').join('')+'</div>'+
    '<div class="bin-tip">'+I.warn+'<span>删除的内容保留 '+days+' 天后自动清理（可在设置中调整），恢复后将回到原位置。彻底删除不可恢复。</span></div>'+
    '<div class="scrollarea">'+(items||'<div class="empty-tip">这一类暂无已删除内容</div>')+'</div>';
}

/* ============ 页面：设置 ============ */
async function renderSettings(){
  const stats=await Promise.all([livePersons().length,S.entries.filter(e=>!e.deleted).length]);
  const themeNames={auto:'跟随系统',light:'浅色',dark:'深色'};
  const nextTheme={auto:'light',light:'dark',dark:'auto'};
  return '<div class="topbar">'+
      '<button class="icbtn" data-go="#/list">'+I.back+'</button><h1>设置</h1></div>'+
    '<div class="scrollarea">'+
      '<div class="set-group"><div class="st">数据安全</div>'+
        '<div class="srow"><div class="si">'+I.broom+'</div>'+
          '<div class="sl">自动清理回收站<div class="sd">超期软删除内容自动彻底删除</div></div>'+
          '<div class="toggle'+(S.autoClean?' on':'')+'" data-toggle="autoClean"></div></div>'+
        '<div class="srow" style="'+(S.autoClean?'':'opacity:.45;')+'">'+
          '<div class="si">'+I.trash+'</div>'+
          '<div class="sl">回收站保留期</div>'+
          '<div class="stepper"><button data-step="-5">−</button><div class="v">'+S.retention+' 天</div><button data-step="5">＋</button></div></div>'+
        '<div class="srow"><div class="si">'+I.lock+'</div>'+
          '<div class="sl">本地密码锁<div class="sd">打开应用时需输入密码（第二版）</div></div>'+
          '<div class="toggle"></div></div>'+
      '</div>'+
      '<div class="set-group"><div class="st">备份</div>'+
        '<div class="srow"><div class="si">'+I.export+'</div>'+
          '<div class="sl">导出备份<div class="sd">全部数据打包为单个 JSON 文件</div></div>'+
          '<button class="val link" id="st-export">导出</button></div>'+
        '<div class="srow" style="opacity:.5;"><div class="si">'+I.file+'</div>'+
          '<div class="sl">导入备份<div class="sd">从备份文件恢复（第二版）</div></div></div>'+
      '</div>'+
      '<div class="set-group"><div class="st">外观</div>'+
        '<div class="srow"><div class="si">'+I.moon+'</div>'+
          '<div class="sl">深色模式<div class="sd">当前：'+themeNames[S.theme]+'</div></div>'+
          '<button class="val link" id="st-theme">切换</button></div>'+
      '</div>'+
      '<div class="set-group"><div class="st">关于</div>'+
        '<div class="srow"><div class="si">'+I.info+'</div>'+
          '<div class="sl">数据统计<div class="sd">'+stats[0]+' 位人员 · '+stats[1]+' 条登记</div></div></div>'+
        '<div class="srow"><div class="si">'+I.person+'</div>'+
          '<div class="sl">关于本应用<div class="sd">纯本地离线 · 不联网 · 不上传任何数据</div></div></div>'+
      '</div>'+
      '<div class="ver">个人家庭档案登记 v'+APP_VERSION+'<br>数据仅存储在本机，卸载应用前请先导出备份</div>'+
    '</div>';
}

/* ---------- 附件操作 ---------- */
let _pickTarget=null;
function pickFiles(){
  const inp=$('#filePick');
  inp.value=''; _pickTarget=true; inp.click();
}
async function addPickedFiles(files){
  const e=S.editingEntry; if(!e) return;
  for(const f of files){
    e.attachments=e.attachments||[];
    e.attachments.push({id:uid(),name:f.name,type:f.type||'application/octet-stream',size:f.size,blob:f});
  }
  await scheduleSaveNow();
  render();
  toast('已添加 '+files.length+' 个附件');
}
async function scheduleSaveNow(){
  const e=S.editingEntry;
  if(e){ e.updatedAt=now(); await dbPut('entries',e);
    const idx=S.entries.findIndex(x=>x.id===e.id); if(idx>=0) S.entries[idx]=e; }
}
function viewAttachment(e,attId){
  const a=(e.attachments||[]).find(x=>x.id===attId); if(!a) return;
  const url=URL.createObjectURL(a.blob);
  const isImg=(a.type||'').startsWith('image/');
  const isPdf=a.type==='application/pdf';
  sheet('<h3>'+esc(a.name)+'<button class="sheet-x" data-x>✕</button></h3>'+
    (isImg?'<img class="preview-img" src="'+url+'">':
     isPdf?'<iframe class="preview-frame" src="'+url+'"></iframe>':
     '<div class="empty-tip" style="padding:30px;">该类型暂不支持在线预览</div>')+
    '<div class="sheet-actions"><a class="btn-secondary" style="text-decoration:none;text-align:center;flex:1;" href="'+url+'" download="'+esc(a.name)+'">下载 / 用其他应用打开</a></div>',
    ov=>{ ov.querySelector('[data-x]').onclick=()=>ov.remove(); });
}
async function exportBackup(){
  toast('正在打包备份…');
  const blobToB64=b=>new Promise(res=>{
    const r=new FileReader();
    r.onload=()=>res(r.result.split(',')[1]); r.readAsDataURL(b);
  });
  const pack={app:'family-archive',version:APP_VERSION,exportedAt:new Date().toISOString(),
    persons:S.persons,dirs:S.dirs,entries:[],meta:{}};
  for(const e of S.entries){
    const copy=Object.assign({},e);
    if(copy.attachments&&copy.attachments.length){
      copy.attachments=[];
      for(const a of e.attachments){
        copy.attachments.push({id:a.id,name:a.name,type:a.type,size:a.size,dataB64:await blobToB64(a.blob)});
      }
    }
    pack.entries.push(copy);
  }
  pack.meta.theme=S.theme; pack.meta.retention=S.retention; pack.meta.autoClean=S.autoClean;
  const json=JSON.stringify(pack,null,1);
  if(NATIVE){
    const fname='家庭档案备份-'+new Date().toISOString().slice(0,10)+'.json';
    let ok=false;
    try{ ok=NATIVE.saveFile(fname,'application/json',json); }catch(err){ ok=false; }
    if(!ok) toast('原生保存失败，请改用浏览器版本导出',true);
    return;
  }
  const blob=new Blob([json],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='家庭档案备份-'+new Date().toISOString().slice(0,10)+'.json';
  a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  toast('备份已导出（'+fmtSize(blob.size)+'）');
}

/* ---------- 恢复 / 彻底删除 ---------- */
async function restoreItem(type,id){
  if(type==='person'){
    const p=await dbGet('persons',id); p.deleted=false; p.deletedAt=null; await dbPut('persons',p);
    const ds=S.dirs.filter(d=>d.personId===id&&d.deleted); // 只恢复因人员删除而连带删除的
    for(const d of ds){ d.deleted=false; d.deletedAt=null; await dbPut('dirs',d); }
    const es=S.entries.filter(e=>e.personId===id&&e.deleted);
    for(const e of es){ e.deleted=false; e.deletedAt=null; await dbPut('entries',e); }
  }else if(type==='dir'){
    const d=await dbGet('dirs',id); d.deleted=false; d.deletedAt=null; await dbPut('dirs',d);
    const subs=S.dirs.filter(x=>x.parentId===id&&x.deleted);
    for(const s of subs){ s.deleted=false; s.deletedAt=null; await dbPut('dirs',s); }
  }else{
    const e=await dbGet('entries',id); e.deleted=false; e.deletedAt=null; await dbPut('entries',e);
  }
  await loadAll(); toast('已恢复到原位置'); render();
}
async function killItem(type,id){
  let msg='彻底删除后不可恢复，确定继续吗？';
  if(type==='person') msg='<strong>将同时删除该人员的全部目录和条目</strong>，彻底删除后不可恢复，确定继续吗？';
  if(type==='dir') msg='<strong>将同时删除其中的子目录和条目</strong>，彻底删除后不可恢复，确定继续吗？';
  const ok=await confirmSheet('彻底删除',msg,'彻底删除',true);
  if(!ok) return;
  if(type==='person'){ const p=await dbGet('persons',id); await hardDeletePerson(p); }
  else if(type==='dir'){ const d=await dbGet('dirs',id); await hardDeleteDir(d); }
  else{ const e=await dbGet('entries',id); await hardDeleteEntry(e); }
  await loadAll(); toast('已彻底删除'); render();
}

/* ---------- 目录操作 ---------- */
function dirMenu(dirId){
  const d=S.dirs.find(x=>x.id===dirId); if(!d) return;
  const siblings=liveDirs(d.personId).filter(x=>x.parentId===d.parentId)
    .sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||(a.sortOrder??0)-(b.sortOrder??0));
  const idx=siblings.findIndex(x=>x.id===d.id);
  sheet('<h3>'+esc(d.name)+'<button class="sheet-x" data-x>✕</button></h3>'+
    '<div class="menu-sheet">'+
    '<button class="menu-item" data-m="rename">'+I.edit+' 重命名</button>'+
    '<button class="menu-item" data-m="pin">'+I.pin+' '+(d.pinned?'取消置顶':'置顶')+'</button>'+
    (idx>0?'<button class="menu-item" data-m="up">'+I.back+' 上移</button>':'')+
    (idx<siblings.length-1?'<button class="menu-item" data-m="down" style="transform:scaleX(-1);">'+I.back+' 下移</button>':'')+
    '<button class="menu-item danger" data-m="del">'+I.trash+' 删除目录</button>'+
    '</div>',
    ov=>{
      ov.querySelector('[data-x]').onclick=()=>ov.remove();
      ov.querySelectorAll('[data-m]').forEach(b=>b.onclick=async()=>{
        const m=b.dataset.m; ov.remove();
        if(m==='rename'){
          sheet('<h3>重命名目录<button class="sheet-x" data-x>✕</button></h3>'+
            '<div class="field"><input id="dn" value="'+esc(d.name)+'"></div>'+
            '<div class="sheet-actions"><button class="btn-secondary" data-cancel>取消</button><button class="btn-primary" data-ok>保存</button></div>',
            ov2=>{
              ov2.querySelector('[data-x]').onclick=()=>ov2.remove();
              ov2.querySelector('[data-cancel]').onclick=()=>ov2.remove();
              ov2.querySelector('[data-ok]').onclick=async()=>{
                const n=ov2.querySelector('#dn').value.trim();
                if(!n){ toast('名称不能为空',true); return; }
                d.name=n; d.updatedAt=now(); await dbPut('dirs',d);
                await loadAll(); ov2.remove(); toast('已重命名'); render();
              };
            });
        }else if(m==='pin'){
          d.pinned=!d.pinned; d.updatedAt=now(); await dbPut('dirs',d);
          await loadAll(); toast(d.pinned?'已置顶':'已取消置顶'); render();
        }else if(m==='up'||m==='down'){
          const j=m==='up'?idx-1:idx+1;
          const o=siblings[idx].sortOrder??0, t=siblings[j].sortOrder??0;
          siblings[idx].sortOrder=t; siblings[j].sortOrder=o;
          await dbPut('dirs',siblings[idx]); await dbPut('dirs',siblings[j]);
          await loadAll(); render();
        }else if(m==='del'){
          const subCount=S.dirs.filter(x=>x.parentId===d.id&&!x.deleted).length;
          const eCount=liveEntries(d.personId,d.id).length;
          const extra=(subCount?'，含 '+subCount+' 个子目录':'')+(eCount?'，其中 '+eCount+' 条条目':'');
          const ok=await confirmSheet('删除目录','目录「'+esc(d.name)+'」将移入回收站'+extra+'，可随时恢复。','删除',false);
          if(!ok) return;
          const nowTs=now();
          d.deleted=true; d.deletedAt=nowTs; await dbPut('dirs',d);
          for(const s of S.dirs.filter(x=>x.parentId===d.id&&!x.deleted)){
            s.deleted=true; s.deletedAt=nowTs; await dbPut('dirs',s);
          }
          if(S.curDirId===d.id){ const first=liveDirs(d.personId)[0]; S.curDirId=first?first.id:null; }
          await loadAll(); toast('已移入回收站'); render();
        }
      });
    });
}
function addDirForm(personId,parentId){
  sheet('<h3>'+(parentId?'新建子目录':'新建目录')+'<button class="sheet-x" data-x>✕</button></h3>'+
    (parentId?'':'<div class="field"><label>上级目录</label><select id="ad-parent">'+
      '<option value="">（顶层目录）</option>'+
      liveDirs(personId).filter(d=>!d.parentId).map(d=>'<option value="'+d.id+'">'+esc(d.name)+'</option>').join('')+
      '</select><div class="sd" style="font-size:11px;color:var(--ink3);margin-top:4px;">目录最多两层，子目录下不能再建子目录</div></div>')+
    '<div class="field"><label>目录名称</label><input id="ad-name" placeholder="如：兴趣爱好"></div>'+
    '<div class="sheet-actions"><button class="btn-secondary" data-cancel>取消</button><button class="btn-primary" data-ok>创建</button></div>',
    ov=>{
      ov.querySelector('[data-x]').onclick=()=>ov.remove();
      ov.querySelector('[data-cancel]').onclick=()=>ov.remove();
      ov.querySelector('[data-ok]').onclick=async()=>{
        const n=ov.querySelector('#ad-name').value.trim();
        if(!n){ toast('请填写目录名称',true); return; }
        const parent=parentId||ov.querySelector('#ad-parent').value;
        if(!parent){
          const topCount=liveDirs(personId).filter(d=>!d.parentId).length;
          await dbPut('dirs',{id:uid(),personId,parentId:'',name:n,sortOrder:topCount,pinned:false,
            deleted:false,deletedAt:null,createdAt:now(),updatedAt:now()});
        }else{
          const subs=liveDirs(personId).filter(d=>d.parentId===parent).length;
          await dbPut('dirs',{id:uid(),personId,parentId:parent,name:n,sortOrder:subs,pinned:false,
            deleted:false,deletedAt:null,createdAt:now(),updatedAt:now()});
        }
        await loadAll(); ov.remove(); toast('目录已创建'); render();
      };
      setTimeout(()=>ov.querySelector('#ad-name').focus(),80);
    });
}

/* ---------- 人员菜单 ---------- */
function personMenu(pid){
  const p=personById(pid); if(!p) return;
  sheet('<div class="menu-sheet">'+
    '<button class="menu-item" data-m="edit">'+I.edit+' 编辑资料</button>'+
    '<button class="menu-item" data-m="pin">'+I.pin+' 置顶</button>'+
    '<button class="menu-item" data-m="export">'+I.export+' 导出该人员备份</button>'+
    '<button class="menu-item danger" data-m="del">'+I.trash+' 删除人员</button>'+
    '</div>',
    ov=>{
      ov.addEventListener('click',e=>{ if(e.target===ov) ov.remove(); });
      ov.querySelectorAll('[data-m]').forEach(b=>b.onclick=async()=>{
        const m=b.dataset.m; ov.remove();
        if(m==='edit') personForm(p);
        else if(m==='pin'){
          const min=Math.min(...livePersons().map(x=>x.sortOrder??0),0);
          p.sortOrder=min-1; p.updatedAt=now(); await dbPut('persons',p);
          await loadAll(); toast('已置顶'); render();
        }else if(m==='del'){
          const eCount=S.entries.filter(e=>e.personId===pid&&!e.deleted).length;
          const ok=await confirmSheet('删除人员','人员「'+esc(p.name)+'」及其 '+eCount+' 条登记、全部目录将移入回收站，可在回收站恢复。','删除',false);
          if(!ok) return;
          const nowTs=now();
          p.deleted=true; p.deletedAt=nowTs; await dbPut('persons',p);
          for(const d of S.dirs.filter(d=>d.personId===pid&&!d.deleted)){ d.deleted=true; d.deletedAt=nowTs; await dbPut('dirs',d); }
          for(const e of S.entries.filter(e=>e.personId===pid&&!e.deleted)){ e.deleted=true; e.deletedAt=nowTs; await dbPut('entries',e); }
          await loadAll(); toast('已移入回收站'); render();
        }else if(m==='export'){
          await exportBackup();
        }
      });
    });
}

/* ---------- 路由与渲染 ---------- */
function parseRoute(){
  const h=location.hash||'#/list';
  const m=h.match(/^#\/([\w-]+)(?:\/([^?]+))?(?:\?(.*))?$/);
  if(!m) return {name:'list'};
  const q={};
  if(m[3]) m[3].split('&').forEach(kv=>{ const [k,v]=kv.split('='); q[k]=decodeURIComponent(v||''); });
  return {name:m[1],id:m[2],q};
}
async function render(){
  const r=parseRoute();
  const app=$('#app');
  if(r.name==='list'){
    S.searchKw='';
    app.innerHTML=renderPersonListReal();
    bindListEvents();
  }else if(r.name==='person'&&r.id){
    S.curPersonId=r.id; S.curDirId=r.q&&r.q.dir?r.q.dir:(S.curPersonId===r.id?S.curDirId:null);
    app.innerHTML=renderPersonPage(r.id);
    bindPersonEvents();
  }else if(r.name==='entry'&&r.id){
    app.innerHTML=renderEntryEditor(r.id);
    bindEntryEvents();
  }else if(r.name==='new-entry'){
    const pid=r.q.person, did=r.q.dir||S.curDirId;
    const e={id:uid(),personId:pid,dirId:did,title:'',time:'',location:'',relatedPeople:'',
      content:'',note:'',attachments:[],deleted:false,deletedAt:null,createdAt:now(),updatedAt:now()};
    await dbPut('entries',e); S.entries.push(e);
    location.hash='#/entry/'+e.id; return;
  }else if(r.name==='search'){
    if(r.q.person) S.curPersonId=r.q.person;
    if(!r.q.person&&r.q.global){ S.searchScope='global'; }
    else if(r.q.person){ S.searchScope='person'; S.searchDirFilter=''; }
    app.innerHTML=renderSearchPage();
    bindSearchEvents();
  }else if(r.name==='bin'){
    app.innerHTML=renderBin();
    bindBinEvents();
  }else if(r.name==='settings'){
    app.innerHTML=await renderSettings();
    bindSettingsEvents();
  }else{
    location.hash='#/list'; return;
  }
  window.scrollTo(0,0);
}

/* ---------- 事件绑定 ---------- */
function bindListEvents(){
  const inp=$('#pl-search');
  if(inp){
    inp.oninput=()=>{ S.searchKw=inp.value; const pos=inp.selectionStart;
      const app=$('#app'); app.innerHTML=renderPersonListReal(); bindListEvents();
      const ni=$('#pl-search'); ni.focus(); ni.setSelectionRange(pos,pos); };
  }
  const clr=$('#pl-clear'); if(clr) clr.onclick=()=>{ S.searchKw=''; render(); };
  $('#pl-add').onclick=()=>personForm(null);
  document.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>{
    const pid=el.dataset.open; S.curPersonId=pid; S.curDirId=null;
    location.hash='#/person/'+pid;
  });
  document.querySelectorAll('[data-pmenu]').forEach(el=>el.onclick=e=>{
    e.stopPropagation(); personMenu(el.dataset.pmenu);
  });
  document.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>{ location.hash=el.dataset.go; });
}
function bindPersonEvents(){
  document.querySelectorAll('[data-dir]').forEach(el=>el.onclick=()=>{
    S.curDirId=el.dataset.dir;
    const app=$('#app'); app.innerHTML=renderPersonPage(S.curPersonId); bindPersonEvents();
  });
  document.querySelectorAll('[data-entry]').forEach(el=>el.onclick=()=>{
    if(el.dataset.dirperson&&S.curPersonId!==el.dataset.dirperson){
      S.curPersonId=el.dataset.dirperson; S.curDirId=el.dataset.dir;
      location.hash='#/person/'+el.dataset.dirperson; return;
    }
    location.hash='#/entry/'+el.dataset.entry;
  });
  const ad=document.querySelector('[data-adddir]');
  if(ad) ad.onclick=()=>addDirForm(ad.dataset.adddir,'');
  const dm=document.querySelector('[data-dirmenu]');
  if(dm) dm.onclick=()=>dirMenu(dm.dataset.dirmenu);
  const ne=document.querySelector('[data-newentry]');
  if(ne) ne.onclick=()=>{
    if(!S.curDirId){ toast('请先选择一个目录',true); return; }
    location.hash='#/new-entry?person='+ne.dataset.newentry+'&dir='+S.curDirId;
  };
  document.querySelectorAll('[data-pmenu]').forEach(el=>el.onclick=e=>{
    e.stopPropagation(); personMenu(el.dataset.pmenu);
  });
  document.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>{ location.hash=el.dataset.go; });
}
function bindEntryEvents(){
  document.querySelectorAll('[data-save]').forEach(el=>el.addEventListener('input',scheduleSave));
  document.querySelectorAll('[data-back-entry]').forEach(el=>el.onclick=()=>{
    clearTimeout(S.saveTimer);
    location.hash='#/person/'+el.dataset.backEntry;
  });
  const del=document.querySelector('[data-deentry]');
  if(del) del.onclick=async()=>{
    const e=S.editingEntry;
    const ok=await confirmSheet('删除条目','条目「'+esc(e.title||'未命名条目')+'」将移入回收站，可随时恢复。','删除',false);
    if(!ok) return;
    e.deleted=true; e.deletedAt=now(); await dbPut('entries',e);
    await loadAll(); toast('已移入回收站');
    location.hash='#/person/'+e.personId;
  };
  const add=$('#ef-addatt'); if(add) add.onclick=pickFiles;
  document.querySelectorAll('[data-viewatt]').forEach(el=>el.onclick=()=>{
    viewAttachment(S.editingEntry,el.dataset.viewatt);
  });
  document.querySelectorAll('[data-delatt]').forEach(el=>el.onclick=async()=>{
    const e=S.editingEntry;
    const a=(e.attachments||[]).find(x=>x.id===el.dataset.delatt); if(!a) return;
    const ok=await confirmSheet('删除附件','附件「'+esc(a.name)+'」将被移除（仅从本条目移除，需删除条目并清空回收站才会真正释放空间）。','删除',true);
    if(!ok) return;
    e.attachments=e.attachments.filter(x=>x.id!==a.id);
    await scheduleSaveNow(); render(); toast('附件已移除');
  });
  updateSaveStatus(true);
}
function bindSearchEvents(){
  const inp=$('#sp-search');
  if(inp){
    inp.oninput=()=>{ S.searchKw=inp.value; const pos=inp.selectionStart;
      const app=$('#app'); app.innerHTML=renderSearchPage(); bindSearchEvents();
      const ni=$('#sp-search'); ni.focus(); ni.setSelectionRange(pos,pos); };
  }
  const clr=$('#sp-clear'); if(clr) clr.onclick=()=>{ S.searchKw=''; render(); };
  document.querySelectorAll('[data-sscope]').forEach(el=>el.onclick=()=>{
    S.searchScope=el.dataset.sscope; S.searchDirFilter='';
    const app=$('#app'); app.innerHTML=renderSearchPage(); bindSearchEvents();
  });
  document.querySelectorAll('[data-sfilter]').forEach(el=>el.onclick=()=>{
    S.searchDirFilter=el.dataset.sfilter;
    const app=$('#app'); app.innerHTML=renderSearchPage(); bindSearchEvents();
  });
  document.querySelectorAll('[data-entry]').forEach(el=>el.onclick=()=>{
    location.hash='#/entry/'+el.dataset.entry;
  });
  document.querySelectorAll('[data-dir]').forEach(el=>el.onclick=()=>{
    S.curPersonId=el.dataset.dirperson; S.curDirId=el.dataset.dir;
    location.hash='#/person/'+el.dataset.dirperson;
  });
  document.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>{
    S.curPersonId=el.dataset.open; S.curDirId=null;
    location.hash='#/person/'+el.dataset.open;
  });
}
function bindBinEvents(){
  document.querySelectorAll('[data-bintab]').forEach(el=>el.onclick=()=>{
    S.binTab=el.dataset.bintab;
    const app=$('#app'); app.innerHTML=renderBin(); bindBinEvents();
  });
  document.querySelectorAll('[data-restore]').forEach(el=>el.onclick=()=>{
    const [t,i]=el.dataset.restore.split('|'); restoreItem(t,i);
  });
  document.querySelectorAll('[data-kill]').forEach(el=>el.onclick=()=>{
    const [t,i]=el.dataset.kill.split('|'); killItem(t,i);
  });
}
function bindSettingsEvents(){
  document.querySelectorAll('[data-toggle]').forEach(el=>el.onclick=async()=>{
    S.autoClean=!S.autoClean;
    el.classList.toggle('on',S.autoClean);
    await metaSet('autoClean',S.autoClean);
    render();
  });
  document.querySelectorAll('[data-step]').forEach(el=>el.onclick=async()=>{
    S.retention=Math.max(5,Math.min(365,S.retention+parseInt(el.dataset.step)));
    await metaSet('retention',S.retention); render();
  });
  const th=$('#st-theme'); if(th) th.onclick=async()=>{
    S.theme=({auto:'light',light:'dark',dark:'auto'})[S.theme];
    await metaSet('theme',S.theme); await applyTheme(); render();
  };
  const ex=$('#st-export'); if(ex) ex.onclick=exportBackup;
  document.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>{ location.hash=el.dataset.go; });
}

/* ---------- 全局文件选择 ---------- */
$('#filePick').addEventListener('change',e=>{
  if(e.target.files&&e.target.files.length) addPickedFiles(Array.from(e.target.files));
});

/* ---------- 启动 ---------- */
window.addEventListener('hashchange',render);
(async function boot(){
  await applyTheme();
  S.retention=await metaGet('retention',30);
  S.autoClean=await metaGet('autoClean',true);
  await loadAll();
  await autoClean();
  await loadAll();
  if(!location.hash) location.hash='#/list';
  render();
  if(NATIVE){ /* APK 内资源本就在本地，跳过 Service Worker */ }
  else if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
})();
/* 供安卓返回键关闭浮层 */
window.__closeOverlay=function(){ closeTopOverlay(); };
