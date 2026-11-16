/* 知证 KnowProof · 诊断与编排引擎
 * 原则：程序负责确定性判题，规则负责掌握门槛与路径；LLM 只负责理解和表达（演示版用规则模拟）。 */
(function (root) {
  const D = typeof module !== 'undefined' && module.exports ? require('./data.js') : root.KP_DATA;
  const C = typeof module !== 'undefined' && module.exports ? require('./cmini.js') : root.KP_C;
  const ORDER = ['concept', 'reasoning', 'code', 'transfer', 'complexity'];
  const DIM_NAME = Object.fromEntries(D.DIMS.map((d) => [d.id, d.name]));
  const STRAT_OF = { concept: 's1', reasoning: 's2', code: 's3', complexity: 's4', transfer: 's5' };
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;

  /* ---------- 二分模拟器 + 判题 ---------- */
  function runBinary(cfg) {
    let l = cfg.lo, r = cfg.hi; const steps = [];
    while (l < r) {
      if (steps.length >= 60) return { verdict: 'TLE', l, r, steps };
      const mid = (l + r + cfg.midPlus) >> 1;
      let c;
      try { c = cfg.check(mid); } catch (e) { return { verdict: 'RE', l, r, steps }; }
      const act = c ? cfg.onTrue : cfg.onFalse;
      steps.push({ l, r, mid, c, act });
      if (act === 'l=mid') l = mid; else if (act === 'l=mid+1') l = mid + 1; else if (act === 'r=mid') r = mid; else r = mid - 1;
    }
    return { verdict: 'OK', l, r, steps };
  }
  function complete(task, ch) { return Object.keys(task.blanks).every((k) => ch && ch[k]); }
  function judge(task, ch) {
    if (!complete(task, ch)) return null;
    const results = task.tests.map((t) => {
      const res = runBinary(task.setup(ch, t)); const expect = task.expect(t);
      let verdict = res.verdict, out = null;
      if (verdict === 'OK') { try { out = task.output(ch, t, res.l); verdict = out === expect ? 'AC' : 'WA'; } catch (e) { verdict = 'RE'; } }
      return { verdict, out, expect, steps: res.steps, show: task.fmt(t) };
    });
    const ac = results.filter((r) => r.verdict === 'AC').length;
    return { results, ac, total: results.length, allAC: ac === results.length };
  }
  /* 手写代码任务：由 cmini 解释执行学生的函数体，结果结构与 judge 一致 */
  function judgeSrc(task, src) {
    if (!src || !src.trim()) return null;
    const ce = C.check(src, Object.keys(task.args(task.tests[0])));
    const results = task.tests.map((t) => {
      const expect = task.expect(t);
      if (ce) return { verdict: 'CE', out: null, expect, steps: [], show: task.fmt(t), msg: `第 ${ce.line} 行：${ce.msg}` };
      const res = C.run(src, task.args(t));
      const verdict = res.verdict === 'OK' ? (res.ret === expect ? 'AC' : 'WA') : res.verdict;
      return { verdict, out: res.verdict === 'OK' ? (res.ret === undefined ? '无返回值' : res.ret) : null, expect, steps: res.trace, show: task.fmt(t), msg: res.msg || null };
    });
    const ac = results.filter((r) => r.verdict === 'AC').length;
    return { results, ac, total: results.length, allAC: ac === results.length, ce: ce ? `第 ${ce.line} 行：${ce.msg}` : null };
  }

  /* ---------- 会话与证据 ---------- */
  function newSession(persona) {
    return { v: 2, persona: persona || 'me', stage: 'home', reached: 0, started: false, paused: false,
      evidence: [], log: [], rapid: { idx: 0, ans: {}, done: false }, reflect: null,
      deep: { plan: null, idx: 0, done: false, results: {} },
      support: { rounds: [], cur: null, offered: false, done: false },
      verify: { status: null, parts: null, tries: 0 }, star4: { status: null }, star5: { status: null },
      path: { choice: null }, snaps: {}, flags: { llmBad: false } };
  }
  const stageIdx = (id) => D.STAGES.findIndex((s) => s.id === id);
  function go(S, stage) {
    S.stage = stage; S.reached = Math.max(S.reached, stageIdx(stage)); S.paused = false;
    if (stage !== 'home') S.started = true;
    if (stage === 'support' && !S.support.offered) offer(S);
  }
  function addEv(S, ev) {
    ev.id = 'E' + String(S.evidence.length + 1).padStart(2, '0'); ev.t = Date.now();
    S.evidence.push(ev); return ev;
  }
  function note(S, kind, text) { S.log.push({ t: Date.now(), kind, text, stage: S.stage }); }

  /* ---------- Learning State：五维画像 + 综合标签（全部由规则产生） ---------- */
  function dimState(S, dim) {
    const all = S.evidence.filter((e) => e.dims.includes(dim));
    const evs = all.filter((e) => e.ok !== null && e.ok !== undefined);
    const st = (s) => evs.filter((e) => e.stage === s);
    const latest = (s) => { const a = st(s); const m = Math.max(0, ...a.map((e) => e.try || 1)); return a.filter((e) => (e.try || 1) === m); };
    let level = null, phase = 'none';
    const diag = [...st('rapid'), ...st('deep')];
    if (diag.length) {
      const w = (e) => (e.stage === 'deep' ? 2 : 1);
      const r = diag.reduce((s, e) => s + w(e) * e.ok, 0) / diag.reduce((s, e) => s + w(e), 0);
      level = r >= 0.99 ? 3 : r >= 0.3 ? 2 : 1; phase = st('deep').length ? 'ink' : 'pencil';
    }
    for (const tier of ['verify', 'star4']) {
      const v = latest(tier);
      if (v.length) { const r = mean(v.map((e) => e.ok)); level = r >= 0.99 ? 3 : r > 0 ? 2 : level >= 3 ? 2 : 1; phase = r >= 0.99 ? 'seal' : 'ink'; }
    }
    const s5 = latest('star5');
    if (s5.length && mean(s5.map((e) => e.ok)) >= 0.99) { level = 4; phase = 'seal'; }
    return { level, phase, ids: all.filter((e) => e.stage !== 'support').map((e) => e.id),
      scaffolded: all.some((e) => e.stage === 'support' && e.ok === 1) };
  }

  function diagnose(S) {
    const dims = {}; D.DIMS.forEach((d) => { dims[d.id] = dimState(S, d.id); });
    const lowConf = S.evidence.filter((e) => e.ok === 1 && e.conf === 'low');
    const tagCount = {}; S.evidence.forEach((e) => { if (e.misc) tagCount[e.misc] = (tagCount[e.misc] || 0) + 1; });
    const misc = S.evidence.filter((e) => e.misc && (e.conf === 'high' || tagCount[e.misc] >= 2) && dims[D.MISC[e.misc].dim].phase !== 'seal');
    const core = ['concept', 'reasoning', 'code', 'complexity'];
    const has = (id) => dims[id].level !== null;
    const l1 = D.DIMS.filter((d) => dims[d.id].level === 1).map((d) => d.id);
    const weakCore = core.filter((id) => has(id) && dims[id].level <= 2);
    const coreSealed = core.every((id) => dims[id].phase === 'seal');
    const names = (a) => a.map((id) => DIM_NAME[id]).join('、');
    let label;
    if (!D.DIMS.some((d) => has(d.id))) label = { key: 'none', name: '暂无评估', detail: '作答记录不足，暂不给出评估。', focus: [] };
    else if (l1.length >= 2) label = { key: 'gap', name: '基础知识缺口', detail: `${names(l1)}尚未建立，建议先回到基础内容。`, focus: l1 };
    else if (misc.length) { const m = D.MISC[misc[0].misc]; label = { key: 'misc', name: '典型认知误解', detail: `在「${m.name}」上出现了稳定的错误判断：${m.say}。该问题属于${DIM_NAME[m.dim]}。`, focus: [m.dim] }; }
    else if (weakCore.length) label = { key: 'fragile', name: '脆弱掌握', detail: `${names(weakCore)}能够部分完成，但表现不稳定，尚不能保证独立完成。`, focus: weakCore };
    else if (lowConf.length >= 2 && !coreSealed) label = { key: 'unsure', name: '掌握但信心不足', detail: `作答结果正确，但有 ${lowConf.length} 道答对的题把握程度选了「不太确定」。问题不在知识本身，而在对自身掌握程度的判断偏低。`, focus: [] };
    else if (!has('transfer')) label = { key: 'tna', name: '基础掌握，迁移待评估', detail: '概念、推理和代码表现正确。迁移能力尚未评估，不作推断。', focus: ['transfer'] };
    else if (dims.transfer.level <= 2) label = { key: 'tlow', name: '基础掌握，迁移不足', detail: '标准写法表现稳定；条件发生变化后，还不能独立写出正确的代码。', focus: ['transfer'] };
    else if (coreSealed && dims.transfer.phase !== 'seal') label = { key: 'tna', name: '核心能力已验证，迁移待验证', detail: '概念、推理、代码、复杂度均已通过独立检测。迁移能力需要通过四星任务验证。', focus: ['transfer'] };
    else if (!D.DIMS.every((x) => dims[x.id].phase === 'seal')) label = { key: 'pending', name: '表现稳定，待独立检测', detail: '目前评估到的能力均表现正确。通过独立检测后，才会记为「已掌握」。', focus: [] };
    else label = { key: 'stable', name: '稳定掌握', detail: '五项能力均达到要求，并且每一项都通过了无提示的独立检测。', focus: [] };
    const matrix = { low: [0, 0], mid: [0, 0], high: [0, 0] };
    S.evidence.forEach((e) => { if (e.conf && e.ok !== null) matrix[e.conf][e.ok >= 0.99 ? 0 : 1]++; });
    return { dims, label, lowConf, misc, matrix, coreSealed };
  }
  const proven = (S) => { const d = diagnose(S).dims; return D.DIMS.every((x) => d[x.id].level >= 3 && d[x.id].phase === 'seal'); };

  /* ---------- 03 基础练习（Rapid Probe） ---------- */
  function rapidFinish(S) {
    D.RAPID.forEach((q, i) => {
      const a = S.rapid.ans[q.id] || {};
      const picked = a.final || null; const opt = q.options.find((o) => o[0] === picked);
      const ok = picked ? (picked === q.answer ? 1 : 0) : null;
      addEv(S, { stage: 'rapid', task: q.id, title: `基础练习 第 ${i + 1} 题`, kind: q.type, dims: [q.dim], ok,
        conf: picked ? a.conf || null : null, misc: ok === 0 && opt && opt[2] ? opt[2] : null, first: a.first || null, final: picked,
        note: picked ? `选择 ${picked}${a.first && a.first !== picked ? `（最初选择 ${a.first}，后改为 ${picked}）` : ''}` : '已跳过，记为未作答' });
    });
    S.rapid.done = true;
    const hc = S.evidence.find((e) => e.stage === 'rapid' && e.ok === 0 && e.conf === 'high' && D.REFLECT[e.task]);
    S.reflect = hc ? { q: hc.task, ev: hc.id, answer: null } : null;
    S.snaps.rapid = diagnose(S);
    S.deep.plan = pickDeep(S);
    note(S, 'sys', `基础练习完成，初步评估为「${S.snaps.rapid.label.name}」`);
  }
  function reflectAnswer(S, idx) {
    if (!S.reflect) return;
    S.reflect.answer = idx;
    const r = D.REFLECT[S.reflect.q];
    note(S, 'reflect', idx === -1 ? '回顾错题：学生选择暂不回答' : `回顾错题：学生认为原因是「${r.options[idx]}」`);
  }

  /* 进阶练习固定 3 题：第 1 题按初步评估选择，第 2 题代码改错，第 3 题变式应用 */
  function pickDeep(S) {
    const d = diagnose(S); const lv = (id) => d.dims[id].level || 0;
    const core = ['concept', 'reasoning', 'code'];
    const low = Math.min(...core.map(lv));
    const dim = low <= 2 ? core.find((id) => lv(id) === low) : null;
    let target, reason;
    if (dim === 'concept') { target = 'explain'; reason = '概念理解是目前最薄弱的一项，第 1 题请你用自己的话解释二分的原理。'; }
    else if (dim === 'reasoning') { target = 'counter'; reason = '算法推理是目前最薄弱的一项，第 1 题请你为一段有错误的程序构造反例。'; }
    else if (dim === 'code') { target = 'complexity'; reason = '代码实现是目前最薄弱的一项，将由第 2 题「代码改错」重点考察；第 1 题先补充基础练习没有涉及的复杂度分析。'; }
    else if (d.lowConf.length >= 2) { target = 'followup'; reason = '基础练习全部答对，但把握程度偏低。第 1 题请你说明作答理由，用来确认理解是否扎实。'; }
    else { target = 'complexity'; reason = '基础练习全部答对。第 1 题补充复杂度分析，后两题提高难度，考察代码改错和变式应用。'; }
    const tasks = [target, 'fix', 'variant'];
    const plan = { tasks, reason, target, fallback: false, llm: tasks.slice() };
    if (S.flags.llmBad) { plan.llm = ['graph_dp_quiz', 'fix', 'variant']; plan.fallback = true; }
    return plan;
  }

  /* ---------- 05 进阶练习（Deep Probe） ---------- */
  function deepSubmit(S, taskId, p) {
    const T = D.DEEP[taskId]; let ok = null, noteText = '已跳过，记为未作答', analysis = null, misc = null;
    if (!p.skip) {
      if (T.kind === 'text') {
        const hits = T.rubric.filter((r) => r.re.test(p.text)).map((r) => r.id);
        ok = hits.length === T.rubric.length ? 1 : hits.length ? 0.5 : 0;
        analysis = { hits, text: p.text };
        noteText = `解释覆盖了 ${hits.length} / ${T.rubric.length} 个要点`;
      } else if (T.kind === 'mcq') { ok = p.a === T.answer ? 1 : 0; noteText = `选择 ${p.a}`; }
      else if (T.kind === 'code' || T.kind === 'src') {
        const pass = (c) => { const j = T.kind === 'src' ? judgeSrc(D.PROG[T.prog], c) : judge(D.CODE[T.codeTask], c); return j && j.allAC; };
        const idx = p.runs.findIndex(pass);
        ok = idx === 0 ? 1 : idx > 0 && idx <= 2 ? 0.5 : 0;
        analysis = { runs: p.runs.length, passAt: idx, last: T.kind === 'src' ? p.runs[p.runs.length - 1] : null };
        noteText = idx === 0 ? '第 1 次运行即全部通过' : idx > 0 ? `第 ${idx + 1} 次运行全部通过` : `运行 ${p.runs.length} 次，仍有测试点未通过`;
      } else if (T.kind === 'counter') {
        const task = D.CODE[T.codeTask];
        const found = p.tries.slice(0, 3).findIndex((t) => runBinary(task.setup(task.initial, t)).verdict === 'TLE');
        const why = p.why === T.whyAnswer;
        ok = (found >= 0 ? 0.5 : 0) + (why ? 0.5 : 0);
        if (!why) misc = 'mid_round';
        analysis = { found, why };
        noteText = `${found >= 0 ? `第 ${found + 1} 次尝试构造出反例` : '未能构造出反例'}；${why ? '原因判断正确' : '原因判断错误'}`;
      }
    }
    const ev = addEv(S, { stage: 'deep', task: taskId, title: `进阶练习 · ${T.type}`, kind: T.type, dims: T.dims, ok, conf: null, misc, note: noteText });
    S.deep.results[taskId] = { ok, analysis, ev: ev.id };
    S.deep.idx++;
    if (S.deep.idx >= S.deep.plan.tasks.length) { S.deep.done = true; S.snaps.deep = diagnose(S); note(S, 'sys', `进阶练习完成，评估确认为「${S.snaps.deep.label.name}」`); }
    return ev;
  }

  /* ---------- 06 针对辅导（Adaptive Support） ---------- */
  const lvName = (lv) => `L${lv} ${D.LADDER[lv - 1].name}`;
  function pickStrategy(S) {
    const d = diagnose(S); const done = S.support.rounds.map((r) => r.strategy);
    const weak = ORDER.filter((id) => d.dims[id].level !== null && d.dims[id].level <= 2).sort((a, b) => d.dims[a].level - d.dims[b].level);
    let list = weak.map((id) => STRAT_OF[id]);
    if (d.label.key === 'gap') list = ['s1', 's4', ...list];
    if (d.lowConf.length >= 2 && !d.coreSealed) list.push('s6');
    list = [...new Set(list)].filter((s) => !done.includes(s));
    if (!list.length) return { primary: null, list: [], reason: '各项能力目前都没有需要辅导的地方，可以直接进入独立检测。' };
    const primary = list[0]; const st = D.STRATEGIES[primary]; const lv = st.dim === 'meta' ? null : d.dims[st.dim].level;
    const startLevel = primary === 's6' ? 1 : (lv === 1 || d.label.key === 'gap') ? 2 : 1;
    const reason = primary === 's6' ? '作答正确但把握程度偏低，匹配元认知支持：对照作答记录，校准自我评价。'
      : d.label.key === 'gap' && primary === 's1' ? '多项能力处于 L1，先回到基础概念，再处理其他问题。'
      : `${DIM_NAME[st.dim]}${lv ? `评估为 L${lv}` : '尚未评估'}，匹配「${st.name}」；${startLevel === 2 ? '差距较大，提示从「局部示例」开始' : '差距较小，提示从最轻的「方向提示」开始'}。`;
    return { primary, list, startLevel, reason };
  }
  function offer(S, from) {
    const p = pickStrategy(S); S.support.offered = true;
    S.support.cur = p.primary ? { strategy: p.primary, startLevel: p.startLevel, level: p.startLevel, reason: p.reason, alts: p.list.slice(1), decision: null, tries: 0, l4tries: 0, solved: false, finished: false, capped: false, from: from || null } : null;
    S.support.none = !p.primary; S.support.noneReason = p.reason;
    if (p.primary) note(S, 'proactive', `辅导建议：${D.STRATEGIES[p.primary].name}（${p.reason}）`);
    else note(S, 'sys', p.reason);
  }
  function supportDecide(S, decision, strategyId) {
    const c = S.support.cur; if (!c) return;
    if (decision === 'accept') { c.decision = 'accept'; note(S, 'student', `接受辅导：${D.STRATEGIES[c.strategy].name}，提示从 ${lvName(c.level)} 开始`); }
    else if (decision === 'decline') {
      c.decision = 'decline'; c.finished = true; S.support.rounds.push(c); S.support.cur = null;
      note(S, 'student', `跳过辅导「${D.STRATEGIES[c.strategy].name}」（不影响能力评估）`);
    } else if (decision === 'switch') {
      const old = c.strategy; const d = diagnose(S); const st = D.STRATEGIES[strategyId];
      const lv = st.dim === 'meta' ? null : d.dims[st.dim].level;
      S.support.cur = { strategy: strategyId, startLevel: lv === 1 ? 2 : 1, level: lv === 1 ? 2 : 1, reason: `学生将「${D.STRATEGIES[old].name}」更换为「${st.name}」。`, alts: [], decision: 'accept', tries: 0, l4tries: 0, solved: false, finished: false, capped: false, from: old };
      note(S, 'student', `更换辅导方式：${D.STRATEGIES[old].name} → ${st.name}`);
    }
  }
  function supportTry(S, p) {
    const c = S.support.cur; const st = D.STRATEGIES[c.strategy]; c.tries++;
    let right;
    if (st.task.kind === 'reflect') { right = true; c.reflectPick = p.a; }
    else if (st.task.kind === 'mcq') right = p.a === st.task.answer;
    else { const j = judge(D.CODE[st.task.codeTask], p.c); right = !!(j && j.allAC); }
    if (right) { c.solved = true; closeRound(S); }
    else { if (c.level >= 4) c.l4tries++; if (c.l4tries >= 2) c.capped = true; }
    return right;
  }
  function supportHintUp(S) { const c = S.support.cur; if (c.level < 4) { c.level++; note(S, 'ai', `提示升一级：${lvName(c.level)}`); } }
  function closeRound(S) {
    const c = S.support.cur; const st = D.STRATEGIES[c.strategy]; c.finished = true;
    const dims = st.dim === 'meta' ? [] : [st.dim];
    const ev = addEv(S, { stage: 'support', task: c.strategy, title: `辅导练习 · ${st.name}`, kind: st.theory, dims, ok: c.solved ? 1 : 0, scaffold: c.level, conf: null, misc: null,
      note: st.task.kind === 'reflect' ? '完成了一次作答记录对照' : c.solved ? `在 ${lvName(c.level)} 下完成（辅导中完成，不计入掌握）` : `提示给到 ${lvName(c.level)} 仍未完成，本轮辅导结束` });
    c.ev = ev.id; S.support.rounds.push(c);
    note(S, 'sys', c.solved ? `辅导练习在 ${lvName(c.level)} 下完成，提示全部撤除` : '提示已到上限，本轮辅导结束');
  }
  function supportGiveUp(S) { const c = S.support.cur; if (c && !c.finished) { c.solved = false; closeRound(S); } }
  function supportMore(S) { S.support.cur = null; if (S.support.rounds.filter((r) => r.decision === 'accept').length < 3) offer(S); }
  function supportDone(S) { if (S.support.cur && S.support.cur.decision === 'accept' && !S.support.cur.finished) supportGiveUp(S); S.support.cur = null; S.support.done = true; S.snaps.support = diagnose(S); if (S.star4.status && S.star4.status !== 'pass') S.star4.remed = true; }

  /* ---------- 07 独立检测（Independent Verification） ---------- */
  const score = (j) => { if (!j) return null; const r = j.ac / j.total; return r === 1 ? 1 : r >= 0.5 ? 0.5 : 0; };
  function verifySubmit(S, p) {
    S.verify.tries++; const tr = S.verify.tries;
    if (p.skip) { S.verify.status = 'skipped'; S.verify.parts = null; note(S, 'student', '跳过独立检测：知识点记为「待检测」'); S.snaps.verify = diagnose(S); return; }
    const task = D.CODE[D.VERIFY.code]; const j = judge(task, p.code); const c = score(j);
    addEv(S, { stage: 'verify', try: tr, task: 'vcode', title: `独立检测 · ${task.name}`, kind: '程序判题', dims: task.dims, ok: c, conf: null, misc: null, note: j ? `${j.ac} / ${j.total} 个测试点通过` : '未作答' });
    const parts = { c, judge: j, mcq: {} };
    D.VERIFY.mcq.forEach((m) => {
      const a = p[m.id] || null; const ok = a ? (a === m.answer ? 1 : 0) : null; parts.mcq[m.id] = ok;
      addEv(S, { stage: 'verify', try: tr, task: m.id, title: `独立检测 · ${DIM_NAME[m.dim]}`, kind: '标准答案', dims: [m.dim], ok, conf: null, misc: null, note: a ? `选择 ${a}` : '未作答' });
    });
    const pt = D.PROG[D.VERIFY.prog]; const pj = judgeSrc(pt, p.prog === pt.initial ? null : p.prog); const pc = score(pj);
    parts.p = pc; parts.pjudge = pj; parts.src = p.prog || null;
    addEv(S, { stage: 'verify', try: tr, task: 'vprog', title: `独立检测 · ${pt.name}（编程）`, kind: '程序判题', dims: pt.dims, ok: pc, conf: null, misc: null, note: pj ? (pj.ce ? '代码无法通过编译' : `${pj.ac} / ${pj.total} 个测试点通过`) : '未作答' });
    const m = Object.values(parts.mcq); const right = m.filter((x) => x === 1).length;
    S.verify.status = c === 1 && pc === 1 && right === m.length ? 'pass' : !c && !pc && right <= 1 ? 'fail' : 'partial';
    S.verify.parts = parts; S.snaps.verify = diagnose(S);
    note(S, 'sys', `独立检测结果：${{ pass: '通过', partial: '部分通过', fail: '未通过' }[S.verify.status]}`);
  }
  function starSubmit(S, n, ch) {
    const key = 'star' + n; const task = D.CODE[key]; const j = judge(task, ch); const ok = score(j) || 0;
    S[key].tries = (S[key].tries || 0) + 1;
    addEv(S, { stage: key, try: S[key].tries, task: key, title: `${n === 4 ? '四星任务' : '五星挑战'} · ${task.name}`, kind: '程序判题', dims: task.dims, ok, conf: null, misc: null, note: `${j ? j.ac : 0} / ${task.tests.length} 个测试点通过` });
    S[key].status = ok === 1 ? 'pass' : ok ? 'partial' : 'fail'; S[key].judge = j; S[key].remed = false;
    S.snaps[key] = diagnose(S);
    note(S, 'sys', `${n === 4 ? '四星任务' : '五星挑战'}：${S[key].status === 'pass' ? '通过' : '未通过'}`);
  }

  /* ---------- 08 学习路径（规则决定，LLM 无权解锁知识点） ---------- */
  const PATH_RULES = [
    { when: '尚未完成独立检测', then: '先完成独立检测', lane: 'remed' },
    { when: '独立检测未通过或部分通过', then: '补差：针对未通过的能力辅导后重新检测', lane: 'remed' },
    { when: '独立检测通过，迁移能力尚未验证', then: '拔高：完成四星任务', lane: 'deepen' },
    { when: '四星任务未通过', then: '补差：完成变式训练后重做四星任务', lane: 'remed' },
    { when: '四星任务通过，五项能力全部验证', then: '进入下一知识点（可选五星挑战）', lane: 'next' },
    { when: '已完成五星挑战', then: '进入下一知识点', lane: 'next' },
  ];
  function pathAdvice(S) {
    const v = S.verify.status, s4 = S.star4.status, s5 = S.star5.status; const d = diagnose(S); const p = pickStrategy(S);
    const O = {
      verify: { id: 'verify', lane: 'remed', label: '完成独立检测', desc: '4 道题，无提示，约 10 分钟。', fit: '尚未检测时' },
      support: { id: 'support', lane: 'remed', label: p.primary ? `补差：${D.STRATEGIES[p.primary].name}` : '补差：再进行一轮辅导', desc: p.primary ? D.STRATEGIES[p.primary].short + '。' : '回到针对辅导，再完成一轮练习。', fit: '仍有能力未达到要求时' },
      reverify: { id: 'reverify', lane: 'remed', label: '重新进行独立检测', desc: '不经过辅导，直接再检测一次。', fit: '认为上次属于失误时' },
      star4: { id: 'star4', lane: 'deepen', label: '拔高：四星任务「旋转数组的最小值」', desc: '在新的约束下独立完成。通过后，本知识点记为「已掌握」。', fit: '独立检测通过后' },
      star5: { id: 'star5', lane: 'deepen', label: '挑战：五星任务「分巧克力」', desc: '竞赛风格的综合题，不影响已有的掌握结论。', fit: '学有余力时' },
      next: { id: 'next', lane: 'next', label: '进入下一知识点：二分答案', desc: '生成本次学习报告，并解锁「二分答案」。', fit: '五项能力全部验证后' },
      explore: { id: 'explore', lane: 'next', label: '先浏览下一知识点', desc: '可以查看，但「二分查找」仍记为「待检测」。', fit: '想先了解后续内容时' },
      report: { id: 'report', lane: 'next', label: '结束本次学习，查看报告', desc: '已有记录全部保留，未完成的部分记为「待检测」。', fit: '时间不够时' },
    };
    const weak = D.DIMS.filter((x) => d.dims[x.id].level !== null && d.dims[x.id].level <= 2).map((x) => x.name).join('、');
    if (!v || v === 'skipped') return { rule: 0, rec: 'remed', title: '完成独立检测', why: '你还没有完成独立检测。只有在没有提示的情况下独立完成，知识点才会记为「已掌握」。', options: [O.verify, O.explore, O.report] };
    if (v !== 'pass') return { rule: 1, rec: 'remed', title: '补差', why: `独立检测${v === 'partial' ? '部分通过' : '未通过'}，${weak || '部分能力'}尚未达到要求。${v === 'fail' ? '上一轮的辅导方式效果有限，本次将更换方式。' : '建议针对未通过的部分再辅导一轮，然后重新检测。'}`, options: [O.support, O.reverify, O.report] };
    if (!s4) return { rule: 2, rec: 'deepen', title: '拔高', why: '独立检测通过，概念理解、算法推理、代码实现、复杂度分析均已验证。迁移能力尚未验证，完成四星任务后即可达到本知识点的掌握标准。', options: [O.star4, O.explore, O.report] };
    if (s4 !== 'pass' && S.star4.remed) return { rule: 3, rec: 'remed', title: '重做四星任务', why: '四星任务未通过后，你已完成一轮补差辅导。现在重做四星任务，检验条件变化后能否独立写对。', options: [Object.assign({}, O.star4, { label: '重做四星任务「旋转数组的最小值」', lane: 'remed' }), O.support, O.report] };
    if (s4 !== 'pass') return { rule: 3, rec: 'remed', title: '补差（迁移能力）', why: '四星任务未通过：标准写法已经稳定，但条件变化后的写法仍有错误。建议完成一轮变式训练后重做四星任务。', options: [O.support, Object.assign({}, O.star4, { label: '重做四星任务', lane: 'remed' }), O.report] };
    if (!s5) return { rule: 4, rec: 'next', title: '进入下一知识点', why: '五项能力均达到 L3，并且全部通过了无提示的独立检测，已达到「二分查找」的掌握标准。也可以选择继续挑战五星任务。', options: [O.next, O.star5] };
    return { rule: 5, rec: 'next', title: '进入下一知识点', why: s5 === 'pass' ? '五星挑战通过：你把二分用到了需要自行设计判定函数的综合问题上，迁移能力记为 L4。' : '五星挑战未通过，不影响已有的掌握结论。「二分查找」已达到掌握标准。', options: [O.next, ...(s5 === 'pass' ? [] : [Object.assign({}, O.star5, { label: '重做五星挑战' })])] };
  }

  /* ---------- 评估过程记录（AI Decision Trace） ---------- */
  function trace(S) {
    const ids = (f) => S.evidence.filter(f).map((e) => e.id);
    const sn = S.snaps; const steps = [];
    const rp = S.evidence.filter((e) => e.stage === 'rapid');
    steps.push({ t: '基础练习作答', done: S.rapid.done, ids: ids((e) => e.stage === 'rapid'),
      body: S.rapid.done ? `共 ${rp.length} 题：答对 ${rp.filter((e) => e.ok === 1).length}，答错 ${rp.filter((e) => e.ok === 0).length}，跳过 ${rp.filter((e) => e.ok === null).length}。把握程度：${rp.filter((e) => e.conf).map((e) => ({ low: '不太确定', mid: '有些把握', high: '非常确定' }[e.conf])).join('、') || '未填写'}。` : '' });
    steps.push({ t: '初步评估', done: !!sn.rapid, ids: sn.rapid ? [...new Set(sn.rapid.label.focus.flatMap((f) => sn.rapid.dims[f].ids))] : [],
      body: sn.rapid ? `「${sn.rapid.label.name}」。${sn.rapid.label.detail}` : '' });
    steps.push({ t: '进阶练习安排', done: !!S.deep.plan, ids: ids((e) => e.stage === 'deep'),
      body: S.deep.plan ? `${S.deep.plan.tasks.map((t) => D.DEEP[t].type).join('、')}。${S.deep.plan.reason}${S.deep.plan.fallback ? '（模型推荐了内容库之外的任务，已按规则回退。）' : ''}` : '' });
    const rounds = S.support.rounds;
    steps.push({ t: '辅导方式匹配', done: S.support.offered, ids: [],
      body: !S.support.offered ? '' : rounds.length || S.support.cur ? [...rounds, ...(S.support.cur && !S.support.cur.finished ? [S.support.cur] : [])].map((r) => `「${D.STRATEGIES[r.strategy].name}」：${r.reason}`).join(' ') : S.support.noneReason });
    steps.push({ t: '学生的选择', done: S.support.done || rounds.length > 0, ids: rounds.filter((r) => r.ev).map((r) => r.ev),
      body: rounds.length ? rounds.map((r) => (r.decision === 'decline' ? `跳过了「${D.STRATEGIES[r.strategy].name}」（不影响能力评估）` : `${r.from ? '更换为' : '接受了'}「${D.STRATEGIES[r.strategy].name}」，${r.solved ? `在 ${lvName(r.level)} 下完成` : '提示到上限仍未完成'}`)).join('；') + '。' : S.support.done ? '系统判断无需辅导，直接进入独立检测。' : '' });
    steps.push({ t: '独立检测结果', done: !!S.verify.status, ids: ids((e) => e.stage === 'verify' && (e.try || 1) === S.verify.tries),
      body: S.verify.status ? { pass: '在没有任何提示的情况下全部通过。', partial: '在没有提示的情况下部分通过。', fail: '在没有提示的情况下未通过。', skipped: '已跳过独立检测：知识点记为「待检测」，不记为掌握。' }[S.verify.status] : '' });
    const before = sn.rapid, after = diagnose(S); const f = (x) => (x ? 'L' + x : '未评估');
    steps.push({ t: '能力评估更新', done: !!S.verify.status, ids: [],
      body: S.verify.status && before ? D.DIMS.map((x) => { const a = before.dims[x.id], b = after.dims[x.id]; return a.level === b.level && a.phase === b.phase ? null : `${x.name} ${f(a.level)}${a.phase === 'pencil' ? '（初步评估）' : ''} → ${f(b.level)}${b.phase === 'seal' ? '（已验证）' : ''}`; }).filter(Boolean).join('；') || '各项能力没有变化。' : '' });
    const adv = S.verify.status ? pathAdvice(S) : null;
    steps.push({ t: '学习路径', done: S.stage === 'report' || !!S.path.choice, ids: ids((e) => e.stage === 'star4' || e.stage === 'star5'),
      body: adv ? `推荐：${adv.title}。${adv.why}${S.path.choice ? ` 学生的选择：${S.path.choice}。` : ''}` : '' });
    return steps;
  }

  /* ---------- 演示脚本：按模拟学生的预设表现自动走完当前阶段 ---------- */
  function auto(S) {
    const sc = (D.PERSONAS[S.persona].script) || D.PERSONAS.F.script;
    const st = S.stage;
    if (st === 'home') return go(S, 'material');
    if (st === 'material') return go(S, 'rapid');
    if (st === 'rapid') {
      if (!S.rapid.done) { D.RAPID.forEach((q) => { const a = sc.rapid[q.id]; if (a) S.rapid.ans[q.id] = { first: a[0], final: a[0], conf: a[1] || null }; }); rapidFinish(S); }
      return go(S, 'state');
    }
    if (st === 'state') { if (S.reflect && S.reflect.answer === null) reflectAnswer(S, sc.reflect == null ? -1 : sc.reflect); return go(S, 'deep'); }
    if (st === 'deep') { while (!S.deep.done) { const t = S.deep.plan.tasks[S.deep.idx]; deepSubmit(S, t, sc.deep[t] || { skip: true }); } return go(S, 'support'); }
    if (st === 'support') {
      if (!S.support.done) {
        let guard = 0;
        while (S.support.cur && guard++ < 4) {
          const i = S.support.rounds.length; const plan = sc.support[i];
          if (!plan) { if (S.support.cur.decision !== 'accept') supportDecide(S, 'decline'); break; }
          if (!S.support.cur.decision) supportDecide(S, plan.decision);
          if (plan.decision !== 'accept') break;
          for (const tr of plan.tries) { if (supportTry(S, tr)) break; supportHintUp(S); }
          if (!S.support.cur.finished) supportGiveUp(S);
          if (sc.support[i + 1]) supportMore(S); else break;
        }
        supportDone(S);
      }
      return go(S, 'verify');
    }
    if (st === 'verify') { if (!S.verify.status) verifySubmit(S, sc.verify || { skip: true }); return go(S, 'path'); }
    if (st === 'path') {
      for (const step of sc.path) {
        if (step === 'star4' && S.star4.status !== 'pass') { starSubmit(S, 4, sc.star4); S.path.choice = '完成四星任务'; }
        if (step === 'star5' && !S.star5.status) { starSubmit(S, 5, sc.star5); S.path.choice = '挑战五星任务'; }
      }
      if (!S.path.choice) S.path.choice = '查看学习报告';
      return go(S, 'report');
    }
  }
  function autoTo(S, target) { let g = 0; while (stageIdx(S.stage) < stageIdx(target) && g++ < 12) auto(S); }

  const KP = { runBinary, judge, judgeSrc, PATH_RULES, lvName, complete, newSession, go, stageIdx, addEv, note, diagnose, dimState, proven, rapidFinish, reflectAnswer, pickDeep, deepSubmit,
    pickStrategy, offer, supportDecide, supportTry, supportHintUp, supportGiveUp, supportMore, supportDone, verifySubmit, starSubmit, pathAdvice, trace, auto, autoTo, DIM_NAME };
  if (typeof module !== 'undefined' && module.exports) module.exports = KP; else root.KP = KP;
})(typeof window !== 'undefined' ? window : globalThis);
