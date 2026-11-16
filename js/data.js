/* 知证 KnowProof · 内容包（Content Package）
 * 知识体系按信息学竞赛常见教学顺序编排；题目、练习任务与学生数据均为演示用的模拟内容。 */
(function (root) {
  const UPD = [['l=mid', 'l = mid'], ['l=mid+1', 'l = mid + 1'], ['r=mid', 'r = mid'], ['r=mid-1', 'r = mid - 1']];
  const MID = [['0', 'l + r >> 1'], ['1', 'l + r + 1 >> 1']];
  const CMP = { lt: (a, x) => a < x, le: (a, x) => a <= x, ge: (a, x) => a >= x, gt: (a, x) => a > x, eq: (a, x) => a === x };
  const at = (q, i) => { if (i < 0 || i >= q.length) throw new Error('越界'); return q[i]; };
  const fmtQX = (t) => `q = [${t.q.join(', ')}]` + (t.x !== undefined ? `，x = ${t.x}` : '');

  const DIMS = [
    { id: 'concept', name: '概念理解', ask: '判断一个问题能否使用二分' },
    { id: 'reasoning', name: '算法推理', ask: '说明每一步操作的依据' },
    { id: 'code', name: '代码实现', ask: '写出边界正确的代码' },
    { id: 'complexity', name: '复杂度分析', ask: '估算程序的循环次数' },
    { id: 'transfer', name: '迁移能力', ask: '条件变化时独立调整写法' },
  ];
  const LEVELS = { 1: '尚未建立', 2: '发展中', 3: '独立掌握', 4: '灵活迁移' };

  /* name 是学生看到的名称；inner 是设计文档里的内部阶段名，只在演示台出现 */
  const STAGES = [
    { id: 'home', no: '01', name: '知识地图', inner: '知识点选择 Knowledge Selection' },
    { id: 'material', no: '02', name: '学习', inner: '学习材料 Learning Material' },
    { id: 'rapid', no: '03', name: '基础练习', inner: '快速诊断 Rapid Probe' },
    { id: 'state', no: '04', name: '练习结果', inner: '学习状态 Learning State（候选）' },
    { id: 'deep', no: '05', name: '进阶练习', inner: '深度诊断 Deep Probe' },
    { id: 'support', no: '06', name: '针对辅导', inner: '自适应支持 Adaptive Support' },
    { id: 'verify', no: '07', name: '独立检测', inner: '独立验证 Independent Verification' },
    { id: 'path', no: '08', name: '学习路径', inner: '路径推进 Learning Progression' },
    { id: 'report', no: '09', name: '学习报告', inner: '学习报告 Learning Report' },
  ];

  /* ---------- 知识地图（两层：章节 → 知识点） ----------
   * status：sealed 已掌握 / pending 待检测 / live 当前开放 / open 未开始；lock 表示前置知识点尚未掌握 */
  const N = (id, name, o) => Object.assign({ id, name, status: 'open' }, o || {});
  const TREE = [
    { id: 'm1', name: '基础算法', desc: '排序、二分、前缀和等最常用的基本技巧', nodes: [
      N('qsort', '快速排序', { status: 'sealed', when: '10 月 28 日' }),
      N('msort', '归并排序', { status: 'sealed', when: '11 月 6 日' }),
      N('bsearch', '二分查找', { status: 'live' }),
      N('bsans', '二分答案', { pre: ['bsearch'], lock: true }),
      N('presum', '前缀和与差分', { status: 'pending', when: '11 月 9 日学习，尚未完成独立检测' }),
      N('twoptr', '双指针'),
      N('bigint', '高精度运算'),
      N('bitop', '位运算'),
      N('discrete', '离散化', { pre: ['bsearch'], lock: true }),
      N('merge', '区间合并'),
    ] },
    { id: 'm2', name: '数据结构', desc: '用合适的结构组织数据，让操作更快', nodes: [
      N('stackq', '栈与队列', { status: 'sealed', when: '10 月 19 日' }),
      N('linked', '链表'),
      N('mono', '单调栈与单调队列', { pre: ['stackq'] }),
      N('kmp', 'KMP 字符串匹配'),
      N('trie', 'Trie 字典树'),
      N('dsu', '并查集'),
      N('heap', '堆'),
      N('hash', '哈希表'),
    ] },
    { id: 'm3', name: '搜索与图论', desc: '在状态空间和图上系统地寻找答案', nodes: [
      N('dfs', '深度优先搜索'),
      N('bfs', '广度优先搜索'),
      N('graph', '树与图的遍历', { pre: ['dfs', 'bfs'], lock: true }),
      N('topo', '拓扑排序', { pre: ['graph'], lock: true }),
      N('dijkstra', '最短路', { pre: ['graph', 'heap'], lock: true }),
      N('mst', '最小生成树', { pre: ['graph', 'dsu'], lock: true }),
      N('bipart', '二分图', { pre: ['graph'], lock: true }),
    ] },
    { id: 'm4', name: '数学知识', desc: '数论、组合与博弈的基本工具', nodes: [
      N('prime', '质数与约数'),
      N('qpow', '快速幂'),
      N('euler', '欧拉函数', { pre: ['prime'], lock: true }),
      N('exgcd', '扩展欧几里得', { pre: ['prime'], lock: true }),
      N('comb', '组合计数', { pre: ['qpow'], lock: true }),
      N('game', '博弈论'),
    ] },
    { id: 'm5', name: '动态规划', desc: '把大问题拆成有重叠的子问题', nodes: [
      N('bag', '背包问题'),
      N('lineardp', '线性 DP', { pre: ['bag'], lock: true }),
      N('rangedp', '区间 DP', { pre: ['lineardp'], lock: true }),
      N('bitdp', '状态压缩 DP', { pre: ['lineardp', 'bitop'], lock: true }),
      N('treedp', '树形 DP', { pre: ['lineardp', 'graph'], lock: true }),
      N('memo', '记忆化搜索', { pre: ['dfs'], lock: true }),
    ] },
    { id: 'm6', name: '贪心', desc: '每一步做当前最优的选择，并证明它正确', nodes: [
      N('greedyrange', '区间问题', { pre: ['qsort'] }),
      N('huffman', 'Huffman 树', { pre: ['heap'], lock: true }),
      N('ineq', '排序不等式'),
      N('formula', '推公式'),
    ] },
  ];

  /* 知识点简介：学习目标写成学生可以自查的「能做到什么」 */
  const NODE_INFO = {
    bsearch: {
      level: '入门', mins: 30, pre: ['数组', '循环与条件判断'],
      intro: '在有序的数据里，每比较一次就排除一半，用几十次比较找到十亿个数中的目标。',
      outcomes: [
        '判断一个问题能不能用二分，并说出理由',
        '独立写出不会死循环的整数二分代码',
        '正确处理边界，以及「要找的数不存在」的情况',
        '估算二分的循环次数，知道它为什么快',
        '在数组降序、问法改变等新情况下，自己改出正确写法',
      ],
      contents: ['图文讲解 8 节，含 2 个互动演示', '练习 3 组，共 11 题', '独立检测 1 次，通过后记为「已掌握」'],
    },
  };

  /* ---------- Rapid Probe ---------- */
  const TPL1 = `int l = 0, r = n - 1;
while (l < r) {
    int mid = l + r >> 1;
    if (q[mid] >= x) r = mid;
    else l = mid + 1;
}
cout << l;`;

  const RAPID = [
    { id: 'q1', type: '概念辨析', dim: 'concept', askConf: false,
      stem: '「这道题能不能用二分」，最关键看什么？',
      options: [
        ['A', '数据量够不够大，n 太小就没必要二分'],
        ['B', '能不能找到一个性质，让区间一边全都满足、另一边全都不满足'],
        ['C', '数组里有没有重复元素，有重复就不能二分', 'dup_forbid'],
        ['D', '数组长度是不是偶数，这样才能正好平分'],
      ], answer: 'B' },
    { id: 'q2', type: '代码输出预测', dim: 'reasoning', askConf: false,
      stem: '下面这段代码，输入 q = [1, 2, 2, 3, 3, 4]、x = 3。循环结束后输出的 l 是几？',
      code: TPL1,
      options: [['A', '2'], ['B', '3'], ['C', '4', 'first_last_mix'], ['D', '5']], answer: 'B' },
    { id: 'q3', type: '关键步骤判断', dim: 'reasoning', askConf: true,
      stem: '另一种写法里用的是 l = mid，这时 mid 必须写成 l + r + 1 >> 1。如果少写了这个 +1，会怎样？',
      options: [
        ['A', '没有影响，加不加只是个人习惯', 'mid_round'],
        ['B', '区间只剩两个数时，mid 会一直等于 l，区间不再缩小，死循环'],
        ['C', 'l + r 可能超出 int 范围，+1 是用来防溢出的', 'mid_round'],
        ['D', '不会出错，只是答案会比正确位置偏左一位', 'mid_round'],
      ], answer: 'B' },
    { id: 'q4', type: '边界情况判断', dim: 'code', askConf: true,
      stem: '用上面第 2 题那段代码找「第一个 ≥ x 的位置」。如果数组里根本没有 x，循环结束时会发生什么？',
      options: [
        ['A', '会死循环，所以进循环之前必须先判断 x 在不在数组里'],
        ['B', '正常结束，但 l 停在的位置上不一定是 x，要再判断一次 q[l] == x'],
        ['C', '正常结束，并且 l 一定等于 -1', 'no_exist_check'],
        ['D', '正常结束，并且 q[l] 一定等于 x，直接输出 l 就行', 'no_exist_check'],
      ], answer: 'B' },
  ];

  const MISC = {
    mid_round: { name: 'mid 取整方向与区间更新不配对', dim: 'reasoning', say: '没意识到 l = mid 必须配上取整（+1），否则区间可能不缩小' },
    no_exist_check: { name: '默认循环结束时 q[l] 就是答案', dim: 'code', say: '忽略了「目标不存在」时需要在循环后再检查一次' },
    dup_forbid: { name: '认为有重复元素就不能二分', dim: 'concept', say: '把「有序且不重复」当成了二分的前提' },
    first_last_mix: { name: '混淆「第一个」与「最后一个」的位置', dim: 'reasoning', say: '推演时没有跟住区间往哪一侧收' },
  };

  const REFLECT = {
    q3: { stem: '这道题的把握程度为「非常确定」，但作答有误。回顾作答过程，你认为主要原因是什么？',
      options: ['没有用具体的数推演，凭印象作答', '把 +1 的作用记成了别的（例如防止溢出）', '没有分清两种写法的区别'] },
    q4: { stem: '这道题的把握程度为「非常确定」，但作答有误。回顾作答过程，你认为主要原因是什么？',
      options: ['默认 x 一定在数组中', '没有考虑循环结束时 l 停在哪个位置', '记住了模板，但没有考虑「找不到」的情况'] },
  };

  /* ---------- 代码任务（由浏览器里的二分模拟器真实判题） ---------- */
  const CODE = {
    debug: {
      id: 'debug', name: '修复死循环', dims: ['code'],
      statement: '升序数组 q，输出<b>最后一个 ≤ x</b> 的元素下标（保证 q[0] ≤ x）。下面这段代码能通过样例，但提交后超时。请修改。',
      lines: ['int l = 0, r = n - 1;', 'while (l < r) {', '    int mid = {mid};', '    if (q[mid] <= x) {t};', '    else {f};', '}', 'cout << l;'],
      blanks: { mid: MID, t: UPD, f: UPD }, initial: { mid: '0', t: 'l=mid', f: 'r=mid-1' },
      tests: [{ q: [1, 5, 9], x: 1 }, { q: [1, 2, 2, 3], x: 2 }, { q: [1, 2], x: 1 }, { q: [3], x: 3 }, { q: [1, 3, 5, 7], x: 8 }, { q: [2, 4, 6, 8, 10], x: 5 }],
      fmt: fmtQX,
      setup: (c, t) => ({ lo: 0, hi: t.q.length - 1, midPlus: +c.mid, check: (m) => at(t.q, m) <= t.x, onTrue: c.t, onFalse: c.f }),
      output: (c, t, l) => l,
      expect: (t) => { let a = 0; t.q.forEach((v, i) => { if (v <= t.x) a = i; }); return a; },
    },
    variant: {
      id: 'variant', name: '降序数组中的二分', dims: ['transfer'],
      statement: '数组 q 按<b>降序</b>排列，例如 [9, 7, 5, 3, 1]。输出<b>第一个 ≤ x</b> 的元素下标（保证存在）。请补全代码。',
      lines: ['int l = 0, r = n - 1;', 'while (l < r) {', '    int mid = {mid};', '    if ({cond}) {t};', '    else {f};', '}', 'cout << l;'],
      blanks: { mid: MID, cond: [['le', 'q[mid] <= x'], ['ge', 'q[mid] >= x'], ['lt', 'q[mid] < x'], ['gt', 'q[mid] > x']], t: UPD, f: UPD },
      tests: [{ q: [9, 7, 5, 3, 1], x: 5 }, { q: [9, 7, 5, 3, 1], x: 6 }, { q: [9, 7, 7, 7, 1], x: 7 }, { q: [4], x: 4 }, { q: [8, 2], x: 2 }, { q: [8, 2], x: 9 }, { q: [10, 8, 6, 4, 2, 0], x: 3 }],
      fmt: fmtQX,
      setup: (c, t) => ({ lo: 0, hi: t.q.length - 1, midPlus: +c.mid, check: (m) => CMP[c.cond](at(t.q, m), t.x), onTrue: c.t, onFalse: c.f }),
      output: (c, t, l) => l,
      expect: (t) => t.q.findIndex((v) => v <= t.x),
    },
    scode: {
      id: 'scode', name: '不超过 x 的最大数', dims: ['code'],
      statement: '升序数组 q，输出<b>不超过 x 的最大的数</b>；如果数组里所有数都比 x 大，输出 -1。',
      lines: ['int l = 0, r = n - 1;', 'while (l < r) {', '    int mid = {mid};', '    if (q[mid] <= x) {t};', '    else {f};', '}', 'if ({post}) cout << q[l];', 'else cout << -1;'],
      blanks: { mid: MID, t: UPD, f: UPD, post: [['le', 'q[l] <= x'], ['inr', 'l < n'], ['ge0', 'l >= 0']] },
      tests: [{ q: [1, 2, 2, 3, 3, 4], x: 3 }, { q: [1, 3, 5, 7], x: 6 }, { q: [1, 2], x: 1 }, { q: [1, 2], x: 2 }, { q: [2], x: 2 }, { q: [2], x: 1 }, { q: [4, 6, 8], x: 3 }, { q: [1, 1, 1], x: 9 }],
      fmt: fmtQX,
      setup: (c, t) => ({ lo: 0, hi: t.q.length - 1, midPlus: +c.mid, check: (m) => at(t.q, m) <= t.x, onTrue: c.t, onFalse: c.f }),
      output: (c, t, l) => { const ok = c.post === 'le' ? at(t.q, l) <= t.x : c.post === 'inr' ? l < t.q.length : l >= 0; return ok ? at(t.q, l) : -1; },
      expect: (t) => { let a = -1; t.q.forEach((v) => { if (v <= t.x) a = v; }); return a; },
    },
    vcode: {
      id: 'vcode', name: '找前驱', dims: ['code', 'reasoning'], star: 3,
      statement: '升序数组 q（可能有重复）。输出<b>最后一个严格小于 x</b> 的元素下标；如果没有比 x 小的数，输出 -1。',
      lines: ['int l = 0, r = n - 1;', 'while (l < r) {', '    int mid = {mid};', '    if ({cond}) {t};', '    else {f};', '}', 'if ({post}) cout << l;', 'else cout << -1;'],
      blanks: { mid: MID, cond: [['lt', 'q[mid] < x'], ['le', 'q[mid] <= x'], ['ge', 'q[mid] >= x']], t: UPD, f: UPD, post: [['lt', 'q[l] < x'], ['eq', 'q[l] == x'], ['le', 'q[l] <= x']] },
      tests: [{ q: [1, 2, 2, 3, 5], x: 3 }, { q: [1, 2, 2, 3, 5], x: 1 }, { q: [1, 2, 2, 3, 5], x: 6 }, { q: [4], x: 4 }, { q: [4], x: 9 }, { q: [1, 1, 1, 1], x: 1 }, { q: [1, 3, 5, 7, 9, 11], x: 8 }, { q: [2, 2], x: 3 }],
      fmt: fmtQX,
      setup: (c, t) => ({ lo: 0, hi: t.q.length - 1, midPlus: +c.mid, check: (m) => CMP[c.cond](at(t.q, m), t.x), onTrue: c.t, onFalse: c.f }),
      output: (c, t, l) => (CMP[c.post](at(t.q, l), t.x) ? l : -1),
      expect: (t) => { let a = -1; t.q.forEach((v, i) => { if (v < t.x) a = i; }); return a; },
    },
    star4: {
      id: 'star4', name: '旋转数组的最小值', dims: ['transfer'], star: 4,
      statement: '一个元素互不相同的升序数组，从某个位置断开后，前半段被接到了后半段的后面，例如 [4, 5, 6, 7, 0, 1, 2]（也可能没有断开）。数组整体不再有序。请在 O(log n) 时间内输出<b>数组中的最小值</b>。',
      lines: ['int l = 0, r = n - 1;', 'while (l < r) {', '    int mid = {mid};', '    if ({cond}) {t};', '    else {f};', '}', 'cout << q[l];'],
      blanks: { mid: MID, cond: [['last', 'q[mid] <= q[n - 1]'], ['first', 'q[mid] >= q[0]'], ['next', 'q[mid] <= q[mid + 1]']], t: UPD, f: UPD },
      tests: [{ q: [4, 5, 6, 7, 0, 1, 2] }, { q: [1, 2, 3, 4, 5] }, { q: [2, 1] }, { q: [7] }, { q: [3, 4, 5, 1, 2] }, { q: [5, 1, 2, 3, 4] }, { q: [2, 3, 4, 5, 1] }, { q: [3, 1, 2] }],
      fmt: fmtQX,
      setup: (c, t) => ({ lo: 0, hi: t.q.length - 1, midPlus: +c.mid,
        check: (m) => (c.cond === 'last' ? at(t.q, m) <= t.q[t.q.length - 1] : c.cond === 'first' ? at(t.q, m) >= t.q[0] : at(t.q, m) <= at(t.q, m + 1)),
        onTrue: c.t, onFalse: c.f }),
      output: (c, t, l) => at(t.q, l),
      expect: (t) => Math.min(...t.q),
    },
    star5: {
      id: 'star5', name: '分巧克力', dims: ['transfer', 'reasoning', 'code'], star: 5,
      statement: '有 n 块长方形巧克力，第 i 块是 h[i] × w[i]。要从中切出<b>至少 k 块</b>大小相同的<b>正方形</b>，边长必须是整数。输出正方形边长的最大值（保证至少能切出 k 块 1 × 1 的正方形）。',
      lines: ['bool check(int mid) {', '    long long cnt = 0;', '    for (int i = 0; i < n; i++) cnt += {cnt};', '    return {ret};', '}', '', 'int l = 1, r = 100000;', 'while (l < r) {', '    int mid = {mid};', '    if (check(mid)) {t};', '    else {f};', '}', 'cout << l;'],
      blanks: { cnt: [['grid', '(h[i] / mid) * (w[i] / mid)'], ['area', '(h[i] * w[i]) / (mid * mid)'], ['edge', 'min(h[i], w[i]) / mid']], ret: [['ge', 'cnt >= k'], ['gt', 'cnt > k'], ['eq', 'cnt == k']], mid: MID, t: UPD, f: UPD },
      tests: [{ p: [[6, 5], [5, 6]], k: 10 }, { p: [[1, 100]], k: 1 }, { p: [[10, 10]], k: 1 }, { p: [[10, 10]], k: 4 }, { p: [[3, 3], [3, 3]], k: 3 }, { p: [[7, 9], [4, 4]], k: 2 }],
      fmt: (t) => `${t.p.map((a) => a.join('×')).join('、')}，k = ${t.k}`,
      setup: (c, t) => ({ lo: 1, hi: 100000, midPlus: +c.mid, onTrue: c.t, onFalse: c.f,
        check: (m) => { let cnt = 0; for (const [h, w] of t.p) cnt += c.cnt === 'grid' ? Math.floor(h / m) * Math.floor(w / m) : c.cnt === 'area' ? Math.floor((h * w) / (m * m)) : Math.floor(Math.min(h, w) / m);
          return c.ret === 'ge' ? cnt >= t.k : c.ret === 'gt' ? cnt > t.k : cnt === t.k; } }),
      output: (c, t, l) => l,
      expect: (t) => { for (let s = 200; s >= 1; s--) { let cnt = 0; for (const [h, w] of t.p) cnt += Math.floor(h / s) * Math.floor(w / s); if (cnt >= t.k) return s; } return 0; },
    },
  };

  /* ---------- 手写代码任务（由 cmini.js 解释执行学生写的函数体） ---------- */
  const FIX_SRC = `int l = 0, r = n - 1;
while (l < r) {
    int mid = l + r >> 1;
    if (q[mid] <= x) l = mid;
    else r = mid - 1;
}
return l;`;
  const FIX_OK = `int l = 0, r = n - 1;
while (l < r) {
    int mid = l + r + 1 >> 1;
    if (q[mid] <= x) l = mid;
    else r = mid - 1;
}
if (q[l] != x) return -1;
return l;`;
  const VPROG_SRC = `// 第一步（已给出）：找到 x 第一次出现的位置
int l = 0, r = n - 1;
while (l < r) {
    int mid = l + r >> 1;
    if (q[mid] >= x) r = mid;
    else l = mid + 1;
}
if (q[l] != x) return 0;
int first = l;

// 第二步（请补全）：找到 x 最后一次出现的位置，返回 x 出现的次数
`;
  const VPROG_OK = VPROG_SRC + `l = first; r = n - 1;
while (l < r) {
    int mid = l + r + 1 >> 1;
    if (q[mid] <= x) l = mid;
    else r = mid - 1;
}
return l - first + 1;`;
  const VPROG_BAD = VPROG_SRC + `l = first; r = n - 1;
while (l < r) {
    int mid = l + r >> 1;
    if (q[mid] <= x) l = mid;
    else r = mid - 1;
}
return l - first + 1;`;
  const PROG = {
    fix: {
      id: 'fix', name: '修复有错误的代码', dims: ['code'], sig: 'int find(int q[], int n, int x)',
      statement: '函数 find 应当返回 x 在升序数组 q 中<b>最后一次出现</b>的下标；如果 q 中没有 x，返回 -1（1 ≤ n ≤ 10<sup>5</sup>）。下面这份代码提交后，一部分测试点超时，一部分答案错误。<b>请找出并修复其中的全部错误。</b>',
      initial: FIX_SRC, sampleOk: FIX_OK, sampleBad: FIX_SRC.replace('l + r >> 1', 'l + r + 1 >> 1'),
      tests: [{ q: [1, 2, 2, 3, 3, 4], x: 3 }, { q: [1, 2, 2, 3, 3, 4], x: 5 }, { q: [1, 2], x: 1 }, { q: [1, 2], x: 2 }, { q: [2], x: 2 }, { q: [2], x: 1 }, { q: [1, 3, 5], x: 4 }, { q: [1, 1, 1], x: 1 }],
      fmt: fmtQX, args: (t) => ({ q: t.q, n: t.q.length, x: t.x }), expect: (t) => t.q.lastIndexOf(t.x),
    },
    vprog: {
      id: 'vprog', name: '统计出现次数', dims: ['code'], sig: 'int count(int q[], int n, int x)',
      statement: '函数 count 应当返回 x 在升序数组 q 中<b>出现的次数</b>（1 ≤ n ≤ 10<sup>5</sup>，要求时间复杂度 O(log n)）。第一步已经写好，请<b>补全第二步</b>。',
      initial: VPROG_SRC, sampleOk: VPROG_OK, sampleBad: VPROG_BAD,
      tests: [{ q: [1, 2, 2, 3, 3, 3, 4], x: 3 }, { q: [1, 2, 2, 3, 3, 3, 4], x: 2 }, { q: [1, 2, 2, 3], x: 5 }, { q: [5], x: 5 }, { q: [5, 5], x: 5 }, { q: [1, 5, 5], x: 5 }, { q: [1, 3, 5], x: 4 }, { q: [2, 2, 2, 2, 7], x: 2 }],
      fmt: fmtQX, args: (t) => ({ q: t.q, n: t.q.length, x: t.x }), expect: (t) => t.q.filter((v) => v === t.x).length,
    },
  };

  /* ---------- 进阶练习任务库（内部：Deep Probe） ---------- */
  const DEEP = {
    explain: { id: 'explain', kind: 'text', type: '概念解释', dims: ['concept'], name: '用自己的话解释',
      why: '基础练习中的概念题没有答对，这道题用来了解你对二分原理的实际理解',
      prompt: '不查看讲解，用两三句话说明：<b>二分查找为什么每次可以排除一半的元素？什么样的问题才能使用二分？</b>',
      placeholder: '写下你的理解即可，不需要和讲解里的说法一致',
      rubric: [
        { id: 'p1', name: '说明了使用前提：有序 / 单调 / 存在一条分界线', re: /(有序|单调|二段|分界|分成两|一边.{0,12}(另一边|一边)|排好序|从小到大)/ },
        { id: 'p2', name: '说明了另一半为什么可以排除', re: /(不可能|一定不|肯定不|排除|扔掉|不用看|不用找|不在|都比|全都)/ },
      ] },
    followup: { id: 'followup', kind: 'text', type: '说明理由', dims: ['reasoning'], name: '说明你的理由',
      why: '基础练习全部答对，但有两题的把握程度选了「不太确定」，这道题用来确认你的作答依据',
      prompt: '基础练习第 3 题你选择了正确答案。请用一两句话说明：<b>为什么写 l = mid 时，mid 要多加 1？</b>',
      placeholder: '可以举一个只有两个数的例子',
      rubric: [
        { id: 'p1', name: '指出了后果：区间不再缩小 / 死循环', re: /(死循环|卡住|不缩小|不变|出不来|无限|一直循环|停不下来|不会结束)/ },
        { id: 'p2', name: '指出了原因：只剩两个数时 mid 向下取整等于 l', re: /(两个|相邻|下取整|向下取整|只剩|等于\s*l|还是\s*l|r\s*-\s*1|l\s*\+\s*1)/ },
      ] },
    counter: { id: 'counter', kind: 'counter', type: '构造反例', dims: ['reasoning'], name: '构造一组让程序出错的输入',
      why: '基础练习第 3 题的作答与正确结论相反，且把握程度为「非常确定」，这道题让你亲手验证这一判断',
      prompt: '下面这段程序要输出<b>最后一个 ≤ x</b> 的元素下标（保证 q[0] ≤ x）。它能通过样例，但存在错误。请<b>构造一组输入，使它陷入死循环</b>。',
      codeTask: 'debug', sample: { q: [1, 5, 9], x: 1 },
      whyStem: '这段程序陷入死循环的原因是什么？',
      whyOptions: [['A', 'x 比数组里所有数都大，所以找不到'], ['B', '区间只剩两个数时，mid 的计算结果等于 l，执行 l = mid 后区间没有变化'], ['C', '数组里有重复元素，二分无法处理重复'], ['D', 'r = mid - 1 使 r 跑到了 l 的左边']],
      whyAnswer: 'B' },
    complexity: { id: 'complexity', kind: 'mcq', type: '复杂度分析', dims: ['complexity'], name: '估算循环次数',
      why: '基础练习没有涉及复杂度分析，这里补充一题',
      stem: '有序数组长度 n = 1 000 000，用二分查找，循环最多大约要执行多少次？',
      options: [['A', '20 次左右'], ['B', '1 000 次左右'], ['C', '500 000 次左右'], ['D', '1 000 000 次']], answer: 'A' },
    fix: { id: 'fix', kind: 'src', type: '代码改错', dims: ['code'], prog: 'fix', name: '修复有错误的代码',
      why: '检验你能否在一份完整代码里定位并修复边界错误' },
    variant: { id: 'variant', kind: 'code', type: '变式应用', dims: ['transfer'], codeTask: 'variant', name: '数组变成了降序',
      why: '检验条件变化后，你能否独立调整写法，而不是套用固定模板' },
  };

  /* ---------- 教学策略库 + 支架阶梯 ---------- */
  const LADDER = [
    { lv: 1, name: '方向提示', desc: '指出应当关注的位置' },
    { lv: 2, name: '局部示例', desc: '给出一个最小的例子，由你推演' },
    { lv: 3, name: '关键结构提示', desc: '给出循环不变量等关键结论' },
    { lv: 4, name: '部分解法', desc: '给出部分解法，其余由你完成' },
    { lv: 5, name: '独立检测', desc: '撤除全部提示，更换题目独立完成' },
  ];

  const traceTable = (rows) => `<table class="trace"><thead><tr><th>轮次</th><th>l</th><th>r</th><th>mid</th><th>执行</th></tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

  const STRATEGIES = {
    s1: { id: 's1', name: '概念讲解', theory: 'Supportive Information', dim: 'concept', short: '回到「分界线」这一基本原理，重新建立判断标准',
      pitch: '你对「什么样的问题可以用二分」的判断还不稳定。建议回到二分的基本原理，通过一道辨析题重新建立这个判断标准。',
      task: { kind: 'mcq', stem: '下面哪个问题<b>不能</b>直接用二分？',
        options: [['A', '在升序数组里找第一个 ≥ x 的数'], ['B', '一本按页码装订的书，翻到第 x 页'], ['C', '在一个乱序数组里找等于 x 的数'], ['D', '猜数字游戏：每猜一次，对方告诉你「大了」还是「小了」']], answer: 'C' },
      hints: [
        '先不考虑是不是数组，只关注一点：<b>查看一个位置之后，能否断定答案在它的哪一侧？</b>',
        '以猜数字为例：范围 1 ~ 100，猜 50，回答「大了」，于是 50 ~ 100 全部排除。能一次排除一半，是因为「大了」对右侧的每一个数都成立。',
        '把每个位置标上 ✗ 或 ✓。可以二分的问题，一定能排成 <span class="mono">✗ ✗ ✗ ✓ ✓ ✓</span> 的形式，中间只有一条分界线。在乱序数组中，查看中间的数之后，无法对左右两侧作出任何判断。',
        'A、B、D 三项都能画出 <span class="mono">✗ ✗ ✓ ✓</span> 这样的分界线（≥ x 的数、页码 ≥ x 的页、不小于答案的数）。剩下的一项能画出来吗？',
      ] },
    s2: { id: 's2', name: '反例引导', theory: 'Self-explanation / 反例', dim: 'reasoning', short: '用一个最小的例子逐步推演，找出原有判断出错的位置',
      pitch: '你对「区间每一轮是否真的缩小」的判断存在偏差。建议用一个只有两个数的最小例子，逐步推演一次。',
      task: { kind: 'mcq', stem: '区间只剩 l = 3、r = 4。代码是 <span class="mono">mid = l + r >> 1; if (check(mid)) l = mid; else r = mid - 1;</span> 如果 check(3) 为真，<b>下一轮的区间是什么？</b>',
        options: [['A', '[4, 4]，循环结束'], ['B', '[3, 4]，和这一轮一模一样'], ['C', '[3, 3]，循环结束'], ['D', '[4, 3]，越界了']], answer: 'B' },
      hints: [
        '先计算：<span class="mono">(3 + 4) >> 1</span> 等于几？',
        '看一个更小的例子：l = 0、r = 1。' + traceTable([['1', '0', '1', '0', 'check 为真 → l = mid = 0'], ['2', '0', '1', '0', '与上一轮完全相同']]),
        '循环不变量：<b>每一轮结束后，r - l 必须严格变小。</b>要通过 l = mid 缩小区间，mid 就不能等于 l。',
        'mid = 3，恰好等于 l。执行 l = mid 之后，l 仍然是 3，r 仍然是 4。所以下一轮的区间是 [ ? , ? ]。',
      ] },
    s3: { id: 's3', name: '代码提示', theory: 'Procedural Support', dim: 'code', short: '由你完成代码，系统只在出错的位置给出分级提示',
      pitch: '你的思路正确，错误集中在代码的边界处理上。建议换一道题重新实现，系统会在出错的位置给出分级提示。',
      task: { kind: 'code', codeTask: 'scode' },
      hints: [
        '写代码前先检查两点：① 区间只剩两个数时，它还能继续缩小吗？② 循环结束时，l 所在位置的数<b>一定</b>满足要求吗？',
        '用 q = [1, 2]、x = 1 推演 <span class="mono">mid = l + r >> 1; l = mid;</span>' + traceTable([['1', '0', '1', '0', 'q[0] ≤ 1 → l = mid = 0'], ['2', '0', '1', '0', '区间没有变化']]),
        '两条结论：<b>l = mid 配上取整（+1），r = mid 配下取整。</b>循环只负责把区间缩小到一个位置；这个位置是否满足要求，需要在循环结束后再判断一次。',
        '前两个空（mid 的取法、条件成立时的更新）已填好。请完成剩下两个空：条件不成立时如何更新，以及循环结束后如何判断。',
      ], l4fill: { mid: '1', t: 'l=mid' } },
    s4: { id: 's4', name: '分步示例', theory: 'Worked Example', dim: 'complexity', short: '跟着分步示例推导循环次数，再独立完成一次估算',
      pitch: '你还没有形成估算二分循环次数的稳定方法。建议跟着一个分步示例完整推一遍。',
      task: { kind: 'mcq', stem: '假设有一个长度 n = 10<sup>9</sup> 的有序数组，二分最多大约循环多少次？',
        options: [['A', '30 次左右'], ['B', '1 000 次左右'], ['C', '约 31 623 次（√n）'], ['D', '5 × 10<sup>8</sup> 次']], answer: 'A' },
      hints: [
        '只关注一个量：<b>每循环一次，尚未排除的区间长度变为原来的多少？</b>',
        '以 n = 8 为例：8 → 4 → 2 → 1，共缩小 3 次，而 2<sup>3</sup> = 8。',
        '循环 k 次之后，区间长度为 n / 2<sup>k</sup>。长度为 1 时结束，所以 2<sup>k</sup> = n，k = log<sub>2</sub> n。',
        '已知 2<sup>10</sup> ≈ 1000，那么 10<sup>9</sup> = 1000 × 1000 × 1000 ≈ 2<sup>10</sup> × 2<sup>10</sup> × 2<sup>10</sup> = 2<sup>?</sup>',
      ] },
    s5: { id: 's5', name: '变式训练', theory: 'Transfer Task', dim: 'transfer', short: '同一原理换一种条件，练习从分界线出发推导写法',
      pitch: '标准写法已经稳定，但条件变化后容易套错模板。建议回到降序数组那道题，换一种分析方法重新完成。',
      task: { kind: 'code', codeTask: 'variant' },
      hints: [
        '先不套用模板。在<b>降序</b>数组中，满足「≤ x」的数集中在左侧还是右侧？',
        '以 q = [9, 7, 5, 3, 1]、x = 5 为例，标出满足「≤ 5」的位置：<span class="mono">✗ ✗ ✓ ✓ ✓</span>。要找的是 ✓ 这一段的最左端。',
        '答案在「满足段」的<b>左端</b>：mid 满足时，答案在 mid 或它左边，所以收右边界，而且不能把 mid 丢掉；mid 不满足时，答案一定在 mid 右边。',
        '判断条件和条件成立时的更新已填好。请完成剩下两个空：mid 的取法，以及条件不成立时如何更新。',
      ], l4fill: { cond: 'le', t: 'r=mid' } },
    s6: { id: 's6', name: '对照作答记录', theory: 'Metacognitive Support', dim: 'meta', short: '把自我评价和实际作答结果放在一起对照',
      pitch: '你的作答是正确的，但自我评价明显偏低。建议对照自己的作答记录，重新校准对掌握程度的判断。',
      task: { kind: 'reflect', stem: '以后遇到没有把握的二分题，你准备用什么方法判断自己的代码是否正确？',
        options: [['A', '用只有两个数的小例子在草稿纸上推演'], ['B', '先提交，根据评测结果再修改'], ['C', '对照题解'], ['D', '凭感觉判断']] },
      hints: [] },
  };

  /* ---------- 独立检测 ---------- */
  const VERIFY = {
    code: 'vcode', prog: 'vprog',
    mcq: [
      { id: 'v2', dim: 'concept', stem: '下面哪个场景可以用二分？',
        options: [['A', '一排路灯里随机坏了几盏，找出任意一盏坏的'], ['B', '一排路灯从某一盏开始，后面的全坏了、前面的都亮着，找第一盏坏的'], ['C', '每盏路灯亮度毫无规律，找最亮的那一盏'], ['D', '坏灯的位置毫无规律，数一数一共坏了几盏']], answer: 'B' },
      { id: 'v3', dim: 'complexity', stem: '把有序数组的长度从 n 扩大到 n²，二分查找的循环次数大约变成原来的多少？',
        options: [['A', '2 倍'], ['B', 'n 倍'], ['C', '平方'], ['D', '基本不变']], answer: 'A' },
    ],
  };

  const STARS = [
    { n: 1, name: '基础识别', desc: '判断这道题能不能二分' },
    { n: 2, name: '基础实现', desc: '写对标准的二分代码' },
    { n: 3, name: '综合理解', desc: '脱离提示，处理边界和找不到的情况' },
    { n: 4, name: '独立迁移', desc: '在新约束下独立完成任务', exit: '标准出口' },
    { n: 5, name: '综合挑战', desc: '竞赛风格的综合题', exit: '挑战出口' },
  ];

  /* ---------- 学习材料里的互动演示 ---------- */
  const VIZ = { q: [1, 2, 2, 3, 3, 4, 5, 7], xs: [3, 6, 0] };

  /* ---------- 模拟学生（演示不同分支；非真实数据） ----------
   * outcome：[练习后的评估, 匹配的辅导方式, 独立检测后的推荐路径]，由 /tmp 下的回归脚本逐项核对 */
  const OK_V = { mid: '1', cond: 'lt', t: 'l=mid', f: 'r=mid-1', post: 'lt' };
  const OK_S4 = { mid: '0', cond: 'last', t: 'r=mid', f: 'l=mid+1' };
  const OK_S5 = { cnt: 'grid', ret: 'ge', mid: '1', t: 'l=mid', f: 'r=mid-1' };
  const OK_VAR = { mid: '0', cond: 'le', t: 'r=mid', f: 'l=mid+1' };
  const OK_SC = { mid: '1', t: 'l=mid', f: 'r=mid-1', post: 'le' };
  const FIX_HALF = FIX_SRC.replace('return l;', 'if (q[l] != x) return -1;\nreturn l;');
  const V_OK = { code: OK_V, v2: 'B', v3: 'A', prog: VPROG_OK };

  const PERSONAS = {
    me: { id: 'me', name: '我', tag: '自己作答', desc: '每一步由你本人操作，系统根据实际作答给出评估和路径。', script: null },
    A: { id: 'A', name: '周小北', tag: '基础薄弱', desc: '概念、推理、代码都没有建立，且自己清楚没有把握。',
      outcome: ['基础知识缺口', '概念讲解 → 分步示例', '检测部分通过 → 补差'],
      script: { rapid: { q1: ['C'], q2: ['C'], q3: ['A', 'low'], q4: ['A', 'low'] },
        deep: { explain: { text: '因为数组是有序的，所以每次看中间的数，比它大就去右边找。' }, fix: { runs: [PROG.fix.sampleBad] } },
        support: [{ decision: 'accept', tries: [{ a: 'A' }, { a: 'C' }] }, { decision: 'accept', tries: [{ a: 'C' }, { a: 'A' }] }],
        verify: { code: { mid: '0', cond: 'lt', t: 'l=mid', f: 'r=mid-1', post: 'lt' }, v2: 'B', v3: 'A', prog: null }, path: ['report'] } },
    B: { id: 'B', name: '林一舟', tag: '会讲不会写', desc: '概念和推演都正确，写代码时在边界上出错。',
      outcome: ['典型认知误解（代码实现）', '代码提示', '检测通过 → 拔高 → 四星通过 → 下一知识点'],
      script: { rapid: { q1: ['B'], q2: ['B'], q3: ['B', 'mid'], q4: ['D', 'high'] }, reflect: 0,
        deep: { complexity: { a: 'A' }, fix: { runs: [PROG.fix.sampleBad, FIX_OK] }, variant: { runs: [OK_VAR] } },
        support: [{ decision: 'accept', tries: [{ c: { mid: '1', t: 'l=mid', f: 'r=mid-1', post: 'ge0' } }, { c: OK_SC }] }],
        verify: V_OK, path: ['star4', 'report'], star4: OK_S4 } },
    C: { id: 'C', name: '陈可', tag: '迁移不足', desc: '标准题全部正确，条件一变就套错模板。',
      outcome: ['基础掌握，迁移不足', '变式训练', '检测通过 → 拔高 → 四星通过 → 下一知识点'],
      script: { rapid: { q1: ['B'], q2: ['B'], q3: ['B', 'high'], q4: ['B', 'high'] },
        deep: { complexity: { a: 'A' }, fix: { runs: [FIX_OK] }, variant: { runs: [{ mid: '0', cond: 'ge', t: 'r=mid', f: 'l=mid+1' }, { mid: '1', cond: 'ge', t: 'l=mid', f: 'r=mid-1' }, { mid: '0', cond: 'lt', t: 'r=mid', f: 'l=mid+1' }] } },
        support: [{ decision: 'accept', tries: [{ c: { mid: '0', cond: 'ge', t: 'l=mid+1', f: 'r=mid' } }, { c: OK_VAR }] }],
        verify: V_OK, path: ['star4', 'report'], star4: OK_S4 } },
    D: { id: 'D', name: '沈知远', tag: '学有余力', desc: '各项表现稳定，不需要辅导，主动挑战到五星。',
      outcome: ['表现稳定，待独立检测', '无需辅导', '检测通过 → 拔高 → 四星、五星通过 → 挑战出口'],
      script: { rapid: { q1: ['B'], q2: ['B'], q3: ['B', 'high'], q4: ['B', 'high'] },
        deep: { complexity: { a: 'A' }, fix: { runs: [FIX_OK] }, variant: { runs: [OK_VAR] } }, support: [],
        verify: V_OK, path: ['star4', 'star5', 'report'], star4: OK_S4, star5: OK_S5 } },
    E: { id: 'E', name: '许安安', tag: '信心不足', desc: '全部答对，但总选「不太确定」。',
      outcome: ['掌握但信心不足', '对照作答记录（元认知）', '检测通过 → 推荐拔高（停在路径选择）'],
      script: { rapid: { q1: ['B'], q2: ['B'], q3: ['B', 'low'], q4: ['B', 'low'] },
        deep: { followup: { text: '如果区间只剩两个数，不加 1 的话 mid 向下取整就等于 l，l = mid 之后区间没变，会死循环。' }, fix: { runs: [FIX_OK] }, variant: { runs: [OK_VAR] } },
        support: [{ decision: 'accept', tries: [{ a: 'A' }] }],
        verify: V_OK, path: ['report'] } },
    F: { id: 'F', name: '赵一鸣', tag: '高自信错误', desc: '很确定地答错，是典型的认知误解。',
      outcome: ['典型认知误解（算法推理）', '反例引导', '检测通过 → 拔高 → 四星未通过 → 补差（迁移）'],
      script: { rapid: { q1: ['B'], q2: ['B'], q3: ['A', 'high'], q4: ['B', 'mid'] }, reflect: 0,
        deep: { counter: { tries: [{ q: [2, 4, 6, 8], x: 3 }, { q: [1, 2], x: 1 }], why: 'D' }, fix: { runs: [FIX_HALF, FIX_OK] }, variant: { runs: [OK_VAR] } },
        support: [{ decision: 'accept', tries: [{ a: 'C' }, { a: 'B' }] }],
        verify: V_OK, path: ['star4', 'report'], star4: { mid: '0', cond: 'first', t: 'l=mid+1', f: 'r=mid' } } },
  };

  const DATA = { DIMS, LEVELS, STAGES, TREE, NODE_INFO, RAPID, MISC, REFLECT, CODE, PROG, DEEP, LADDER, STRATEGIES, VERIFY, STARS, VIZ, PERSONAS, TPL1 };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA; else root.KP_DATA = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
