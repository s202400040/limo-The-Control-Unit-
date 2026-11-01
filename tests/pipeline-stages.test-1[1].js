
"use strict";

const assert = require("assert");
const assembler = require("../docs/assembler.js");
const pipelineModule = require("../docs/pipeline-core.js");

const core = pipelineModule.createCore();

// A simple program with one instruction.
const program = "eketsi r3, r0, 7";

// Assemble and load the program into the pipeline.
core.reset(assembler.assemble(program));

console.log("FIVE-STAGE PIPELINE TEST");

// CYCLE 1: INSTRUCTION FETCH (IF)
core.step();

let snapshot = core.snapshot();

assert.strictEqual(snapshot.cycles, 1);

console.log("Cycle 1: IF - Instruction Fetch");

// CYCLE 2: INSTRUCTION DECODE (ID)
core.step();

snapshot = core.snapshot();

assert.strictEqual(snapshot.cycles, 2);

console.log("Cycle 2: ID - Instruction Decode");

// CYCLE 3: EXECUTE (EX)
core.step();

snapshot = core.snapshot();

assert.strictEqual(snapshot.cycles, 3);

console.log("Cycle 3: EX - Execute");

// CYCLE 4: MEMORY (MEM)
core.step();

snapshot = core.snapshot();

assert.strictEqual(snapshot.cycles, 4);

console.log("Cycle 4: MEM - Memory");

// CYCLE 5: WRITE BACK (WB)
core.step();

snapshot = core.snapshot();

assert.strictEqual(snapshot.cycles, 5);

// Check that the result was written into r3.
assert.strictEqual(core.readRegister(3), 7);

console.log("Cycle 5: WB - Write Back");
console.log("Register r3:", core.readRegister(3));

console.log("Five-stage pipeline test passed!");