/* 知证 KnowProof · AI 助教「小证」：侧栏卡片与对话抽屉
 * 演示版本没有接入大模型，回答来自 data-lesson.js 中的预设内容，部分条目会读取当前的作答记录。 */
(function () {
  const A = window.A, D = A.D, K = A.K, esc = A.esc, QA = A.L.QA;
  const qa = (id) => QA.find((x) => x.id === id);
  const working = () => { const c = A.S.support.cur; return A.S.stage === 'support' && c && c.decision === 'accept' && !c.finished ? c : null; };

  /* 练习和检测进行中，助教只解答题意与规则 */
  const quiet = () => { const S = A.S; return (S.stage === 'rapid' && !S.rapid.done) || (S.stage === 'deep' && !S.deep.done) || (S.stage === 'verify' && (!S.verify.status || A.U.redo)) || !!A.U.pathTask; };
  const context = () => { const S = A.S, st = S.stage, c = S.support.cur;
    if (st === 'home') return K.proven(S) ? ['「二分查找」已掌握，「二分答案」「离散化」已解锁。', ['mastery', 'pending']] : S.started ? [`「二分查找」进行到「${D.STAGES[S.reached].name}」，可以从上次的位置继续。`, ['mastery', 'pending']]
      : ['推荐学习「二分查找」：前置知识已具备，并且它是「二分答案」「离散化」的前置知识点。', ['what', 'mastery', 'pending']];
    if (st === 'material') return ['阅读中有不理解的地方，可以随时提问。', ['guess', 'plus1', 'sorted', 'tpl', 'overflow']];
    if (st === 'rapid') return S.rapid.done ? ['基础练习已提交。', ['prelim']] : ['练习期间只解答与题意、规则有关的问题。', ['conf', 'skip']];
    if (st === 'state') return ['可以询问评估结果的依据。', ['whylabel', 'prelim', 'noexp']];
    if (st === 'deep') return S.deep.done ? ['进阶练习已完成，可以询问评估结果的依据。', ['whylabel', 'prelim']] : ['练习期间只解答与题意、规则有关的问题。', ['deepwhy', 'runs', 'skip']];
    if (st === 'support') return working() ? ['需要时可以请求下一级提示，或让我检查当前的作答。', [...(D.STRATEGIES[c.strategy].hints.length ? ['hint', 'chk'] : []), ...(D.STRATEGIES[c.strategy].task.kind === 'code' ? ['explain'] : []), 'full']]
      : ['可以询问辅导建议的依据。辅导方式可以更换，也可以跳过。', ['whystrat', 'declineok']];
    if (st === 'verify') return quiet() ? ['独立检测期间不提供解题帮助。', ['vrule', 'vfail']] : ['可以询问检测结果与评估的依据。', ['whylabel', 'prelim', 'vfail']];
    if (st === 'path') return A.U.pathTask ? ['任务进行中，不提供解题帮助。', ['runs']] : ['可以询问路径推荐的依据。', ['whypath', 'other', 'mastery']];
    return ['可以询问报告的阅读方法和评估依据。', ['howread', 'whylabel', 'prelim']]; };

  /* 辅导环节的三个动态回答：升级提示、检查当前作答、逐步演示 */
  const curJudge = (c) => { const st = D.STRATEGIES[c.strategy]; if (st.task.kind !== 'code') return null; const task = D.CODE[st.task.codeTask]; const cs = A.U.code['sup-' + c.strategy]; return { task, ch: cs ? cs.ch : {}, j: cs ? K.judge(task, cs.ch) : null }; };
  const SPECIAL = {
    hint: { q: '给我下一级提示', a: () => { const c = working(); if (!c) return '当前没有进行中的辅导练习。'; const st = D.STRATEGIES[c.strategy];
      if (c.level >= 4) return '已经是最高一级提示。如果仍然无法完成，可以结束本轮辅导，或更换辅导方式。'; K.supportHintUp(A.S); const cs = A.U.code['sup-' + c.strategy]; if (c.level === 4 && st.l4fill && cs) Object.assign(cs.ch, st.l4fill);
      return `<b>${K.lvName(c.level)}</b><br>${st.hints[c.level - 1]}`; } },
    chk: { q: '检查我当前的作答', a: () => { const c = working(); if (!c) return '当前没有进行中的辅导练习。'; const st = D.STRATEGIES[c.strategy]; const x = curJudge(c);
      if (!x) { const p = A.U.pick['sup-' + c.strategy]; return p ? `你当前选择了 ${p}。提交前先确认一点：${st.hints[0]}` : '你还没有选择选项。可以先按自己的判断选一个，再对照提示检查。'; }
      if (!x.j) return '代码中还有空没有填。请先全部填完，我再检查。'; if (x.j.allAC) return '当前代码可以通过全部测试点，可以提交。';
      const bad = x.j.results.find((r) => r.verdict !== 'AC');
      return bad.verdict === 'TLE' ? `输入 <span class="mono">${esc(bad.show)}</span> 时程序没有停下来。请推演：区间只剩两个数时，mid 等于多少？执行更新之后，区间有没有变小？`
        : `输入 <span class="mono">${esc(bad.show)}</span> 时，输出与期望不一致。请检查：循环结束时 l 停在哪个位置？这个位置上的数一定满足题目的要求吗？`; } },
    explain: { q: '逐步演示第一个测试点', a: () => { const c = working(); const x = c && curJudge(c); if (!x) return '这道练习没有可以演示的代码。'; if (!x.j) return '代码中还有空没有填。请先全部填完，我再按你的代码逐步演示。';
      const r = x.j.results.find((y) => y.verdict !== 'AC') || x.j.results[0]; return `按你当前的代码执行：${A.traceBox(r)}`; } },
  };
  const label = (id) => (SPECIAL[id] ? SPECIAL[id].q : qa(id).q);

  A.assistCard = () => { const [ctx, ids] = context(); const q = quiet();
    return `<section class="card assist${q ? ' quiet' : ''}"><div class="as-h"><span class="as-av">${A.icon('spark', 18)}</span><div><b>小证</b><span>AI 助教</span></div><span class="as-on">${q ? '仅答疑' : '在线'}</span></div>
      <p class="as-ctx">${ctx}</p><div class="as-qs">${ids.slice(0, 4).map((id) => `<button data-act="ask" data-q="${id}">${label(id)}</button>`).join('')}</div>
      <button class="as-open" data-act="chat">${A.icon('chat', 15)}输入你的问题</button></section>`; };

  /* ---------- 对话 ---------- */
  const tokens = (html) => html.match(/<[^>]+>|&[a-z#0-9]+;|[\s\S]/g) || [];
  const stream = (m) => { m.tok = tokens(m.html); m.shown = 0; m.think = false;
    const tick = () => { if (!A.U.chat.includes(m)) return; m.shown = Math.min(m.tok.length, m.shown + 2); const el = document.getElementById('stream');
      if (el) { el.innerHTML = m.tok.slice(0, m.shown).join(''); const b = document.getElementById('drawer-b'); if (b) b.scrollTop = b.scrollHeight; }
      if (m.shown < m.tok.length) setTimeout(tick, 14); else { m.done = true; A.save(); A.render(); } };
    A.render(); tick(); };
  const reply = (question, html) => { A.U.chat.push({ role: 'me', text: question }); const m = { role: 'ai', html, think: true, done: false }; A.U.chat.push(m); A.U.drawer = 'chat'; setTimeout(() => stream(m), 650); };
  const answer = (id) => { const x = { S: A.S, D, K, A }; if (SPECIAL[id]) return SPECIAL[id].a(); const it = qa(id); return typeof it.a === 'function' ? it.a(x) : it.a; };
  A.acts.chat = () => { A.U.drawer = 'chat'; };
  A.acts.ask = (d) => { const q = label(d.q); K.note(A.S, 'ondemand', `学生提问：${q}`); reply(q, answer(d.q)); };
  A.acts.send = () => { const text = (A.U.ins.chat || '').trim(); if (!text) return false; A.U.ins.chat = ''; K.note(A.S, 'ondemand', `学生提问：${text}`);
    const [, ids] = context(); const hit = QA.find((x) => x.re.test(text));
    if (hit && quiet() && !ids.includes(hit.id)) return reply(text, '练习和检测进行期间，我只解答与题意、规则有关的问题。完成后可以继续提问。');
    if (hit) return reply(text, answer(hit.id));
    reply(text, `这个问题不在演示版本的预设范围内。当前环节可以提问：<div class="as-qs in-chat">${ids.map((id) => `<button data-act="ask" data-q="${id}">${label(id)}</button>`).join('')}</div>`); };

  A.drawers.chat = () => { const [ctx, ids] = context(); const asked = A.U.chat.filter((m) => m.role === 'me').map((m) => m.text); const rest = ids.filter((id) => !asked.includes(label(id)));
    const body = `<div class="chat"><div class="msg ai"><span class="as-av sm">${A.icon('spark', 14)}</span><div class="bub">${ctx}</div></div>${A.U.chat.map((m) => (m.role === 'me' ? `<div class="msg me"><div class="bub">${esc(m.text)}</div></div>`
      : `<div class="msg ai"><span class="as-av sm">${A.icon('spark', 14)}</span><div class="bub"${m.done ? '' : ' id="stream"'}>${m.think ? '<span class="think"><i></i><i></i><i></i></span>' : m.done ? m.html : (m.tok || []).slice(0, m.shown).join('')}</div></div>`)).join('')}</div>`;
    const foot = `${rest.length ? `<div class="as-qs">${rest.slice(0, 3).map((id) => `<button data-act="ask" data-q="${id}">${label(id)}</button>`).join('')}</div>` : ''}
      <div class="chat-in"><input class="in" data-in="chat" data-enter="send" placeholder="输入你的问题" value="${esc(A.U.ins.chat || '')}" aria-label="输入问题"><button class="btn sm" data-act="send" aria-label="发送">${A.icon('send', 16)}</button></div>
      <p class="faint small">演示版本：回答为预设内容。正式版本由大模型结合作答记录生成，并经过规则校验。</p>`;
    return { title: '小证 · AI 助教', body, foot, cls: 'chatd' }; };
})();
