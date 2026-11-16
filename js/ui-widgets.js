/* 知证 KnowProof · 界面层：代码块、代码编辑器、判题结果 */
(function () {
  const A = window.A, esc = A.esc;

  /* 极简语法高亮：只处理注释、关键字和数字 */
  const hi = (line) => { const i = line.indexOf('//'); const code = i >= 0 ? line.slice(0, i) : line, cm = i >= 0 ? line.slice(i) : '';
    return esc(code).replace(/\b(int|long|bool|while|if|else|return|for|cout)\b|\b(\d+)\b/g, (m, k, n) => (k ? `<span class="kw">${k}</span>` : `<span class="nu">${n}</span>`)) + (cm ? `<span class="cm">${esc(cm)}</span>` : ''); };
  const rows = (lines) => lines.map((l, i) => `<span class="cl"><i>${i + 1}</i>${l || ' '}</span>`).join('');
  A.code = (text) => `<pre class="code">${rows(text.split('\n').map(hi))}</pre>`;

  /* 填空式代码：{blank} 位置渲染为下拉框。状态 A.U.code[key] = { ch 选择, runs 每次运行时的选择, last 最近一次判题结果 } */
  A.cst = (key, task, fill) => A.U.code[key] || (A.U.code[key] = { ch: Object.assign({}, task.initial || {}, fill || {}), runs: [], last: null });
  A.codeBlock = (key, task, o) => { o = o || {}; const st = o.value ? { ch: o.value } : A.cst(key, task);
    const sel = (b) => `<select class="blank${st.ch[b] ? ' set' : ''}" data-blank="${key}|${b}" aria-label="填空"${o.disabled ? ' disabled' : ''}><option value="">请选择</option>${task.blanks[b].map((op) => `<option value="${op[0]}"${st.ch[b] === op[0] ? ' selected' : ''}>${esc(op[1])}</option>`).join('')}</select>`;
    return `<pre class="code fill">${rows(task.lines.map((l) => l.split(/(\{\w+\})/).map((p) => (/^\{\w+\}$/.test(p) ? sel(p.slice(1, -1)) : hi(p))).join('')))}</pre>`; };

  /* 手写代码编辑器：学生只写函数体。状态 A.U.src[key] = { code, runs 每次运行时的源码, last } */
  A.sst = (key, prog) => A.U.src[key] || (A.U.src[key] = { code: prog.initial, runs: [], last: null });
  const nums = (code) => code.split('\n').map((_, i) => i + 1).join('\n');
  A.editor = (key, prog, o) => { o = o || {}; const st = A.sst(key, prog); const n = Math.max(9, st.code.split('\n').length + 1);
    return `<div class="editor"><div class="ed-h"><span class="dots"><i></i><i></i><i></i></span><span class="mono">${esc(prog.sig)} {</span><span class="sp"></span>${o.disabled ? '' : `<button class="ed-reset" data-act="edreset" data-key="${key}" data-prog="${prog.id}">恢复初始代码</button>`}</div>
      <div class="ed-b"><pre class="gut" data-gut="${key}">${nums(st.code + '\n')}</pre><textarea data-src="${key}" rows="${n}" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="代码编辑区"${o.disabled ? ' readonly' : ''}>${esc(st.code)}</textarea></div>
      <div class="ed-f mono">}</div></div>`; };
  A.edInput = (ta) => { const st = A.U.src[ta.dataset.src]; if (!st) return; st.code = ta.value; ta.rows = Math.max(9, ta.value.split('\n').length + 1);
    const g = document.querySelector(`[data-gut="${ta.dataset.src}"]`); if (g) g.textContent = nums(ta.value + '\n'); A.U.syntax = null; };
  A.acts.edreset = (d) => { A.U.src[d.key] = { code: A.D.PROG[d.prog].initial, runs: (A.U.src[d.key] || {}).runs || [], last: null }; };

  /* 执行过程：把一个测试点的循环逐轮列出来，标出区间不再变化的那一轮 */
  const norm = (r) => r.steps.map((s) => ('nl' in s ? { l: s.l, r: s.r, mid: s.mid, nl: s.nl, nr: s.nr, act: `l = ${s.nl}，r = ${s.nr}` }
    : { l: s.l, r: s.r, mid: s.mid, act: `条件${s.c ? '成立' : '不成立'} → ${s.act.replace('=', ' = ').replace(/([+-])/, ' $1 ')}`,
      nl: s.act === 'l=mid' ? s.mid : s.act === 'l=mid+1' ? s.mid + 1 : s.l, nr: s.act === 'r=mid' ? s.mid : s.act === 'r=mid-1' ? s.mid - 1 : s.r }));
  A.stuckAt = (r) => norm(r).findIndex((s) => s.nl === s.l && s.nr === s.r);
  A.traceBox = (r) => { const st = norm(r); if (!st.length) return ''; const k = st.findIndex((s) => s.nl === s.l && s.nr === s.r); const show = st.slice(0, k >= 0 ? k + 2 : 6);
    const say = r.verdict === 'TLE' ? (k >= 0 ? `第 ${k + 1} 轮结束后，l 和 r 都没有变化。之后每一轮都重复同样的计算，循环无法结束。` : '循环执行的轮数超出上限，没有停下来。')
      : r.verdict === 'RE' ? (r.msg || '运行过程中访问了数组范围之外的位置。') : `循环正常结束，输出 ${r.out}，期望输出 ${r.expect}。`;
    return `<div class="tracebox"><div class="tb-h">执行过程 · <span class="mono">${esc(r.show)}</span></div>
      <table class="trace"><thead><tr><th>轮次</th><th>l</th><th>r</th><th>mid</th><th>本轮执行</th></tr></thead><tbody>${show.map((s, i) => `<tr class="${i >= k && k >= 0 ? 'stuck' : ''}"><td>${i + 1}</td><td>${s.l}</td><td>${s.r}</td><td>${s.mid === undefined ? '—' : s.mid}</td><td>${esc(s.act)}</td></tr>`).join('')}${st.length > show.length ? '<tr><td colspan="5" class="more">……</td></tr>' : ''}</tbody></table>
      <p class="tb-say">${esc(say)}</p></div>`; };

  /* 判题结果。o.trace：附上第一个未通过测试点的执行过程；o.brief：只显示汇总 */
  A.judgeTable = (j, o) => { o = o || {}; if (!j) return '';
    const head = `<div class="jsum ${j.allAC ? 'ok' : 'no'}">${A.mark(j.allAC ? 1 : j.ac ? 0.5 : 0)}<b>${j.ce ? '编译错误' : j.allAC ? '全部通过' : `${j.ac} / ${j.total} 个测试点通过`}</b><span class="jbar">${j.results.map((r) => `<i class="${r.verdict}"></i>`).join('')}</span></div>`;
    if (j.ce) return `<div class="judge">${head}<p class="ce mono">${esc(j.ce)}</p></div>`;
    if (o.brief) return `<div class="judge">${head}</div>`;
    const bad = j.results.find((r) => r.verdict !== 'AC');
    return `<div class="judge">${head}<div class="jwrap"><table class="tbl jt"><thead><tr><th>#</th><th>输入</th><th>期望输出</th><th>实际输出</th><th>结果</th></tr></thead><tbody>${j.results.map((r, i) => `<tr><td class="mono">${i + 1}</td><td class="mono">${esc(r.show)}</td><td class="mono">${r.expect}</td><td class="mono">${r.out === null || r.out === undefined ? '—' : r.out}</td><td>${A.vd(r.verdict)}</td></tr>`).join('')}</tbody></table></div>
      ${o.trace && bad ? A.traceBox(bad) : ''}</div>`; };
})();
