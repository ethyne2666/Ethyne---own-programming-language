// ─────────────────────────────────────────────
//  Ethyne Language — Recursive-Descent Parser
//
//  Grammar (informal):
//    program     → stmt* EOF
//    stmt        → varDecl | printStmt | inputStmt
//                | ifStmt | whileStmt | funcDecl
//                | returnStmt | exprStmt
//    varDecl     → 'pet' IDENT ('=' expr)? terminator
//    printStmt   → 'bol' expr terminator
//    inputStmt   → 'adg' IDENT (',' STRING)? terminator
//    ifStmt      → 'yen' expr block ('lek' block)?
//    whileStmt   → 'jado' expr block
//    funcDecl    → 'kar' IDENT '(' params ')' block
//    returnStmt  → 'dena' expr? terminator
//    exprStmt    → expr terminator
//    block       → '{' stmt* '}'
//    terminator  → "'" | '~'  (both end a statement)
//
//  Expressions (precedence low→high):
//    assign  → or ('=' assign)?
//    or      → and ('||' and)*
//    and     → equality ('&&' equality)*
//    equality→ compare (('=='|'!=') compare)*
//    compare → add (('<'|'>'|'<='|'>=') add)*
//    add     → mul (('+'|'-') mul)*
//    mul     → unary (('*'|'/'|'%') unary)*
//    unary   → ('!'-unary) | call
//    call    → primary ('(' args ')')*
//    primary → NUMBER | STRING | BOOLEAN | NULL | IDENT | '(' expr ')'
// ─────────────────────────────────────────────

const { T } = require('../lexer/tokens');
const { AST } = require('./ast');
const { EthyneError } = require('../errors/EthyneError');

class Parser {
  constructor(tokens, filename = '<stdin>') {
    this.tokens   = tokens;
    this.filename = filename;
    this.pos      = 0;
  }

  // ── Token navigation ────────────────────────

  peek()       { return this.tokens[this.pos]; }
  previous()   { return this.tokens[this.pos - 1]; }
  isAtEnd()    { return this.peek().type === T.EOF; }

  advance() {
    if (!this.isAtEnd()) this.pos++;
    return this.previous();
  }

  check(type)  { return !this.isAtEnd() && this.peek().type === type; }

  match(...types) {
    for (const t of types) {
      if (this.check(t)) { this.advance(); return true; }
    }
    return false;
  }

  consume(type, msg) {
    if (this.check(type)) return this.advance();
    const tok = this.peek();
    this.error(msg, tok);
  }

  error(msg, tok = this.peek()) {
    throw new EthyneError('ParseError', msg, tok.line, tok.col, this.filename);
  }

  // Ethyne uses ' or ~ as statement terminators — accept either
  consumeTerminator() {
    if (this.match(T.SEMICOLON, T.TILDE)) return;
    this.error("Expected \"'\" or '~' after statement");
  }

  skipTerminators() {
    while (this.match(T.SEMICOLON, T.TILDE)) { /* skip */ }
  }

  // ── Entry point ─────────────────────────────

  parse() {
    const body = [];
    this.skipTerminators();
    while (!this.isAtEnd()) {
      body.push(this.statement());
      this.skipTerminators();
    }
    return AST.Program(body);
  }

  // ── Statements ───────────────────────────────

  statement() {
    const tok = this.peek();

    if (this.match(T.PET))    return this.varDecl(tok);
    if (this.match(T.BOL))    return this.printStmt(tok);
    if (this.match(T.ADG))    return this.inputStmt(tok);
    if (this.match(T.YEN))    return this.ifStmt(tok);
    if (this.match(T.JADO))   return this.whileStmt(tok);
    if (this.match(T.KAR))    return this.funcDecl(tok);
    if (this.match(T.DENA))   return this.returnStmt(tok);
    if (this.check(T.LBRACE)) return this.block();

    return this.exprStmt();
  }

  varDecl(tok) {
    const name = this.consume(T.IDENTIFIER, "Expected variable name after 'pet'").value;
    let init = null;
    if (this.match(T.ASSIGN)) {
      init = this.expression();
    }
    this.consumeTerminator();
    return AST.VarDecl(name, init, tok.line, tok.col);
  }

  printStmt(tok) {
    const expr = this.expression();
    this.consumeTerminator();
    return AST.PrintStmt(expr, tok.line, tok.col);
  }

  inputStmt(tok) {
    const name = this.consume(T.IDENTIFIER, "Expected variable name after 'adg'").value;
    let prompt = null;
    if (this.match(T.COMMA)) {
      prompt = this.consume(T.STRING, "Expected string prompt after ','").value;
    }
    this.consumeTerminator();
    return AST.InputStmt(name, prompt, tok.line, tok.col);
  }

  ifStmt(tok) {
    const test       = this.expression();
    const consequent = this.block();
    let alternate    = null;
    this.skipTerminators();
    if (this.match(T.LEK)) {
      // lek yen → else if
      if (this.match(T.YEN)) {
        alternate = this.ifStmt(this.previous());
      } else {
        alternate = this.block();
      }
    }
    return AST.IfStmt(test, consequent, alternate, tok.line, tok.col);
  }

