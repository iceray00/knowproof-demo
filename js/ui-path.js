/* 知证 KnowProof · 08 学习路径：补差 / 拔高 / 下一知识点，由规则推荐，学生决定 */
(function () {
  const A = window.A, D = A.D, K = A.K, esc = A.esc;
  const LANES = [
    { id: 'remed', name: '补差', icon: 'book', when: '独立检测或四星任务未通过', then: '针对未通过的能力再辅导一轮，然后重新检测' },
    { id: 'deepen', name: '拔高', icon: 'up', when: '独立检测通过，迁移能力尚未验证', then: '完成四星任务，在新的条件下独立解题' },
    { id: 'next', name: '下一知识点', icon: 'flag', when: '五项能力全部通过验证', then: '解锁「二分答案」，可选五星挑战' },
  ];
  const LANE_NAME = { remed: '补差', deepen: '拔高', next: '下一知识点' };
  const starState = (S, n) => (n <= 3 ? (S.verify.status === 'pass' ? 'pass' : S.verify.status && S.verify.status !== 'skipped' ? 'try' : null) : S['star' + n].status);

  A.acts.pact = (d) => { const S = A.S, id = d.id; A.U.starRes = null;
    if (id === 'verify') return A.go('verify');
    if (id === 'reverify') { A.acts.vredo(); A.go('verify'); return; }
    if (id === 'support') { S.support.done = false; K.offer(S, 'path'); A.U.wrong = {}; Object.keys(A.U.code).filter((k) => k.startsWith('sup-')).forEach((k) => delete A.U.code[k]); return A.go('support'); }
    if (id === 'star4' || id === 'star5') { delete A.U.code[id]; A.U.pathTask = +id.slice(4); A._top = true; return; }
    S.path.choice = d.label; if (id === 'explore') S.paused = true; A.go('report'); };
  A.acts.pquit = () => { A.U.pathTask = null; A._top = true; };
  A.acts.psub = () => { const S = A.S, n = A.U.pathTask, task = D.CODE['star' + n]; const st = A.cst('star' + n, task); if (!K.complete(task, st.ch)) return A.toast('请先填完所有空');
    K.starSubmit(S, n, st.ch); S.path.choice = n === 4 ? '完成四星任务' : '挑战五星任务'; A.U.pathTask = null; A.U.starRes = n; A.U.stamp = S['star' + n].status === 'pass'; A._top = true; };

  /* ---------- 星级任务 ---------- */
  const starTask = (n) => { const task = D.CODE['star' + n], s = D.STARS[n - 1];
    return `${A.head('path', n === 4 ? '四星任务' : '五星挑战', `${s.name} · ${s.desc}`)}
      <div class="rules"><span>${A.icon('star', 15)}${'★'.repeat(n)}</span><span>${A.icon('lock', 15)}无提示，不可运行测试</span><span>${A.icon('flag', 15)}提交后判题</span></div>
      <section class="card q"><div class="qhead"><span class="qno">${task.name}</span><span class="tag blue">代码填空</span><span class="tag">${task.dims.map((x) => K.DIM_NAME[x]).join('、')}</span></div>
        <p class="stem">${task.statement}</p>${A.codeBlock('star' + n, task)}
        <div class="actions"><button class="btn plain" data-act="pquit">返回学习路径</button><span class="sp"></span><button class="btn lg" data-act="psub">提交${A.icon('arrow', 17)}</button></div></section>`; };
  const starResult = (S, n) => { const st = S['star' + n], ok = st.status === 'pass';
    return `<section class="card vres ${ok ? 'pass' : 'partial'}"><div><span class="eyebrow">${n === 4 ? '四星任务' : '五星挑战'} · ${D.CODE['star' + n].name}</span><h2>${ok ? '通过' : '未通过'}</h2>
      <p>${ok ? (n === 4 ? '迁移能力通过验证。五项能力全部达到要求，「二分查找」记为「已掌握」。' : '综合挑战完成，迁移能力记为 L4。') : (n === 4 ? '条件变化后的写法仍有错误，迁移能力暂未通过验证。' : '本次挑战未通过，不影响已有的掌握结论。')}</p>
      ${ok ? '' : `<details class="fold"><summary>查看判题详情</summary><div class="fold-b">${A.judgeTable(st.judge, { trace: true })}</div></details>`}</div>
      ${ok ? `<span class="stamp${A.U.stamp ? ' drop' : ''}">${n === 4 ? '已<br>掌握' : '挑战<br>完成'}</span>` : ''}</section>`; };

  /* ---------- 路径页 ---------- */
  const stars = (S, adv) => { const target = adv.options[0].id === 'star4' ? 4 : adv.options[0].id === 'star5' ? 5 : S.verify.status === 'pass' ? 0 : 3;
    return `<ol class="starline">${D.STARS.map((s) => { const st = starState(S, s.n);
      return `<li class="${st === 'pass' ? 'ok' : ''}${s.n === target ? ' target' : ''}"><span class="stars">${'★'.repeat(s.n)}</span><b>${s.name}</b><span>${s.desc}</span>
        <em>${st === 'pass' ? '已达成' : st ? '未通过' : s.n === target ? '当前目标' : '未开始'}</em>${s.exit ? `<i>${s.exit}</i>` : ''}</li>`; }).join('')}</ol>`; };
  const rules = (adv) => `<details class="fold"><summary>路径是如何推荐的</summary><div class="fold-b"><p class="muted small">学习路径按以下固定规则推荐。AI 助教只负责说明理由，不能修改规则，也不能解锁知识点。</p>
    <table class="tbl"><thead><tr><th>条件</th><th>推荐</th><th>路径</th></tr></thead><tbody>${K.PATH_RULES.map((r, i) => `<tr class="${i === adv.rule ? 'hit' : ''}"><td>${r.when}</td><td>${r.then}</td><td><span class="tag ${i === adv.rule ? 'blue' : ''}">${LANE_NAME[r.lane]}</span>${i === adv.rule ? ' <b class="small">当前</b>' : ''}</td></tr>`).join('')}</tbody></table></div></details>`;
  const optBtn = (o, cls) => `<button class="${cls}" data-act="pact" data-id="${o.id}" data-label="${esc(o.label)}">`;

  A.views.path = () => { const S = A.S;
    if (!S.deep.done) return { html: `${A.head('path', '学习路径')}<section class="card"><p class="empty">完成进阶练习后开放。</p></section>` };
    if (A.U.pathTask) return { html: starTask(A.U.pathTask) };
    const adv = K.pathAdvice(S), main = adv.options[0], dg = K.diagnose(S);
    return { html: `${A.head('path', '学习路径', '根据检测结果推荐下一步。你可以采纳推荐，也可以选择其他路径。')}
      ${A.U.starRes ? starResult(S, A.U.starRes) : ''}
      <section class="card rec lane-${adv.rec}"><div class="rec-h"><span class="eyebrow">推荐路径</span>${A.labelTag(dg, '当前评估：').replace(' big', '')}</div><h2>${adv.title}</h2><p class="rec-why">${adv.why}</p>
        <div class="rec-go"><div><b>${main.label}</b><span>${main.desc}</span></div>${optBtn(main, 'btn lg')}开始${A.icon('arrow', 17)}</button></div></section>
      <section class="card"><h2 class="sec-h">三条路径<small>每条路径对应一种检测结果</small></h2>
        <div class="lanes">${LANES.map((l) => `<div class="lane${l.id === adv.rec ? ' on' : ''}"><div class="lane-h"><span class="lane-ic">${A.icon(l.icon, 17)}</span><b>${l.name}</b>${l.id === adv.rec ? '<span class="tag blue">当前推荐</span>' : ''}</div><dl><dt>适用情况</dt><dd>${l.when}</dd><dt>学习内容</dt><dd>${l.then}</dd></dl></div>`).join('')}</div></section>
      ${adv.options.length > 1 ? `<section class="card"><h2 class="sec-h">其他选择</h2><div class="others">${adv.options.slice(1).map((o) => `${optBtn(o, 'other')}<span class="tag">${LANE_NAME[o.lane]}</span><b>${o.label}</b><span>${o.desc}</span><em>适用于：${o.fit}</em></button>`).join('')}</div></section>` : ''}
      <section class="card"><h2 class="sec-h">掌握标准<small>达到四星即记为「已掌握」</small></h2>${stars(S, adv)}</section>
      ${rules(adv)}` }; };
})();
