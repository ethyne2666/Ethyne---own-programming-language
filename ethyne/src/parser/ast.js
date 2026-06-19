// ─────────────────────────────────────────────
//  Ethyne Language — AST Node Factories
//  Pure data constructors. No logic here.
//  Every node carries line/col for error messages.
// ─────────────────────────────────────────────

const AST = {
  // ── Statements ───────────────────────────────

  Program: (body)                         => ({ type: 'Program',        body }),
  VarDecl: (name, init, line, col)        => ({ type: 'VarDecl',        name, init, line, col }),
  PrintStmt: (expr, line, col)            => ({ type: 'PrintStmt',      expr, line, col }),
  InputStmt: (name, prompt, line, col)    => ({ type: 'InputStmt',      name, prompt, line, col }),
  IfStmt: (test, consequent, alternate,
           line, col)                     => ({ type: 'IfStmt',         test, consequent, alternate, line, col }),
  WhileStmt: (test, body, line, col)      => ({ type: 'WhileStmt',      test, body, line, col }),
  FuncDecl: (name, params, body,
             line, col)                   => ({ type: 'FuncDecl',       name, params, body, line, col }),
  ReturnStmt: (expr, line, col)           => ({ type: 'ReturnStmt',     expr, line, col }),
  BlockStmt: (body)                       => ({ type: 'BlockStmt',      body }),
  ExprStmt: (expr, line, col)             => ({ type: 'ExprStmt',       expr, line, col }),

  // ── Expressions ──────────────────────────────

  AssignExpr: (name, value, line, col)    => ({ type: 'AssignExpr',     name, value, line, col }),
  BinaryExpr: (op, left, right,
               line, col)                 => ({ type: 'BinaryExpr',     op, left, right, line, col }),
  UnaryExpr: (op, operand, line, col)     => ({ type: 'UnaryExpr',      op, operand, line, col }),
  CallExpr: (callee, args, line, col)     => ({ type: 'CallExpr',       callee, args, line, col }),
  Identifier: (name, line, col)           => ({ type: 'Identifier',     name, line, col }),
  NumberLit: (value, line, col)           => ({ type: 'NumberLit',      value, line, col }),
  StringLit: (value, line, col)           => ({ type: 'StringLit',      value, line, col }),
  BoolLit: (value, line, col)             => ({ type: 'BoolLit',        value, line, col }),
  NullLit: (line, col)                    => ({ type: 'NullLit',        line, col }),
};

module.exports = { AST };
