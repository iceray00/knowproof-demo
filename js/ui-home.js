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
  const chapter = (m, i) => { const c = counts(m.nodes), n = m.nodes.length; const w = (x) => `width:${(x / n * 100).toFixed(1)}%`;
    return `<section class="card chap${i === 0 ? ' first' : ''}"><div class="chap-h"><span class="chap-no">${String(i + 1).padStart(2, '0')}</span><div><h3>${m.name}</h3><p>${m.desc}</p></div>
      <div class="chap-p"><b>${c.sealed} / ${n}</b><small>已掌握</small></div></div>
      <div class="prog" role="img" aria-label="已掌握 ${c.sealed} 个，待检测 ${c.pending} 个，共 ${n} 个"><i style="${w(c.sealed)}"></i><i class="p" style="${w(c.pending)}"></i><i class="l" style="${w(c.live)}"></i></div>
      <div class="nodes">${m.nodes.map(nodeBtn).join('')}</div></section>`; };

  A.views.home = () => { const S = A.S; const all = D.TREE.flatMap((m) => m.nodes); const c = counts(all); const cur = D.STAGES[S.reached];
    const done = K.proven(S); const info = D.NODE_INFO.bsearch;
    const cont = done ? `<div><div class="t">已掌握</div><div class="n">二分查找</div><div class="s">「二分答案」「离散化」已解锁</div></div><button class="btn ghost" data-act="start" data-to="report">查看报告</button>`
      : S.started ? `<div><div class="t">继续学习</div><div class="n">二分查找</div><div class="s">基础算法 · 进行到「${cur.name}」</div></div><button class="btn" data-act="resume">继续${A.icon('arrow', 16)}</button>`
        : `<div><div class="t">推荐学习</div><div class="n">二分查找</div><div class="s">基础算法 · ${info.level} · 约 ${info.mins} 分钟</div></div><button class="btn" data-act="node" data-id="bsearch">开始${A.icon('arrow', 16)}</button>`;
    const html = `<section class="hero"><div class="kicker">算法基础 · 学习进度</div><h1>已掌握 ${c.sealed} / ${TOTAL} 个知识点</h1>
        <p class="sub">${done ? '「二分查找」已通过独立检测。' : S.started ? `正在学习「二分查找」，当前环节：${cur.name}。` : '前置知识已具备，推荐从「二分查找」开始。'}</p>
        <div class="hero-row"><div class="stats"><div class="stat"><b>${c.sealed}<small> / ${TOTAL}</small></b><span>已掌握</span></div><div class="stat"><b>${c.pending}</b><span>待检测</span></div><div class="stat"><b>${c.live}</b><span>进行中</span></div></div>
        <div class="cont">${cont}</div></div></section>
      <div class="map-h"><h2>知识地图</h2><div class="legend"><span><i class="dot sealed"></i>已掌握</span><span><i class="dot pending"></i>待检测</span><span><i class="dot live"></i>推荐 / 学习中</span><span><i class="dot"></i>未开始</span><span><i class="dot lock"></i>未解锁</span></div></div>
      <div class="chapters">${D.TREE.map(chapter).join('')}</div>`;
    const side = `<details class="fold"><summary>第一次使用？了解学习流程</summary><div class="fold-b"><ol class="steps6">
        <li><span><b>学习</b>　阅读图文讲解，完成互动演示</span></li><li><span><b>基础练习</b>　4 道选择题，了解当前水平</span></li>
        <li><span><b>进阶练习</b>　解释、改错、变式，共 3 题</span></li><li><span><b>针对辅导</b>　针对薄弱项，提供分级提示</span></li>
        <li><span><b>独立检测</b>　无提示完成 4 题，通过后记为已掌握</span></li><li><span><b>学习报告</b>　查看五项能力的评估与依据</span></li></ol></div></details>
      <section class="card hcard"><h3>学习概况</h3><div class="kv"><span>课程</span><b>算法基础</b></div><div class="kv"><span>知识点</span><b>6 章 · ${TOTAL} 个</b></div><div class="kv"><span>最近掌握</span><b>归并排序 · 11 月 6 日</b></div><div class="kv"><span>待检测</span><b>${all.filter((n) => A.nodeStatus(n) === 'pending').map((n) => n.name).join('、') || '无'}</b></div></section>`;
    return { html, side }; };

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
