

"use strict";

const assert = require("assert");
const assembler = require("./assembler.js");
const pipelineModule = require("./pipeline-core.js");

const core = pipelineModule.createCore();

// =====================================
// TEST 1: ARITHMETIC AND FORWARDING
// =====================================

const arithmeticProgram = [
 "eketsi r3, r0, 7",
 "eketsi r4, r0, 5",
 "eketsi r8, r0, 1",
 "eketsi r9, r0, 2",
 "eketsa r5, r3, r4"
].join("\n");

core.reset(assembler.assemble(arithmeticProgram));
const arithmeticResult = core.run(100);

console.log("ARITHMETIC TEST");
console.log("r3:", core.readRegister(3));
console.log("r4:", core.readRegister(4));
console.log("r5:", core.readRegister(5));

assert.strictEqual(core.readRegister(3), 7);
assert.strictEqual(core.readRegister(4), 5);
assert.strictEqual(core.readRegister(5), 12);
assert.strictEqual(arithmeticResult.halted, true);

console.log("Hazard-free arithmetic tests passed: 4");

// =====================================
// TEST 2: MEMORY OPERATIONS
// =====================================

const memoryProgram = [
 "eketsi r3, r0, 7",
 "eketsi r4, r0, 5",
 "eketsi r8, r0, 1",
 "eketsi r9, r0, 2",
 "boloka r4, 0(r3)",
 "bala r5, 0(r3)"
].join("\n");

core.reset(assembler.assemble(memoryProgram));
const memoryResult = core.run(100);

console.log("\nMEMORY TEST");
console.log("r3:", core.readRegister(3));
console.log("r4:", core.readRegister(4));
console.log("Memory address 7:", memoryResult.dataMemory[7]);
console.log("r5:", core.readRegister(5));

assert.strictEqual(core.readRegister(3), 7);
assert.strictEqual(core.readRegister(4), 5);
assert.strictEqual(memoryResult.dataMemory[7], 5);
assert.strictEqual(core.readRegister(5), 5);
assert.strictEqual(memoryResult.halted, true);

console.log("Memory tests passed: 5");
