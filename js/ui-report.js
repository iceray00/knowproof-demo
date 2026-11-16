/* 知证 KnowProof · 09 学习报告 */
(function () {
  const A = window.A, D = A.D, K = A.K, esc = A.esc;
  const KIND = { sys: ['系统', ''], proactive: ['AI 助教建议', 'blue'], ai: ['AI 助教', 'blue'], student: ['学生决定', 'gold'], ondemand: ['学生提问', 'gold'], reflect: ['学生回顾', 'gold'] };
  A.acts.print = () => { window.print(); return false; };

  A.views.report = () => { const S = A.S;
    if (!S.rapid.done) return { html: `${A.head('report', '学习报告')}<section class="card"><p class="empty">完成练习后生成学习报告。</p></section>` };
    const dg = K.diagnose(S), base = S.snaps.rapid, proven = K.proven(S), adv = K.pathAdvice(S); const tr = K.trace(S);
    const sealed = D.DIMS.filter((d) => dg.dims[d.id].phase === 'seal').length; const rounds = S.support.rounds.filter((r) => r.decision === 'accept').length;
    const mins = Math.max(1, Math.round((Date.now() - (S.evidence[0] ? S.evidence[0].t : Date.now())) / 60000));
    return { html: `${A.head('report', '学习报告', `二分查找 · ${new Date().toLocaleDateString('zh-CN')}`)}
      <section class="card vres ${proven ? 'pass' : 'partial'}"><div><span class="eyebrow">总评</span><h2>${proven ? '二分查找：已掌握' : '二分查找：待检测'}</h2><p>${A.labelTag(dg).replace(' big', '')}　${dg.label.detail}</p>
        <div class="rstats"><div><b>${sealed}<small> / 5</small></b><span>项能力已验证</span></div><div><b>${S.evidence.length}</b><span>条作答记录</span></div><div><b>${rounds}</b><span>轮针对辅导</span></div><div><b>${mins}</b><span>分钟</span></div></div></div>
        ${proven ? '<span class="stamp">已<br>掌握</span>' : ''}</section>
      <section class="card"><h2 class="sec-h"><span class="no">1</span>能力评估<small>虚线为基础练习后的初步评估</small></h2><div class="assess">${A.radar(dg, base)}${A.dimList(dg, { base })}</div>${A.legend3()}</section>
      <section class="card"><h2 class="sec-h"><span class="no">2</span>评估过程<small>每一步结论对应的作答记录</small></h2>
        <ol class="tl">${tr.map((s, i) => `<li class="${s.done ? 'done' : ''}"><span class="tl-n">${i + 1}</span><div><b>${s.t}</b>${s.done ? `<p>${esc(s.body)}</p>${s.ids.length ? `<div>${A.evchips(s.ids)}</div>` : ''}` : '<p class="faint">未进行</p>'}</div></li>`).join('')}</ol></section>
      <section class="card"><h2 class="sec-h"><span class="no">3</span>下一步</h2>
        ${proven ? `<p>「二分查找」已达到掌握标准，后续知识点「二分答案」「离散化」已解锁。${S.star5.status === 'pass' ? '' : '也可以回到学习路径挑战五星任务。'}</p><div class="actions"><button class="btn lg" data-act="home">返回知识地图${A.icon('arrow', 17)}</button><button class="btn ghost noprint" data-act="start" data-to="path">返回学习路径</button></div>`
          : `<p><b>${adv.title}。</b>${adv.why}</p><div class="actions"><button class="btn lg" data-act="start" data-to="path">返回学习路径${A.icon('arrow', 17)}</button><button class="btn ghost" data-act="home">返回知识地图</button></div>`}</section>
      <details class="fold"><summary>辅导与提问记录（${S.log.length} 条）</summary><div class="fold-b"><ul class="loglist">${S.log.map((l) => `<li><span class="faint mono">${A.fmtTime(l.t)}</span><span class="tag ${KIND[l.kind][1]}">${KIND[l.kind][0]}</span><span>${esc(l.text)}</span></li>`).join('')}</ul></div></details>
      <div class="actions noprint"><button class="btn ghost" data-act="print">打印 / 导出 PDF</button><button class="btn plain" data-act="drawer" data-v="ev">查看全部作答记录</button></div>
      <p class="faint small" style="margin-top:14px">判题、能力等级和学习路径由程序与固定规则计算；评估说明的文字在演示版本中为预设内容，正式版本由大模型生成并经过规则校验。</p>` }; };
})();
