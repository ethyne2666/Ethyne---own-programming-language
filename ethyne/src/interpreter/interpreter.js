// ─────────────────────────────────────────────
//  Ethyne Language — Tree-Walk Interpreter
//
//  Walks the AST produced by the parser and
//  evaluates each node in a runtime environment.
//  This is the "run ethyne directly" path.
//
//  Environment: lexical scope chain (closures work).
//  Built-ins: bol (print) is a keyword, not a fn.
//  Input (adg) uses synchronous stdin via readline.
// ─────────────────────────────────────────────

const readline = require('readline');
const { EthyneError } = require('../errors/EthyneError');

// ── Return signal (non-error throw for 'dena') ──

class ReturnSignal {
  constructor(value) { this.value = value; }
}

// ── Lexical Environment ──────────────────────────

class Environment {
  constructor(parent = null) {
    this.vars   = new Map();
    this.parent = parent;
  }

  define(name, value) {
    this.vars.set(name, value);
  }

  get(name, line, col, file) {
    if (this.vars.has(name)) return this.vars.get(name);
    if (this.parent) return this.parent.get(name, line, col, file);
    throw new EthyneError('RuntimeError', `Undefined variable '${name}'`, line, col, file);
  }

  set(name, value, line, col, file) {
    if (this.vars.has(name)) { this.vars.set(name, value); return; }
    if (this.parent) { this.parent.set(name, value, line, col, file); return; }
    throw new EthyneError('RuntimeError', `Undefined variable '${name}'`, line, col, file);
  }
}

// ── Ethyne Callable (user-defined function) ──────

class EthyneFunction {
  constructor(decl, closure) {
    this.decl    = decl;   // FuncDecl AST node
    this.closure = closure;
  }

  call(interpreter, args) {
    const env = new Environment(this.closure);
    this.decl.params.forEach((p, i) => env.define(p, args[i] ?? null));
    try {
      interpreter.execBlock(this.decl.body.body, env);
    } catch (sig) {
      if (sig instanceof ReturnSignal) return sig.value;
      throw sig;
    }
    return null;
  }

  toString() { return `<kar ${this.decl.name}>`; }
}

// ── Interpreter ──────────────────────────────────

class Interpreter {
  constructor(filename = '<stdin>', outputFn = console.log) {
    this.filename = filename;
    this.outputFn = outputFn;       // injectable for tests
    this.globals  = new Environment();
  }

  // Public entry point
  run(program) {
    this.execBlock(program.body, this.globals);
  }

  // ── Statement dispatch ───────────────────────

  exec(node, env) {
    switch (node.type) {
      case 'VarDecl':    return this.execVarDecl(node, env);
      case 'PrintStmt':  return this.execPrint(node, env);
      case 'InputStmt':  return this.execInput(node, env);
      case 'IfStmt':     return this.execIf(node, env);
      case 'WhileStmt':  return this.execWhile(node, env);
      case 'FuncDecl':   return this.execFuncDecl(node, env);
      case 'ReturnStmt': return this.execReturn(node, env);
      case 'BlockStmt':  return this.execBlock(node.body, new Environment(env));
      case 'ExprStmt':   return this.evaluate(node.expr, env);
      default:
        throw new EthyneError('RuntimeError',
          `Unknown statement type '${node.type}'`,
          node.line, node.col, this.filename);
    }
  }

  execBlock(stmts, env) {
    for (const stmt of stmts) this.exec(stmt, env);
  }

  execVarDecl(node, env) {
    const value = node.init ? this.evaluate(node.init, env) : null;
    env.define(node.name, value);
  }

  execPrint(node, env) {
    const value = this.evaluate(node.expr, env);
    this.outputFn(this.stringify(value));
  }

  execInput(node, env) {
    // Synchronous stdin — only works in CLI mode
    const prompt = node.prompt ? `${node.prompt} ` : '';
    const value  = this._readlineSync(prompt);
    // Try to coerce to number
    const num = Number(value);
    env.define(node.name, isNaN(num) ? value : num);
  }

  execIf(node, env) {
    if (this.isTruthy(this.evaluate(node.test, env))) {
      this.exec(node.consequent, env);
    } else if (node.alternate) {
      this.exec(node.alternate, env);
    }
  }

  execWhile(node, env) {
    while (this.isTruthy(this.evaluate(node.test, env))) {
      this.exec(node.body, env);
    }
  }

