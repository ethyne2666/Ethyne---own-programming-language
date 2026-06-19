# Ethyne Compiler Architecture

Ethyne processes source code through several stages.

```text
Source Code
    │
    ▼
Lexer
    │
    ▼
Tokens
    │
    ▼
Parser
    │
    ▼
AST
    │
 ┌──┴──────────────┐
 ▼                 ▼
Interpreter    JS Generator
```

---

## Lexer

File:

```text
src/lexer/lexer.js
```

Responsibilities:

- Read source code
- Remove comments
- Generate tokens
- Track line numbers
- Detect lexical errors

Example:

```eth
pet age = 20'
```

Produces:

```text
PET
IDENTIFIER(age)
ASSIGN
NUMBER(20)
SEMICOLON
```

---

## Parser

File:

```text
src/parser/parser.js
```

Responsibilities:

- Consume token stream
- Validate syntax
- Generate AST

---

## AST

File:

```text
src/parser/ast.js
```

Example:

```json
{
  "type": "VarDecl",
  "name": "age",
  "value": 20
}
```

---

## Interpreter

File:

```text
src/interpreter/interpreter.js
```

Responsibilities:

- Walk AST
- Execute statements
- Manage scopes
- Handle functions
- Evaluate expressions

---

## Code Generator

File:

```text
src/codegen/codegen.js
```

Responsibilities:

- Convert AST into JavaScript
- Preserve program logic

Example:

Ethyne:

```eth
bol("Hello")'
```

JavaScript:

```js
console.log("Hello");
```

---

## Error Handling

File:

```text
src/errors/EthyneError.js
```

Handles:

- Lex Errors
- Parse Errors
- Runtime Errors
