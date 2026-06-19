#!/usr/bin/env node
// ─────────────────────────────────────────────
//  Ethyne Language — CLI
//
//  Usage:
//    ethyne run   <file.eth>          → interpret directly
//    ethyne build <file.eth>          → transpile to JS, print output
//    ethyne build <file.eth> -o out.js → transpile and save
//    ethyne tokens <file.eth>         → dump token list (debug)
//    ethyne ast    <file.eth>         → dump AST as JSON (debug)
// ─────────────────────────────────────────────

const fs      = require('fs');
const path    = require('path');
const { compile, interpret, tokenize, parse } = require('./src/compiler');
const { EthyneError } = require('./src/errors/EthyneError');

// ── ANSI colours ──────────────────────────────

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
};

function banner() {
  console.log(`${C.cyan}${C.bold}`);
  console.log(`   ███████╗████████╗██╗  ██╗██╗   ██╗███╗   ██╗███████╗`);
  console.log(`   ██╔════╝╚══██╔══╝██║  ██║╚██╗ ██╔╝████╗  ██║██╔════╝`);
  console.log(`   █████╗     ██║   ███████║ ╚████╔╝ ██╔██╗ ██║█████╗  `);
  console.log(`   ██╔══╝     ██║   ██╔══██║  ╚██╔╝  ██║╚██╗██║██╔══╝  `);
  console.log(`   ███████╗   ██║   ██║  ██║   ██║   ██║ ╚████║███████╗`);
  console.log(`   ╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═══╝╚══════╝`);
  console.log(`${C.reset}${C.dim}   the Ethyne programming language  v0.1.0${C.reset}`);
  console.log();
}

function help() {
  banner();
  console.log(`  ${C.bold}Usage:${C.reset}`);
  console.log(`    ethyne ${C.cyan}run${C.reset}   <file.eth>              Interpret Ethyne source`);
  console.log(`    ethyne ${C.cyan}build${C.reset} <file.eth>              Transpile to JavaScript`);
  console.log(`    ethyne ${C.cyan}build${C.reset} <file.eth> -o <out.js>  Save JS output to file`);
  console.log(`    ethyne ${C.cyan}tokens${C.reset} <file.eth>             Dump token list`);
  console.log(`    ethyne ${C.cyan}ast${C.reset}    <file.eth>             Dump AST as JSON`);
  console.log(`    ethyne ${C.cyan}help${C.reset}                          Show this message`);
  console.log();
}

function die(msg) {
  console.error(`${C.red}${C.bold}Error:${C.reset} ${msg}`);
  process.exit(1);
}

function readSource(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) die(`File not found: ${filePath}`);
  return { source: fs.readFileSync(abs, 'utf8'), filename: path.basename(abs) };
}

function handleError(err) {
  if (err instanceof EthyneError) {
    console.error(`${C.red}${err.pretty()}${C.reset}`);
  } else {
    console.error(`${C.red}${C.bold}Internal error:${C.reset} ${err.message}`);
    if (process.env.ETHYNE_DEBUG) console.error(err.stack);
  }
  process.exit(1);
}

// ── Command dispatch ─────────────────────────

const [,, cmd, file, flag, flagVal] = process.argv;

if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
  help(); process.exit(0);
}

if (!file) die(`Expected a file path after '${cmd}'`);

const { source, filename } = readSource(file);

try {
  switch (cmd) {
    case 'run': {
      interpret(source, filename);
      break;
    }

    case 'build': {
      const js = compile(source, filename);
      if (flag === '-o' && flagVal) {
        const out = path.resolve(flagVal);
        fs.writeFileSync(out, js, 'utf8');
        console.log(`${C.green}✔${C.reset}  Compiled → ${out}`);
      } else {
        console.log(js);
      }
      break;
    }

    case 'tokens': {
      const toks = tokenize(source, filename);
      toks.forEach(t =>
        console.log(`${C.dim}${String(t.line).padStart(3)}:${String(t.col).padEnd(3)}${C.reset}  ${C.cyan}${t.type.padEnd(12)}${C.reset}  ${JSON.stringify(t.value)}`)
      );
      break;
    }

    case 'ast': {
      const ast = parse(source, filename);
      console.log(JSON.stringify(ast, null, 2));
      break;
    }

    default:
      help();
      die(`Unknown command '${cmd}'`);
  }
} catch (err) {
  handleError(err);
}
