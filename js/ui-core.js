/* 知证 KnowProof · 界面层：状态、存档、通用组件 */
(function () {
  const D = window.KP_DATA, K = window.KP, L = window.KP_LESSON;
  const KEY = 'kp_demo_v3';
  const A = window.A = { D, K, L, views: {}, acts: {}, drawers: {}, onPick: {}, S: null, U: null };

  A.freshU = () => ({ drawer: null, focusEv: null, nodeId: null, toast: null, code: {}, src: {}, pick: {}, text: {}, ins: {}, folds: {}, wrong: {},
    viz: { x: 3, mode: 'first', plus: true, step: 0 }, guess: null, counter: { q: '1, 5, 9', x: '1', tries: [], why: null, err: null },
    chat: [], sec: 0, amb: {}, pro: {}, switching: false, pathTask: null, stamp: false, redo: false, deepRes: null, warned: false, syntax: null });
  A.load = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 2) return s; } catch (e) { /* 存档损坏就重新开始 */ } return K.newSession('me'); };
  A.save = () => { try { localStorage.setItem(KEY, JSON.stringify(A.S)); } catch (e) { /* 无痕模式下不存档 */ } };

  const esc = A.esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const svg = (d, w, sw) => `<svg width="${w || 18}" height="${w || 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw || 2.2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const PATHS = {
    ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', no: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    half: '<circle cx="12" cy="12" r="7.5"/><path d="M12 4.5a7.5 7.5 0 0 0 0 15z" fill="currentColor"/>', skip: '<path d="M7 12h10"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', chat: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    play: '<path d="M8 5.5v13l10-6.5z" fill="currentColor"/>', send: '<path d="M4 12l16-7-6 16-3-7z"/>',
    book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    flag: '<path d="M6 21V4M6 5h11l-2 4 2 4H6"/>', up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  };
  A.icon = (n, w, sw) => svg(PATHS[n], w, sw);

  /* 品牌标识：一枚缺角的印章，里面是 K 与对勾（知 Know + 证 Proof）；折角表示「凭证」 */
  /* 标识：一枚朱红印章，白文「证」。言字旁写成一个对勾；右边的「正」五画，对应五项能力 */
  A.logo = (w) => `<svg class="logo" width="${w || 36}" height="${w || 36}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="kp-seal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e4553f"/><stop offset="1" stop-color="#c8321f"/></linearGradient></defs><path d="M17 4h30a13 13 0 0 1 13 13v30a13 13 0 0 1-13 13H17A13 13 0 0 1 4 47V17A13 13 0 0 1 17 4z" fill="url(#kp-seal)"/><rect x="7.6" y="7.6" width="48.8" height="48.8" rx="10" fill="none" stroke="#fffaf3" stroke-opacity=".42" stroke-width="1.3"/><g transform="translate(32 32.5) scale(.87) translate(-31.4 -31)" fill="none" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 13.5l4.2 3.4M28 16h23.5M39.8 16v31M39.8 31h10.2M31 31v16M25.5 47h28.5" stroke="#fffaf3"/><path d="M8 32.5l6.2 13 8-18.5" stroke="#f5cc6e"/></g></svg>`;
  /* AI 助教「小证」的头像：一枚圆形的小印；四种出现方式各带一个标签 */
  A.xz = (cls) => `<span class="xz${cls ? ' ' + cls : ''}" aria-hidden="true">证</span>`;
  A.MODES = { pro: ['主动介入', 'Proactive', '系统发现你卡住时，主动弹出来问一句'], amb: ['环境式辅助', 'Ambient', '题目、代码旁边的快捷提问，就地回答'],
    ond: ['主动请求', 'On-demand', '右下角的「问小证」，随时可以提问'], ref: ['反思式介入', 'Reflective', '做完之后的一张回顾卡片'] };
  A.mode = (k) => `<span class="aim aim-${k}">${A.xz('sm')}<b>小证</b><i>${A.MODES[k][0]}</i></span>`;
  /* 任务等级：五格，代替星星 */
  A.pips = (n) => `<span class="pips" role="img" aria-label="难度 ${n} / 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  const MARK = { 1: ['ok', '正确'], 0.5: ['half', '部分正确'], 0: ['no', '错误'] };
  A.mark = (ok) => { const m = ok === null || ok === undefined ? ['skip', '未作答'] : MARK[ok];
    return `<span class="mark ${m[0]}" role="img" aria-label="${m[1]}" title="${m[1]}">${A.icon(m[0], 14, 2.8)}</span>`; };
  A.okWord = (ok) => (ok === null || ok === undefined ? '未作答' : MARK[ok][1]);
  const VD = { AC: ['ok', '通过'], WA: ['no', '答案错误'], TLE: ['clock', '超时'], RE: ['no', '运行错误'], CE: ['no', '编译错误'] };
  A.vd = (v) => `<span class="vd ${v}">${A.icon(VD[v][0], 13, 2.8)}${VD[v][1]}</span>`;
  A.CONF = { low: '不太确定', mid: '有些把握', high: '非常确定' };
  A.PHASE = { none: '未评估', pencil: '初步评估', ink: '已确认', seal: '已验证' };
  A.lv = (ds) => (ds.level ? `L${ds.level} ${D.LEVELS[ds.level]}` : '未评估');
  A.phaseTag = (ds) => (ds.level ? `<span class="tag ${{ pencil: '', ink: 'blue', seal: 'green' }[ds.phase]}">${A.PHASE[ds.phase]}</span>` : '');

  /* 等级条：斜线 = 初步评估，蓝色 = 已确认，绿色 = 已验证；始终配文字说明，不只依赖颜色 */
  A.meter = (ds) => `<span class="meter ph-${ds.level ? ds.phase : 'none'}" role="img" aria-label="${A.lv(ds)}，${A.PHASE[ds.level ? ds.phase : 'none']}">${[1, 2, 3, 4].map((i) => `<i class="${ds.level && i <= ds.level ? 'on' : ''}"></i>`).join('')}</span>`;
  A.evchips = (ids) => ids.map((id) => `<button class="evchip" data-act="ev" data-id="${id}" title="查看这条作答记录">${id}</button>`).join('');
  A.dimList = (dg, o) => `<ul class="dims${o && o.compact ? ' compact' : ''}">${D.DIMS.map((d) => { const ds = dg.dims[d.id]; const b = o && o.base ? o.base.dims[d.id] : null;
    return `<li><div class="dn"><b>${d.name}</b><span>${d.ask}</span></div><div class="dm">${A.meter(ds)}<span class="lvtxt">${A.lv(ds)}</span>${A.phaseTag(ds)}</div>
      <div class="de">${ds.ids.length ? `依据 ${A.evchips(ds.ids)}` : '暂无作答记录，不作推断'}${ds.scaffolded ? '<span>　辅导中完成的练习不计入</span>' : ''}${b && b.level && b.level !== ds.level ? `<span>　初步评估为 ${A.lv(b)}</span>` : ''}</div></li>`; }).join('')}</ul>`;
  A.legend3 = () => `<div class="legend3"><span><span class="meter ph-pencil"><i class="on"></i><i class="on"></i></span>初步评估：依据基础练习</span><span><span class="meter ph-ink"><i class="on"></i><i class="on"></i></span>已确认：经进阶练习确认</span><span><span class="meter ph-seal"><i class="on"></i><i class="on"></i></span>已验证：独立检测中完成</span></div>`;

  /* 五项能力雷达图：cur 为当前评估，base（可选）为对比用的初步评估。图旁始终配有列表，数值不只靠图形表达 */
  A.radar = (cur, base) => { const W = 340, H = 250, cx = 170, cy = 128, R = 82, n = D.DIMS.length;
    const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const pt = (i, v) => [cx + (R * v / 4) * Math.cos(ang(i)), cy + (R * v / 4) * Math.sin(ang(i))];
    const poly = (v) => D.DIMS.map((d, i) => pt(i, v(d)).map((x) => x.toFixed(1)).join(',')).join(' ');
    const lvl = (dg) => (d) => dg.dims[d.id].level || 0;
    const rings = [1, 2, 3, 4].map((k) => `<polygon points="${poly(() => k)}" class="rr${k === 3 ? ' key' : ''}"/>`).join('');
    const axes = D.DIMS.map((d, i) => { const p = pt(i, 4); return `<line x1="${cx}" y1="${cy}" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}" class="axis"/>`; }).join('');
    const labels = D.DIMS.map((d, i) => { const c = Math.cos(ang(i)), s = Math.sin(ang(i)); const x = cx + (R + 12) * c, y = cy + (R + 12) * s + (s < -0.5 ? -14 : s > 0.5 ? 12 : 0);
      const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end'; const ds = cur.dims[d.id];
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" class="rl">${d.name}</text><text x="${x.toFixed(1)}" y="${(y + 15).toFixed(1)}" text-anchor="${anchor}" class="rv">${ds.level ? 'L' + ds.level : '未评估'}</text>`; }).join('');
    const dots = D.DIMS.map((d, i) => { const ds = cur.dims[d.id]; if (!ds.level) return ''; const p = pt(i, ds.level);
      return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5" class="rd"><title>${d.name}：${A.lv(ds)}（${A.PHASE[ds.phase]}）</title></circle>`; }).join('');
    return `<figure class="radar"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="五项能力评估雷达图">${rings}${axes}
      ${base ? `<polygon points="${poly(lvl(base))}" class="rb"/>` : ''}<polygon points="${poly(lvl(cur))}" class="rc"/>${dots}${labels}
      <text x="${cx + 4}" y="${(cy - R * 0.75 + 4).toFixed(1)}" class="rt">L3</text></svg>
      ${base ? '<figcaption><span><i class="lg-b"></i>初步评估</span><span><i class="lg-c"></i>当前评估</span></figcaption>' : ''}</figure>`; };

  /* 选择题 */
  A.mcq = (key, options, o) => { o = o || {}; const cur = o.value !== undefined ? o.value : A.U.pick[key];
    return `<div class="opts" role="radiogroup">${options.map((op) => `<button class="opt${cur === op[0] ? ' on' : ''}" role="radio" aria-checked="${cur === op[0]}" data-act="pick" data-key="${key}" data-v="${op[0]}"${o.disabled ? ' disabled' : ''}><span class="k">${op[0]}</span><span>${o.html ? op[1] : esc(op[1])}</span></button>`).join('')}</div>`; };

  A.head = (id, title, sub) => { const s = D.STAGES.find((x) => x.id === id);
    return `<div class="page-h"><span class="eyebrow">二分查找 · ${s.name}</span><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>`; };
  A.qhead = (i, n, type, dims) => `<div class="qhead"><span class="qno">第 ${i} 题<small> / 共 ${n} 题</small></span><span class="tag blue">${type}</span>${dims ? `<span class="tag">${dims.map((x) => K.DIM_NAME[x]).join('、')}</span>` : ''}<span class="sp"></span><span class="qdots">${Array.from({ length: n }, (_, j) => `<i class="${j + 1 < i ? 'd' : j + 1 === i ? 'c' : ''}"></i>`).join('')}</span></div>`;
  A.toast = (msg) => { A.U.toast = msg; clearTimeout(A._tt); A._tt = setTimeout(() => { A.U.toast = null; A.render(); }, 3600); };
  A.go = (stage) => { K.go(A.S, stage); A.U.drawer = null; A.U.switching = false; A.U.pathTask = null; A.U.stamp = false; A.U.toast = null; A.U.deepRes = null; A.U.amb = {}; A.U.pro = {}; A._top = true; };
  A.fmtTime = (t) => { const d = new Date(t); const p = (n) => String(n).padStart(2, '0'); return `${p(d.getHours())}:${p(d.getMinutes())}`; };
  A.who = () => { const p = D.PERSONAS[A.S.persona]; return p.id === 'me' ? null : p; };
})();
