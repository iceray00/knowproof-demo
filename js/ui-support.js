/* 知证 KnowProof · 06 针对辅导：辅导建议 → 分级提示下完成练习 → 撤除提示 */
(function () {
  const A = window.A, D = A.D, K = A.K, esc = A.esc;
  const ST = (c) => D.STRATEGIES[c.strategy];
  const key = (c) => 'sup-' + c.strategy;
  const accepted = (S) => S.support.rounds.filter((r) => r.decision === 'accept');

  A.acts.saccept = () => { K.supportDecide(A.S, 'accept'); A._top = true; };
  A.acts.sdecline = () => { K.supportDecide(A.S, 'decline'); A.U.switching = false; };
  A.acts.sswitch = () => { A.U.switching = !A.U.switching; };
  A.acts.sto = (d) => { K.supportDecide(A.S, 'switch', d.id); A.U.switching = false; A._top = true; };
  A.acts.shint = () => { const c = A.S.support.cur, st = ST(c); K.supportHintUp(A.S); const cs = A.U.code[key(c)]; if (c.level === 4 && st.l4fill && cs) { Object.assign(cs.ch, st.l4fill); cs.last = null; } A.U.wrong[key(c)] = false; };
  A.acts.sgiveup = () => { K.supportGiveUp(A.S); A._top = true; };
  A.acts.smore = () => { K.supportMore(A.S); A._top = true; };
  A.acts.sdone = () => { const v = A.S.verify.status; K.supportDone(A.S); if (v === 'pass') return A.go('path'); if (v) A.acts.vredo(); A.go('verify'); };
  const nextLabel = () => { const v = A.S.verify.status; return v === 'pass' ? '返回学习路径' : v && v !== 'skipped' ? '重新进行独立检测' : '进入独立检测'; };
  A.acts.ssub = () => { const S = A.S, c = S.support.cur, st = ST(c), k = key(c); let p;
    if (st.task.kind === 'code') { const cs = A.cst(k, D.CODE[st.task.codeTask]); const j = K.judge(D.CODE[st.task.codeTask], cs.ch); if (!j) return A.toast('请先填完所有空'); cs.last = j; cs.runs.push(Object.assign({}, cs.ch)); p = { c: cs.ch }; }
    else { if (!A.U.pick[k]) return A.toast('请先选择一个选项'); p = { a: A.U.pick[k] }; }
    const right = K.supportTry(S, p); A.U.wrong[k] = !right; if (right) A._top = true; };

  /* 提示阶梯：4 级提示 + 撤除提示后的独立检测 */
  const ladder = (c) => `<ol class="ladder">${D.LADDER.map((l) => `<li class="${l.lv < 5 && l.lv >= c.startLevel && l.lv <= c.level ? 'on' : ''}${l.lv === c.level ? ' cur' : ''}${l.lv === 5 ? ' end' : ''}"><span>${l.lv === 5 ? A.icon('flag', 13) : 'L' + l.lv}</span><b>${l.name}</b></li>`).join('')}</ol>`;
  const dimLine = (S, st) => { if (st.dim === 'meta') return ['自我评价', '作答正确，但把握程度偏低']; const ds = K.diagnose(S).dims[st.dim]; return [K.DIM_NAME[st.dim], `${A.lv(ds)} ${A.evchips(ds.ids)}`]; };

  /* ---------- 辅导建议 ---------- */
  const proposal = (S, c) => { const st = ST(c); const [dn, dv] = dimLine(S, st);
    const alts = (c.alts.length ? c.alts : Object.keys(D.STRATEGIES).filter((x) => x !== 's6')).filter((x) => x !== c.strategy);
    return `<section class="card propose"><div class="pr-h"><span class="as-av">${A.icon('spark', 18)}</span><div><span class="eyebrow">辅导建议</span><h2>${st.name}</h2></div><span class="sp"></span><span class="tag">约 5 分钟</span></div>
      <p class="pitch">${st.pitch}</p>
      <dl class="kv3"><div><dt>薄弱点</dt><dd><b>${dn}</b>　${dv}</dd></div><div><dt>辅导方式</dt><dd>${st.short}</dd></div><div><dt>推荐依据</dt><dd>${c.reason}</dd></div>
        <div><dt>提示方式</dt><dd>${st.hints.length ? `提示分 4 级，从「${D.LADDER[c.startLevel - 1].name}」开始，需要时再升级。` : '本项辅导不包含解题提示。'}</dd></div></dl>
      <div class="actions"><button class="btn lg" data-act="saccept">开始辅导${A.icon('arrow', 17)}</button><button class="btn ghost" data-act="sswitch">更换方式</button><button class="btn plain" data-act="sdecline">跳过辅导</button></div>
      ${A.U.switching ? `<div class="alts"><p class="muted small">选择其他辅导方式：</p>${alts.map((id) => { const x = D.STRATEGIES[id]; return `<button class="alt" data-act="sto" data-id="${id}"><b>${x.name}</b><span>${x.short}</span><span class="tag">${x.dim === 'meta' ? '自我评价' : K.DIM_NAME[x.dim]}</span></button>`; }).join('')}</div>` : ''}</section>
      <p class="faint small" style="margin:12px 4px 0">辅导由你决定是否进行。跳过不影响能力评估，也不影响进入独立检测。</p>`; };

  /* ---------- 辅导练习 ---------- */
  const lowTable = (S) => { const evs = S.evidence.filter((e) => e.stage === 'rapid' || e.stage === 'deep').filter((e) => e.ok === 1);
    return `<table class="tbl"><thead><tr><th>作答记录</th><th>题型</th><th>结果</th><th>你的把握程度</th></tr></thead><tbody>${evs.map((e) => `<tr><td>${A.evchips([e.id])}</td><td>${e.kind}</td><td>${A.mark(1)} 正确</td><td>${e.conf ? (e.conf === 'low' ? `<span class="tag gold">${A.CONF[e.conf]}</span>` : A.CONF[e.conf]) : '<span class="faint">—</span>'}</td></tr>`).join('')}</tbody></table>
      <p class="info">以上 ${evs.length} 道题全部作答正确，其中 ${evs.filter((e) => e.conf === 'low').length} 道的把握程度为「不太确定」。实际表现高于自我评价。</p>`; };
  const working = (S, c) => { const st = ST(c), k = key(c), t = st.task; const wrong = A.U.wrong[k];
    const hints = st.hints.length ? `<section class="card hints"><div class="hints-h"><h3>提示</h3><span class="tag blue">提示等级 ${c.level} / 4</span></div>${ladder(c)}
      <ol class="hintlist">${st.hints.slice(c.startLevel - 1, c.level).map((h, i) => { const lv = c.startLevel + i; return `<li class="${lv === c.level ? 'new' : ''}"><span class="hl-k">L${lv} ${D.LADDER[lv - 1].name}</span><div>${h}</div></li>`; }).join('')}</ol></section>` : '';
    let body;
    if (t.kind === 'code') { const task = D.CODE[t.codeTask]; const cs = A.cst(k, task, c.level === 4 ? st.l4fill : null); body = `<p class="stem">${task.statement}</p>${A.codeBlock(k, task)}${wrong ? A.judgeTable(cs.last, { trace: true }) : ''}`; }
    else if (t.kind === 'reflect') body = `${lowTable(S)}<p class="stem" style="margin-top:18px">${t.stem}</p>${A.mcq(k, t.options)}`;
    else body = `<p class="stem">${t.stem}</p>${A.mcq(k, t.options)}`;
    const bar = wrong ? `<div class="wrongbar">${A.mark(0)}<div><b>${t.kind === 'code' ? '仍有测试点未通过。' : '回答不正确。'}</b><span>${c.capped ? '提示已到最高一级，建议结束本轮辅导或更换方式。' : c.level < 4 && st.hints.length ? '可以查看下一级提示，或修改后再次提交。' : '请对照提示修改后再次提交。'}</span></div><span class="sp"></span>
      ${c.capped ? '<button class="btn sm" data-act="sgiveup">结束本轮</button>' : c.level < 4 && st.hints.length ? '<button class="btn sm" data-act="shint">查看下一级提示</button>' : ''}<button class="btn ghost sm" data-act="sswitch">更换方式</button></div>` : '';
    const alts = Object.keys(D.STRATEGIES).filter((x) => x !== 's6' && x !== c.strategy);
    return `${hints}<section class="card q"><div class="qhead"><span class="qno">辅导练习</span><span class="tag blue">${st.name}</span>${st.dim === 'meta' ? '' : `<span class="tag">${K.DIM_NAME[st.dim]}</span>`}<span class="sp"></span><span class="faint small">已提交 ${c.tries} 次</span></div>${body}${bar}
      ${A.U.switching ? `<div class="alts">${alts.map((id) => { const x = D.STRATEGIES[id]; return `<button class="alt" data-act="sto" data-id="${id}"><b>${x.name}</b><span>${x.short}</span><span class="tag">${K.DIM_NAME[x.dim]}</span></button>`; }).join('')}</div>` : ''}
      <div class="actions">${!wrong && c.level < 4 && st.hints.length ? '<button class="btn plain" data-act="shint">查看下一级提示</button>' : ''}<span class="sp"></span><button class="btn plain" data-act="sgiveup">结束本轮</button><button class="btn" data-act="ssub">${t.kind === 'reflect' ? '确认' : '提交'}${A.icon('arrow', 16)}</button></div></section>`; };

  /* ---------- 本轮结束 ---------- */
  const rounds = (S) => { const rs = S.support.rounds; if (!rs.length) return '';
    return `<table class="tbl"><thead><tr><th>轮次</th><th>辅导方式</th><th>结果</th><th>提示等级</th><th></th></tr></thead><tbody>${rs.map((r, i) => { const st = D.STRATEGIES[r.strategy];
      return `<tr><td class="mono">${i + 1}</td><td>${st.name}</td><td>${r.decision === 'decline' ? '<span class="faint">已跳过</span>' : `${A.mark(r.solved ? 1 : 0)} ${r.solved ? '完成' : '未完成'}`}</td><td>${r.decision === 'decline' || !st.hints.length ? '<span class="faint">—</span>' : K.lvName(r.level)}</td><td>${r.ev ? A.evchips([r.ev]) : ''}</td></tr>`; }).join('')}</tbody></table>`; };
  const after = (S, c) => { const st = ST(c); const more = accepted(S).length < 3 && K.pickStrategy(S).primary;
    return `<section class="card"><div class="res-h">${A.mark(c.solved ? 1 : 0)}<h2>${c.solved ? '辅导练习完成' : '本轮辅导结束'}</h2><span class="sp"></span>${c.ev ? A.evchips([c.ev]) : ''}</div>
      <p>${st.task.kind === 'reflect' ? '已记录你的选择。后续的把握程度会继续与实际作答结果对照。' : c.solved ? `你在「${K.lvName(c.level)}」的提示下完成了练习。` : '提示已给到最高一级，练习仍未完成。建议更换辅导方式，或回到讲解重新学习相关内容。'}</p>
      ${st.hints.length ? `${ladder({ startLevel: 9, level: 5 })}<p class="info">辅导中完成的练习不计入掌握。接下来撤除全部提示，更换题目，由你独立完成检测。</p>` : ''}
      <div class="actions"><button class="btn lg" data-act="sdone">${nextLabel()}${A.icon('arrow', 17)}</button>${more ? '<button class="btn ghost" data-act="smore">再进行一轮辅导</button>' : ''}</div></section>
      <section class="card"><h2 class="sec-h">辅导记录</h2>${rounds(S)}</section>`; };

  A.views.support = () => { const S = A.S, sp = S.support, c = sp.cur; const head = (sub) => A.head('support', '针对辅导', sub);
    if (!S.deep.done) return { html: `${head()}<section class="card"><p class="empty">完成进阶练习后开放。</p></section>` };
    if (sp.done) return { html: `${head()}<section class="card"><h2>针对辅导已结束</h2><p class="muted">${accepted(S).length ? `共完成 ${accepted(S).length} 轮辅导。` : '本次没有进行辅导。'}</p>${rounds(S)}<div class="actions"><button class="btn" data-act="start" data-to="verify">前往独立检测${A.icon('arrow', 16)}</button></div></section>` };
    if (!c) return { html: `${head()}<section class="card"><div class="res-h">${A.mark(sp.none ? 1 : null)}<h2>${sp.none ? '当前不需要辅导' : '已跳过辅导'}</h2></div><p>${sp.none ? sp.noneReason : '你选择了跳过辅导。能力评估保持不变，可以直接进入独立检测。'}</p>
      <div class="actions"><button class="btn lg" data-act="sdone">${nextLabel()}${A.icon('arrow', 17)}</button>${!sp.none && K.pickStrategy(S).primary ? '<button class="btn ghost" data-act="smore">查看其他辅导建议</button>' : ''}</div></section>${sp.rounds.length ? `<section class="card"><h2 class="sec-h">辅导记录</h2>${rounds(S)}</section>` : ''}` };
    if (!c.decision) return { html: `${head('根据练习结果，为你匹配了一项辅导。')}${proposal(S, c)}` };
    if (c.finished) return { html: `${head()}${after(S, c)}` };
    return { html: `${head(`${ST(c).name} · ${ST(c).short}`)}${working(S, c)}` }; };
})();
