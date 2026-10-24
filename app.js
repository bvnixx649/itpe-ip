(function(){
'use strict';
const QS = window.QS;
const L = 'abcd';
const SECT = {
  S:{name:'Strategy',th:'กลยุทธ์',topics:['Corporate and Legal Affairs','Business Strategy','System Strategy']},
  M:{name:'Management',th:'การจัดการ',topics:['Development Technology','Project Management','Service Management']},
  T:{name:'Technology',th:'เทคโนโลยี',topics:['Basic Theory','Computer System','Technology Element']}
};
const SKIPIMG = {p34_0:1};
const app = document.getElementById('app');
const byN = {}; QS.forEach(q => byN[q.n] = q);

/* ---------- storage ---------- */
function load(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function save(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
let stats = load('ip-stats', {});           // n -> {t:tries, c:last correct, g:ever correct}
function record(n, ok){
  const s = stats[n] || {t:0,c:false,g:false};
  s.t++; s.c = ok; s.g = s.g || ok; stats[n] = s; save('ip-stats', stats);
}
const wrongList = () => QS.filter(q => stats[q.n] && !stats[q.n].c).map(q => q.n);

/* ---------- helpers ---------- */
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $ = (s, el=document) => el.querySelector(s);
const ico = {
  arr:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  ok:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  no:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h3l3-8 4 16 3-8h3"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>',
  shuffle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h4v4M4 20L20 4M20 16v4h-4M15 15l5 5M4 4l5 5"/></svg>',
  redo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>'
};
function isDark(){
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}
function toggleTheme(){
  const t = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = t; save('ip-theme-x', 1);
  try{ localStorage.setItem('ip-theme', t); }catch(e){}
  route();
}
function shuffle(a){ a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }
function stemHTML(q){
  return q.q.map(l => {
    const sub = /^(\(\d+\)|\([ivx]+\)|[A-D][:\s]|•|To:|Cc:|Bcc:|\[)/.test(l);
    return `<p class="${sub ? 'sub' : ''}">${esc(l.replace(/^([A-D])\s{2,}/,'$1: '))}</p>`;
  }).join('') + q.img.filter(i => !SKIPIMG[i]).map(i => `<div class="fig"><img src="img/${i}.png" alt="รูปประกอบโจทย์ข้อ ${q.n}" loading="lazy"></div>`).join('');
}
function metaHTML(q){
  return `<div class="qmeta"><span class="dot" style="background:var(--${q.s})"></span><span class="qno">ข้อ ${q.n}</span><span>${esc(q.c)}</span></div>`;
}
function bindZoom(root){
  root.querySelectorAll('.fig img').forEach(img => img.onclick = () => {
    const z = document.createElement('div'); z.className = 'zoom';
    z.innerHTML = `<img src="${img.src}" alt="">`; z.onclick = () => z.remove();
    document.body.appendChild(z);
  });
}

/* ---------- home ---------- */
function ring(done, total, color){
  const r = 24, c = 2*Math.PI*r, f = total ? done/total : 0;
  return `<div class="ring"><svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="${r}" fill="none" stroke="var(--faint)" stroke-width="6"/><circle cx="28" cy="28" r="${r}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-f)}" style="transition:stroke-dashoffset 1s"/></svg><b>${done}</b></div>`;
}
function home(){
  const answered = QS.filter(q => stats[q.n]).length;
  const right = QS.filter(q => stats[q.n] && stats[q.n].c).length;
  const wl = wrongList();
  const ex = load('ip-exam', null);
  const last = load('ip-last', null);
  const secCard = k => {
    const qs = QS.filter(q => q.s === k), g = qs.filter(q => stats[q.n] && stats[q.n].c).length;
    return `<button class="card sx" data-go="#/p/${k}">${ring(g, qs.length, `var(--${k})`)}
      <div><h3>${SECT[k].name} <span style="color:var(--mute);font-weight:500">${SECT[k].th}</span></h3>
      <p>${qs.length} ข้อ ตอบถูกแล้ว ${g}</p>
      <div class="topics">${SECT[k].topics.map(t => `<span>${t} ${qs.filter(q=>q.c===t).length}</span>`).join('')}</div></div>
      <span class="arr">${ico.arr}</span></button>`;
  };
  app.innerHTML = `
  <header class="hero"><div class="wrap">
    <div class="topbar"><button class="iconbtn" id="theme" aria-label="สลับธีม">${isDark() ? ico.sun : ico.moon}</button></div>
    <h1>ITPE IP<br>ทำข้อสอบ แล้วเรียนจากเฉลย</h1>
    <p>ข้อสอบ IT Passport 100 ข้อ ตอบแล้วเห็นทันทีว่าถูกหรือผิด พร้อมวิธีคิดทีละขั้นและเหตุผลว่าทำไมตัวเลือกอื่นผิด</p>
    <div class="stats"><div><b>${answered}<span style="font-size:16px;opacity:.7">/100</span></b><span>ข้อที่เคยทำ</span></div><div><b>${right}</b><span>ตอบถูกล่าสุด</span></div><div><b>${wl.length}</b><span>ข้อที่ต้องทวน</span></div></div>
    <svg viewBox="0 0 200 200" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><rect x="30" y="30" width="140" height="30" rx="10"/><rect x="30" y="74" width="140" height="30" rx="10"/><rect x="30" y="118" width="140" height="30" rx="10" fill="rgba(255,255,255,.25)"/><rect x="30" y="162" width="140" height="30" rx="10"/><path d="M140 126l8 8 14-16"/></svg>
  </div></header>
  <div class="wrap lift">
    ${last && last.mode && last.i > 0 && last.i < (last.list||[]).length ? `<button class="card go" data-go="#/p/${last.mode}" style="margin-bottom:12px"><span class="gi">${ico.play}</span><div><h3>ทำต่อจากเดิม</h3><p>${modeName(last.mode)} ข้อที่ ${last.i+1} จาก ${last.list.length}</p></div><span class="arr">${ico.arr}</span></button>` : ''}
    <button class="card go" data-go="#/p/all"><span class="gi">${ico.play}</span><div><h3>ฝึกเรียงทั้ง 100 ข้อ</h3><p>ตอบทีละข้อ เห็นเฉลยและวิธีคิดทันที</p></div><span class="arr">${ico.arr}</span></button>
    <div class="row2">
      <button class="card go" data-go="#/x"><span class="gi" style="background:var(--T-soft);color:var(--T)">${ico.clock}</span><div><h3>${ex && !ex.done ? 'สอบต่อ' : 'สอบเสมือนจริง'}</h3><p>${ex && !ex.done ? `ตอบไปแล้ว ${Object.keys(ex.ans).length} ข้อ` : '100 ข้อ 120 นาที เฉลยตอนจบ'}</p></div></button>
      <button class="card go" data-go="#/p/rand"><span class="gi" style="background:var(--M-soft);color:var(--M)">${ico.shuffle}</span><div><h3>สุ่ม 20 ข้อ</h3><p>รอบสั้น ทำจบในสิบนาที</p></div></button>
    </div>
    ${wl.length ? `<button class="card go" data-go="#/p/wrong" style="margin-top:12px"><span class="gi" style="background:var(--bad-soft);color:var(--bad)">${ico.redo}</span><div><h3>ทวนข้อที่ตอบผิด</h3><p>${wl.length} ข้อ ตอบถูกแล้วจะออกจากรายการนี้</p></div><span class="arr">${ico.arr}</span></button>` : ''}
    <h2 class="sec">ฝึกทีละหมวด</h2>
    <div class="secs">${secCard('S')}${secCard('M')}${secCard('T')}</div>
    <p class="foot">ข้อสอบจริงมี 100 ข้อ 120 นาที ปรนัย 4 ตัวเลือก เกณฑ์ผ่านของ ITPEC คือคะแนนรวม 60% และทุกหมวดต้องได้อย่างน้อย 30% (ผู้จัดสอบในไทยบางรอบใช้ 55% ตรวจประกาศรอบสอบของตัวเองอีกที) ความคืบหน้าเก็บไว้ในเครื่องนี้เท่านั้น <button id="reset">ล้างความคืบหน้า</button></p>
  </div>`;
  app.querySelectorAll('[data-go]').forEach(b => b.onclick = () => location.hash = b.dataset.go);
  $('#theme').onclick = toggleTheme;
  $('#reset').onclick = () => { if(confirm('ล้างประวัติการทำข้อสอบทั้งหมด?')){ stats = {}; save('ip-stats', {}); save('ip-last', null); save('ip-exam', null); home(); } };
}
function modeName(m){
  return m === 'all' ? 'ฝึกเรียง 100 ข้อ' : m === 'rand' ? 'สุ่ม 20 ข้อ' : m === 'wrong' ? 'ทวนข้อที่ผิด' : SECT[m] ? `หมวด ${SECT[m].name}` : '';
}

/* ---------- practice ---------- */
let P = null;
function practice(mode){
  let last = load('ip-last', null);
  if(last && last.mode === mode && last.i < last.list.length && last.list.every(n => byN[n])){
    P = {mode, list:last.list, i:last.i, res:last.res || {}};
  } else {
    let list;
    if(mode === 'all') list = QS.map(q => q.n);
    else if(mode === 'rand') list = shuffle(QS.map(q => q.n)).slice(0, 20);
    else if(mode === 'wrong') list = wrongList();
    else list = QS.filter(q => q.s === mode).map(q => q.n);
    if(!list.length){ return emptyView('ไม่มีข้อที่ต้องทวน', 'ข้อที่ตอบผิดจะมาอยู่ตรงนี้ ตอบถูกเมื่อไหร่ก็หายไปเอง'); }
    P = {mode, list, i:0, res:{}};
  }
  persistP(); showQ();
}
function persistP(){ save('ip-last', {mode:P.mode, list:P.list, i:P.i, res:P.res}); }
function topbar(extra){
  return `<div class="qtop"><div class="wrap"><button class="iconbtn" id="close" aria-label="กลับหน้าแรก">${ico.x}</button>
  <div class="bar"><i style="width:${extra.pct}%"></i></div>${extra.right}</div></div>`;
}
function showQ(){
  if(P.i >= P.list.length) return practiceDone();
  const q = byN[P.list[P.i]];
  app.innerHTML = topbar({pct: P.i/P.list.length*100, right:`<span class="count">${P.i+1}/${P.list.length}</span>`}) + `
  <div class="wrap qbody fade">${metaHTML(q)}<div class="stem">${stemHTML(q)}</div>
  <div class="opts">${q.o.map((o,i) => `<button class="opt" data-i="${i}"><span class="k">${L[i]}</span><span class="t">${esc(o)}</span></button>`).join('')}</div></div>
  `;
  $('#close').onclick = () => location.hash = '#/';
  bindZoom(app);
  app.querySelectorAll('.opt').forEach(b => b.onclick = () => answer(q, +b.dataset.i));
  scrollTo(0, 0);
}
function answer(q, i){
  if(app.querySelector('.opt[disabled]')) return;
  const ok = i === q.a;
  record(q.n, ok); P.res[q.n] = ok; persistP();
  app.querySelectorAll('.opt').forEach((b, j) => {
    b.disabled = true;
    if(j === q.a) b.classList.add('ok');
    else if(j === i) b.classList.add('no');
    else b.classList.add('dim');
  });
  if(navigator.vibrate) try{ navigator.vibrate(ok ? 12 : [20, 40, 20]); }catch(e){}
  showFeedback(q, i, P.i + 1 < P.list.length ? 'ข้อต่อไป' : 'ดูสรุป', () => { P.i++; persistP(); showQ(); });
}
function explainHTML(q, pick){
  const wrongPick = pick != null && pick !== q.a;
  const others = [0,1,2,3].filter(j => j !== q.a && j !== pick);
  return `<div class="ex">
    ${wrongPick ? `<h4>ทำไม ${L[pick]}) ถึงไม่ใช่</h4><div class="why">${esc(q.w[pick] || '')}</div>` : ''}
    <h4>วิธีคิด</h4><ol class="steps">${q.st.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol>
    ${others.length ? `<h4>${wrongPick ? 'ตัวเลือกที่เหลือ' : 'ทำไมตัวเลือกอื่นผิด'}</h4><div class="others">${others.map(j => `<div><span class="l">${L[j]})</span><span>${esc(q.w[j] || '')}</span></div>`).join('')}</div>` : ''}
    ${q.k.length ? `<h4>จำไว้</h4><div class="keep">${q.k.map(k => `<p>${esc(k)}</p>`).join('')}</div>` : ''}
  </div>`;
}
function showFeedback(q, pick, label, next){
  const ok = pick === q.a;
  const fb = document.createElement('section');
  fb.className = 'fb ' + (ok ? 'good' : 'bad');
  fb.innerHTML = `<div class="verdict"><span class="ic">${ok ? ico.ok : ico.no}</span><div><h3>${ok ? 'ถูกต้อง' : 'ยังไม่ใช่'}</h3><p>คำตอบคือ ${L[q.a]}) ${esc(q.o[q.a])}</p></div></div>${explainHTML(q, pick)}`;
  $('.qbody').appendChild(fb);
  const dock = document.createElement('div');
  dock.className = 'dock ' + (ok ? 'good' : 'bad');
  dock.innerHTML = `<div class="wrap"><button class="big" id="next">${label}</button></div>`;
  app.appendChild(dock);
  requestAnimationFrame(() => { fb.classList.add('on'); dock.classList.add('on'); });
  $('#next').onclick = next;
  setTimeout(() => {
    const y = fb.getBoundingClientRect().top + scrollY - 72;
    if(y > scrollY) scrollTo({top:y, behavior:'smooth'});
  }, 380);
}
function practiceDone(){
  const ns = P.list, r = ns.filter(n => P.res[n]).length;
  save('ip-last', null);
  app.innerHTML = `<div class="wrap fade"><div class="score"><div class="big-n">${r}<small>/${ns.length}</small></div>
    <h2>${r === ns.length ? 'ถูกหมดทุกข้อ' : r/ns.length >= .6 ? 'ผ่านเกณฑ์ 60%' : 'ยังต่ำกว่า 60%'}</h2><p>${modeName(P.mode)}</p></div>
    ${resultList(ns, n => P.res[n])}
    <div style="display:grid;gap:10px;margin-bottom:40px">${ns.some(n => !P.res[n]) ? `<button class="big" id="again">ทวนข้อที่ผิดรอบนี้</button>` : ''}<button class="big ghost" id="home">กลับหน้าแรก</button></div></div>`;
  bindList();
  $('#home').onclick = () => location.hash = '#/';
  const a = $('#again'); if(a) a.onclick = () => { P = {mode:'wrong', list:ns.filter(n => !P.res[n]), i:0, res:{}}; persistP(); location.hash = '#/p/wrong'; };
  scrollTo(0, 0);
}
function resultList(ns, isRight){
  return `<div class="list">${ns.map(n => `<button class="card li" data-n="${n}"><span class="n ${isRight(n) ? 'r' : 'w'}">${n}</span><span class="tx">${esc(byN[n].q[0])}</span><span class="arr" style="color:var(--mute)">${ico.arr}</span></button>`).join('')}</div>`;
}
function bindList(pickOf){
  app.querySelectorAll('.li').forEach(b => b.onclick = () => review(+b.dataset.n, pickOf ? pickOf(+b.dataset.n) : undefined));
}
function review(n, pick){
  const q = byN[n], back = location.hash;
  const prev = app.innerHTML, y = scrollY;
  app.innerHTML = topbar({pct:100, right:''}) + `<div class="wrap qbody fade">${metaHTML(q)}<div class="stem">${stemHTML(q)}</div>
    <div class="opts">${q.o.map((o,i) => `<button class="opt ${i === q.a ? 'ok' : i === pick ? 'no' : 'dim'}" disabled><span class="k">${L[i]}</span><span class="t">${esc(o)}</span></button>`).join('')}</div>
    <div class="card" style="padding:4px 20px 20px;margin-top:20px">${explainHTML(q, pick === undefined ? null : pick)}</div>
    <button class="big ghost" id="bk" style="margin-top:20px">กลับไปที่สรุป</button></div>`;
  bindZoom(app); scrollTo(0, 0);
  const goBack = () => { app.innerHTML = prev; bindAfterRestore(); scrollTo(0, y); };
  $('#close').onclick = goBack; $('#bk').onclick = goBack;
}
let bindAfterRestore = () => {};

/* ---------- exam ---------- */
const EXAM_MIN = 120;
function exam(){
  let ex = load('ip-exam', null);
  if(!ex || ex.done){
    if(ex && ex.done && location.hash === '#/x/res') return examResult(ex);
    return examIntro(ex);
  }
  E = ex; showE();
}
let E = null, tick = null;
function examIntro(prev){
  app.innerHTML = `<div class="wrap fade"><div class="score" style="text-align:left">
    <button class="iconbtn" id="close" style="margin-left:-10px">${ico.x}</button>
    <h2 style="font-size:32px;margin-top:20px;letter-spacing:-.02em">สอบเสมือนจริง</h2>
    <p style="font-size:17px;color:var(--ink);margin-top:14px">100 ข้อ 120 นาที เหมือนวันสอบ ระหว่างทำจะไม่เห็นเฉลย เปลี่ยนคำตอบได้ตลอด และข้ามข้อได้ พอส่งแล้วจะเห็นคะแนนแยกตามหมวด กับเฉลยพร้อมวิธีคิดทุกข้อ</p>
    <p style="margin-top:10px">เวลาเฉลี่ย 72 วินาทีต่อข้อ ปิดหน้านี้ไปก่อนได้ เวลาจะยังเดินต่อ</p>
    <div style="display:grid;gap:10px;margin-top:28px"><button class="big" id="start">เริ่มจับเวลา</button>${prev && prev.done ? `<button class="big ghost" id="last">ดูผลสอบครั้งก่อน</button>` : ''}</div>
  </div></div>`;
  $('#close').onclick = () => location.hash = '#/';
  $('#start').onclick = () => { E = {start:Date.now(), ans:{}, i:0, done:false}; save('ip-exam', E); showE(); };
  const l = $('#last'); if(l) l.onclick = () => { location.hash = '#/x/res'; };
}
function remain(){ return Math.max(0, E.start + EXAM_MIN*60000 - Date.now()); }
function fmt(ms){ const s = Math.ceil(ms/1000), h = s/3600|0, m = (s%3600)/60|0, ss = s%60; return `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`; }
function showE(){
  const q = QS[E.i], pick = E.ans[q.n];
  const done = Object.keys(E.ans).length;
  app.innerHTML = topbar({pct: done, right:`<span class="timer" id="tm">${fmt(remain())}</span><button class="iconbtn" id="nav" aria-label="ดูทุกข้อ">${ico.grid}</button>`}) + `
  <div class="wrap qbody fade" style="padding-bottom:140px">${metaHTML(q)}<div class="stem">${stemHTML(q)}</div>
  <div class="opts">${q.o.map((o,i) => `<button class="opt ${pick === i ? 'pick' : ''}" data-i="${i}"><span class="k">${L[i]}</span><span class="t">${esc(o)}</span></button>`).join('')}</div></div>
  <div class="dock"><div class="wrap"><button class="big ghost" id="prev" ${E.i === 0 ? 'disabled' : ''} style="flex:1">ก่อนหน้า</button><button class="big" id="nx" style="flex:2">${E.i === 99 ? 'ส่งคำตอบ' : pick == null ? 'ข้ามไปก่อน' : 'ข้อต่อไป'}</button></div></div>
  <div class="modal" id="md"><div class="in"></div></div>`;
  $('#close').onclick = () => location.hash = '#/';
  bindZoom(app);
  app.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    const i = +b.dataset.i;
    E.ans[q.n] = i; save('ip-exam', E);
    app.querySelectorAll('.opt').forEach(x => x.classList.toggle('pick', x === b));
    $('#nx').textContent = E.i === 99 ? 'ส่งคำตอบ' : 'ข้อต่อไป';
    $('.bar i').style.width = Object.keys(E.ans).length + '%';
  });
  $('#prev').onclick = () => { E.i--; save('ip-exam', E); showE(); };
  $('#nx').onclick = () => { if(E.i === 99) return navOpen(true); E.i++; save('ip-exam', E); showE(); };
  $('#nav').onclick = () => navOpen(false);
  clearInterval(tick);
  tick = setInterval(() => {
    const t = $('#tm'); if(!t){ clearInterval(tick); return; }
    const r = remain(); t.textContent = fmt(r); t.classList.toggle('low', r < 600000);
    if(r <= 0){ clearInterval(tick); submitExam(); }
  }, 1000);
  scrollTo(0, 0);
}
function navOpen(submitting){
  const md = $('#md'), left = 100 - Object.keys(E.ans).length;
  md.firstChild.innerHTML = `<h3>${submitting ? (left ? `ยังไม่ได้ตอบ ${left} ข้อ` : 'ตอบครบ 100 ข้อแล้ว') : `ตอบแล้ว ${100-left} จาก 100 ข้อ`}</h3>
    <div class="grid">${QS.map((q, i) => `<button class="${E.ans[q.n] != null ? 'done' : ''} ${i === E.i ? 'cur' : ''}" data-i="${i}">${q.n}</button>`).join('')}</div>
    <div style="display:grid;gap:10px;margin-top:20px"><button class="big" id="sub">ส่งคำตอบและดูผล</button><button class="big ghost" id="cl">ทำต่อ</button></div>`;
  md.classList.add('on');
  md.onclick = e => { if(e.target === md) md.classList.remove('on'); };
  md.querySelectorAll('.grid button').forEach(b => b.onclick = () => { E.i = +b.dataset.i; save('ip-exam', E); showE(); });
  $('#cl').onclick = () => md.classList.remove('on');
  $('#sub').onclick = () => { if(!left || confirm(`ยังเหลือ ${left} ข้อที่ไม่ได้ตอบ ส่งเลยไหม`)) submitExam(); };
}
function submitExam(){
  clearInterval(tick);
  E.done = true; E.end = Date.now();
  QS.forEach(q => { if(E.ans[q.n] != null) record(q.n, E.ans[q.n] === q.a); });
  save('ip-exam', E);
  location.hash = '#/x/res';
}
function examResult(ex){
  E = ex;
  const ok = n => ex.ans[n] === byN[n].a;
  const total = QS.filter(q => ok(q.n)).length;
  const per = {}; 'SMT'.split('').forEach(k => { const qs = QS.filter(q => q.s === k); per[k] = {r: qs.filter(q => ok(q.n)).length, t: qs.length}; });
  const secPass = 'SMT'.split('').every(k => per[k].r/per[k].t >= .3);
  const pass = total >= 60 && secPass;
  const mins = Math.round(((ex.end || Date.now()) - ex.start)/60000);
  const wrongNs = QS.filter(q => !ok(q.n)).map(q => q.n);
  app.innerHTML = `<div class="wrap fade"><div class="score"><div class="big-n">${total}<small>/100</small></div>
    <h2>${pass ? 'ผ่านเกณฑ์ ITPEC' : total >= 60 ? 'คะแนนรวมผ่าน แต่มีหมวดต่ำกว่า 30%' : 'ยังไม่ถึง 60%'}</h2><p>ใช้เวลา ${mins} นาที</p></div>
    <div class="card bars">${'SMT'.split('').map(k => { const p = per[k].r/per[k].t*100; return `<div><div class="lbl"><span>${SECT[k].name} <span style="color:var(--mute)">${SECT[k].th}</span></span><b>${per[k].r}/${per[k].t}</b></div><div class="track"><i style="background:var(--${k})" data-w="${p}"></i><span class="mark" style="left:30%"></span></div></div>`; }).join('')}</div>
    <h2 class="sec">${wrongNs.length ? `ข้อที่พลาด ${wrongNs.length} ข้อ` : 'ไม่มีข้อที่พลาด'}</h2>
    ${resultList(wrongNs, () => false)}
    <div style="display:grid;gap:10px;margin-bottom:40px"><button class="big" id="again">สอบใหม่อีกรอบ</button><button class="big ghost" id="home">กลับหน้าแรก</button></div></div>`;
  requestAnimationFrame(() => setTimeout(() => app.querySelectorAll('.track i').forEach(i => i.style.width = i.dataset.w + '%'), 60));
  const bind = () => {
    bindList(n => ex.ans[n] == null ? null : ex.ans[n]);
    $('#home').onclick = () => location.hash = '#/';
    $('#again').onclick = () => { save('ip-exam', null); location.hash = '#/x'; };
    app.querySelectorAll('.track i').forEach(i => i.style.width = i.dataset.w + '%');
  };
  bindAfterRestore = bind; bind();
  scrollTo(0, 0);
}

function emptyView(h, p){
  app.innerHTML = `<div class="wrap fade"><div class="empty"><h2>${h}</h2><p>${p}</p><button class="big ghost" style="margin-top:28px" onclick="location.hash='#/'">กลับหน้าแรก</button></div></div>`;
}

/* ---------- router ---------- */
function route(){
  clearInterval(tick);
  const h = location.hash.replace(/^#\/?/, '').split('/');
  if(h[0] === 'p' && h[1]) return practice(h[1]);
  if(h[0] === 'x'){
    if(h[1] === 'res'){ const ex = load('ip-exam', null); return ex && ex.done ? examResult(ex) : exam(); }
    return exam();
  }
  home(); scrollTo(0, 0);
}
addEventListener('hashchange', route);
addEventListener('keydown', e => {
  if(e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase(), idx = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k);
  if(idx >= 0){ const b = app.querySelectorAll('.opt:not([disabled])')[idx]; if(b){ b.click(); e.preventDefault(); } }
  if(k === 'enter' || k === 'arrowright'){ const n = $('#next') || $('#nx'); if(n && !n.disabled){ n.click(); e.preventDefault(); } }
});
route();
})();
