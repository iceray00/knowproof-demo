/* 知证 KnowProof · 演示台：汇报时使用，学生端不可见的内容都放在这里 */
(function () {
  const A = window.A, D = A.D, K = A.K, L = A.L, esc = A.esc;
  const fresh = (persona) => { A.S = K.newSession(persona); A.U = A.freshU(); A._top = true; };

  A.acts.persona = (d) => { fresh(d.id); const p = D.PERSONAS[d.id]; A.toast(d.id === 'me' ? '已切换为自己作答' : `已切换为模拟学生：${p.name}（${p.tag}）`); };
  A.acts.scene = (d) => { const sc = L.SCENES.find((x) => x.id === d.id); fresh(sc.persona); K.autoTo(A.S, sc.to);
    if (sc.star4) { K.starSubmit(A.S, 4, D.PERSONAS[sc.persona].script.star4); A.S.path.choice = '完成四星任务'; A.U.starRes = 4; } A.toast(sc.note); };
  A.acts.dauto = () => { const S = A.S; if (S.stage === 'report') return A.toast('已经是最后一个环节'); K.auto(S); A.U = A.freshU(); A._top = true; };
  A.acts.djump = (d) => { const S = A.S; if (K.stageIdx(d.to) > K.stageIdx(S.stage)) K.autoTo(S, d.to); else K.go(S, d.to); A.U = A.freshU(); A._top = true; };
  A.acts.dfill = (d) => { const p = D.PROG[d.prog]; A.sst(d.key, p).code = d.v === 'ok' ? p.sampleOk : p.sampleBad; A.U.syntax = null; A.U.drawer = null; A.toast(d.v === 'ok' ? '已填入可通过的代码' : '已填入仍有错误的代码'); };
  A.acts.dfillv = () => { const V = D.VERIFY; A.U.code.vcode = { ch: { mid: '1', cond: 'lt', t: 'l=mid', f: 'r=mid-1', post: 'lt' }, runs: [], last: null }; V.mcq.forEach((q) => { A.U.pick[q.id] = q.answer; });
    A.sst('vprog', D.PROG[V.prog]).code = D.PROG[V.prog].sampleOk; A.U.drawer = null; A.toast('已填入 4 道题的参考答案'); };
  A.acts.dllm = () => { const S = A.S; S.flags.llmBad = !S.flags.llmBad; if (S.deep.plan && !S.deep.idx && !S.deep.done) S.deep.plan = K.pickDeep(S); };

  const fills = (S) => { const out = [];
    if (S.stage === 'deep' && S.deep.plan && !S.deep.done && !A.U.deepRes && S.deep.plan.tasks[S.deep.idx] === 'fix') out.push(['deep-fix', 'fix']);
    if (S.stage === 'verify' && (!S.verify.status || A.U.redo)) out.push(['vprog', 'vprog']); return out; };

  A.drawers.demo = () => { const S = A.S, st = D.STAGES[K.stageIdx(S.stage)], ds = L.DESIGN[S.stage]; const fl = fills(S);
    const body = `<div class="demo-sec"><h3>当前环节的设计说明</h3><div class="design"><h4>${st.name}</h4><div class="inner">内部名称：${st.inner || st.name}</div>
        <dl><div><dt>理论依据</dt><dd>${ds.theory}</dd></div><div><dt>设计机制</dt><dd>${ds.how}</dd></div><div><dt>不确定性与责任</dt><dd>${ds.risk}</dd></div></dl></div></div>
      <div class="demo-sec"><h3>直达场景</h3><div class="scenes">${L.SCENES.map((sc) => `<button class="scene" data-act="scene" data-id="${sc.id}"><b>${sc.name}</b><span>${sc.note}</span></button>`).join('')}</div></div>
      <div class="demo-sec"><h3>模拟学生</h3><div class="personas">${Object.values(D.PERSONAS).map((p) => `<button class="persona${S.persona === p.id ? ' on' : ''}" data-act="persona" data-id="${p.id}"><b>${p.name}</b><span class="tag">${p.tag}</span>
        <p>${p.desc}</p>${p.outcome ? `<p class="oc">${p.outcome.join('<br>')}</p>` : ''}</button>`).join('')}</div><p class="faint small" style="margin-top:8px">切换学生会开始一次新的学习。模拟学生按预设表现作答，评估与路径仍由引擎实时计算。</p></div>
      <div class="demo-sec"><h3>快进</h3><div class="rowbtns"><button class="btn sm" data-act="dauto">自动完成当前环节</button>${D.STAGES.slice(1).map((x) => `<button class="btn ghost sm${x.id === S.stage ? ' cur' : ''}" data-act="djump" data-to="${x.id}">${x.name}</button>`).join('')}</div>
        <p class="faint small" style="margin-top:8px">快进时按当前模拟学生的预设表现作答${S.persona === 'me' ? '（「自己作答」时借用赵一鸣的预设）' : ''}。</p></div>
      ${fl.length || (S.stage === 'verify' && (!S.verify.status || A.U.redo)) ? `<div class="demo-sec"><h3>快捷填入</h3><div class="rowbtns">${fl.map(([k, p]) => `<button class="btn ghost sm" data-act="dfill" data-key="${k}" data-prog="${p}" data-v="ok">编程题：填入正确代码</button><button class="btn ghost sm" data-act="dfill" data-key="${k}" data-prog="${p}" data-v="bad">编程题：填入错误代码</button>`).join('')}
        ${S.stage === 'verify' ? '<button class="btn ghost sm" data-act="dfillv">独立检测：填入全部参考答案</button>' : ''}</div></div>` : ''}
      <div class="demo-sec"><h3>异常情况演示</h3><label class="swt"><input type="checkbox" data-chk="llm"${S.flags.llmBad ? ' checked' : ''}><span><b>模拟大模型输出不合规</b><br><span class="muted small">模型推荐了内容库之外的练习。规则校验会拒绝该输出并按规则回退，可在「练习结果 → 查看评估依据」中看到。需在进阶练习开始前打开。</span></span></label></div>
      <div class="demo-sec"><h3>真实与模拟</h3><table class="tbl"><thead><tr><th>模块</th><th>演示版本</th></tr></thead><tbody>
        <tr><td>判题（填空题、手写代码）</td><td><span class="tag green">真实</span> 浏览器内解释执行</td></tr><tr><td>能力评估、学习路径</td><td><span class="tag green">真实</span> 固定规则实时计算</td></tr>
        <tr><td>评估说明、辅导话术</td><td><span class="tag gold">模拟</span> 预设文本，代替大模型</td></tr><tr><td>AI 助教问答</td><td><span class="tag gold">模拟</span> 预设问答，部分读取作答记录</td></tr>
        <tr><td>文字作答评阅</td><td><span class="tag gold">模拟</span> 关键词规则</td></tr><tr><td>其余知识点、账号</td><td><span class="tag gold">模拟</span> 静态数据</td></tr></tbody></table></div>`;
    return { title: '演示台', sub: '仅供汇报使用', body, cls: 'wide', foot: `<div class="rowbtns"><button class="btn ghost sm" data-act="restart">清空记录，重新开始</button><span class="sp"></span><span class="faint small">当前：${D.PERSONAS[S.persona].name} · ${st.name}</span></div>` }; };

  document.addEventListener('change', (e) => { if (e.target.dataset && e.target.dataset.chk === 'llm') { A.acts.dllm(); A.save(); A.render(); } });
})();
