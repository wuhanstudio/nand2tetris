equality_code_counter = 0   # differentiate equality labels in same program (EQUAL_0, EQUAL_1, LESSER_2, EQUAL_3)

def translate(parsed_fields, file_prefix):   # accepts array - ["push", "local", "3"], and "StaticTest" file prefix
    command = parsed_fields[0]  # push, pop, add, sub, eq, not, etc.

    if command in ["eq", "gt", "lt", "add", "sub", "neg", "and", "or", "not"]:  # all 9 arithmetic/logical
        return get_arith_codes(command) 
    elif command == "push":
        return get_push_codes(parsed_fields, file_prefix)   # file_prefix provided for static variable names
    elif command == "pop":
        return get_pop_codes(parsed_fields, file_prefix)

def get_arith_codes(command):
    if command in ["eq", "gt", "lt"]:
        return get_equality_codes(command)
    else:
        return ARITH_LOGIC_CODES[command]

def get_equality_codes(command):                                            # eq, gt, lt
    global equality_code_counter

    equality_label = EQUALITY_LABELS[command] + str(equality_code_counter)  # "EQUAL_" + "3" => "EQUAL_3"
    done_label = "DONE_" + str(equality_code_counter)                       # "DONE_" + "2" => "DONE_2"
    jump_code = JUMP_CODES[command]                                         # "D;JEQ"
    equality_code_counter += 1                                              # ensure uniqueness

    asm_codes = [
        "@SP", "M=M-1", "A=M", "D=M", "@SP", "A=M-1", "D=M-D",
        f"@{equality_label}",  jump_code, "@SP", "A=M-1", "M=0",
        f"@{done_label}", "0;JMP",
        f"({equality_label})", "@SP", "A=M-1", "M=-1", f"({done_label})"
    ]

    return asm_codes

ARITH_LOGIC_CODES = {
    "add": ["@SP", "M=M-1", "A=M", "D=M", "@SP", "A=M-1", "M=M+D"],
    "sub": ["@SP", "M=M-1", "A=M", "D=M", "@SP", "A=M-1", "M=M-D"],
    "neg": ["@SP", "A=M-1", "M=-M", "M=M+1"],                           # add 1 after
    "and": ["@SP", "M=M-1", "A=M", "D=M", "@SP", "A=M-1", "M=M&D"],
    "or": ["@SP", "M=M-1", "A=M", "D=M", "@SP", "A=M-1", "M=M|D"],
    "not": ["@SP", "A=M-1", "M=!M", "M=M+1"]                            # add 1 after
}

EQUALITY_LABELS = {
    "eq": "EQUAL_",
    "gt": "GREATER_",
    "lt": "LESSER_"
}

JUMP_CODES = {
    "eq": "D;JEQ",
    "gt": "D;JGT",
    "lt": "D;JLT"
}

def get_push_codes(parsed_fields, file_prefix):     # local, argument, this, that, temp, pointer, static, constant
    asm_codes = []              # array to be returned once done
    segment = parsed_fields[1]  # local
    i = parsed_fields[2]        # 3

    if segment == "constant":
        asm_codes = [f"@{i}", "D=A", "@SP", "A=M", "M=D", "@SP", "M=M+1"]
    elif segment == "static":
        asm_codes = [f"@{file_prefix}.{i}", "D=M", "@SP", "A=M", "M=D", "@SP", "M=M+1"]
    else:
        segment_code = SEGMENT_CODES[segment]       # for local, argument, this, that, temp, pointer

        asm_codes = [
            segment_code, "D=M", f"@{i}", "A=D+A", "D=M",
            "@SP", "A=M", "M=D",
            "@SP", "M=M+1"
        ]

        if segment in ["temp", "pointer"]:  # reference addresses directly; push temp 3 => push (5 + 3)
            asm_codes[1] = "D=A"            # no need to dereference, unlike LCL, ARG, THIS, THAT

    return asm_codes

def get_pop_codes(parsed_fields, file_prefix):   # accepts array - ["pop", "local", "3"]
    asm_codes = []                  # array to be returned once done
    segment = parsed_fields[1]      # local
    i = parsed_fields[2]            # 3

    if segment == "static":
        asm_codes = ["@SP", "M=M-1", "A=M", "D=M", f"@{file_prefix}.{i}", "M=D"]
    else:
        segment_code = SEGMENT_CODES[segment]

        asm_codes = [
            segment_code, "D=M", f"@{i}", "D=D+A", "@addr", "M=D",
            "@SP", "M=M-1", "A=M", "D=M",
            "@addr", "A=M", "M=D"
        ]

        if segment in ["temp", "pointer"]:    
            asm_codes[1] = "D=A"                        

    return asm_codes

SEGMENT_CODES = {
    "local": "@LCL",        # push local 3 -> push (*LCL + 3) => first need to get value stored in LCL register
    "argument": "@ARG",
    "this": "@THIS",
    "that": "@THAT",
    "temp": "@5",           # push temp 3 => push (5 + 3)
    "pointer": "@3",
}