  whileStmt(tok) {
    const test = this.expression();
    const body = this.block();
    return AST.WhileStmt(test, body, tok.line, tok.col);
  }

  funcDecl(tok) {
    const name = this.consume(T.IDENTIFIER, "Expected function name after 'kar'").value;
    this.consume(T.LPAREN, "Expected '(' after function name");
    const params = [];
    if (!this.check(T.RPAREN)) {
      do {
        params.push(this.consume(T.IDENTIFIER, 'Expected parameter name').value);
      } while (this.match(T.COMMA));
    }
    this.consume(T.RPAREN, "Expected ')' after parameters");
    const body = this.block();
    return AST.FuncDecl(name, params, body, tok.line, tok.col);
  }

  returnStmt(tok) {
    let expr = null;
    if (!this.check(T.SEMICOLON) && !this.check(T.TILDE) && !this.isAtEnd()) {
      expr = this.expression();
    }
    this.consumeTerminator();
    return AST.ReturnStmt(expr, tok.line, tok.col);
  }

  block() {
    this.consume(T.LBRACE, "Expected '{'");
    const body = [];
    this.skipTerminators();
    while (!this.check(T.RBRACE) && !this.isAtEnd()) {
      body.push(this.statement());
      this.skipTerminators();
    }
    this.consume(T.RBRACE, "Expected '}'");
    return AST.BlockStmt(body);
  }

  exprStmt() {
    const tok  = this.peek();
    const expr = this.expression();
    this.consumeTerminator();
    return AST.ExprStmt(expr, tok.line, tok.col);
  }

  // ── Expressions (recursive descent) ─────────

  expression() { return this.assign(); }

  assign() {
    const left = this.or();
    if (this.match(T.ASSIGN)) {
      const tok = this.previous();
      if (left.type !== 'Identifier') {
        this.error('Invalid assignment target', tok);
      }
      const value = this.assign();
      return AST.AssignExpr(left.name, value, tok.line, tok.col);
    }
    return left;
  }

  or() {
    let left = this.and();
    while (this.match(T.OR)) {
      const tok = this.previous();
      left = AST.BinaryExpr('||', left, this.and(), tok.line, tok.col);
    }
    return left;
  }

  and() {
    let left = this.equality();
    while (this.match(T.AND)) {
      const tok = this.previous();
      left = AST.BinaryExpr('&&', left, this.equality(), tok.line, tok.col);
    }
    return left;
  }

  equality() {
    let left = this.compare();
    while (this.match(T.EQ, T.NEQ)) {
      const tok = this.previous();
      left = AST.BinaryExpr(tok.value, left, this.compare(), tok.line, tok.col);
    }
    return left;
  }

  compare() {
    let left = this.addition();
    while (this.match(T.LT, T.GT, T.LTE, T.GTE)) {
      const tok = this.previous();
      left = AST.BinaryExpr(tok.value, left, this.addition(), tok.line, tok.col);
    }
    return left;
  }

  addition() {
    let left = this.multiply();
    while (this.match(T.PLUS, T.MINUS)) {
      const tok = this.previous();
      left = AST.BinaryExpr(tok.value, left, this.multiply(), tok.line, tok.col);
    }
    return left;
  }

  multiply() {
    let left = this.unary();
    while (this.match(T.STAR, T.SLASH, T.PERCENT)) {
      const tok = this.previous();
      left = AST.BinaryExpr(tok.value, left, this.unary(), tok.line, tok.col);
    }
    return left;
  }

  unary() {
    if (this.match(T.NOT, T.MINUS)) {
      const tok = this.previous();
      return AST.UnaryExpr(tok.value, this.unary(), tok.line, tok.col);
    }
    return this.call();
  }

  call() {
    let expr = this.primary();
    while (this.match(T.LPAREN)) {
      const tok  = this.previous();
      const args = [];
      if (!this.check(T.RPAREN)) {
        do { args.push(this.expression()); } while (this.match(T.COMMA));
      }
      this.consume(T.RPAREN, "Expected ')' after arguments");
      expr = AST.CallExpr(expr, args, tok.line, tok.col);
    }
    return expr;
  }

  primary() {
    const tok = this.peek();

    if (this.match(T.NUMBER))  return AST.NumberLit(tok.value, tok.line, tok.col);
    if (this.match(T.STRING))  return AST.StringLit(tok.value, tok.line, tok.col);
    if (this.match(T.BOOLEAN)) return AST.BoolLit(tok.value, tok.line, tok.col);
    if (this.match(T.NULL))    return AST.NullLit(tok.line, tok.col);

    if (this.match(T.IDENTIFIER)) {
      return AST.Identifier(tok.value, tok.line, tok.col);
    }

    if (this.match(T.LPAREN)) {
      const expr = this.expression();
      this.consume(T.RPAREN, "Expected ')' after expression");
      return expr;
    }

    this.error(`Unexpected token '${tok.value ?? tok.type}'`);
  }
}

module.exports = { Parser };
