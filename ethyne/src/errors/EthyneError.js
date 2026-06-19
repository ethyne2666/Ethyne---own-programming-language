// ─────────────────────────────────────────────
//  Ethyne Language — EthyneError
//  All compiler phases throw this. Carries
//  source location for nice CLI error display.
// ─────────────────────────────────────────────

class EthyneError extends Error {
  /**
   * @param {'LexError'|'ParseError'|'RuntimeError'} kind
   * @param {string}  message
   * @param {number}  line
   * @param {number}  col
   * @param {string}  filename
   */
  constructor(kind, message, line = 0, col = 0, filename = '<stdin>') {
    super(message);
    this.kind     = kind;
    this.ethLine  = line;
    this.ethCol   = col;
    this.filename = filename;
    this.name     = 'EthyneError';
  }

  /** Pretty-printed error string for the CLI */
  pretty() {
    return [
      ``,
      `  ✖  [${this.kind}] ${this.filename}:${this.ethLine}:${this.ethCol}`,
      `     ${this.message}`,
      ``,
    ].join('\n');
  }
}

module.exports = { EthyneError };
