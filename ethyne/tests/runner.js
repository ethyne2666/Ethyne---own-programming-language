// ─────────────────────────────────────────────
//  Ethyne — Lightweight Test Runner
//  No dependencies. Run with: node tests/runner.js
// ─────────────────────────────────────────────

const { interpret, compile, tokenize, parse } = require('../src/compiler');
const { EthyneError } = require('../src/errors/EthyneError');

let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✔\x1b[0m  ${label}`);
    passed++;
  } catch (err) {
    console.log(`  \x1b[31m✖\x1b[0m  ${label}`);
    console.log(`       ${err.message}`);
    failed++;
  }
}

function assert(actual, expected, msg = '') {
  // coerce to same type for primitive comparisons (e.g. string '42' vs number 42 is fine here)
  if (String(actual) !== String(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}${msg ? ' — ' + msg : ''}`);
  }
}

function captureOutput(source) {
  const out = [];
  interpret(source, '<test>', v => out.push(String(v)));
  return out;
}

function expectError(source, kind) {
  try {
    interpret(source, '<test>');
    throw new Error(`Expected ${kind} but no error was thrown`);
  } catch (err) {
    if (!(err instanceof EthyneError)) throw err;
    if (err.kind !== kind) throw new Error(`Expected ${kind}, got ${err.kind}: ${err.message}`);
  }
}

// ═══════════════════════════════════════════════
console.log('\n  Ethyne Test Suite\n');

// ── Lexer ──────────────────────────────────────
console.log('  [Lexer]');
test('tokenizes keywords', () => {
  const toks = tokenize("pet bol yen lek '");
  const types = toks.map(t => t.type);
  assert(types[0], 'PET');
  assert(types[1], 'BOL');
  assert(types[2], 'YEN');
  assert(types[3], 'LEK');
  assert(types[4], 'SEMICOLON');
});

test('tokenizes string literal', () => {
  const toks = tokenize('"hello world"');
  assert(toks[0].type, 'STRING');
  assert(toks[0].value, 'hello world');
});

test('tokenizes number', () => {
  const toks = tokenize('42');
  assert(toks[0].type, 'NUMBER');
  assert(toks[0].value, 42);
});

test('tokenizes float', () => {
  const toks = tokenize('3.14');
  assert(toks[0].type, 'NUMBER');
  assert(String(toks[0].value), '3.14');
});

test('skips single-line comment', () => {
  const toks = tokenize('!! this is a comment\npet x');
  assert(toks[0].type, 'PET');
});

test('skips block comment', () => {
  const toks = tokenize('!!! block comment !!!\npet x');
  assert(toks[0].type, 'PET');
});

test('tokenizes tru/nahi as BOOLEAN', () => {
  const toks = tokenize('tru nahi');
  assert(toks[0].type,  'BOOLEAN');
  assert(toks[0].value, true);
  assert(toks[1].type,  'BOOLEAN');
  assert(toks[1].value, false);
});

test('tokenizes kali as NULL', () => {
  const toks = tokenize('kali');
  assert(toks[0].type, 'NULL');
});

// ── Interpreter ────────────────────────────────
console.log('\n  [Interpreter]');
test('prints a string', () => {
  const out = captureOutput(`bol "ethyne" '`);
  assert(out[0], 'ethyne');
});

test('variable declaration and print', () => {
  const out = captureOutput(`pet x = 42 ' bol x '`);
  assert(out[0], '42');
});

test('arithmetic: addition', () => {
  const out = captureOutput(`pet r = 3 + 4 ' bol r '`);
  assert(out[0], '7');
});

test('arithmetic: modulo', () => {
  const out = captureOutput(`pet r = 10 % 3 ' bol r '`);
  assert(out[0], '1');
});

test('string concatenation with +', () => {
  const out = captureOutput(`pet s = "Hello, " + "Ethyne" ' bol s '`);
  assert(out[0], 'Hello, Ethyne');
});

test('if: true branch', () => {
  const out = captureOutput(`yen 1 == 1 { bol "yes" ' }`);
  assert(out[0], 'yes');
});

test('if: false branch (lek)', () => {
  const out = captureOutput(`yen 1 == 2 { bol "yes" ' } lek { bol "no" ' }`);
  assert(out[0], 'no');
});

test('while loop runs correct times', () => {
  const out = captureOutput(`pet i = 0 ' jado i < 3 { bol i ' i = i + 1 ' }`);
  assert(out.length, 3);
  assert(out[2], '2');
});

test('function call', () => {
  const out = captureOutput(`kar add(a, b) { dena a + b ' } pet r = add(3, 4) ' bol r '`);
  assert(out[0], '7');
});

test('kali prints as "kali"', () => {
  const out = captureOutput(`pet x = kali ' bol x '`);
  assert(out[0], 'kali');
});

test('tru/nahi print as tru/nahi', () => {
  const out = captureOutput(`bol tru ' bol nahi '`);
  assert(out[0], 'tru');
  assert(out[1], 'nahi');
});

test('undefined variable throws RuntimeError', () => {
  expectError(`bol z '`, 'RuntimeError');
});

// ── Transpiler ─────────────────────────────────
console.log('\n  [Transpiler]');
test('compile produces JS string', () => {
  const js = compile(`pet x = 1 ' bol x '`);
  assert(typeof js, 'string');
  assert(js.includes('let x = 1'), true);
  assert(js.includes('console.log(x)'), true);
});

test('compile if statement', () => {
  const js = compile(`yen tru { bol "ok" ' }`);
  assert(js.includes('if (true)'), true);
  assert(js.includes(`console.log("ok")`), true);
});

// ═══════════════════════════════════════════════
console.log();
const total = passed + failed;
const colour = failed > 0 ? '\x1b[31m' : '\x1b[32m';
console.log(`  ${colour}${passed}/${total} tests passed\x1b[0m\n`);
process.exit(failed > 0 ? 1 : 0);
