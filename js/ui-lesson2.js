/* 知证 KnowProof · 02 学习（下）：讲解 5 ~ 8 节与页面组装 */
(function () {
  const A = window.A, D = A.D, { ask, sec, callout, parts } = A.lesson;
  const TOC = ['从猜数字说起', '什么是二分查找', '一步一步看过程', '把过程写成代码', '二分的本质：找分界线', '常见错误', '为什么这么快', '例题与小结'];
  const strip = (q, ok, cut) => `<div class="strip" role="img" aria-label="分界线示意">${q.map((v, i) => `${i === cut ? '<u></u>' : ''}<i class="${ok(v) ? 'y' : ''}">${v}</i>`).join('')}</div>`;
  const rounds = (rows) => `<table class="trace"><thead><tr><th>轮次</th><th>l</th><th>r</th><th>mid</th><th>q[mid]</th><th>执行</th></tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

  parts.push(
    () => sec(5, '二分的本质：找分界线', `<p>把数组 <code>[1, 2, 2, 3, 3, 4, 5, 7]</code> 的每个位置按「是否满足 q[i] ≥ 3」标记，结果一定是：前一段全部不满足，后一段全部满足，中间只有<span class="hl">一条分界线</span>。</p>
      ${strip(D.VIZ.q, (v) => v >= 3, 3)}<p class="small muted">红色：不满足 q[i] ≥ 3　绿色：满足</p>
      <p>二分查找做的事情，就是找到这条分界线。按照要找的是「第一个满足条件的位置」还是「最后一个满足条件的位置」，有两种写法：</p>
      <div class="two"><div><h4>写法一：第一个满足条件的位置</h4>${A.code('int mid = l + r >> 1;\nif (check(mid)) r = mid;\nelse l = mid + 1;')}</div><div><h4>写法二：最后一个满足条件的位置</h4>${A.code('int mid = l + r + 1 >> 1;\nif (check(mid)) l = mid;\nelse r = mid - 1;')}</div></div>
      ${callout('!', '<b>写法二的 mid 必须多加 1。</b>区间只剩两个数时，<code>l + r &gt;&gt; 1</code> 的结果等于 l，执行 <code>l = mid</code> 后区间没有变化，程序会陷入死循环。可以回到第 3 节，选择「最后一个 ≤ x」并勾选「去掉 mid 的 +1」验证。', true)}
      ${ask('plus1', 'tpl')}`),
    () => sec(6, '常见错误', `<div class="pits">
      <div class="pit"><span class="n">1</span><div><h4>死循环</h4><p>使用了 <code>l = mid</code>，但 mid 没有加 1。区间只剩两个数时不再缩小。</p></div></div>
      <div class="pit"><span class="n">2</span><div><h4>没有处理「找不到」</h4><p>循环只保证 l 停在某一个位置，不保证这个位置上的数就是 x。循环结束后需要再判断一次 <code>q[l] == x</code>。</p></div></div>
      <div class="pit"><span class="n">3</span><div><h4>l + r 溢出</h4><p>l、r 很大时，<code>l + r</code> 可能超出 int 的范围。可以写成 <code>l + (r - l) / 2</code>。</p></div></div>
      <div class="pit"><span class="n">4</span><div><h4>对无序数据使用二分</h4><p>使用前先确认：数据有序，或者能找到一条分界线。</p></div></div></div>${ask('overflow')}`),
    () => sec(7, '为什么这么快', `<p>每循环一次，查找范围缩小一半。长度为 n 的数组缩小到只剩 1 个位置，大约需要 log<sub>2</sub>n 次，时间复杂度记作 <b>O(log n)</b>。</p>
      <table class="tbl" style="margin-top:12px"><thead><tr><th>数组长度 n</th><th>顺序查找（最坏）</th><th>二分查找（最坏）</th></tr></thead><tbody>
      <tr><td class="mono">10</td><td class="mono">10 次</td><td class="mono"><b>4 次</b></td></tr><tr><td class="mono">1 000</td><td class="mono">1 000 次</td><td class="mono"><b>10 次</b></td></tr>
      <tr><td class="mono">1 000 000</td><td class="mono">1 000 000 次</td><td class="mono"><b>20 次</b></td></tr><tr><td class="mono">1 000 000 000</td><td class="mono">1 000 000 000 次</td><td class="mono"><b>30 次</b></td></tr></tbody></table>
      ${callout('≈', '估算方法：2<sup>10</sup> ≈ 1000。数组长度每扩大 1000 倍，二分只需要多循环 10 次。')}`),
    () => sec(8, '例题与小结', `<p><b>例题</b>　升序数组 <code>q = [1, 3, 3, 3, 5, 8]</code>，求 <code>x = 3</code> 的起始位置和终止位置（下标从 0 开始）。如果数组中没有 x，输出 <code>-1 -1</code>。</p>
      <p><b>第一步：起始位置</b>，即第一个 ≥ 3 的位置，使用写法一。</p>${rounds([[1, 0, 5, 2, 3, '3 ≥ 3 成立 → r = 2'], [2, 0, 2, 1, 3, '3 ≥ 3 成立 → r = 1'], [3, 0, 1, 0, 1, '1 ≥ 3 不成立 → l = 1']])}
      <p>循环结束，l = 1。检查 q[1] = 3，等于 x，起始位置为 <b>1</b>。如果这里 q[l] ≠ x，说明数组中没有 x，直接输出 -1 -1。</p>
      <p><b>第二步：终止位置</b>，即最后一个 ≤ 3 的位置，使用写法二（mid 加 1）。</p>${rounds([[1, 0, 5, 3, 3, '3 ≤ 3 成立 → l = 3'], [2, 3, 5, 4, 5, '5 ≤ 3 不成立 → r = 3']])}
      <p>循环结束，l = 3，终止位置为 <b>3</b>。答案：<code>1 3</code>。</p>
      <h3 style="margin-top:20px">小结</h3><ul class="sumlist" style="margin-top:8px">${['使用二分的前提是存在一条分界线，数据有序是最常见的情形', '每一轮比较中间位置并排除一半，时间复杂度为 O(log n)', 'r = mid 配 l + r >> 1；l = mid 配 l + r + 1 >> 1', '循环结束后，需要判断停下的位置是否真的是答案'].map((t) => `<li>${A.icon('ok', 15, 2.6)}<span>${t}</span></li>`).join('')}</ul>`),
  );

  A.acts.sec = (d) => { A.U.sec = +d.i; A.U.amb = {}; A._top = true; };
  A.views.material = () => { const n = parts.length, k = Math.min(A.U.sec, n - 1); const no = (i) => String(i + 1).padStart(2, '0');
    return { html: `<div class="page-h lesson-h"><div><span class="eyebrow">基础算法 · 学习</span><h1>二分查找</h1></div><button class="btn ghost sm" data-act="start" data-to="rapid">已学过，直接练习</button></div>
      <nav class="secnav" aria-label="本节目录">${TOC.map((t, i) => `<button class="${i === k ? 'cur' : i < k ? 'done' : ''}" data-act="sec" data-i="${i}" title="${t}"${i === k ? ' aria-current="step"' : ''}><i>${no(i)}</i><span>${t}</span></button>`).join('')}</nav>
      ${parts[k]()}
      <div class="actions secfoot">${k > 0 ? `<button class="btn ghost" data-act="sec" data-i="${k - 1}">${A.icon('back', 16)}上一节</button>` : ''}<span class="sp"></span><span class="faint small">第 ${k + 1} / ${n} 节</span>
        ${k < n - 1 ? `<button class="btn" data-act="sec" data-i="${k + 1}">下一节：${TOC[k + 1]}${A.icon('arrow', 16)}</button>` : `<button class="btn lg" data-act="start" data-to="rapid">开始练习（4 题）${A.icon('arrow', 17)}</button>`}</div>` }; };
})();