  execFuncDecl(node, env) {
    env.define(node.name, new EthyneFunction(node, env));
  }

  execReturn(node, env) {
    const value = node.expr ? this.evaluate(node.expr, env) : null;
    throw new ReturnSignal(value);
  }

  // ── Expression evaluation ────────────────────

  evaluate(node, env) {
    switch (node.type) {
      case 'NumberLit':  return node.value;
      case 'StringLit':  return node.value;
      case 'BoolLit':    return node.value;
      case 'NullLit':    return null;

      case 'Identifier':
        return env.get(node.name, node.line, node.col, this.filename);

      case 'AssignExpr': {
        const val = this.evaluate(node.value, env);
        env.set(node.name, val, node.line, node.col, this.filename);
        return val;
      }

      case 'BinaryExpr':
        return this.evalBinary(node, env);

      case 'UnaryExpr':
        return this.evalUnary(node, env);

      case 'CallExpr':
        return this.evalCall(node, env);

      default:
        throw new EthyneError('RuntimeError',
          `Unknown expression type '${node.type}'`,
          node.line, node.col, this.filename);
    }
  }

  evalBinary(node, env) {
    const L = this.evaluate(node.left,  env);
    const R = this.evaluate(node.right, env);
    const e = (msg) =>
      new EthyneError('RuntimeError', msg, node.line, node.col, this.filename);

    switch (node.op) {
      case '+':
        if (typeof L === 'string' || typeof R === 'string')
          return String(L) + String(R);
        if (typeof L === 'number' && typeof R === 'number') return L + R;
        throw e(`Operator '+' not supported for ${typeof L} and ${typeof R}`);
      case '-':  return this.numOp(L, R, node, (a,b) => a - b);
      case '*':  return this.numOp(L, R, node, (a,b) => a * b);
      case '/':
        if (R === 0) throw e('Division by zero');
        return this.numOp(L, R, node, (a,b) => a / b);
      case '%':  return this.numOp(L, R, node, (a,b) => a % b);
      case '<':  return L < R;
      case '>':  return L > R;
      case '<=': return L <= R;
      case '>=': return L >= R;
      case '==': return L === R;
      case '!=': return L !== R;
      case '&&': return this.isTruthy(L) && this.isTruthy(R);
      case '||': return this.isTruthy(L) || this.isTruthy(R);
      default:   throw e(`Unknown operator '${node.op}'`);
    }
  }

  numOp(L, R, node, fn) {
    if (typeof L !== 'number' || typeof R !== 'number')
      throw new EthyneError('RuntimeError',
        `Operator '${node.op}' requires numbers, got ${typeof L} and ${typeof R}`,
        node.line, node.col, this.filename);
    return fn(L, R);
  }

  evalUnary(node, env) {
    const val = this.evaluate(node.operand, env);
    switch (node.op) {
      case '!': return !this.isTruthy(val);
      case '-':
        if (typeof val !== 'number')
          throw new EthyneError('RuntimeError',
            `Unary '-' requires a number`, node.line, node.col, this.filename);
        return -val;
      default:
        throw new EthyneError('RuntimeError',
          `Unknown unary operator '${node.op}'`, node.line, node.col, this.filename);
    }
  }

  evalCall(node, env) {
    const callee = this.evaluate(node.callee, env);
    if (!(callee instanceof EthyneFunction)) {
      throw new EthyneError('RuntimeError',
        `'${node.callee.name ?? '?'}' is not a function`,
        node.line, node.col, this.filename);
    }
    const args = node.args.map(a => this.evaluate(a, env));
    return callee.call(this, args);
  }

  // ── Utilities ────────────────────────────────

  isTruthy(val) {
    if (val === null || val === false) return false;
    if (val === 0 || val === '') return false;
    return true;
  }

  stringify(val) {
    if (val === null)  return 'kali';
    if (val === true)  return 'tru';
    if (val === false) return 'nahi';
    return String(val);
  }

  // Synchronous readline for adg (input) — CLI only
  _readlineSync(prompt = '') {
    // We use the /dev/stdin trick for sync reads in Node.js
    if (prompt) process.stdout.write(prompt);
    try {
      const buf = require('fs').readFileSync('/dev/stdin', 'utf8');
      return buf.split('\n')[0].trim();
    } catch {
      return '';
    }
  }
}

module.exports = { Interpreter };
