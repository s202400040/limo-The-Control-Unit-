LIMO INSTRUCTION SET ARCHITECTURE(ISA) SPECIFICATION

Project: Sesotho-Language Processor Derived from RISC-V

Milestone: M1- LIMO ISA Specification

Team name: The Control Unit


1.	A1 – Machine Style


|Property| 	LIMO decision| 	Reason|
|:---| :---|:---|
|Word size| 	32-bit| 	Required by the project and suitable for the datapath.| 
|Memory model |	Load-store |	Only loads and stores access data memory.| 
|Addressing| 	Byte-addressed| 	Each byte has its own address.| 
|Endianness 	|Little-endian 	|Least-significant byte occupies the lowest address.| 
|Alignment| 	Word-aligned |	Word accesses use addresses divisible by 4. |
|Instruction size| 	Fixed 32 bits| 	Simplifies instruction fetch and pipeline control.| 
|Formats 	|R, I, S, B; J  	|Covers required operations and jump support.| 
Excluded 	|Multiply/divide, floating point, CSRs, exceptions |	Explicitly excluded by the handout.| 

Main departure from RV32I: LIMO uses 16 registers instead of 32. Register identifiers are therefore 4 bits. The remaining instruction bits are reorganised so every instruction is still exactly 32 bits. 
