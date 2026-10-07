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

4. A4 – Sesotho Assembly

Mnemonics are Sesotho words or documented abbreviations and are typeable using a standard keyboard. Operands are separated by commas. Labels end with a colon and comments begin with #. 

|Mnemonic| 	Meaning| 	Operation| 	Format| 	RV32I equivalent| 	Example|
|:---|:---|:---|:---|:---|:---|
|eketsa| 	add| 	rd = rs1 + rs2| 	R |	ADD| 	eketsa rd, rs1, rs2| 
|fokotsa 	|subtract 	|rd = rs1 − rs2 |	R 	|SUB 	|fokotsa rd, rs1, rs2| 
|eketsi|	add immediate| 	rd = rs1 + imm|	I| 	ADDI |	eketsi rd, rs1, imm| 
le 	|AND 	|rd = rs1 AND rs2 	|R 	|AND 	|le rd, rs1, rs2|
|kapa |	OR| 	rd = rs1 OR rs2| 	R| 	OR |	kapa rd, rs1, rs2|
|suthela| 	shift left logical| 	rd = rs1 << rs2[4:0] |	R| 	SLL |	suthela rd, rs1, rs2 |
|bala 	|load word 	|rd = Mem[rs1+imm] 	|I 	|LW 	|bala rd, imm(rs1)|
|boloka |	store word 	|Mem[rs1+imm] =rs2| 	S 	|SW |	boloka rs2, imm(rs1)| 
|lekana 	|branch if equal 	|if rs1 == rs2 PC+= offset| 	B 	|BEQ 	|lekana rs1, rs2, mosebetsing|
|selekane| 	branch if not equal| 	if rs1 != rs2: PC+= offset |	B |	BNE| 	selekane rs1, rs2, mosebetsing|
|qhoma	|jump and link	|rd = PC + 4; PC += offset|	J 	|JAL	|qhoma r2,loop|

Apostrophe handling 

The assembler accepts the ASCII apostrophe (') inside a mnemonic token so future Sesotho mnemonics can represent forms such as ts' or ch'. Curly Unicode apostrophes are rejected to keep tokenisation predictable on a standard keyboard.




