/* 知证 KnowProof · 演示向导：在演示台选定模拟学生后，页面顶部出现「下一步」。
 * 每点一次，按这位学生的预设表现推进一步；评估、辅导和路径仍由引擎实时计算。
 * 下一步由当前状态推出，中途手动操作后再点「下一步」也能接上。 */
(function () {
  const A = window.A, D = A.D, K = A.K;
  const script = () => { const p = D.PERSONAS[A.S.persona]; return p && p.script; };
  const on = () => !!(A.S.guide && script());
  const copy = (o) => Object.assign({}, o);
  const top = () => { A._top = true; };

  /* ---------- 基础练习：填入作答后，停在最能说明问题的一道题 ---------- */
  const keyQ = (sc) => { let best = -1, at = 0; D.RAPID.forEach((q, i) => { const a = sc.rapid[q.id]; if (!a) return; const ok = a[0] === q.answer;
    const w = !ok && a[1] === 'high' ? 5 : !ok && a[1] ? 4 : !ok ? 3 : a[1] === 'low' ? 2 : q.askConf ? 1 : 0; if (w > best) { best = w; at = i; } }); return at; };
  const rapid = (sc) => { const S = A.S, R = S.rapid;
    if (R.done) return ['查看练习结果', () => A.go('state')];
    const filled = D.RAPID.every((q) => !sc.rapid[q.id] || (R.ans[q.id] && R.ans[q.id].final === sc.rapid[q.id][0]));
    if (!filled) return ['填入 4 道题的作答', () => { D.RAPID.forEach((q) => { const a = sc.rapid[q.id]; if (a) R.ans[q.id] = { first: a[0], final: a[0], conf: a[1] || null }; }); R.idx = keyQ(sc); top(); }];
    return ['提交，查看练习结果', () => { K.rapidFinish(S); A.go('state'); }]; };

  const state = (sc) => { const rf = A.S.reflect;
    if (rf && rf.answer === null && sc.reflect != null) return ['回答小证的回顾问题', () => { K.reflectAnswer(A.S, sc.reflect); A._focus = '.refl'; }];
    return ['开始进阶练习', () => A.go('deep')]; };

  /* ---------- 进阶练习：每道题先填入作答，再提交看判断 ---------- */
  const dkey = (T) => 'deep-' + T.id;
  const FOCUS = { text: '.txt', mcq: '.opts', counter: '.tries', code: 'pre.code', prog: '.editor' };
  const fillDeep = (T, p) => { const k = dkey(T);
    if (T.kind === 'text') A.U.text[k] = p.text;
    else if (T.kind === 'mcq') A.U.pick[k] = p.a;
    else if (T.kind === 'counter') { A.U.counter.tries = p.tries.map(copy); A.U.pick[k] = p.why; }
    else if (T.kind === 'code') { const task = D.CODE[T.codeTask], ch = Object.assign({}, task.initial || {}, p.runs[p.runs.length - 1]); A.U.code[k] = { ch, runs: p.runs.map(copy), last: K.judge(task, ch) }; }
    else { const code = p.runs[p.runs.length - 1]; A.U.src[k] = { code, runs: p.runs.slice(), last: K.judgeSrc(D.PROG[T.prog], code) }; }
    A.U.gfill = k; A._focus = FOCUS[T.kind]; };
  const deep = (sc) => { const S = A.S, dp = S.deep;
    if (dp.done) return A.U.deepRes ? ['查看进阶练习后的评估', () => { A.U.deepRes = null; top(); }] : ['进入针对辅导', () => A.go('support')];
    const T = D.DEEP[dp.plan.tasks[dp.idx]], p = sc.deep[T.id], no = dp.idx + 1;
    if (A.U.deepRes) return [p ? `第 ${no} 题：填入作答` : `第 ${no} 题`, () => { A.U.deepRes = null; top(); if (p) fillDeep(T, p); }];
    if (p && A.U.gfill !== dkey(T)) return [`第 ${no} 题：填入作答`, () => fillDeep(T, p)];
    return [p ? `提交第 ${no} 题，查看判断` : `第 ${no} 题没有把握，跳过`, () => { K.deepSubmit(S, T.id, p || { skip: true }); A.U.deepRes = T.id; A.U.amb = {}; top(); }]; };

  /* ---------- 针对辅导 ---------- */
  const skey = (c) => 'sup-' + c.strategy;
  const solve = (task) => { const ks = Object.keys(task.blanks); let hit = null;
    const walk = (i, c) => { if (hit) return; if (i === ks.length) { const j = K.judge(task, c); if (j && j.allAC) hit = copy(c); return; } task.blanks[ks[i]].forEach(([v]) => walk(i + 1, Object.assign({}, c, { [ks[i]]: v }))); };
    walk(0, copy(task.initial || {})); return hit; };
  const rightTry = (st) => (st.task.kind === 'code' ? { c: solve(D.CODE[st.task.codeTask]) } : { a: st.task.kind === 'mcq' ? st.task.answer : st.task.options[0][0] });
  /* 预设里只错一次时补一次不同的错误作答，让「连续 2 次未通过 → 主动介入」能够出现 */
  const altWrong = (st, w) => { const t = st.task;
    if (t.kind === 'mcq') { const o = t.options.map((x) => x[0]).find((v) => v !== t.answer && v !== w.a); return o ? { a: o } : null; }
    if (t.kind !== 'code') return null; const task = D.CODE[t.codeTask];
    for (const b of Object.keys(task.blanks).reverse()) for (const [v] of task.blanks[b]) { if (v === w.c[b]) continue; const c = Object.assign({}, w.c, { [b]: v }); const j = K.judge(task, c); if (j && !j.allAC) return { c }; }
    return null; };
  const submit = (p) => { const c = A.S.support.cur, st = D.STRATEGIES[c.strategy], k = skey(c);
    if (st.task.kind === 'code') Object.assign(A.cst(k, D.CODE[st.task.codeTask]).ch, p.c); else A.U.pick[k] = p.a;
    A.acts.ssub(); if (!c.finished) A._focus = '.pro, .wrongbar'; };
  const support = (sc) => { const S = A.S, sp = S.support, c = sp.cur; const passed = S.verify.status === 'pass';
    if (sp.done) return [passed ? '返回学习路径' : '进入独立检测', () => A.go(passed ? 'path' : 'verify')];
    const leave = [passed ? '返回学习路径' : '撤除提示，进入独立检测', () => A.acts.sdone()];
    if (!c) return sp.none ? [passed ? '返回学习路径' : '不需要辅导，进入独立检测', leave[1]] : leave;
    const st = D.STRATEGIES[c.strategy], k = skey(c);
    if (c.finished) return sc.support[sp.rounds.length] ? ['再做一轮辅导', () => A.acts.smore()] : leave;
    const plan = sc.support[sp.rounds.length];
    if (!c.decision) return plan && plan.decision !== 'accept' ? ['暂时不需要辅导', () => A.acts.sdecline()] : [`接受建议，开始「${st.name}」`, () => A.acts.saccept()];
    if (A.U.pro.sup === 'show') return ['接受小证的询问，看下一级提示', () => { A.acts.shint({ pro: '1' }); A._focus = '.hintlist li.new'; }];
    const tries = plan ? plan.tries : [rightTry(st)], wrongs = tries.slice(0, -1), n = c.tries, hintable = st.hints.length && !c.capped && c.level < 4;
    if (n < wrongs.length) return [`第 ${n + 1} 次作答`, () => submit(wrongs[n])];
    if (n === 1 && wrongs.length === 1 && hintable && !A.U.pro.sup) { const x = altWrong(st, wrongs[0]); if (x) return ['第 2 次作答', () => submit(x)]; }
    if (n && A.U.wrong[k] && hintable) return ['请小证给下一级提示', () => { A.acts.shint({}); A._focus = '.hintlist li.new'; }];
    return [n ? `看过提示后，第 ${n + 1} 次作答` : '完成辅导练习', () => submit(tries[tries.length - 1])]; };

  /* ---------- 独立检测、学习路径 ---------- */
  const verify = (sc) => { const S = A.S, V = D.VERIFY, v = sc.verify;
    if (S.verify.status && !A.U.redo) return ['查看学习路径', () => A.go('path')];
    if (!(A.U.code.vcode && A.U.pick.v2 === v.v2)) return ['填入 4 道题的作答', () => { A.U.code.vcode = { ch: Object.assign({}, D.CODE[V.code].initial || {}, v.code), runs: [], last: null };
      A.U.pick.v2 = v.v2; A.U.pick.v3 = v.v3; if (v.prog) A.sst('vprog', D.PROG[V.prog]).code = v.prog; top(); }];
    return ['提交检测', () => { K.verifySubmit(S, v); A.U.warned = null; A.U.redo = false; A.U.stamp = S.verify.status === 'pass'; top(); }]; };
  const STAR = { 4: '四星任务', 5: '五星挑战' };
  const path = (sc) => { const S = A.S, n = A.U.pathTask;
    if (n) return [`提交${STAR[n]}`, () => { const task = D.CODE['star' + n]; Object.assign(A.cst('star' + n, task).ch, sc['star' + n] || solve(task)); A.acts.psub(); }];
    for (const s of sc.path) { const m = +s.slice(4); if (!STAR[m] || S[s].status || !sc[s]) continue; if (m === 4 ? S.verify.status !== 'pass' : S.star4.status !== 'pass') continue;
      return [`打开${STAR[m]}，填入作答`, () => { A.acts.pact({ id: s }); Object.assign(A.cst(s, D.CODE[s]).ch, sc[s]); A._focus = 'pre.code'; }]; }
    return ['查看学习报告', () => { if (!S.path.choice) S.path.choice = '查看学习报告'; A.go('report'); }]; };

  const STEP = { home: () => ['进入「二分查找」', () => A.go('material')], material: () => ['学完讲解，开始基础练习', () => A.go('rapid')], rapid, state, deep, support, verify, path, report: () => null };
  const step = () => STEP[A.S.stage](script());
  A.guideStep = step;

  A.acts.gnext = () => { if (!on()) return false; const s = step(); if (!s) return false; A.U.toast = null; s[1](); };
  A.acts.gskip = () => { if (!on()) return false; const st = A.S.stage; let g = 0; while (A.S.stage === st && g++ < 40) { const s = step(); if (!s) break; s[1](); } A._focus = null; A.U.toast = null; top(); };
  A.acts.gquit = () => { A.S.guide = false; A.toast('已退出演示，可以继续手动操作'); };

  A.guide = () => { if (!on()) return ''; const p = D.PERSONAS[A.S.persona], s = step();
    return `<div class="gbar" role="region" aria-label="演示向导"><div class="gbar-in"><span class="gtag">演示</span><span class="gwho"><b>${p.name}</b>${p.tag}</span>
      ${s ? `<span class="gnext">下一步：<b>${s[0]}</b></span><span class="sp"></span><button class="btn plain sm" data-act="gskip">跳过本环节</button><button class="btn sm gbtn" data-act="gnext">下一步${A.icon('arrow', 15)}</button>`
        : '<span class="gnext"><b>演示完成</b>　向下滚动可查看五项能力、评估过程和小证参与记录</span><span class="sp"></span><button class="btn ghost sm" data-act="drawer" data-v="demo">换一位学生</button>'}
      <button class="gx" data-act="gquit" aria-label="退出演示" title="退出演示">×</button></div></div>`; };

  /* 翻页笔或键盘：→ / PageDown 等同于点「下一步」 */
  document.addEventListener('keydown', (e) => { if (!on() || A.U.drawer || e.ctrlKey || e.metaKey || e.altKey || (e.key !== 'ArrowRight' && e.key !== 'PageDown')) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || '')) return; e.preventDefault(); if (A.acts.gnext() !== false) { A.save(); A.render(); } });
})();
