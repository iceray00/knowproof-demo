/* 知证 KnowProof · 01 知识地图 */
(function () {
  const A = window.A, D = A.D, K = A.K;
  const NAME = {}; D.TREE.forEach((m) => m.nodes.forEach((n) => { NAME[n.id] = n.name; }));
  const TOTAL = D.TREE.reduce((s, m) => s + m.nodes.length, 0);
  const WORD = { sealed: '已掌握', pending: '待检测', live: '学习中', lock: '未解锁', open: '未开始' };

  /* 「二分查找」的状态取决于本次学习的进度；依赖它的知识点在它掌握后解锁；其余为演示数据 */
  A.nodeStatus = (n) => { const S = A.S;
    if (n.id === 'bsearch') return K.proven(S) ? 'sealed' : S.verify.status ? 'pending' : 'live';
    if (n.lock) return n.pre.includes('bsearch') && K.proven(S) ? 'open' : 'lock';
    return n.status; };
  const counts = (nodes) => { const c = { sealed: 0, pending: 0, live: 0 }; nodes.forEach((n) => { const s = A.nodeStatus(n); if (s === 'live' && !A.S.started) return; if (c[s] !== undefined) c[s]++; }); return c; };
  const nodeBtn = (n, i) => { const s = A.nodeStatus(n);
    return `<button class="node ${s}" data-act="node" data-id="${n.id}" title="${WORD[s]}"><span class="ix">${String(i + 1).padStart(2, '0')}</span>${n.name}${s === 'live' ? `<span class="st">${A.S.started ? '学习中' : '推荐'}</span>` : s === 'lock' ? A.icon('lock', 13) : s === 'sealed' ? `<span class="mark ok" style="width:18px;height:18px">${A.icon('ok', 11, 3)}</span>` : s === 'pending' ? '<span class="tag gold">待检测</span>' : ''}</button>`; };
  const prog = (c, n) => { const w = (x) => `width:${(x / n * 100).toFixed(1)}%`;
    return `<div class="prog" role="img" aria-label="已掌握 ${c.sealed} 个，待检测 ${c.pending} 个，共 ${n} 个"><i style="${w(c.sealed)}"></i><i class="p" style="${w(c.pending)}"></i><i class="l" style="${w(c.live)}"></i></div>`; };
  /* 正在学习的一章展开，其余各章收成一行，点击再展开 */
  const chapter = (m, i) => { const c = counts(m.nodes), n = m.nodes.length; const no = String(i + 1).padStart(2, '0');
    if (m.nodes.some((x) => x.id === 'bsearch')) return `<section class="card chap"><div class="chap-h"><span class="chap-no">${no}</span><div><h3>${m.name}</h3><p>${m.desc}</p></div>
      <div class="chap-p"><b>${c.sealed} / ${n}</b><small>已掌握</small></div></div>${prog(c, n)}<div class="nodes">${m.nodes.map(nodeBtn).join('')}</div></section>`;
    return `<details class="fold chaprow"><summary><span class="chap-no">${no}</span><b>${m.name}</b><span class="cr-d">${m.desc}</span><span class="cr-p">${c.sealed} / ${n}</span></summary><div class="fold-b"><div class="nodes">${m.nodes.map(nodeBtn).join('')}</div></div></details>`; };

  A.views.home = () => { const S = A.S; const all = D.TREE.flatMap((m) => m.nodes); const c = counts(all); const cur = D.STAGES[S.reached];
    const done = K.proven(S); const info = D.NODE_INFO.bsearch;
    const [t, sub, btn] = done ? ['已掌握', '五项能力全部通过独立检测，「二分答案」「离散化」已解锁。', `<button class="btn lg" data-act="start" data-to="report">查看学习报告${A.icon('arrow', 17)}</button>`]
      : S.started ? ['继续学习', `上次进行到「${cur.name}」，进度已自动保存。`, `<button class="btn lg" data-act="resume">继续学习${A.icon('arrow', 17)}</button>`]
        : ['推荐学习', `前置知识已具备 · ${info.level} · 约 ${info.mins} 分钟`, `<button class="btn lg" data-act="node" data-id="bsearch">开始学习${A.icon('arrow', 17)}</button>`];
    const html = `<section class="today"><div class="td-main"><span class="eyebrow">${t}</span><h1>二分查找</h1><p>${sub}</p><div class="actions">${btn}</div></div>
        <div class="td-side"><div class="td-n"><b>${c.sealed}</b><span>/ ${TOTAL}</span></div><p>个知识点已掌握</p>${prog(c, TOTAL)}<p class="faint small">${c.pending} 个待检测</p>${done ? '<span class="stamp sm">已<br>掌握</span>' : ''}</div></section>
      <div class="map-h"><h2>知识地图</h2><div class="legend"><span><i class="dot sealed"></i>已掌握</span><span><i class="dot pending"></i>待检测</span><span><i class="dot live"></i>推荐 / 学习中</span><span><i class="dot"></i>未开始</span><span><i class="dot lock"></i>未解锁</span></div></div>
      <div class="chapters">${D.TREE.map(chapter).join('')}</div>
      <section class="card xzmodes"><div class="xm-h">${A.xz()}<div><h3>AI 助教「小证」</h3><p>不是一个随时给答案的聊天框。它只在四种时候出现，每一种的样子都不同。</p></div></div>
        <ol>${Object.keys(A.MODES).map((k) => `<li><span class="aim aim-${k}"><i>${A.MODES[k][0]}</i></span><p>${A.MODES[k][2]}</p></li>`).join('')}</ol></section>`;
    return { html }; };

  A.acts.node = (d) => { A.U.nodeId = d.id; A.U.drawer = 'node'; };
  A.acts.resume = () => A.go(D.STAGES[A.S.reached].id);
  A.acts.start = (d) => A.go(d.to);
  A.acts.restart = () => { A.S = K.newSession(A.S.persona); A.U = A.freshU(); A._top = true; A.toast('学习记录已清空'); };

  /* 知识点详情抽屉 */
  A.drawers.node = () => { const n = D.TREE.flatMap((m) => m.nodes).find((x) => x.id === A.U.nodeId); const ch = D.TREE.find((m) => m.nodes.includes(n)); const s = A.nodeStatus(n); const S = A.S;
    const tagc = { sealed: 'green', pending: 'gold', live: 'blue', lock: '', open: '' }[s];
    const headRow = `<div class="meta" style="margin-top:0"><span class="tag ${tagc}">${s === 'live' && !S.started ? '推荐学习' : WORD[s]}</span><span class="tag">${ch.name}</span></div>`;
    if (n.id !== 'bsearch') return { title: n.name, body: `${headRow}
      ${n.when ? `<div class="kv" style="margin-top:14px"><span>${s === 'sealed' ? '掌握时间' : '学习记录'}</span><b>${n.when}</b></div>` : ''}
      ${n.pre ? `<div class="kv"${n.when ? '' : ' style="margin-top:14px"'}><span>前置知识点</span><b>${n.pre.map((p) => NAME[p]).join('、')}</b></div>` : ''}
      ${s === 'lock' ? `<p class="warn">掌握前置知识点后解锁。</p>` : ''}
      <p class="info">演示版本仅开放「二分查找」，其余知识点的状态为示例数据。</p>` };
    const i = D.NODE_INFO.bsearch;
    return { title: '二分查找', body: `${headRow}<p style="margin-top:14px">${i.intro}</p>
      <div class="kv" style="margin-top:12px"><span>难度</span><b>${i.level}</b></div><div class="kv"><span>预计时长</span><b>约 ${i.mins} 分钟</b></div><div class="kv"><span>前置知识</span><b>${i.pre.join('、')}</b></div><div class="kv"><span>解锁</span><b>二分答案、离散化</b></div>
      <div class="outcomes"><h3>学完本节，你将能够</h3><ul>${i.outcomes.map((o) => `<li>${A.icon('ok', 15, 2.6)}<span>${o}</span></li>`).join('')}</ul></div>
      <h3 style="margin-top:18px">包含内容</h3><ul class="plainlist">${i.contents.map((c) => `<li>${c}</li>`).join('')}</ul>
      <div class="actions">${S.started ? `<button class="btn" data-act="resume">继续学习${A.icon('arrow', 16)}</button><button class="btn ghost" data-act="restart">重新开始</button>`
        : `<button class="btn" data-act="start" data-to="material">开始学习${A.icon('arrow', 16)}</button><button class="btn ghost" data-act="start" data-to="rapid">已学过，直接练习</button>`}</div>` }; };
})();
