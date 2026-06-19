// ─────────────────────────────────────────────
//  Ethyne Language — Compiler Pipeline
//
//  Two public modes:
//    compile(source)  → JS string (transpile mode)
//    interpret(source) → run directly (AST walk)
//
//  Both share the same Lexer + Parser front-end.
// ─────────────────────────────────────────────

const { Lexer }       = require('./lexer/lexer');
const { Parser }      = require('./parser/parser');
const { CodeGen }     = require('./codegen/codegen');
const { Interpreter } = require('./interpreter/interpreter');

/**
 * Run the front-end (lex + parse) and return the AST.
 * @param {string} source
 * @param {string} filename
 * @returns {{ tokens: Token[], ast: ASTNode }}
 */
function frontend(source, filename = '<stdin>') {
  const lexer  = new Lexer(source, filename);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens, filename);
  const ast    = parser.parse();
  return { tokens, ast };
}

/**
 * Transpile Ethyne source to a JavaScript string.
 * @param {string} source
 * @param {string} filename
 * @returns {string} JavaScript code
 */
function compile(source, filename = '<stdin>') {
  const { ast } = frontend(source, filename);
  const gen     = new CodeGen(filename);
  return gen.generate(ast);
}

/**
 * Interpret Ethyne source directly (no JS output).
 * @param {string} source
 * @param {string} filename
 * @param {Function} [outputFn=console.log] — injectable for tests
 */
function interpret(source, filename = '<stdin>', outputFn = console.log) {
  const { ast }    = frontend(source, filename);
  const interp     = new Interpreter(filename, outputFn);
  interp.run(ast);
}

/**
 * Return just the token list (useful for debugging / REPL highlighting).
 * @param {string} source
 * @param {string} filename
 * @returns {Token[]}
 */
function tokenize(source, filename = '<stdin>') {
  const lexer = new Lexer(source, filename);
  return lexer.tokenize();
}

/**
 * Return just the AST (useful for tooling / IDE integrations).
 * @param {string} source
 * @param {string} filename
 * @returns {ASTNode}
 */
function parse(source, filename = '<stdin>') {
  return frontend(source, filename).ast;
}

module.exports = { compile, interpret, tokenize, parse };
