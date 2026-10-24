


"use strict";

const { assemble } = require("./assembler");

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`PASS: ${name}`);
    } catch (error) {
        failed++;
        console.error(`FAIL: ${name}\n  ${error.message}`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(
            `${message}\nExpected: ${expected}\nReceived: ${actual}`
        );
    }
}

function assertThrowsContaining(source, expected) {
    let caughtError;

    try {
        assemble(source);
    } catch (error) {
        caughtError = error;
    }

    if (!caughtError) {
        throw new Error(`Expected an error containing '${expected}'.`);
    }

    assert(
        caughtError.message.includes(expected),
        `Expected error containing '${expected}', received '${caughtError.message}'.`
    );
}

// 1. Basic output format.
test("R-format output is a 32-bit word", () => {
    const result = assemble("eketsa r7, r8, r9")[0];

    assert(result, "No instruction was returned.");
    assertEqual(
        result.binary.replace(/\s/g, "").length,
        32,
        "Binary output must contain 32 bits."
    );
    assert(
        /^0x[0-9A-F]{8}$/.test(result.hex),
        "Hex output must contain eight uppercase hexadecimal digits."
    );
    assertEqual(
        result.word >>> 0,
        result.word,
        "The encoded word must be an unsigned 32-bit value."
    );
});

// 2. Metadata.
test("Returns source line and instruction address", () => {
    const result = assemble("\n# comment\neketsa r7, r8, r9")[0];

    assertEqual(result.line, 3, "Incorrect source line.");
    assertEqual(result.address, "0x00000000", "Incorrect instruction address.");
    assertEqual(result.source, "eketsa r7, r8, r9", "Incorrect source text.");
});

// 3. Decimal and hexadecimal immediates.
test("Accepts a decimal immediate", () => {
    const result = assemble("eketsi r10, r7, 10")[0];

    assert(result.binary, "Binary output is missing.");
    assert(result.hex, "Hexadecimal output is missing.");
});

test("Decimal and hexadecimal immediates encode identically", () => {
    const decimal = assemble("eketsi r10, r7, 10")[0];
    const hexadecimal = assemble("eketsi r10, r7, 0xA")[0];

    assertEqual(
        hexadecimal.word,
        decimal.word,
        "10 and 0xA should produce the same encoded word."
    );
});

// 4. Labels and branches.
test("Resolves a backward branch label", () => {
    const results = assemble(
        "start: eketsa r7, r8, r9\n" +
        "lekana r7, r8, start"
    );

    assertEqual(results.length, 2, "Expected two instructions.");
    assertEqual(results[1].address, "0x00000004", "Incorrect branch address.");
});

test("Resolves a forward branch label", () => {
    const results = assemble(
        "lekana r7, r8, finish\n" +
        "eketsa r7, r8, r9\n" +
        "finish: eketsi r10, r7, 1"
    );

    assertEqual(results.length, 3, "Expected three instructions.");
    assertEqual(results[2].address, "0x00000008", "Incorrect label address.");
});

test("Rejects an unknown branch label", () => {
    assertThrowsContaining(
        "lekana r1, r2, missing",
        "Unknown label"
    );
});

test("Rejects a duplicate label", () => {
    assertThrowsContaining(
        "start: eketsa r1, r2, r3\n" +
        "start: eketsa r1, r2, r3",
        "Duplicate label"
    );
});

test("Rejects an odd branch offset", () => {
    assertThrowsContaining(
        "lekana r1, r2, 3",
        "Branch offset must be even"
    );
});

// 5. Comments and blank lines.
test("Ignores comments and blank lines", () => {
    const results = assemble(
        "# full-line comment\n" +
        "\n" +
        "eketsa r7, r8, r9 // trailing comment\n" +
        "eketsi r10, r7, 10 ; another comment"
    );

    assertEqual(results.length, 2, "Expected two instructions.");
});

test("Allows a label-only line", () => {
    const results = assemble(
        "start:\n" +
        "eketsa r7, r8, r9\n" +
        "lekana r7, r8, start"
    );

    assertEqual(results.length, 2, "Expected two instructions.");
});

// 6. Memory instructions.
test("Accepts a load instruction", () => {
    const result = assemble("bala r5, 0(r3)")[0];

    assert(result.hex, "Load instruction has no hexadecimal output.");
});

test("Accepts a store instruction", () => {
    const result = assemble("boloka r5, 8(r3)")[0];

    assert(result.hex, "Store instruction has no hexadecimal output.");
});

test("Accepts a negative memory offset", () => {
    const result = assemble("bala r5, -4(r3)")[0];

    assert(result.hex, "Negative memory offset was not encoded.");
});

test("Rejects an invalid memory operand", () => {
    assertThrowsContaining(
        "bala r5, 8r3",
        "Expected offset(register)"
    );
});

// 7. Invalid instructions and registers.
test("Rejects a register above r15", () => {
    assertThrowsContaining(
        "eketsa r16, r8, r9",
        "outside r0-r15"
    );
});

test("Rejects a malformed register", () => {
    assertThrowsContaining(
        "eketsa x7, r8, r9",
        "Expected a register"
    );
});

test("Rejects an unknown instruction", () => {
    assertThrowsContaining(
        "notAnInstruction r1, r2, r3",
        "Unknown instruction"
    );
});

test("Rejects missing operands", () => {
    assertThrowsContaining(
        "eketsa r1, r2",
        "expects 3 operands"
    );
});

test("Rejects an out-of-range immediate", () => {
    assertThrowsContaining(
        "eketsi r1, r2, 2048",
        "Immediate must be between"
    );
});

test("Rejects an invalid number", () => {
    assertThrowsContaining(
        "eketsi r1, r2, abc",
        "Invalid number"
    );
});

test("Rejects input that is not a string", () => {
    let caught = false;

    try {
        assemble(null);
    } catch (error) {
        caught = error instanceof TypeError;
    }

    assert(caught, "Expected a TypeError for non-string input.");
});

// 8. Empty program.
test("Returns an empty array for a blank program", () => {
    const results = assemble("# only a comment\n\n");

    assert(Array.isArray(results), "Result should be an array.");
    assertEqual(results.length, 0, "Expected no instructions.");
});

// Final report.
console.log("\n------------------------------");
console.log(`Tests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);
console.log("------------------------------");

if (failed > 0) {
    process.exitCode = 1;
}
