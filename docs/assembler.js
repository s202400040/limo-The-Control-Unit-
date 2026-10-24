

/*
 * LIMO Assembler — The Control Unit
 * Based on the submitted M1 ISA specification.
 *
 * R: funct7(7) rs2(4) rs1(4) funct3(3) rd(4) pad(3) opcode(7)
 * I: imm(12) rs1(4) funct3(3) rd(4) pad(2) opcode(7)
 * S: imm[11:5](7) rs2(4) rs1(4) funct3(3)
 *    imm[4:0](5) pad(2) opcode(7)
 * B: imm[12|10:5](7) rs2(4) rs1(4) funct3(3)
 *    imm[4:1|11](5) pad(2) opcode(7)
 *
 * IMPORTANT:
 * Confirm all encoding constants and field positions against
 * the approved M1 specification and worked examples.
 */

"use strict";

const LIMO = Object.freeze({
    eketsa:   { format: "R", opcode: 0x33, funct3: 0, funct7: 0 },
    fokotsa:  { format: "R", opcode: 0x33, funct3: 0, funct7: 0x20 },
    eketsi:   { format: "I", opcode: 0x13, funct3: 0 },
    le:       { format: "R", opcode: 0x33, funct3: 7, funct7: 0 },
    kapa:     { format: "R", opcode: 0x33, funct3: 6, funct7: 0 },
    suthela:  { format: "R", opcode: 0x33, funct3: 1, funct7: 0 },
    bala:     { format: "I", opcode: 0x03, funct3: 2 },
    boloka:   { format: "S", opcode: 0x23, funct3: 2 },
    lekana:   { format: "B", opcode: 0x63, funct3: 2 },
    selekane: { format: "B", opcode: 0x63, funct3: 3 }
});

function fail(line, message) {
    throw new Error(`Line ${line}: ${message}`);
}

function parseNumber(token, line) {
    const text = String(token).trim();
    let value;

    if (/^[+-]?0x[0-9a-f]+$/i.test(text)) {
        const negative = text.startsWith("-");
        const digits = text.replace(/^[+-]?0x/i, "");
        value = parseInt(digits, 16) * (negative ? -1 : 1);
    } else if (/^[+-]?\d+$/.test(text)) {
        value = Number(text);
    } else {
        fail(line, `Invalid number '${token}'.`);
    }

    if (!Number.isSafeInteger(value)) {
        fail(line, `Number '${token}' is outside the supported range.`);
    }

    return value;
}

function parseRegister(token, line) {
    const match = String(token).trim().match(/^r(\d+)$/i);

    if (!match) {
        fail(line, `Expected a register r0-r15, got '${token}'.`);
    }

    const register = Number(match[1]);

    if (register < 0 || register > 15) {
        fail(line, `Register '${token}' is outside r0-r15.`);
    }

    return register;
}

function checkSigned(value, bits, line, description) {
    const min = -(2 ** (bits - 1));
    const max = (2 ** (bits - 1)) - 1;

    if (value < min || value > max) {
        fail(
            line,
            `${description} must be between ${min} and ${max}; received ${value}.`
        );
    }
}

function unsignedBits(value, bits) {
    return value & (2 ** bits - 1);
}

function put(value, width, shift) {
    return (value & (2 ** width - 1)) << shift;
}

