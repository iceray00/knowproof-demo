/* 知证 KnowProof · 07 独立检测：4 道题，无提示，一次提交 */
(function () {
  const A = window.A, D = A.D, K = A.K, esc = A.esc;
  const V = D.VERIFY, CT = D.CODE[V.code], PT = D.PROG[V.prog];
  const STATUS = { pass: ['独立检测通过', '4 道题全部正确。本次检测到的能力记为「已验证」。'], partial: ['独立检测部分通过', '部分题目未通过。已通过的能力记为「已验证」，其余保持原评估。'],
    fail: ['独立检测未通过', '大部分题目未通过。建议完成针对辅导后重新检测。'], skipped: ['已跳过独立检测', '本知识点记为「待检测」。已有的评估保留，但不会记为「已掌握」。'] };

  const missing = () => { const m = []; if (!K.complete(CT, A.cst('vcode', CT).ch)) m.push('第 1 题'); V.mcq.forEach((q, i) => { if (!A.U.pick[q.id]) m.push(`第 ${i + 2} 题`); }); if (A.sst('vprog', PT).code === PT.initial) m.push('第 4 题'); return m; };
  A.acts.vsyntax = () => { const e = window.KP_C.check(A.sst('vprog', PT).code, ['q', 'n', 'x']); A.U.syntax = e || { ok: true }; };
  A.acts.vsub = (d) => { const S = A.S; const m = missing(); if (m.length && d.v !== 'force') { A.U.warned = m; return; }
    K.verifySubmit(S, { code: A.cst('vcode', CT).ch, v2: A.U.pick.v2, v3: A.U.pick.v3, prog: A.sst('vprog', PT).code });
    A.U.warned = null; A.U.redo = false; A.U.stamp = S.verify.status === 'pass'; A._top = true; };
  A.acts.vback = () => { A.U.warned = null; };
  A.acts.vskip = () => { K.verifySubmit(A.S, { skip: true }); A.U.redo = false; A.U.warned = null; A._top = true; };
  A.acts.vredo = () => { delete A.U.code.vcode; delete A.U.src.vprog; delete A.U.pick.v2; delete A.U.pick.v3; A.U.redo = true; A.U.syntax = null; A.U.stamp = false; A._top = true; };

  /* ---------- 检测 ---------- */
  const paper = (S) => { const sx = A.U.syntax;
    return `${A.head('verify', '独立检测', '检验你能否在没有任何提示的情况下独立完成。')}
      <div class="rules"><span>${A.icon('book', 15)}共 4 题</span><span>${A.icon('clock', 15)}约 10 分钟</span><span>${A.icon('lock', 15)}无提示，不可运行测试</span><span>${A.icon('flag', 15)}提交后不可修改</span>${S.verify.tries ? `<span class="tag">第 ${S.verify.tries + 1} 次检测</span>` : ''}</div>
      <section class="card q">${A.qhead(1, 4, '代码填空', CT.dims)}<p class="stem">${CT.statement}</p>${A.codeBlock('vcode', CT)}</section>
      ${V.mcq.map((q, i) => `<section class="card q">${A.qhead(i + 2, 4, '单项选择', [q.dim])}<p class="stem">${q.stem}</p>${A.mcq(q.id, q.options)}</section>`).join('')}
      <section class="card q">${A.qhead(4, 4, '编程', PT.dims)}<p class="stem">${PT.statement}</p>${A.editor('vprog', PT)}
        <div class="runbar"><button class="btn ghost sm" data-act="vsyntax">检查语法</button>${sx ? (sx.ok ? `<span class="vd AC">${A.icon('ok', 13, 3)}语法正确</span>` : `<span class="vd">${A.icon('no', 13, 3)}第 ${sx.line} 行：${esc(sx.msg)}</span>`) : '<span class="cnt">只检查能否编译，不运行测试点。</span>'}</div></section>
      ${A.U.warned ? `<div class="wrongbar confirm-bar">${A.mark(0.5)}<div><b>${A.U.warned.join('、')}尚未作答。</b><span>未作答的题目记为未通过。提交后不可修改。</span></div><span class="sp"></span><button class="btn ghost sm" data-act="vback">继续作答</button><button class="btn sm" data-act="vsub" data-v="force">确认提交</button></div>` : ''}
      <div class="actions submitbar"><button class="btn plain" data-act="vskip">暂不检测</button><span class="sp"></span><span class="faint small">提交后不可修改</span><button class="btn lg" data-act="vsub">提交检测${A.icon('arrow', 17)}</button></div>`; };

  /* ---------- 结果 ---------- */
  const change = (b, a, tested) => { if (!tested) return '<span class="tag">本次未检测</span>';
    if (a.phase === 'seal' && b.phase !== 'seal') return '<span class="tag green">已验证</span>';
    if ((a.level || 0) > (b.level || 0)) return '<span class="tag blue">提升</span>'; if ((a.level || 0) < (b.level || 0)) return '<span class="tag red">下降</span>'; return '<span class="tag">无变化</span>'; };
  const cell = (ds) => `<div class="dm">${A.meter(ds)}<span class="lvtxt">${A.lv(ds)}</span>${A.phaseTag(ds)}</div>`;
  const result = (S) => { const vf = S.verify, st = vf.status, p = vf.parts; const before = S.snaps.support || S.snaps.deep, after = S.snaps.verify; const [title, desc] = STATUS[st];
    const evs = S.evidence.filter((e) => e.stage === 'verify' && e.try === vf.tries); const tested = new Set(evs.flatMap((e) => e.dims));
    const rows = p ? [[CT.name, '代码填空', p.c, evs[0]], ...V.mcq.map((q, i) => [`${K.DIM_NAME[q.dim]}判断`, '单项选择', p.mcq[q.id], evs[i + 1]]), [PT.name, '编程', p.p, evs[3]]] : [];
    return `${A.head('verify', '独立检测')}
      <section class="card vres ${st}"><div><span class="eyebrow">检测结果</span><h2>${title}</h2><p>${desc}</p>
        <div class="actions"><button class="btn lg" data-act="start" data-to="path">查看学习路径${A.icon('arrow', 17)}</button>${st !== 'pass' ? '<button class="btn ghost" data-act="vredo">重新检测</button>' : ''}</div></div>
        ${st === 'pass' ? `<span class="stamp${A.U.stamp ? ' drop' : ''}">检测<br>通过</span>` : ''}</section>
      ${p ? `<section class="card"><h2 class="sec-h"><span class="no">1</span>逐题结果</h2><table class="tbl"><thead><tr><th>题号</th><th>题目</th><th>题型</th><th>结果</th><th>说明</th><th></th></tr></thead><tbody>${rows.map((r, i) => `<tr><td class="mono">${i + 1}</td><td>${r[0]}</td><td>${r[1]}</td><td>${A.mark(r[2])} ${A.okWord(r[2])}</td><td class="muted small">${esc(r[3].note)}</td><td>${A.evchips([r[3].id])}</td></tr>`).join('')}</tbody></table>
        ${p.judge && !p.judge.allAC ? `<details class="fold"><summary>第 1 题判题详情</summary><div class="fold-b">${A.judgeTable(p.judge, { trace: true })}</div></details>` : ''}
        ${p.pjudge && !p.pjudge.allAC ? `<details class="fold"><summary>第 4 题判题详情</summary><div class="fold-b">${A.judgeTable(p.pjudge, { trace: true })}</div></details>` : ''}</section>` : ''}
      <section class="card"><h2 class="sec-h"><span class="no">${p ? 2 : 1}</span>能力评估更新</h2>
        <table class="tbl cmp"><thead><tr><th>能力维度</th><th>检测前</th><th>检测后</th><th>变化</th></tr></thead><tbody>${D.DIMS.map((d) => `<tr><td><b>${d.name}</b></td><td>${cell(before.dims[d.id])}</td><td>${cell(after.dims[d.id])}</td><td>${change(before.dims[d.id], after.dims[d.id], tested.has(d.id))}</td></tr>`).join('')}</tbody></table>
        <p class="faint small" style="margin-top:12px">「已验证」表示该项能力在无提示的条件下独立完成。迁移能力不在本次检测范围内，由四星任务检测。</p>${A.legend3()}</section>`; };

  A.views.verify = () => { const S = A.S;
    if (!S.deep.done) return { html: `${A.head('verify', '独立检测')}<section class="card"><p class="empty">完成进阶练习后开放。</p></section>` };
    return { html: S.verify.status && !A.U.redo ? result(S) : paper(S) }; };
})();
