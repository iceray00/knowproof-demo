/* 知证 KnowProof · 05 进阶练习：3 道题（针对性题目 + 代码改错 + 变式应用） */
(function () {
  const A = window.A, D = A.D, K = A.K, esc = A.esc;
  const cur = () => { const dp = A.S.deep; return D.DEEP[dp.plan.tasks[dp.idx]]; };
  const key = (T) => 'deep-' + T.id;
  const EXPLAIN = {
    complexity: '每循环一次，区间长度减半。长度为 n 的区间最多减半 log₂n 次；2<sup>20</sup> ≈ 10<sup>6</sup>，所以大约 20 次。',
    counter: '反例需要让区间在某一轮只剩两个数，并且条件成立：此时 mid = (l + r) / 2 向下取整等于 l，执行 l = mid 后区间没有变化。最小的反例是 q = [1, 2]，x = 1。',
    fix: '代码里有两处错误：① 更新写的是 l = mid，mid 必须向上取整，写成 l + r + 1 &gt;&gt; 1；② 循环结束后需要再判断 q[l] == x，否则 x 不存在时会返回错误的下标。',
    variant: '数组降序时，「q[mid] ≤ x」的元素集中在右侧。要找第一个满足条件的位置：条件成立时答案在 mid 或其左侧，写 r = mid；否则写 l = mid + 1；mid 向下取整。',
  };
  const RAPID_EXPLAIN = { q1: '二分的前提是存在一条分界线：一侧全部满足某个性质，另一侧全部不满足。与数据量、是否有重复、长度奇偶无关。',
    q2: '这段代码找的是第一个 ≥ x 的位置。q = [1, 2, 2, 3, 3, 4] 中第一个 ≥ 3 的元素在下标 3。',
    q3: '区间只剩两个数时，(l + r) / 2 向下取整等于 l。执行 l = mid 后区间不变，循环无法结束。加 1 使 mid 向上取整。',
    q4: '循环一定会正常结束，l 停在第一个 ≥ x 的位置。x 不存在时，这个位置上的数大于 x，所以要再判断一次 q[l] == x。' };

  /* ---------- 构造反例 ---------- */
  const parse = () => { const c = A.U.counter; const qs = (A.U.ins.cq || '').trim(), xs = (A.U.ins.cx || '').trim();
    if (!qs || !xs) return '请填写数组 q 和 x';
    const q = qs.split(/[,，\s]+/).filter(Boolean).map(Number), x = Number(xs);
    if (q.some((v) => !Number.isInteger(v)) || !Number.isInteger(x)) return '只能填写整数，数组元素之间用逗号分隔';
    if (q.length > 8) return '数组最多 8 个元素';
    if (q.some((v, i) => i && v < q[i - 1])) return '数组必须按升序排列';
    if (q[0] > x) return '题目保证 q[0] ≤ x，请调整输入';
    c.err = null; return { q, x }; };
  const tryRun = (T, t) => { const task = D.CODE[T.codeTask]; const r = K.runBinary(task.setup(task.initial, t));
    return Object.assign(r, { show: task.fmt(t), out: r.verdict === 'OK' ? r.l : null, expect: task.expect(t) }); };
  A.acts.ctry = () => { const c = A.U.counter, T = cur(); const t = parse(); if (typeof t === 'string') { c.err = t; return; }
    if (c.tries.length >= 3) return; c.tries.push(t); A.U.ins.cq = ''; A.U.ins.cx = ''; };
  const counter = (T) => { const c = A.U.counter, task = D.CODE[T.codeTask]; const rs = c.tries.map((t) => tryRun(T, t)); const found = rs.some((r) => r.verdict === 'TLE'); const over = found || c.tries.length >= 3;
    return `<p class="stem">${T.prompt}</p>${A.codeBlock(key(T), task, { disabled: true, value: task.initial })}
      <p class="muted small" style="margin-top:8px">样例：<span class="mono">${task.fmt(T.sample)}</span>，输出 0，结果正确。</p>
      ${rs.length ? `<ul class="tries">${rs.map((r, i) => `<li class="${r.verdict === 'TLE' ? 'hit' : ''}"><div class="try-h"><b>第 ${i + 1} 次</b><span class="mono">${esc(r.show)}</span><span class="sp"></span>${r.verdict === 'TLE' ? '<span class="tag green">程序陷入死循环</span>' : `<span class="tag">正常结束，输出 ${r.out}</span>`}</div>${r.verdict === 'TLE' ? A.traceBox(r) : ''}</li>`).join('')}</ul>` : ''}
      ${over ? `${found ? '' : '<p class="warn">3 次机会已用完，没有构造出反例。请继续回答下面的问题。</p>'}<h3 style="margin-top:20px">${T.whyStem}</h3>${A.mcq(key(T), T.whyOptions)}`
        : `<div class="cin"><label>数组 q<input class="in mono" data-in="cq" data-enter="ctry" placeholder="升序，逗号分隔，例如 1, 5, 9" value="${esc(A.U.ins.cq || '')}"></label><label>x<input class="in mono" data-in="cx" data-enter="ctry" placeholder="例如 1" value="${esc(A.U.ins.cx || '')}"></label>
          <button class="btn dark" data-act="ctry">${A.icon('play', 15)}运行</button></div>${c.err ? `<p class="warn">${c.err}</p>` : ''}<p class="faint small" style="margin-top:8px">共 3 次机会，已使用 ${c.tries.length} 次。数组最多 8 个元素。</p>`}`; };

  /* ---------- 运行与提交 ---------- */
  const judgeNow = (T) => { if (T.kind === 'code') { const st = A.cst(key(T), D.CODE[T.codeTask]); const j = K.judge(D.CODE[T.codeTask], st.ch); if (j) { st.runs.push(Object.assign({}, st.ch)); st.last = j; } return j; }
    const st = A.sst(key(T), D.PROG[T.prog]); const j = K.judgeSrc(D.PROG[T.prog], st.code); if (j) { st.runs.push(st.code); st.last = j; } return j; };
  A.acts.drun = () => { const T = cur(); if (!judgeNow(T)) A.toast(T.kind === 'code' ? '请先填完所有空' : '请先编写代码'); };
  A.acts.dsub = () => { const S = A.S, T = cur(), k = key(T); let p;
    if (T.kind === 'text') { const text = (A.U.text[k] || '').trim(); if (text.length < 10) return A.toast('请至少写 10 个字，或点击「跳过本题」'); p = { text }; }
    else if (T.kind === 'mcq') { if (!A.U.pick[k]) return A.toast('请先选择一个选项'); p = { a: A.U.pick[k] }; }
    else if (T.kind === 'counter') { const c = A.U.counter; const done = c.tries.length >= 3 || c.tries.some((t) => tryRun(T, t).verdict === 'TLE');
      if (!done) return A.toast('请先运行你构造的输入'); if (!A.U.pick[k]) return A.toast('请选择死循环的原因'); p = { tries: c.tries.slice(), why: A.U.pick[k] }; }
    else { const st = T.kind === 'code' ? A.U.code[k] : A.U.src[k]; const cur0 = T.kind === 'code' ? JSON.stringify(st.ch) : st.code; const lastRun = st.runs[st.runs.length - 1];
      if (!st.runs.length || (T.kind === 'code' ? JSON.stringify(lastRun) : lastRun) !== cur0) { if (!judgeNow(T)) return A.toast(T.kind === 'code' ? '请先填完所有空' : '请先编写代码'); }
      p = { runs: st.runs.slice() }; }
    K.deepSubmit(S, T.id, p); A.U.deepRes = T.id; A._top = true; };
  A.acts.dskip = () => { const T = cur(); K.deepSubmit(A.S, T.id, { skip: true }); A.U.deepRes = T.id; A._top = true; };
  A.acts.dnext = () => { A.U.deepRes = null; A._top = true; };

  /* ---------- 题目 ---------- */
  const body = (T) => { const k = key(T);
    if (T.kind === 'text') return `<p class="stem">${T.prompt}</p><textarea class="txt" data-text="${k}" placeholder="${T.placeholder}" aria-label="作答区">${esc(A.U.text[k] || '')}</textarea>`;
    if (T.kind === 'mcq') return `<p class="stem">${T.stem}</p>${A.mcq(k, T.options)}`;
    if (T.kind === 'counter') return counter(T);
    const code = T.kind === 'code'; const task = code ? D.CODE[T.codeTask] : D.PROG[T.prog]; const st = code ? A.cst(k, task) : A.sst(k, task);
    return `<p class="stem">${task.statement}</p>${code ? A.codeBlock(k, task) : A.editor(k, task)}
      <div class="runbar"><button class="btn dark" data-act="drun">${A.icon('play', 15)}运行测试</button><span class="cnt">已运行 ${st.runs.length} 次 · 运行次数会计入评估</span></div>${A.judgeTable(st.last, { trace: true })}`; };

  /* ---------- 单题结果 ---------- */
  const resultOf = (T) => { const S = A.S, r = S.deep.results[T.id], ev = S.evidence.find((e) => e.id === r.ev), an = r.analysis; let extra = '';
    if (r.ok === null) extra = '<p class="muted">本题已跳过，对应的能力不作评估。</p>';
    else if (T.kind === 'text') extra = `<ul class="checks">${T.rubric.map((x) => `<li>${A.mark(an.hits.includes(x.id) ? 1 : 0)}<span>${x.name}</span></li>`).join('')}</ul><p class="faint small" style="margin-top:10px">文字作答按以上要点评阅。演示版本使用关键词规则，正式版本由大模型评阅并经人工抽检。</p>`;
    else if (T.kind === 'mcq') extra = `<p>你的选择：${A.U.pick[key(T)] || '—'}　正确答案：${T.answer}</p>`;
    else if (T.kind === 'counter') extra = `<ul class="checks"><li>${A.mark(an.found >= 0 ? 1 : 0)}<span>${an.found >= 0 ? `第 ${an.found + 1} 次尝试构造出了反例` : '没有构造出反例'}</span></li><li>${A.mark(an.why ? 1 : 0)}<span>${an.why ? '原因判断正确' : `原因判断错误，正确答案是 ${T.whyAnswer}`}</span></li></ul>`;
    else { const st = T.kind === 'code' ? A.U.code[key(T)] : A.U.src[key(T)]; extra = st && st.last ? A.judgeTable(st.last, { brief: an.passAt >= 0, trace: true }) : ''; }
    return `<section class="card"><div class="res-h">${A.mark(r.ok)}<h2>${r.ok === null ? '已跳过' : r.ok === 1 ? '本题完成' : r.ok === 0.5 ? '本题部分完成' : '本题未完成'}</h2><span class="sp"></span>${A.evchips([r.ev])}</div>
      <p class="muted">${esc(ev.note)}</p>${extra}${EXPLAIN[T.id] && r.ok !== 1 ? `<div class="explain"><b>解析</b><p>${EXPLAIN[T.id]}</p></div>` : ''}
      <div class="actions"><button class="btn" data-act="dnext">${S.deep.done ? '查看评估结果' : '下一题'}${A.icon('arrow', 16)}</button></div></section>`; };

  /* ---------- 完成页 ---------- */
  const done = (S) => { const dg = S.snaps.deep, base = S.snaps.rapid, p = S.deep.plan; const changed = dg.label.key !== base.label.key;
    return `${A.head('deep', '进阶练习')}
      <section class="card result confirm"><div class="cf"><span class="cf-k">初步评估</span>${A.labelTag(base)}</div><span class="cf-arrow">${A.icon('arrow', 22)}</span><div class="cf"><span class="cf-k">确认后</span>${A.labelTag(dg)}</div>
        <p class="r-detail">${changed ? '进阶练习的结果与初步评估不一致，评估已更新。' : '进阶练习的结果与初步评估一致，评估已确认。'}${dg.label.detail}</p></section>
      <section class="card"><h2 class="sec-h"><span class="no">1</span>逐题结果</h2><table class="tbl"><thead><tr><th>题号</th><th>题目</th><th>题型</th><th>结果</th><th>说明</th><th></th></tr></thead><tbody>${p.tasks.map((t, i) => { const T = D.DEEP[t], r = S.deep.results[t], ev = S.evidence.find((e) => e.id === r.ev);
        return `<tr><td class="mono">${i + 1}</td><td>${T.name}</td><td>${T.type}</td><td>${A.mark(r.ok)} ${A.okWord(r.ok)}</td><td class="muted small">${esc(ev.note)}</td><td>${A.evchips([r.ev])}</td></tr>`; }).join('')}</tbody></table></section>
      <section class="card"><h2 class="sec-h"><span class="no">2</span>能力评估<small>虚线为基础练习后的评估</small></h2><div class="assess">${A.radar(dg, base)}${A.dimList(dg, { base })}</div>${A.legend3()}</section>
      <section class="card"><h2 class="sec-h"><span class="no">3</span>下一步：针对辅导</h2><p>${dg.label.focus.length ? `根据评估结果，接下来针对「${dg.label.focus.map((f) => K.DIM_NAME[f]).join('、')}」安排辅导。` : '目前没有发现需要辅导的薄弱点，可以直接进入独立检测。'}</p>
        <div class="actions"><button class="btn lg" data-act="start" data-to="support">继续${A.icon('arrow', 17)}</button></div></section>
      <details class="fold"><summary>查看题目解析</summary><div class="fold-b"><h4>基础练习</h4><ol class="explains">${D.RAPID.map((q) => `<li><b>答案 ${q.answer}。</b>${RAPID_EXPLAIN[q.id]}</li>`).join('')}</ol>
        <h4 style="margin-top:14px">进阶练习</h4><ol class="explains">${p.tasks.map((t) => `<li><b>${D.DEEP[t].name}。</b>${EXPLAIN[t] || '文字作答按要点评阅，要点见单题结果。'}</li>`).join('')}</ol></div></details>`; };

  A.views.deep = () => { const S = A.S, dp = S.deep;
    if (!dp.plan) return { html: `${A.head('deep', '进阶练习')}<section class="card"><p class="empty">完成基础练习后开放。</p></section>` };
    if (A.U.deepRes) { const T = D.DEEP[A.U.deepRes], i = dp.plan.tasks.indexOf(T.id); return { html: `${A.head('deep', '进阶练习')}<div class="qtitle">${A.qhead(i + 1, 3, T.type, T.dims)}</div>${resultOf(T)}` }; }
    if (dp.done) return { html: done(S) };
    const T = cur();
    return { html: `${A.head('deep', '进阶练习', '共 3 题，约 10 分钟。独立完成，过程中不提供提示。')}
      <section class="card q">${A.qhead(dp.idx + 1, 3, T.type, T.dims)}<h2 class="qname">${T.name}</h2>${body(T)}
      <div class="actions"><span class="sp"></span><button class="btn plain" data-act="dskip">跳过本题</button><button class="btn" data-act="dsub">提交${A.icon('arrow', 16)}</button></div></section>` }; };
})();
