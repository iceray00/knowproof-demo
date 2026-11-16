/* 知证 KnowProof · 迷你 C 解释器
 * 在浏览器里真实执行学生写的函数体（C 的一个子集），用于「改错」和「编程补全」两类任务的判题。
 * 支持：int / long long 声明、赋值与复合赋值、++ --、算术 / 比较 / 逻辑 / 移位运算、数组下标（越界检查）、
 *       if / else、while、for、break、continue、return、注释。运算符优先级与 C 一致（l + r >> 1 即 (l + r) >> 1）。 */
(function (root) {
  const KW = new Set(['int', 'long', 'if', 'else', 'while', 'for', 'return', 'break', 'continue', 'bool', 'true', 'false', 'const', 'unsigned']);
  const OPS = ['<<=', '>>=', '++', '--', '+=', '-=', '*=', '/=', '%=', '==', '!=', '<=', '>=', '&&', '||', '<<', '>>', '+', '-', '*', '/', '%', '<', '>', '=', '!', '(', ')', '[', ']', '{', '}', ';', ',', '?', ':', '&', '|', '^'];
  function CErr(msg, line) { this.msg = msg; this.line = line; }
  function Signal(kind, value) { this.kind = kind; this.value = value; }

  function lex(src) {
    const toks = []; let i = 0, line = 1; const n = src.length;
    while (i < n) {
      const c = src[i];
      if (c === '\n') { line++; i++; continue; }
      if (/\s/.test(c)) { i++; continue; }
      if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); if (e < 0) throw new CErr('注释没有结束（缺少 */）', line); line += src.slice(i, e).split('\n').length - 1; i = e + 2; continue; }
      if (/[0-9]/.test(c)) { let j = i; while (j < n && /[0-9]/.test(src[j])) j++; if (/[A-Za-z_.]/.test(src[j] || '')) throw new CErr('数字写法不支持：' + src.slice(i, j + 1), line); toks.push({ t: 'num', v: Number(src.slice(i, j)), line }); i = j; continue; }
      if (/[A-Za-z_]/.test(c)) { let j = i; while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++; const w = src.slice(i, j); toks.push({ t: KW.has(w) ? 'kw' : 'id', v: w, line }); i = j; continue; }
      const op = OPS.find((o) => src.startsWith(o, i));
      if (!op) throw new CErr('无法识别的字符「' + c + '」（请使用英文符号）', line);
      toks.push({ t: 'op', v: op, line }); i += op.length;
    }
    toks.push({ t: 'eof', v: '<结尾>', line });
    return toks;
  }

  /* 解析成闭包树；ctx = { v: 变量表, steps, limit, trace } */
  function compile(src, params) {
    const toks = lex(src); let p = 0; const declared = new Set(params);
    const peek = () => toks[p]; const next = () => toks[p++];
    const is = (v) => peek().t !== 'num' && peek().v === v && peek().t !== 'eof';
    const eat = (v) => { if (is(v)) { p++; return true; } return false; };
    const need = (v, what) => { if (!eat(v)) { const prev = toks[Math.max(0, p - 1)]; throw new CErr(`${what || '这里'}缺少「${v}」`, v === ';' ? prev.line : peek().line); } };
    const tick = (ctx, line) => { if (++ctx.steps > ctx.limit) throw new Signal('TLE', line); };
    const arr = (ctx, name, i, line) => { const a = ctx.v[name]; if (!Array.isArray(a)) throw new Signal('RE', `第 ${line} 行：${name} 不是数组`); if (!Number.isInteger(i) || i < 0 || i >= a.length) throw new Signal('RE', `第 ${line} 行：数组下标越界，${name}[${i}]（合法范围 0 ~ ${a.length - 1}）`); return a; };
    const BIN = { '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, '<<': (a, b) => a * Math.pow(2, b), '>>': (a, b) => Math.floor(a / Math.pow(2, b)),
      '<': (a, b) => +(a < b), '>': (a, b) => +(a > b), '<=': (a, b) => +(a <= b), '>=': (a, b) => +(a >= b), '==': (a, b) => +(a === b), '!=': (a, b) => +(a !== b), '&': (a, b) => a & b, '|': (a, b) => a | b, '^': (a, b) => a ^ b };
    const LV = [['||'], ['&&'], ['|'], ['^'], ['&'], ['==', '!='], ['<', '>', '<=', '>='], ['<<', '>>'], ['+', '-'], ['*', '/', '%']];
    const divmod = (op, a, b, line) => { if (b === 0) throw new Signal('RE', `第 ${line} 行：除数为 0`); return op === '/' ? Math.trunc(a / b) : a % b; };
    const calc = (op, a, b, line) => (op === '/' || op === '%' ? divmod(op, a, b, line) : BIN[op](a, b));

    function lvalue() { // 返回 { get, set }
      const t = next(); if (t.t !== 'id') throw new CErr(`这里需要一个变量名，却遇到了「${t.v}」`, t.line);
      if (!declared.has(t.v)) throw new CErr(`变量 ${t.v} 没有定义`, t.line);
      if (eat('[')) { const idx = expr(); need(']', '下标');
        return { get: (c) => { const i = idx(c); return arr(c, t.v, i, t.line)[i]; }, set: (c, val) => { const i = idx(c); arr(c, t.v, i, t.line)[i] = val; } }; }
      return { get: (c) => c.v[t.v], set: (c, val) => { c.v[t.v] = val; } };
    }
    function primary() {
      const t = peek();
      if (t.t === 'num') { p++; return () => t.v; }
      if (t.t === 'kw' && (t.v === 'true' || t.v === 'false')) { p++; return () => +(t.v === 'true'); }
      if (eat('(')) { const e = expr(); need(')', '括号'); return e; }
      if (t.t === 'id') {
        if (toks[p + 1].v === '(' && toks[p + 1].t === 'op') { p += 2; const args = []; if (!is(')')) { do args.push(assign()); while (eat(',')); } need(')', '函数调用');
          const F = { min: Math.min, max: Math.max, abs: Math.abs }[t.v]; if (!F) throw new CErr(`不支持调用函数 ${t.v}（可用：min、max、abs）`, t.line); return (c) => F(...args.map((a) => a(c))); }
        const lv = lvalue();
        if (is('++') || is('--')) { const d = next().v === '++' ? 1 : -1; return (c) => { const old = lv.get(c); lv.set(c, old + d); return old; }; }
        return lv.get;
      }
      throw new CErr(t.t === 'eof' ? '代码不完整，表达式没有写完' : `这里不应该出现「${t.v}」`, t.line);
    }
    function unary() {
      if (eat('-')) { const e = unary(); return (c) => -e(c); }
      if (eat('+')) return unary();
      if (eat('!')) { const e = unary(); return (c) => +!e(c); }
      if (is('++') || is('--')) { const d = next().v === '++' ? 1 : -1; const lv = lvalue(); return (c) => { const v = lv.get(c) + d; lv.set(c, v); return v; }; }
      return primary();
    }
    function binary(k) {
      if (k >= LV.length) return unary();
      let left = binary(k + 1);
      while (peek().t === 'op' && LV[k].includes(peek().v)) { const t = next(), op = t.v, a = left, b = binary(k + 1);
        left = op === '&&' ? (c) => +(a(c) && b(c) ? 1 : 0) : op === '||' ? (c) => +(a(c) || b(c) ? 1 : 0) : (c) => calc(op, a(c), b(c), t.line); }
      return left;
    }
    function ternary() { const cnd = binary(0); if (!eat('?')) return cnd; const a = assign(); need(':', '三目运算'); const b = assign(); return (c) => (cnd(c) ? a(c) : b(c)); }
    function assign() {
      const save = p;
      if (peek().t === 'id') { // 试探：是不是赋值
        try { const lv = lvalue(); const t = peek();
          if (t.t === 'op' && ['=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>='].includes(t.v)) { p++; const rhs = assign(); const op = t.v.slice(0, -1);
            return op ? (c) => { const v = calc(op, lv.get(c), rhs(c), t.line); lv.set(c, v); return v; } : (c) => { const v = rhs(c); lv.set(c, v); return v; }; }
        } catch (e) { if (!(e instanceof CErr)) throw e; }
        p = save;
      }
      return ternary();
    }
    function expr() { let e = assign(); while (eat(',')) { const a = e, b = assign(); e = (c) => { a(c); return b(c); }; } return e; }
    const isType = () => peek().t === 'kw' && ['int', 'long', 'bool', 'const', 'unsigned'].includes(peek().v);
    function decl() {
      while (isType()) p++;
      const inits = [];
      do { const t = next(); if (t.t !== 'id') throw new CErr(`这里需要一个变量名，却遇到了「${t.v}」`, t.line);
        if (eat('[')) throw new CErr('演示环境不支持在函数里新开数组', t.line);
        const init = eat('=') ? assign() : null; declared.add(t.v); inits.push([t.v, init]);
      } while (eat(','));
      need(';', '变量定义后面');
      return (c) => { for (const [name, init] of inits) c.v[name] = init ? init(c) : 0; };
    }
    function block() { const list = []; while (!is('}')) { if (peek().t === 'eof') throw new CErr('大括号没有配对，缺少「}」', peek().line); list.push(stmt()); } p++; return (c) => { for (const s of list) s(c); }; }
    const snap = (c) => ({ l: c.v.l, r: c.v.r, mid: c.v.mid });
    function loop(cond, body, step, line) {
      return (c) => { const id = ++c.loops;
        for (;;) { tick(c, line); if (cond && !cond(c)) break;
          const before = c.trace.length < 60 ? { loop: id, l: c.v.l, r: c.v.r } : null;
          let brk = false;
          try { body(c); } catch (e) { if (e instanceof Signal && e.kind === 'break') brk = true; else if (!(e instanceof Signal && e.kind === 'continue')) { if (before) { before.mid = c.v.mid; before.nl = c.v.l; before.nr = c.v.r; c.trace.push(before); } throw e; } }
          if (before) { const s = snap(c); before.mid = s.mid; before.nl = s.l; before.nr = s.r; c.trace.push(before); }
          if (brk) break; if (step) step(c);
        } };
    }
    function stmt() {
      const t = peek();
      if (eat('{')) return block();
      if (eat(';')) return () => {};
      if (isType()) { const d = decl(); return (c) => { tick(c, t.line); d(c); }; }
      if (t.t === 'kw') {
        if (t.v === 'if') { p++; need('(', 'if 后面'); const cnd = expr(); need(')', 'if 条件'); const a = stmt(); const b = peek().t === 'kw' && peek().v === 'else' ? (p++, stmt()) : null;
          return (c) => { tick(c, t.line); if (cnd(c)) a(c); else if (b) b(c); }; }
        if (t.v === 'while') { p++; need('(', 'while 后面'); const cnd = expr(); need(')', 'while 条件'); return loop(cnd, stmt(), null, t.line); }
        if (t.v === 'for') { p++; need('(', 'for 后面'); const init = isType() ? decl() : (is(';') ? (p++, null) : (() => { const e = expr(); need(';', 'for 的第一部分后面'); return e; })());
          const cnd = is(';') ? null : expr(); need(';', 'for 的第二部分后面'); const step = is(')') ? null : expr(); need(')', 'for'); const lp = loop(cnd, stmt(), step, t.line);
          return (c) => { if (init) init(c); lp(c); }; }
        if (t.v === 'return') { p++; const e = is(';') ? null : expr(); need(';', 'return 语句后面'); return (c) => { tick(c, t.line); throw new Signal('return', e ? e(c) : undefined); }; }
        if (t.v === 'break' || t.v === 'continue') { p++; need(';', t.v + ' 后面'); return () => { throw new Signal(t.v); }; }
        throw new CErr(`这里不应该出现「${t.v}」`, t.line);
      }
      const e = expr(); need(';', '语句结尾');
      return (c) => { tick(c, t.line); e(c); };
    }
    const list = []; while (peek().t !== 'eof') { if (is('}')) throw new CErr('多了一个「}」', peek().line); list.push(stmt()); }
    return (c) => { for (const s of list) s(c); };
  }

  /* 语法检查：返回 null 或 { line, msg } */
  function check(src, params) { try { compile(src, params); return null; } catch (e) { if (e instanceof CErr) return { line: e.line, msg: e.msg }; throw e; } }

  /* 执行：env 为形参取值（数组会被复制）。返回 { verdict: OK | TLE | RE | CE, ret, msg, trace } */
  function run(src, env, opts) {
    let prog; const params = Object.keys(env);
    try { prog = compile(src, params); } catch (e) { if (e instanceof CErr) return { verdict: 'CE', msg: `第 ${e.line} 行：${e.msg}`, line: e.line, trace: [] }; throw e; }
    const ctx = { v: {}, steps: 0, limit: (opts && opts.limit) || 20000, trace: [], loops: 0 };
    params.forEach((k) => { ctx.v[k] = Array.isArray(env[k]) ? env[k].slice() : env[k]; });
    try { prog(ctx); return { verdict: 'OK', ret: undefined, msg: '函数没有 return 返回值', trace: ctx.trace }; }
    catch (e) {
      if (e instanceof Signal) {
        if (e.kind === 'return') return { verdict: 'OK', ret: e.value, trace: ctx.trace };
        if (e.kind === 'TLE') return { verdict: 'TLE', msg: '执行步数超出上限，程序没有停下来', trace: ctx.trace };
        if (e.kind === 'RE') return { verdict: 'RE', msg: e.value, trace: ctx.trace };
        return { verdict: 'RE', msg: `${e.kind} 只能写在循环里面`, trace: ctx.trace };
      }
      return { verdict: 'RE', msg: '运行出错：' + (e && e.message), trace: ctx.trace };
    }
  }

  const API = { check, run };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.KP_C = API;
})(typeof window !== 'undefined' ? window : globalThis);
