/* 知证 KnowProof · 02 学习（上）：讲解 1 ~ 4 节、猜数字、分步演示 */
(function () {
  const A = window.A, D = A.D, K = A.K;
  const ask = (id) => { const q = A.L.QA.find((x) => x.id === id); return `<button class="asklink" data-act="ask" data-q="${id}">${A.icon('chat', 14)}问小证：${q.q}</button>`; };
  const sec = (n, title, body) => `<section class="card lesson" id="s${n}"><h2 class="sec-h"><span class="no">${String(n).padStart(2, '0')}</span>${title}</h2>${body}</section>`;
  const callout = (ic, html, warn) => `<div class="callout${warn ? ' warnc' : ''}"><span class="ic">${ic}</span><p>${html}</p></div>`;
  A.lesson = { ask, sec, callout, parts: [] };

  /* ---------- 互动演示一：猜数字 ---------- */
  const newGuess = () => ({ secret: 1 + Math.floor(Math.random() * 100), lo: 1, hi: 100, log: [], done: false, err: null });
  const guess = () => { const g = A.U.guess || (A.U.guess = newGuess()); const n = g.hi - g.lo + 1;
    return `<div class="guess"><div class="g-bar" role="img" aria-label="剩余范围 ${g.lo} 到 ${g.hi}"><div class="live" style="left:${g.lo - 1}%;width:${n}%"></div><div class="lab" style="left:${Math.min(g.lo - 1, 70)}%">${g.done ? `答案是 ${g.secret}` : `剩余范围 ${g.lo} ~ ${g.hi}，共 ${n} 个数`}</div></div>
      <div class="g-ctl">${g.done ? `<b>第 ${g.log.length} 次猜中。</b>` : `<input class="in" style="width:96px" inputmode="numeric" placeholder="${g.lo} ~ ${g.hi}" data-in="guess" data-enter="guess" value="${A.esc(A.U.ins.guess || '')}" aria-label="输入你猜的数"><button class="btn sm" data-act="guess" data-v="go">猜</button><button class="btn sm ghost" data-act="guess" data-v="mid">猜中间值 ${(g.lo + g.hi) >> 1}</button>`}
        <button class="btn sm plain" data-act="guess" data-v="reset">重新开始</button>${g.err ? `<span class="small" style="color:var(--bad)">${g.err}</span>` : ''}</div>
      ${g.log.length ? `<div class="g-log">${g.log.map((x, i) => `<span class="${x[1] === '猜对了' ? 'hit' : ''}">第 ${i + 1} 次　${x[0]}　${x[1]}</span>`).join('')}</div>` : ''}</div>`; };
  A.acts.guess = (d) => { let g = A.U.guess; if (d.v === 'reset' || !g) { A.U.guess = newGuess(); A.U.ins.guess = ''; return; } if (g.done) return;
    const v = d.v === 'mid' ? (g.lo + g.hi) >> 1 : parseInt(A.U.ins.guess, 10); A.U.ins.guess = '';
    if (!(v >= g.lo && v <= g.hi)) { g.err = `请输入 ${g.lo} ~ ${g.hi} 之间的整数`; return; } g.err = null;
    if (v === g.secret) { g.log.push([v, '猜对了']); g.lo = g.hi = v; g.done = true; } else if (v > g.secret) { g.log.push([v, '大了']); g.hi = v - 1; } else { g.log.push([v, '小了']); g.lo = v + 1; } };

  /* ---------- 互动演示二：分步执行 ---------- */
  const vizRun = () => { const v = A.U.viz, q = D.VIZ.q; const first = v.mode === 'first';
    return K.runBinary({ lo: 0, hi: q.length - 1, midPlus: first ? 0 : v.plus ? 1 : 0, check: (m) => (first ? q[m] >= v.x : q[m] <= v.x), onTrue: first ? 'r=mid' : 'l=mid', onFalse: first ? 'l=mid+1' : 'r=mid-1' }); };
  const viz = () => { const v = A.U.viz, q = D.VIZ.q, run = vizRun(); const first = v.mode === 'first';
    const stuck = A.stuckAt(run); const max = run.verdict === 'TLE' ? stuck + 1 : run.steps.length;
    const step = Math.min(v.step, max); const cur = run.steps[step] || null; const ended = step >= max;
    const l = cur ? cur.l : run.l, r = cur ? cur.r : run.r; const mid = cur && !ended ? cur.mid : null; const cmp = first ? '≥' : '≤';
    let say;
    if (ended && run.verdict === 'TLE') say = `<b>区间不再缩小。</b>l = ${l}、r = ${r} 时，mid = (${l} + ${r}) >> 1 = ${l}，执行 l = mid 后 l 仍然是 ${l}。之后每一轮都重复这一步，程序陷入死循环。`;
    else if (ended) { const hit = first ? q[l] >= v.x : q[l] <= v.x; say = `l 与 r 相遇，循环结束，停在下标 ${l}（值为 ${q[l]}）。${hit ? `它就是${first ? '第一个' : '最后一个'} ${cmp} ${v.x} 的元素。` : `但 ${q[l]} 并不 ${cmp} ${v.x}：<b>数组中没有满足条件的元素，循环结束后需要再判断一次。</b>`}`; }
    else say = `第 ${step + 1} 轮：mid = ${mid}，q[${mid}] = ${q[mid]}。${q[mid]} ${cmp} ${v.x} ${cur.c ? '成立' : '不成立'}，答案在${cur.act[0] === 'r' ? '左' : '右'}半部分，执行 <span class="mono">${cur.act.replace('=', ' = ').replace(/([+-])/, ' $1 ')}</span>。`;
    return `<div class="viz"><div class="viz-ctl"><span>查找</span><span class="seg">${[['first', '第一个 ≥ x'], ['last', '最后一个 ≤ x']].map((m) => `<button class="${v.mode === m[0] ? 'on' : ''}" data-act="viz" data-k="mode" data-v="${m[0]}">${m[1]}</button>`).join('')}</span>
      <span>x =</span><span class="seg">${D.VIZ.xs.map((x) => `<button class="${v.x === x ? 'on' : ''}" data-act="viz" data-k="x" data-v="${x}">${x}</button>`).join('')}</span>
      ${first ? '' : `<label class="toggle"><input type="checkbox" data-chk="vizplus"${v.plus ? '' : ' checked'}>去掉 mid 的 +1</label>`}</div>
      <div class="cells">${q.map((val, i) => `<div class="cell${i < l || i > r ? ' out' : ''}${i === mid ? ' mid' : ''}"><div class="p">${[i === l ? 'l' : '', i === mid ? 'mid' : '', i === r ? 'r' : ''].filter(Boolean).join(' ')}</div><div class="v">${val}</div><div class="i">${i}</div></div>`).join('')}</div>
      <p class="viz-say" aria-live="polite">${say}</p>
      <div class="actions" style="margin-top:12px"><button class="btn sm" data-act="viz" data-k="step" data-v="next"${ended ? ' disabled' : ''}>下一步</button><button class="btn sm ghost" data-act="viz" data-k="step" data-v="reset">重新演示</button><span class="faint small">灰色格子表示已被排除</span></div></div>`; };
  A.acts.viz = (d) => { const v = A.U.viz; if (d.k === 'step') v.step = d.v === 'next' ? v.step + 1 : 0; else { v[d.k] = d.k === 'x' ? +d.v : d.v; v.step = 0; if (d.k === 'mode') v.plus = true; } };

  A.lesson.parts.push(
    () => sec(1, '从猜数字说起', `<p>我在 1 ~ 100 之间选定一个整数，你每猜一次，我会回答「大了」「小了」或「猜对了」。怎样猜，才能用最少的次数保证猜中？</p>
      <p>从 1 开始逐个猜，最坏情况要猜 100 次。更好的办法是<span class="hl">每次都猜剩余范围的中间值</span>：无论回答是「大了」还是「小了」，都能一次排除一半的数。</p>${guess()}
      ${callout('7', '每次猜中间值，剩余范围按 100 → 50 → 25 → 12 → 6 → 3 → 1 缩小，<b>最多 7 次一定能猜中</b>。这就是二分查找的全部思想。')}`),
    () => sec(2, '什么是二分查找', `<p><b>二分查找</b>（binary search）是在<span class="hl">有序</span>数据中查找目标的方法：每次取中间位置的元素与目标比较，根据比较结果排除不可能包含目标的那一半，再在剩下的一半中重复这一过程。</p>
      <p>它成立的前提是数据有序。在乱序的数据里，比较中间元素之后，无法判断目标在左侧还是右侧，也就不能排除任何一半。</p>
      <div class="vs"><div><h4>顺序查找<span>逐个比较</span></h4><div class="bar"><i style="width:100%"></i></div><div class="num">1 000 000 次</div><p class="small muted">在 100 万个数中查找，最坏情况</p></div>
      <div class="fast"><h4>二分查找<span>每次排除一半</span></h4><div class="bar"><i style="width:2%"></i></div><div class="num">20 次</div><p class="small muted">同样的 100 万个数，最坏情况</p></div></div>${ask('sorted')}`),
    () => sec(3, '一步一步看过程', `<p>程序用两个变量 <code>l</code> 和 <code>r</code> 记录「答案可能所在范围」的左右端点（数组下标），<code>mid</code> 是这个范围的中间位置。</p>
      <p>每一轮比较 <code>q[mid]</code> 与 <code>x</code>，然后把 <code>l</code> 或 <code>r</code> 移到 mid 附近，范围缩小一半；当 <code>l</code> 与 <code>r</code> 相遇，范围内只剩一个位置，循环结束。点击「下一步」观察每一轮的变化。</p>${viz()}
      <p class="small muted">可以切换 x 的取值：x = 6 和 x = 0 在数组中不存在，注意循环结束时停在哪里。</p>`),
    () => sec(4, '把过程写成代码', `<p>把上面的过程写成代码，只有 7 行。下面的写法用来查找<b>第一个 ≥ x 的位置</b>：</p>
      <div class="anno">${A.code(D.TPL1)}<ol><li><b>第 1 行</b><span>l、r 是查找范围的两个端点，初始为整个数组</span></li><li><b>第 2 行</b><span>范围内不止一个位置时，继续循环</span></li><li><b>第 3 行</b><span>取中间位置；<code>&gt;&gt; 1</code> 表示除以 2 并向下取整</span></li>
        <li><b>第 4 行</b><span>q[mid] ≥ x：答案是 mid 或在它左边，右端点移到 mid</span></li><li><b>第 5 行</b><span>否则答案一定在 mid 右边，左端点移到 mid + 1</span></li><li><b>第 7 行</b><span>循环结束时 l 等于 r，就是要找的位置</span></li></ol></div>
      ${callout('!', '第 4 行写的是 <code>r = mid</code> 而不是 <code>r = mid - 1</code>：因为 mid 本身可能就是答案，不能把它排除在范围之外。')}`),
  );
})();
