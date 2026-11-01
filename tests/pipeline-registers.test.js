

"use strict";

const assert = require("assert");
const registers = require("../docs/pipeline-registers.js");

const pipeline = registers.createPipelineRegisters();

assert.strictEqual(pipeline.IFID.valid, false);
assert.strictEqual(pipeline.IDEX.valid, false);
assert.strictEqual(pipeline.EXMEM.valid, false);
assert.strictEqual(pipeline.MEMWB.valid, false);

assert.strictEqual(pipeline.IFID.instruction, null);
assert.strictEqual(pipeline.IFID.pc, 0);
assert.strictEqual(pipeline.IFID.pcPlus4, 0);

assert.strictEqual(pipeline.IDEX.RegWrite, false);
assert.strictEqual(pipeline.EXMEM.MemWrite, false);
assert.strictEqual(pipeline.MEMWB.MemtoReg, false);

console.log("Pipeline register tests passed: 10");
console.log("Pipeline register tests failed: 0");
