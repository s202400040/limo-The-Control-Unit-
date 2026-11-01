

"use strict";

// LIMO M3: Pipeline Register Model
// These registers hold values between pipeline stages.

(function (root) {

    // IF stage -> ID stage
    function createIFID() {
        return {
            instruction: null,
            pc: 0,
            pcPlus4: 0,
            valid: false
        };
    }

    // ID stage -> EX stage
    function createIDEX() {
        return {
            instruction: null,
            pc: 0,
            pcPlus4: 0,

            rs1: 0,
            rs2: 0,
            rd: 0,

            operandA: 0,
            operandB: 0,
            immediate: 0,

            RegWrite: false,
            ALUSrc: false,
            ALUControl: "ADD",
            MemRead: false,
            MemWrite: false,
            MemtoReg: false,
            Branch: false,

            valid: false
        };
    }

    // EX stage -> MEM stage
    function createEXMEM() {
        return {
            instruction: null,
            pc: 0,

            aluResult: 0,
            storeData: 0,
            rd: 0,

            branchTarget: 0,
            branchTaken: false,

            RegWrite: false,
            MemRead: false,
            MemWrite: false,
            MemtoReg: false,

            valid: false
        };
    }

    // MEM stage -> WB stage
    function createMEMWB() {
        return {
            instruction: null,

            aluResult: 0,
            memoryData: 0,
            rd: 0,

            RegWrite: false,
            MemtoReg: false,

            valid: false
        };
    }

    function createPipelineRegisters() {
        return {
            IFID: createIFID(),
            IDEX: createIDEX(),
            EXMEM: createEXMEM(),
            MEMWB: createMEMWB()
        };
    }

    const api = {
        createIFID: createIFID,
        createIDEX: createIDEX,
        createEXMEM: createEXMEM,
        createMEMWB: createMEMWB,
        createPipelineRegisters: createPipelineRegisters
    };

    root.LIMOPipelineRegisters = api;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

})(typeof window !== "undefined" ? window : global);
