// ─────────────────────────────────────────────
//  Ethyne Language — Lexer
//  Converts raw source text into a flat token list.
//
//  Ethyne syntax handled here:
//    !! comment          → single-line comment
//    !!! … !!!           → multi-line comment
//    '                   → statement terminator (SEMICOLON)
//    ~                   → line-break / separator (TILDE)
//    "…"                 → string literal
//    digits              → number literal
//    identifiers/keywords
//    all operators + delimiters
// ─────────────────────────────────────────────

const { T, KEYWORDS } = require('./tokens');
const { EthyneError } = require('../errors/EthyneError');

class Token {
  constructor(type, value, line, col) {
    this.type  = type;
    this.value = value;
    this.line  = line;
    this.col   = col;
  }

  toString() {
    return `Token(${this.type}, ${JSON.stringify(this.value)}, ${this.line}:${this.col})`;
  }
}

class Lexer {
  constructor(source, filename = '<stdin>') {
    this.source   = source;
    this.filename = filename;
    this.cursor   = 0;
    this.line     = 1;
    this.col      = 1;
    this.tokens   = [];
  }

  // ── Helpers ─────────────────────────────────

  peek(offset = 0) {
    return this.source[this.cursor + offset] ?? null;
  }

  advance() {
    const ch = this.source[this.cursor++];
    if (ch === '\n') { this.line++; this.col = 1; }
    else { this.col++; }
    return ch;
  }

  match(expected) {
    if (this.peek() === expected) { this.advance(); return true; }
    return false;
  }

  error(msg) {
    throw new EthyneError('LexError', msg, this.line, this.col, this.filename);
  }

  pushToken(type, value) {
    this.tokens.push(new Token(type, value, this.line, this.col));
  }

  // ── Comment skipping ────────────────────────

  skipLineComment() {
    // already consumed '!!' — eat until end of line
    while (this.peek() !== null && this.peek() !== '\n') this.advance();
  }

  skipBlockComment() {
    // already consumed first '!!!' — eat until closing '!!!'
    while (this.cursor < this.source.length) {
      if (this.peek() === '!' && this.peek(1) === '!' && this.peek(2) === '!') {
        this.advance(); this.advance(); this.advance();
        return;
      }
      this.advance();
    }
    this.error('Unterminated block comment');
  }

  // ── String literal ──────────────────────────

  readString() {
    let str = '';
    while (this.peek() !== null && this.peek() !== '"') {
      if (this.peek() === '\\') {
        this.advance();
        const esc = this.advance();
        const escapes = { n: '\n', t: '\t', r: '\r', '"': '"', '\\': '\\' };
        str += escapes[esc] ?? esc;
      } else {
        str += this.advance();
      }
    }
    if (this.peek() === null) this.error('Unterminated string literal');
    this.advance(); // closing "
    return str;
  }

  // ── Number literal ──────────────────────────

  readNumber() {
    let num = '';
    let _c;
    while ((_c = this.peek()) !== null && /[0-9]/.test(_c)) num += this.advance();
    if (this.peek() === '.' && /[0-9]/.test(this.peek(1))) {
      num += this.advance(); // consume '.'
      while ((_c = this.peek()) !== null && /[0-9]/.test(_c)) num += this.advance();
      return parseFloat(num);
    }
    return parseInt(num, 10);
  }

  // ── Identifier / keyword ────────────────────

  readIdentifier() {
    let word = '';
    let ch;
    while ((ch = this.peek()) !== null && /[a-zA-Z0-9_]/.test(ch)) word += this.advance();
    return word;
  }

  // ── Main tokenize loop ──────────────────────

  tokenize() {
    while (this.cursor < this.source.length) {
      const startLine = this.line;
      const startCol  = this.col;
      const ch = this.peek();

      // ── Whitespace ──────────────────────────
      if (/[ \t\r\n]/.test(ch)) { this.advance(); continue; }

      // ── Comments !! or !!! ──────────────────
      if (ch === '!') {
        if (this.peek(1) === '!' && this.peek(2) === '!') {
          this.advance(); this.advance(); this.advance(); // consume !!!
          this.skipBlockComment();
          continue;
        }
        if (this.peek(1) === '!') {
          this.advance(); this.advance(); // consume !!
          this.skipLineComment();
          continue;
        }
        this.error(`Unexpected character '!'`);
      }

      // ── String literal ──────────────────────
      if (ch === '"') {
        this.advance(); // consume opening "
        const str = this.readString();
        this.tokens.push(new Token(T.STRING, str, startLine, startCol));
        continue;
      }

      // ── Statement terminator ' ──────────────
      if (ch === "'") {
        this.advance();
        this.tokens.push(new Token(T.SEMICOLON, "'", startLine, startCol));
        continue;
      }

      // ── Line-break / separator ~ ────────────
      if (ch === '~') {
        this.advance();
        this.tokens.push(new Token(T.TILDE, '~', startLine, startCol));
        continue;
      }

      // ── Number ──────────────────────────────
      if (/[0-9]/.test(ch)) {
        const num = this.readNumber();
        this.tokens.push(new Token(T.NUMBER, num, startLine, startCol));
        continue;
      }

      // ── Identifier / keyword ────────────────
      if (/[a-zA-Z_]/.test(ch)) {
        const word = this.readIdentifier();
        const kwType = KEYWORDS[word];

        if (kwType === T.KALI) {
          this.tokens.push(new Token(T.NULL, null, startLine, startCol));
        } else if (kwType === T.BOOLEAN) {
          this.tokens.push(new Token(T.BOOLEAN, word === 'tru', startLine, startCol));
        } else if (kwType) {
          this.tokens.push(new Token(kwType, word, startLine, startCol));
        } else {
          this.tokens.push(new Token(T.IDENTIFIER, word, startLine, startCol));
        }
        continue;
      }

      // ── Two-char operators ───────────────────
      this.advance(); // consume first char

      if (ch === '=' && this.match('=')) { this.tokens.push(new Token(T.EQ,     '==', startLine, startCol)); continue; }
      if (ch === '!' && this.match('=')) { this.tokens.push(new Token(T.NEQ,    '!=', startLine, startCol)); continue; }
      if (ch === '<' && this.match('=')) { this.tokens.push(new Token(T.LTE,    '<=', startLine, startCol)); continue; }
      if (ch === '>' && this.match('=')) { this.tokens.push(new Token(T.GTE,    '>=', startLine, startCol)); continue; }
      if (ch === '&' && this.match('&')) { this.tokens.push(new Token(T.AND,    '&&', startLine, startCol)); continue; }
      if (ch === '|' && this.match('|')) { this.tokens.push(new Token(T.OR,     '||', startLine, startCol)); continue; }

      // ── Single-char tokens ───────────────────
      const singles = {
        '=': T.ASSIGN, '+': T.PLUS,   '-': T.MINUS,  '*': T.STAR,
        '/': T.SLASH,  '%': T.PERCENT,'<': T.LT,     '>': T.GT,
        '!': T.NOT,    '(': T.LPAREN, ')': T.RPAREN,
        '{': T.LBRACE, '}': T.RBRACE, ',': T.COMMA,
      };

      if (singles[ch] !== undefined) {
        this.tokens.push(new Token(singles[ch], ch, startLine, startCol));
        continue;
      }

      this.error(`Unexpected character '${ch}'`);
    }

    this.tokens.push(new Token(T.EOF, null, this.line, this.col));
    return this.tokens;
  }
}

module.exports = { Lexer, Token };
