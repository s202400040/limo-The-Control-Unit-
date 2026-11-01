
"use strict";

// LIMO M3: Instruction Decoder
// Uses the instruction field positions from the existing M2 assembler.

(function (root) {

    function signExtend(value, bits) {
        const sign = 1 << (bits - 1);
        return (value & (sign - 1)) - (value & sign);
    }

    function decodeInstruction(word, pc) {
        word = word >>> 0;

        const opcode = word & 0x7F;

        let instruction = {
            word: word,
            pc: pc,
            name: "unknown",
            type: "INVALID",
            rd: 0,
            rs1: 0,
            rs2: 0,
            funct3: 0,
            funct7: 0,
            immediate: 0,
            usesRs1: false,
            usesRs2: false,
            writesRd: false
        };

        // R-format: eketsa, fokotsa, le, kapa, suthela
        if (opcode === 0x33) {
            const rd = (word >>> 10) & 0xF;
            const rs1 = (word >>> 17) & 0xF;
            const rs2 = (word >>> 21) & 0xF;
            const funct3 = (word >>> 14) & 0x7;
            const funct7 = (word >>> 25) & 0x7F;

            instruction.rd = rd;
            instruction.rs1 = rs1;
            instruction.rs2 = rs2;
            instruction.funct3 = funct3;
            instruction.funct7 = funct7;
            instruction.type = "R";
            instruction.usesRs1 = true;
            instruction.usesRs2 = true;
            instruction.writesRd = true;

            if (funct3 === 0 && funct7 === 0) {
                instruction.name = "eketsa";
            } else if (funct3 === 0 && funct7 === 0x20) {
                instruction.name = "fokotsa";
            } else if (funct3 === 7 && funct7 === 0) {
                instruction.name = "le";
            } else if (funct3 === 6 && funct7 === 0) {
                instruction.name = "kapa";
            } else if (funct3 === 1 && funct7 === 0) {
                instruction.name = "suthela";
            } else {
                instruction.type = "INVALID";
                instruction.writesRd = false;
                instruction.usesRs1 = false;
                instruction.usesRs2 = false;
            }
        }

        // I-format: eketsi
        else if (opcode === 0x13) {
            const rd = (word >>> 9) & 0xF;
            const rs1 = (word >>> 16) & 0xF;
            const funct3 = (word >>> 13) & 0x7;

            instruction.rd = rd;
            instruction.rs1 = rs1;
            instruction.funct3 = funct3;
            instruction.immediate = signExtend(word >>> 20, 12);

            if (funct3 === 0) {
                instruction.type = "I";
                instruction.name = "eketsi";
                instruction.usesRs1 = true;
                instruction.writesRd = true;
            }
        }

        // I-format: bala (load word)
        else if (opcode === 0x03) {
            const rd = (word >>> 9) & 0xF;
            const rs1 = (word >>> 16) & 0xF;
            const funct3 = (word >>> 13) & 0x7;

            instruction.rd = rd;
            instruction.rs1 = rs1;
            instruction.funct3 = funct3;
            instruction.immediate = signExtend(word >>> 20, 12);

            if (funct3 === 2) {
                instruction.type = "LOAD";
                instruction.name = "bala";
                instruction.usesRs1 = true;
                instruction.writesRd = true;
            }
        }

        // S-format: boloka (store word)
        else if (opcode === 0x23) {
            const upper = (word >>> 25) & 0x7F;
            const lower = (word >>> 9) & 0x1F;
            const rs2 = (word >>> 21) & 0xF;
            const rs1 = (word >>> 17) & 0xF;
            const funct3 = (word >>> 14) & 0x7;
            const immediate = (upper << 5) | lower;

            instruction.rs1 = rs1;
            instruction.rs2 = rs2;
            instruction.funct3 = funct3;
            instruction.immediate = signExtend(immediate, 12);

            if (funct3 === 2) {
                instruction.type = "STORE";
                instruction.name = "boloka";
                instruction.usesRs1 = true;
                instruction.usesRs2 = true;
            }
        }

        // B-format: lekana and selekane
        else if (opcode === 0x63) {
            const upper = (word >>> 25) & 0x7F;
            const lower = (word >>> 9) & 0x1F;
            const rs2 = (word >>> 21) & 0xF;
            const rs1 = (word >>> 17) & 0xF;
            const funct3 = (word >>> 14) & 0x7;

            const immediate =
                (((upper >>> 6) & 1) << 12) |
                ((lower & 1) << 11) |
                ((upper & 0x3F) << 5) |
                (((lower >>> 1) & 0xF) << 1);

            instruction.rs1 = rs1;
            instruction.rs2 = rs2;
            instruction.funct3 = funct3;
            instruction.immediate = signExtend(immediate, 13);

            if (funct3 === 2) {
                instruction.type = "BRANCH";
                instruction.name = "lekana";
            } else if (funct3 === 3) {
                instruction.type = "BRANCH";
                instruction.name = "selekane";
            }

            if (instruction.type === "BRANCH") {
                instruction.usesRs1 = true;
                instruction.usesRs2 = true;
            }
        }

        return instruction;
    }

   function generateControlSignals(instruction) {
    const control = {
        RegWrite: false,
        ALUSrc: false,
        ALUControl: "ADD",
        MemRead: false,
        MemWrite: false,
        MemtoReg: false,
        Branch: false
    };

    switch (instruction.name) {
        case "eketsa":
            control.RegWrite = true;
            control.ALUControl = "ADD";
            break;

        case "fokotsa":
            control.RegWrite = true;
            control.ALUControl = "SUB";
            break;

        case "eketsi":
            control.RegWrite = true;
            control.ALUSrc = true;
            control.ALUControl = "ADD";
            break;

        case "le":
            control.RegWrite = true;
            control.ALUControl = "AND";
            break;

        case "kapa":
            control.RegWrite = true;
            control.ALUControl = "OR";
            break;

        case "suthela":
            control.RegWrite = true;
            control.ALUControl = "SLL";
            break;

        case "bala":
            control.RegWrite = true;
            control.ALUSrc = true;
            control.ALUControl = "ADD";
            control.MemRead = true;
            control.MemtoReg = true;
            break;

        case "boloka":
            control.ALUSrc = true;
            control.ALUControl = "ADD";
            control.MemWrite = true;
            break;

        case "lekana":
        case "selekane":
            control.Branch = true;
            control.ALUControl = "SUB";
            break;
    }

    return control;
}

const api = {
    decodeInstruction: decodeInstruction,
    generateControlSignals: generateControlSignals
};

    root.LIMOPipeline = api;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

})(typeof window !== "undefined" ? window : global);

