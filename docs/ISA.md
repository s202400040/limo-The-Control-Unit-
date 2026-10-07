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

2. A2 – Register Architecture

LIMO has sixteen 32-bit general-purpose registers, r0–r15. Each register is selected using a 4-bit field. r0 is hardwired to zero and ignores writes, r1 is the stack pointer and r2 is the return-address register. 

|Register| 	Sesotho name/description| 	Purpose|
|:---|:---|:---|
|r0 | zero| 	lefela| 	Constant zero| 
|r1 	|sepache	|Stack pointer|
|r2 |	boela|	Return Address| 
|r3 -r6|	Khang0-3|	General purpose (Argument)|
|r7-r11	|Nakoana0-4	|General purpose (Temporary)|
|r12-r15|	Boloka0-3|	General purpose(saved)|
|PC 	|sebali_sa_lenaneo 	|Program counter |
 
Register-field consequence 
Sixteen registers require 4 bits because 2^4 = 16. Compared with a 32-register design requiring 5-bit register fields, this saves one bit for each register identifier but increases register pressure

3. A3 – Instruction Set

LIMO contains 11 instructions.

|Mnemonic| 	Instruction classes|
|:---|:---|
|eketsa |	Arithmetic|
|fokotsa |	Arithmetic| 
|eketsi	|Arithmetic|
|le| 	Logic|
|kapa 	|Logic|
|suthela| 	Logic|
|bala 	|Load|
|boloka| 	Store|
|lekana 	|Conditional branch|
|selekane| 	Conditional branch|
|qhoma|	jump|



