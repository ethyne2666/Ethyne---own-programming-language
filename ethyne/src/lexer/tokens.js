// ─────────────────────────────────────────────
//  Ethyne Language — Token Type Constants
//  All token type names live here; import from
//  this file everywhere else. Never hardcode strings.
// ─────────────────────────────────────────────

const T = {
  // ── Literals ──────────────────────────────
  NUMBER:     'NUMBER',
  STRING:     'STRING',
  BOOLEAN:    'BOOLEAN',     // tru / nahi
  NULL:       'NULL',        // kali

  // ── Identifiers ───────────────────────────
  IDENTIFIER: 'IDENTIFIER',

  // ── Keywords ──────────────────────────────
  PET:        'PET',         // variable declaration
  BOL:        'BOL',         // print
  ADG:        'ADG',         // input
  YEN:        'YEN',         // if
  LEK:        'LEK',         // else
  JADO:       'JADO',        // while
  KAR:        'KAR',         // function
  DENA:       'DENA',        // return
  KALI:       'KALI',        // null literal

  // ── Operators ─────────────────────────────
  ASSIGN:     'ASSIGN',      // =
  PLUS:       'PLUS',        // +
  MINUS:      'MINUS',       // -
  STAR:       'STAR',        // *
  SLASH:      'SLASH',       // /
  PERCENT:    'PERCENT',     // %
  EQ:         'EQ',          // ==
  NEQ:        'NEQ',         // !=
  LT:         'LT',          // <
  GT:         'GT',          // >
  LTE:        'LTE',         // <=
  GTE:        'GTE',         // >=
  AND:        'AND',         // &&
  OR:         'OR',          // ||
  NOT:        'NOT',         // !

  // ── Delimiters ────────────────────────────
  LPAREN:     'LPAREN',      // (
  RPAREN:     'RPAREN',      // )
  LBRACE:     'LBRACE',      // {
  RBRACE:     'RBRACE',      // }
  COMMA:      'COMMA',       // ,
  SEMICOLON:  'SEMICOLON',   // ' (Ethyne line-end)
  TILDE:      'TILDE',       // ~ (Ethyne line-break / separator)

  // ── Meta ──────────────────────────────────
  EOF:        'EOF',
};

// Keyword map: source word → token type
const KEYWORDS = {
  pet:  T.PET,
  bol:  T.BOL,
  adg:  T.ADG,
  yen:  T.YEN,
  lek:  T.LEK,
  jado: T.JADO,
  kar:  T.KAR,
  dena: T.DENA,
  kali: T.KALI,
  tru:  T.BOOLEAN,
  nahi: T.BOOLEAN,
};

module.exports = { T, KEYWORDS };
