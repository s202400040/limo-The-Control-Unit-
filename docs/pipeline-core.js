

"use strict";

// LIMO M3: Five-Stage Pipeline Core
// Uses the existing M2 assembler, decoder and pipeline registers.

(function (root) {

    function getPipelineRegisters() {
        if (root.LIMOPipelineRegisters) {
            return root.LIMOPipelineRegisters;
        }

        if (typeof require !== "undefined") {
            return require("./pipeline-registers.js");
        }

        throw new Error("Pipeline registers module not found.");
    }

    function getDecoder() {
        if (root.LIMOPipeline) {
            return root.LIMOPipeline;
        }

        if (typeof require !== "undefined") {
            return require("./pipeline.js");
        }

        throw new Error("Pipeline decoder module not found.");
    }

    function getAssembler() {
        if (root.LIMOAssembler) {
            return root.LIMOAssembler;
        }

        if (typeof require !== "undefined") {
            return require("./assembler.js");
        }

        throw new Error("Assembler module not found.");
    }

    function createCore() {

        const registersModule = getPipelineRegisters();
        const decoder = getDecoder();

        const core = {
            pc: 0,
            cycles: 0,
            halted: false,

            instructions: [],
            instructionMemory: {},
            dataMemory: {},

            registers: new Array(16).fill(0),

            pipeline: registersModule.createPipelineRegisters(),

            completedInstructions: 0
        };

        // --------------------------------
        // REGISTER FILE
        // --------------------------------

        function readRegister(index) {
            if (index === 0) {
                return 0;
            }

            return core.registers[index] | 0;
        }

        function setRegister(index, value) {
            if (index !== 0) {
                core.registers[index] = value | 0;
            }

            // r0 is always zero.
            core.registers[0] = 0;
        }

        // --------------------------------
        // RESET
        // --------------------------------

        function reset(sourceOrInstructions) {

            core.pc = 0;
            core.cycles = 0;
            core.halted = false;

            core.dataMemory = {};
            core.instructionMemory = {};

            core.registers = new Array(16).fill(0);

            core.pipeline =
                registersModule.createPipelineRegisters();

            core.completedInstructions = 0;

            if (typeof sourceOrInstructions === "string") {

                const assembler = getAssembler();

                core.instructions =
                    assembler.assemble(sourceOrInstructions);

            } else {

                core.instructions = sourceOrInstructions || [];
            }

            // Load instructions into instruction memory.

            core.instructions.forEach(function (item) {

                const address = parseInt(item.address, 16);

                core.instructionMemory[address] =
                    item.word >>> 0;

            });

            return snapshot();
        }

        // --------------------------------
        // SNAPSHOT
        // --------------------------------

        function snapshot() {

            return {
                pc: core.pc,

                cycles: core.cycles,

                halted: core.halted,

                registers: core.registers.slice(),

                dataMemory: Object.assign(
                    {},
                    core.dataMemory
                ),

                pipeline: JSON.parse(
                    JSON.stringify(core.pipeline)
                ),

                completedInstructions:
                    core.completedInstructions
            };
        }

        // --------------------------------
        // STEP: ONE PIPELINE CYCLE
        // --------------------------------

        function step() {

            if (core.halted) {
                return snapshot();
            }

            core.cycles++;

            // Save the previous pipeline registers.
            // Each stage reads the values from the previous cycle.

            const oldIFID = core.pipeline.IFID;
            const oldIDEX = core.pipeline.IDEX;
            const oldEXMEM = core.pipeline.EXMEM;
            const oldMEMWB = core.pipeline.MEMWB;

            // =================================
            // WB STAGE: WRITE BACK
            // =================================

            if (oldMEMWB.valid) {

                if (oldMEMWB.RegWrite) {

                    const writeValue = oldMEMWB.MemtoReg
                        ? oldMEMWB.memoryData
                        : oldMEMWB.aluResult;

                    setRegister(
                        oldMEMWB.rd,
                        writeValue
                    );
                }

                core.completedInstructions++;
            }

            // =================================
            // MEM STAGE: MEMORY ACCESS
            // =================================

            const nextMEMWB =
                registersModule.createMEMWB();

            if (oldEXMEM.valid) {

                nextMEMWB.valid = true;

                nextMEMWB.instruction =
                    oldEXMEM.instruction;

                nextMEMWB.rd = oldEXMEM.rd;

                nextMEMWB.RegWrite =
                    oldEXMEM.RegWrite;

                nextMEMWB.MemtoReg =
                    oldEXMEM.MemtoReg;

                nextMEMWB.aluResult =
                    oldEXMEM.aluResult;

                // Load word.
                if (oldEXMEM.MemRead) {

                    nextMEMWB.memoryData =
                        core.dataMemory[oldEXMEM.aluResult] || 0;
                }

                // Store word.
                if (oldEXMEM.MemWrite) {

                    core.dataMemory[oldEXMEM.aluResult] =
                        oldEXMEM.storeData | 0;
                }
            }

            // =================================
            // EX STAGE: EXECUTE
            // =================================

            const nextEXMEM =
                registersModule.createEXMEM();

            if (oldIDEX.valid) {

                const instruction =
                    oldIDEX.instruction;

                const name = instruction.name;

                // Start with values read during ID.
                let operandA = oldIDEX.operandA;
                let operandB = oldIDEX.operandB;

                

                // ---------------------------------
                // ALU OPERATIONS
                // ---------------------------------

                let result = 0;

                if (name === "eketsa") {

                    result = operandA + operandB;

                } else if (name === "fokotsa") {

                    result = operandA - operandB;

                } else if (name === "eketsi") {

                    result = operandA + oldIDEX.immediate;

                } else if (name === "le") {

                    result = operandA & operandB;

                } else if (name === "kapa") {

                    result = operandA | operandB;

                } else if (name === "suthela") {

                    result =
                        operandA << (operandB & 31);

                } else if (
                    name === "bala" ||
                    name === "boloka"
                ) {

                    result =
                        operandA + oldIDEX.immediate;

                } else if (name === "lekana") {

                    nextEXMEM.branchTaken =
                        operandA === operandB;

                } else if (name === "selekane") {

                    nextEXMEM.branchTaken =
                        operandA !== operandB;
                }

                // ---------------------------------
                // EX/MEM PIPELINE REGISTER
                // ---------------------------------

                nextEXMEM.valid = true;

                nextEXMEM.instruction = instruction;

                nextEXMEM.aluResult = result | 0;

                // Store data must also use the
                // forwarded operand.

                nextEXMEM.storeData =
                    operandB | 0;

                nextEXMEM.rd = oldIDEX.rd;

                nextEXMEM.RegWrite =
                    oldIDEX.RegWrite;

                nextEXMEM.MemRead =
                    name === "bala";

                nextEXMEM.MemWrite =
                    name === "boloka";

                nextEXMEM.MemtoReg =
                    name === "bala";
            }

            // =================================
            // ID STAGE: INSTRUCTION DECODE
            // =================================

            const nextIDEX =
                registersModule.createIDEX();

            if (oldIFID.valid) {

                const decoded =
                    decoder.decodeInstruction(
                        oldIFID.instruction,
                        oldIFID.pc
                    );

                if (decoded.type !== "INVALID") {

                    nextIDEX.valid = true;

                    nextIDEX.instruction = decoded;

                    nextIDEX.pc = oldIFID.pc;

                    nextIDEX.pcPlus4 =
                        oldIFID.pcPlus4;

                    nextIDEX.rs1 = decoded.rs1;

                    nextIDEX.rs2 = decoded.rs2;

                    nextIDEX.rd = decoded.rd;

                    nextIDEX.operandA =
                        readRegister(decoded.rs1);

                    nextIDEX.operandB =
                        readRegister(decoded.rs2);

                    nextIDEX.immediate =
                        decoded.immediate;

                    const control =
    decoder.generateControlSignals(decoded);

nextIDEX.RegWrite = control.RegWrite;
nextIDEX.ALUSrc = control.ALUSrc;
nextIDEX.ALUControl = control.ALUControl;
nextIDEX.MemRead = control.MemRead;
nextIDEX.MemWrite = control.MemWrite;
nextIDEX.MemtoReg = control.MemtoReg;
nextIDEX.Branch = control.Branch;
                }
            }

            // =================================
            // IF STAGE: INSTRUCTION FETCH
            // =================================

            const nextIFID =
                registersModule.createIFID();

            const word =
                core.instructionMemory[core.pc];

            if (word !== undefined) {

                nextIFID.valid = true;

                nextIFID.instruction = word;

                nextIFID.pc = core.pc;

                nextIFID.pcPlus4 =
                    core.pc + 4;

                core.pc += 4;
            }

            // =================================
            // UPDATE PIPELINE REGISTERS
            // =================================

            core.pipeline.MEMWB = nextMEMWB;

            core.pipeline.EXMEM = nextEXMEM;

            core.pipeline.IDEX = nextIDEX;

            core.pipeline.IFID = nextIFID;

            // =================================
            // CHECK WHETHER PIPELINE IS EMPTY
            // =================================

            const pipelineEmpty =
                !core.pipeline.IFID.valid &&
                !core.pipeline.IDEX.valid &&
                !core.pipeline.EXMEM.valid &&
                !core.pipeline.MEMWB.valid;

            const programFinished =
                core.pc >= core.instructions.length * 4;

            if (pipelineEmpty && programFinished) {

                core.halted = true;
            }

            return snapshot();
        }

        // --------------------------------
        // RUN
        // --------------------------------

        function run(maxCycles) {

            const limit = maxCycles || 1000;

            let state = snapshot();

            while (
                !core.halted &&
                core.cycles < limit
            ) {

                state = step();
            }

            return state;
        }

        // --------------------------------
        // PUBLIC FUNCTIONS
        // --------------------------------

        return {

            reset: reset,

            step: step,

            run: run,

            snapshot: snapshot,

            readRegister: readRegister,

            setRegister: setRegister
        };
    }

    const api = {
        createCore: createCore
    };

    root.LIMOPipelineCore = api;

    if (
        typeof module !== "undefined" &&
        module.exports
    ) {

        module.exports = api;
    }

})(typeof window !== "undefined" ? window : global);