function stripComment(text) {
    // Supports #, ; and // comments.
    return text.split(/#|;|\/\//, 1)[0].trim();
}

function splitOperands(text, line) {
    const operands = [];
    let current = "";
    let depth = 0;

    for (const char of text) {
        if (char === "(") depth++;

        if (char === ")") {
            depth--;
            if (depth < 0) {
                fail(line, "Unexpected closing parenthesis.");
            }
        }

        if (char === "," && depth === 0) {
            if (!current.trim()) {
                fail(line, "Empty operand.");
            }

            operands.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }

    if (depth !== 0) {
        fail(line, "Unmatched parenthesis.");
    }

    if (current.trim()) {
        operands.push(current.trim());
    }

    if (operands.length === 0) {
        fail(line, "Missing operands.");
    }

    return operands;
}

function parseMemoryOperand(token, line) {
    const pattern =
        /^([+-]?(?:0x[0-9a-f]+|\d+))\s*\(\s*(r\d+)\s*\)$/i;

    const match = String(token).trim().match(pattern);

    if (!match) {
        fail(
            line,
            `Expected offset(register), for example 8(r7); got '${token}'.`
        );
    }

    return {
        offset: parseNumber(match[1], line),
        base: parseRegister(match[2], line)
    };
}

function encode(instruction, labels) {
    const { mnemonic, operands, pc, line } = instruction;
    const spec = LIMO[mnemonic];

    if (!spec) {
        fail(line, `Unknown instruction '${mnemonic}'.`);
    }

    const operandCounts = {
        eketsa: 3,
        fokotsa: 3,
        eketsi: 3,
        le: 3,
        kapa: 3,
        suthela: 3,
        bala: 2,
        boloka: 2,
        lekana: 3,
        selekane: 3
    };

    const expected = operandCounts[mnemonic];

    if (operands.length !== expected) {
        fail(
            line,
            `${mnemonic} expects ${expected} operands, but received ${operands.length}.`
        );
    }

    const { opcode, funct3 } = spec;

    // R format: destination, source 1, source 2.
    if (spec.format === "R") {
        const rd = parseRegister(operands[0], line);
        const rs1 = parseRegister(operands[1], line);
        const rs2 = parseRegister(operands[2], line);

        return (
            put(spec.funct7, 7, 25) |
            put(rs2, 4, 21) |
            put(rs1, 4, 17) |
            put(funct3, 3, 14) |
            put(rd, 4, 10) |
            put(opcode, 7, 0)
        ) >>> 0;
    }

    // I format: arithmetic immediate.
    if (mnemonic === "eketsi") {
        const rd = parseRegister(operands[0], line);
        const rs1 = parseRegister(operands[1], line);
        const immediate = parseNumber(operands[2], line);

        checkSigned(immediate, 12, line, "Immediate");

        return (
            put(unsignedBits(immediate, 12), 12, 20) |
            put(rs1, 4, 16) |
            put(funct3, 3, 13) |
            put(rd, 4, 9) |
            put(opcode, 7, 0)
        ) >>> 0;
    }

    // I format: load word, written as bala rd, offset(base).
    if (mnemonic === "bala") {
        const rd = parseRegister(operands[0], line);
        const memory = parseMemoryOperand(operands[1], line);

        checkSigned(memory.offset, 12, line, "Load offset");

        return (
            put(unsignedBits(memory.offset, 12), 12, 20) |
            put(memory.base, 4, 16) |
            put(funct3, 3, 13) |
            put(rd, 4, 9) |
            put(opcode, 7, 0)
        ) >>> 0;
    }

    // S format: store word, written as boloka rs2, offset(base).
    if (spec.format === "S") {
        const rs2 = parseRegister(operands[0], line);
        const memory = parseMemoryOperand(operands[1], line);

        checkSigned(memory.offset, 12, line, "Store offset");

        const immediate = unsignedBits(memory.offset, 12);

        return (
            put((immediate >> 5) & 0x7f, 7, 25) |
            put(rs2, 4, 21) |
            put(memory.base, 4, 17) |
            put(funct3, 3, 14) |
            put(immediate & 0x1f, 5, 9) |
            put(opcode, 7, 0)
        ) >>> 0;
    }

    // B format: branches use a label or signed byte offset.
    const rs1 = parseRegister(operands[0], line);
    const rs2 = parseRegister(operands[1], line);
    const target = operands[2];

    let offset;

    if (Object.prototype.hasOwnProperty.call(labels, target)) {
        offset = labels[target] - pc;
    } else if (/^[+-]?(?:0x[0-9a-f]+|\d+)$/i.test(target)) {
        offset = parseNumber(target, line);
    } else {
        fail(line, `Unknown label '${target}'.`);
    }

    checkSigned(offset, 13, line, "Branch offset");

    if (offset % 2 !== 0) {
        fail(line, "Branch offset must be even.");
    }

    const immediate = unsignedBits(offset, 13);

    const upper =
        (((immediate >> 12) & 1) << 6) |
        ((immediate >> 5) & 0x3f);

    const lower =
        (((immediate >> 1) & 0x0f) << 1) |
        ((immediate >> 11) & 1);

    return (
        put(upper, 7, 25) |
        put(rs2, 4, 21) |
        put(rs1, 4, 17) |
        put(funct3, 3, 14) |
        put(lower, 5, 9) |
        put(opcode, 7, 0)
    ) >>> 0;
}

function assemble(source) {
    if (typeof source !== "string") {
        throw new TypeError("Assembler input must be a string.");
    }

    const lines = source.split(/\r?\n/);
    const statements = [];
    const labels = Object.create(null);
    let pc = 0;

    // PASS 1: find labels and instruction addresses.
    lines.forEach((original, index) => {
        const line = index + 1;
        let text = stripComment(original);

        if (!text) return;

        const labelMatch = text.match(/^([A-Za-z_][A-Za-z0-9_]*):/);

        if (labelMatch) {
            const name = labelMatch[1];

            if (Object.prototype.hasOwnProperty.call(labels, name)) {
                fail(line, `Duplicate label '${name}'.`);
            }

            labels[name] = pc;
            text = text.slice(labelMatch[0].length).trim();

            if (!text) return;
        }

        const match = text.match(/^([A-Za-z]+)\b\s*(.*)$/);

        if (!match) {
            fail(line, "Could not parse instruction.");
        }

        const mnemonic = match[1].toLowerCase();

        if (!Object.prototype.hasOwnProperty.call(LIMO, mnemonic)) {
            fail(line, `Unknown instruction '${mnemonic}'.`);
        }

        if (!match[2].trim()) {
            fail(line, `Missing operands for '${mnemonic}'.`);
        }

        statements.push({
            line,
            pc,
            mnemonic,
            operands: splitOperands(match[2].trim(), line),
            source: original
        });

        pc += 4;
    });

    // PASS 2: encode instructions and prepare output.
    return statements.map(statement => {
        const word = encode(statement, labels);
        const binary = word.toString(2).padStart(32, "0");

        return {
            line: statement.line,
            address:
                "0x" +
                statement.pc.toString(16).toUpperCase().padStart(8, "0"),
            source: statement.source.trim(),
            binary: binary.match(/.{4}/g).join(" "),
            hex: "0x" + word.toString(16).toUpperCase().padStart(8, "0"),
            word
        };
    });
}

// Export for Node.js tests.
if (typeof module !== "undefined" && module.exports) {
    module.exports = { assemble, LIMO };
}

// Export for the browser interface.
if (typeof window !== "undefined") {
    window.LIMOAssembler = { assemble, LIMO };
}
