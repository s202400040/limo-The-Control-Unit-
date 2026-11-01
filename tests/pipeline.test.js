

"use strict";

const assert = require("assert");
const assembler = require("../docs/assembler.js");
const pipeline = require("../docs/pipeline.js");

const source = [
    "eketsi r3, r0, 7",
    "eketsi r4, r0, 5",
    "eketsa r5, r3, r4",
    "boloka r4, 0(r3)",
    "bala r5, 0(r3)"
].join("\n");

const machineCode = assembler.assemble(source);

const decoded = machineCode.map(function (item) {
    return pipeline.decodeInstruction(item.word, parseInt(item.address, 16));
});

assert.strictEqual(decoded[0].name, "eketsi");
assert.strictEqual(decoded[0].rd, 3);
assert.strictEqual(decoded[0].rs1, 0);
assert.strictEqual(decoded[0].immediate, 7);

assert.strictEqual(decoded[2].name, "eketsa");
assert.strictEqual(decoded[2].rd, 5);
assert.strictEqual(decoded[2].rs1, 3);
assert.strictEqual(decoded[2].rs2, 4);

assert.strictEqual(decoded[3].name, "boloka");
assert.strictEqual(decoded[3].rs2, 4);
assert.strictEqual(decoded[3].rs1, 3);

assert.strictEqual(decoded[4].name, "bala");
assert.strictEqual(decoded[4].rd, 5);
assert.strictEqual(decoded[4].rs1, 3);

console.log("LIMO decoder tests passed: 12");

// =====================================
// M3 CONTROL UNIT TESTS
// =====================================

const decoder = require("./pipeline.js");

const controlTests = [
    { name: "eketsa", expected: { RegWrite: true, ALUSrc: false, ALUControl: "ADD" } },
    { name: "fokotsa", expected: { RegWrite: true, ALUControl: "SUB" } },
    { name: "eketsi", expected: { RegWrite: true, ALUSrc: true, ALUControl: "ADD" } },
    { name: "le", expected: { RegWrite: true, ALUControl: "AND" } },
    { name: "kapa", expected: { RegWrite: true, ALUControl: "OR" } },
    { name: "suthela", expected: { RegWrite: true, ALUControl: "SLL" } },
    { name: "bala", expected: { RegWrite: true, ALUSrc: true, MemRead: true, MemtoReg: true } },
    { name: "boloka", expected: { RegWrite: false, ALUSrc: true, MemWrite: true } },
    { name: "lekana", expected: { Branch: true, ALUControl: "SUB" } },
    { name: "selekane", expected: { Branch: true, ALUControl: "SUB" } }
];

let controlTestCount = 0;

controlTests.forEach(function (test) {
    const instruction = { name: test.name };
    const signals = decoder.generateControlSignals(instruction);

    Object.keys(test.expected).forEach(function (signal) {
        assert.strictEqual(
            signals[signal],
            test.expected[signal],
            test.name + " should have " + signal + " = " + test.expected[signal]
        );

        controlTestCount++;
    });
});

console.log("Control unit tests passed:", controlTestCount);
