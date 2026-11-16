/* 知证 KnowProof · 03 基础练习　04 练习结果 */
(function () {
  const A = window.A, D = A.D, K = A.K, esc = A.esc;

  /* ---------- 03 基础练习 ---------- */
  const rapidAns = () => { const R = A.S.rapid, q = D.RAPID[R.idx]; return R.ans[q.id] || (R.ans[q.id] = { first: null, final: null, conf: null }); };
  A.onPick.rapid = (v) => { const a = rapidAns(); if (!a.first) a.first = v; a.final = v; };
  A.acts.conf = (d) => { rapidAns().conf = d.v; };
  A.acts.rprev = () => { A.S.rapid.idx = Math.max(0, A.S.rapid.idx - 1); A.U.amb = {}; };
  const advance = () => { const R = A.S.rapid; A.U.amb = {}; if (R.idx < D.RAPID.length - 1) { R.idx++; A._top = true; return; } K.rapidFinish(A.S); A.go('state'); };
  A.acts.rnext = () => { const a = rapidAns(), q = D.RAPID[A.S.rapid.idx]; if (!a.final) return A.toast('请先选择一个选项，或点击「跳过本题」'); if (q.askConf && !a.conf) return A.toast('请选择把握程度'); advance(); };
  A.acts.rskip = () => { const a = rapidAns(); a.final = null; a.conf = null; advance(); };

  A.views.rapid = () => { const S = A.S, R = S.rapid, n = D.RAPID.length;
    if (R.done) return { html: `${A.head('rapid', '基础练习')}<section class="card"><h2>基础练习已完成</h2><p class="muted">作答已提交，不能修改。</p><div class="actions"><button class="btn" data-act="start" data-to="state">查看练习结果${A.icon('arrow', 16)}</button></div></section>` };
    const i = Math.min(R.idx, n - 1), q = D.RAPID[i], a = R.ans[q.id] || {};
    return { html: `${A.head('rapid', '基础练习', `共 ${n} 题，约 5 分钟。按当前的理解作答，不会的题可以跳过。`)}
      <section class="card q">${A.qhead(i + 1, n, q.type)}<p class="stem">${esc(q.stem)}</p>${q.code ? A.code(q.code) : ''}
      ${A.mcq('rapid', q.options, { value: a.final || null })}
      ${q.askConf ? `<div class="conf"><span>把握程度</span><span class="seg" role="radiogroup" aria-label="把握程度">${Object.keys(A.CONF).map((c) => `<button class="${a.conf === c ? 'on' : ''}" data-act="conf" data-v="${c}">${A.CONF[c]}</button>`).join('')}</span></div>${A.amb('rapid', ['conf'])}` : ''}
      <div class="actions">${i > 0 ? '<button class="btn ghost" data-act="rprev">上一题</button>' : ''}<span class="sp"></span><button class="btn plain" data-act="rskip">跳过本题</button><button class="btn" data-act="rnext">${i === n - 1 ? '提交' : '下一题'}${A.icon('arrow', 16)}</button></div></section>` }; };

  /* ---------- 04 练习结果 ---------- */
  A.ring = (x, n, cap) => { const r = 44, c = 2 * Math.PI * r, p = n ? x / n : 0;
    return `<div class="ring" role="img" aria-label="${cap} ${x} / ${n}"><svg viewBox="0 0 108 108"><circle cx="54" cy="54" r="${r}" class="rg"/><circle cx="54" cy="54" r="${r}" class="rf" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 54 54)"/></svg><div><b>${x}<small> / ${n}</small></b><span>${cap}</span></div></div>`; };
  const LABEL_TAG = { gap: 'red', misc: 'red', fragile: 'gold', unsure: 'gold', tlow: 'gold', tna: 'blue', pending: 'blue', stable: 'green', none: '' };
  A.labelTag = (dg, pre) => `<span class="tag ${LABEL_TAG[dg.label.key]} big">${pre || ''}${dg.label.name}</span>`;

  const review = (S) => { const evs = S.evidence.filter((e) => e.stage === 'rapid');
    return `<table class="tbl"><thead><tr><th>题号</th><th>题型</th><th>你的作答</th><th>把握程度</th><th>结果</th><th></th></tr></thead><tbody>${evs.map((e, i) => `<tr><td class="mono">${i + 1}</td><td>${e.kind}</td><td>${e.final ? `选择 ${e.final}` : '<span class="faint">跳过</span>'}</td><td>${e.conf ? A.CONF[e.conf] : '<span class="faint">—</span>'}</td><td>${A.mark(e.ok)} ${A.okWord(e.ok)}</td><td>${A.evchips([e.id])}</td></tr>`).join('')}</tbody></table>`; };
  /* 反思式介入：很确定却答错时，先请学生自己回顾原因；答对但没把握时，提醒留意自我评价 */
  const reflect = (S, low) => { const rf = S.reflect;
    if (!rf) return low.length ? A.refl(`第 ${low.join('、')} 题：答对了，但你选的是「不太确定」`, '<p>结果是对的，把握程度却偏低。做进阶练习时可以留意：自己的判断是不是比想象中更可靠。</p>') : '';
    const r = D.REFLECT[rf.q]; const no = D.RAPID.findIndex((q) => q.id === rf.q) + 1;
    return A.refl(`回顾第 ${no} 题：你选了「非常确定」，但这道题答错了`, `<p>${r.stem}</p>${rf.answer === null
      ? `<div class="opts">${r.options.map((o, i) => `<button class="opt" data-act="reflect" data-i="${i}"><span class="k">${i + 1}</span><span>${o}</span></button>`).join('')}</div><button class="btn plain sm" style="margin-top:8px" data-act="reflect" data-i="-1">暂不回答</button>`
      : `<p class="muted small" style="margin-top:6px">${rf.answer === -1 ? '已选择暂不回答。' : `已记录你的回答：${r.options[rf.answer]}。后续练习会重点考察这一点。`}</p>`}`); };
  A.acts.reflect = (d) => K.reflectAnswer(A.S, +d.i);

  const basis = (S, dg) => { const p = S.deep.plan; const evs = S.evidence.filter((e) => e.stage === 'rapid');
    const json = { assessment: dg.label.name, focus: dg.label.focus.map((f) => K.DIM_NAME[f]), evidence: [...new Set(dg.label.focus.flatMap((f) => dg.dims[f].ids))], recommended_tasks: p.llm };
    const un = D.DIMS.filter((d) => !dg.dims[d.id].level).map((d) => d.name);
    const chk = (ok, t) => `<li>${A.mark(ok ? 1 : 0)}<span>${t}</span></li>`;
    return `<details class="fold"><summary>查看评估依据</summary><div class="fold-b"><ol class="basis">
      <li><h4>作答记录</h4><p class="muted small">评估只使用以下 ${evs.length} 条记录：${A.evchips(evs.map((e) => e.id))}</p></li>
      <li><h4>AI 分析</h4><p class="muted small">模型根据作答记录给出评估说明与练习建议（演示版本为模拟输出）：</p><pre class="json">${esc(JSON.stringify(json, null, 2))}</pre></li>
      <li><h4>规则校验</h4><p class="muted small">模型的输出通过以下校验后才会被采用：</p><ul class="checks">${chk(true, '每一条结论都能对应到具体的作答记录')}${chk(true, '能力等级由固定规则计算，模型不能修改')}
        ${chk(true, un.length ? `${un.join('、')}没有作答记录，显示为「未评估」，不作推断` : '五项能力均有作答记录')}
        ${chk(!p.fallback, p.fallback ? `模型建议的练习 <code>${esc(p.llm[0])}</code> 不在内容库中，已拒绝，改为按规则选择「${D.DEEP[p.target].type}」` : '建议的练习全部来自内容库')}</ul></li></ol></div></details>`; };

  A.views.state = () => { const S = A.S; if (!S.rapid.done) return { html: `${A.head('state', '练习结果')}<section class="card"><p class="empty">完成基础练习后显示结果。</p></section>` };
    const dg = S.snaps.rapid, p = S.deep.plan; const evs = S.evidence.filter((e) => e.stage === 'rapid'); const right = evs.filter((e) => e.ok === 1).length;
    const low = evs.map((e, i) => (e.ok === 1 && e.conf === 'low' ? i + 1 : 0)).filter(Boolean);
    return { html: `${A.head('state', '练习结果')}
      <section class="card result">${A.ring(right, evs.length, '答对')}<div><div class="r-top">${A.labelTag(dg, '初步评估：')}</div><p class="r-detail">${dg.label.detail}</p>
        <p class="faint small">只依据 ${evs.length} 道基础练习题，接下来的进阶练习会确认或修正这个评估。</p></div></section>
      ${reflect(S, low)}
      <section class="card cta"><div><span class="eyebrow">下一步</span><h2>进阶练习</h2><p>${p.reason}</p>
        <p class="faint small">共 3 题，约 10 分钟：${p.tasks.map((t) => D.DEEP[t].name).join(' · ')}</p></div>
        <button class="btn lg" data-act="start" data-to="deep">开始进阶练习${A.icon('arrow', 17)}</button></section>
      <section class="card"><h2 class="sec-h">五项能力<small>初步评估</small></h2>${A.dimList(dg, { compact: true })}${A.legend3()}</section>
      <details class="fold"><summary>逐题回顾（答对 ${right} / ${evs.length}）</summary><div class="fold-b">${review(S)}<p class="faint small" style="margin-top:12px">题目解析将在进阶练习完成后提供。</p></div></details>
      ${basis(S, dg)}` }; };
})();
