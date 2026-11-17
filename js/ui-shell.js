/* 知证 KnowProof · 页面框架：顶栏、步骤导航、渲染、事件、作答记录抽屉 */
(function () {
  const A = window.A, D = A.D, K = A.K, esc = A.esc;
  const app = document.getElementById('app');

  const top = () => { const S = A.S, p = A.who(), home = S.stage === 'home';
    return `<header class="top"><button class="brand" data-act="home" aria-label="返回知识地图">${A.logo()}<span class="brand-name">知证</span><span class="brand-en">KnowProof</span></button>
      <nav class="crumb" aria-label="当前位置">${home ? '<b>知识地图</b>' : `<button data-act="home">知识地图</button><i>›</i><span>基础算法</span><i>›</i><b>二分查找</b>`}</nav>
      <div class="top-actions">${p ? `<span class="who">演示学生：${p.name}</span>` : ''}<button class="tbtn" data-act="drawer" data-v="ev">作答记录${S.evidence.length ? `<span class="n">${S.evidence.length}</span>` : ''}</button>
      <button class="tbtn demo" data-act="drawer" data-v="demo">演示台</button><span class="avatar" aria-hidden="true">${p ? p.name[0] : '我'}</span></div></header>`; };
  const rail = () => { const S = A.S, cur = K.stageIdx(S.stage);
    return `<nav class="rail" aria-label="学习步骤"><div class="rail-t">二分查找 · 学习步骤</div><ol>${D.STAGES.slice(1).map((s, k) => { const i = k + 1; const ok = i <= S.reached;
      return `<li class="${i === cur ? 'cur' : ok && i < S.reached ? 'done' : ''}"><button data-act="goto" data-to="${s.id}"${ok ? '' : ' disabled'}${i === cur ? ' aria-current="step"' : ''}><span class="no">${i}</span>${s.name}${ok && i < S.reached && i !== cur ? `<span class="mk mark ok" style="width:18px;height:18px">${A.icon('ok', 11, 3)}</span>` : ''}</button></li>`; }).join('')}</ol>
      <button class="rail-back" data-act="home">${A.icon('back', 14)}返回知识地图</button></nav>`; };
  const drawer = () => { const n = A.U.drawer; if (!n || !A.drawers[n]) return ''; const d = A.drawers[n]();
    return `<div class="scrim" data-act="close"></div><aside class="drawer ${d.cls || ''}" role="dialog" aria-label="${d.title}"><div class="drawer-h"><h2>${d.title}</h2>${d.sub ? `<span class="faint small">${d.sub}</span>` : ''}<span class="sp"></span><button class="x" data-act="close" aria-label="关闭">×</button></div><div class="drawer-b" id="drawer-b">${d.body}</div>${d.foot ? `<div class="drawer-f">${d.foot}</div>` : ''}</aside>`; };

  A.render = () => { const S = A.S, home = S.stage === 'home'; const v = A.views[S.stage](); const view = typeof v === 'string' ? { html: v } : v;
    const ae = document.activeElement; let fk = null;
    if (ae && ae.dataset) { const k = ['src', 'text', 'in'].find((x) => ae.dataset[x]); if (k) fk = { sel: `[data-${k}="${ae.dataset[k]}"]`, s: ae.selectionStart, e: ae.selectionEnd }; }
    const db = document.getElementById('drawer-b'); const keep = db && A._drawer === A.U.drawer ? db.scrollTop : 0;
    const gb = A.guide();
    app.innerHTML = `${top()}${gb}<div class="wrap${home ? ' home' : ''}${gb ? ' g' : ''}">${home ? '' : rail()}<main class="main" id="main">${view.html}</main></div>${A.fab()}${drawer()}${A.U.toast ? `<div class="toast" role="status">${esc(A.U.toast)}</div>` : ''}`;
    app.querySelectorAll('.main details.fold').forEach((d, i) => { d.dataset.fold = S.stage + i; d.open = !!A.U.folds[S.stage + i]; });
    if (fk) { const el = app.querySelector(fk.sel); if (el) { el.focus({ preventScroll: true }); try { el.setSelectionRange(fk.s, fk.e); } catch (e) { /* 部分输入框不支持选区 */ } } }
    const nb = document.getElementById('drawer-b'); if (nb) { if (A.U.drawer === 'chat') nb.scrollTop = nb.scrollHeight; else if (A.U.drawer === 'ev' && A.U.focusEv && A._drawer !== 'ev') { const t = nb.querySelector('.evi.focus'); if (t) t.scrollIntoView({ block: 'center' }); } else nb.scrollTop = keep; }
    A._drawer = A.U.drawer; document.body.classList.toggle('lock', !!A.U.drawer);
    if (A._top) { window.scrollTo(0, 0); A._top = false; }
    if (A._focus) { const t = app.querySelector(A._focus); if (t) t.scrollIntoView({ block: 'center' }); A._focus = null; } };

  /* ---------- 通用操作 ---------- */
  A.acts.home = () => A.go('home');
  A.acts.goto = (d) => { if (K.stageIdx(d.to) <= A.S.reached) A.go(d.to); };
  A.acts.drawer = (d) => { A.U.drawer = d.v; A.U.focusEv = null; };
  A.acts.close = () => { A.U.drawer = null; };
  A.acts.ev = (d) => { A.U.focusEv = d.id; A.U.drawer = 'ev'; A._drawer = null; };
  A.acts.pick = (d) => { if (A.onPick[d.key]) A.onPick[d.key](d.v); else A.U.pick[d.key] = d.v; };

  /* ---------- 作答记录抽屉 ---------- */
  const STAGE_NAME = { rapid: '基础练习', deep: '进阶练习', support: '针对辅导', verify: '独立检测', star4: '四星任务', star5: '五星挑战' };
  A.drawers.ev = () => { const S = A.S;
    return { title: '作答记录', sub: `共 ${S.evidence.length} 条`, body: S.evidence.length ? `<p class="faint small">每一条评估结论都对应这里的一条或多条记录。</p><ul class="evlist">${S.evidence.map((e) => `<li class="evi${A.U.focusEv === e.id ? ' focus' : ''}"><div class="evi-h"><span class="evchip" style="margin:0">${e.id}</span><b>${e.title}</b><span class="sp"></span>${A.mark(e.ok)}</div>
      <p>${esc(e.note)}</p><div class="evi-m"><span class="tag">${STAGE_NAME[e.stage]}</span>${e.dims.map((x) => `<span class="tag blue">${K.DIM_NAME[x]}</span>`).join('')}${e.conf ? `<span class="tag">把握程度：${A.CONF[e.conf]}</span>` : ''}${e.scaffold ? '<span class="tag gold">有提示，不计入掌握</span>' : ''}${e.misc ? `<span class="tag red">${D.MISC[e.misc].name}</span>` : ''}<span class="sp"></span><span class="faint">${A.fmtTime(e.t)}</span></div></li>`).join('')}</ul>`
      : '<p class="empty">还没有作答记录。完成练习后，每一次作答都会记录在这里。</p>' }; };

  /* ---------- 事件 ---------- */
  document.addEventListener('click', (e) => { const el = e.target.closest('[data-act]'); if (!el || el.disabled) return; const f = A.acts[el.dataset.act]; if (!f) return;
    if (f(el.dataset, el) === false) return; A.save(); A.render(); });
  document.addEventListener('change', (e) => { const t = e.target;
    if (t.dataset.blank) { const [key, b] = t.dataset.blank.split('|'); const st = A.U.code[key]; if (st) { st.ch[b] = t.value; st.last = null; } A.render(); }
    else if (t.dataset.chk === 'vizplus') { A.U.viz.plus = !t.checked; A.U.viz.step = 0; A.render(); } });
  document.addEventListener('input', (e) => { const t = e.target; if (t.dataset.src) A.edInput(t); else if (t.dataset.text) A.U.text[t.dataset.text] = t.value; else if (t.dataset.in) A.U.ins[t.dataset.in] = t.value; });
  document.addEventListener('toggle', (e) => { const t = e.target; if (t.dataset && t.dataset.fold) A.U.folds[t.dataset.fold] = t.open; }, true);
  document.addEventListener('keydown', (e) => { const t = e.target;
    if (e.key === 'Escape' && A.U.drawer) { A.U.drawer = null; A.render(); }
    else if (e.key === 'Tab' && t.dataset && t.dataset.src && !t.readOnly) { e.preventDefault(); const s = t.selectionStart; t.setRangeText('    ', s, t.selectionEnd, 'end'); A.edInput(t); }
    else if (e.key === 'Enter' && !e.isComposing && t.dataset && t.dataset.enter) { e.preventDefault(); if (A.acts[t.dataset.enter]({ v: 'go' }, t) !== false) { A.save(); A.render(); } } });

  A.S = A.load(); A.U = A.freshU(); A.render();
})();
