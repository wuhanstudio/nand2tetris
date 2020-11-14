import os
import sys
import vmparser
import codeWriter

pathname = sys.argv[1]          # pathname can be directory or file

asm_lines = []              # array; used to print lines to .asm file at the end
asm_filename = ""           # will be set depending on whether pathname is directory or file

def main():                 # called at bottom of file
    global asm_lines, asm_filename

    if os.path.isfile(pathname):                        # if pathname is a file
        asm_filename = pathname.split(".")[0] + ".asm"  # "SimpleAdd/SimpleAdd.vm" => "SimpleAdd/SimpleAdd.asm"
        translate_file(pathname)

    elif os.path.isdir(pathname):                           # if pathname is a directory
        folder_name = pathname.strip("/").split("/")[-1]    # strip("/") to remove trailing "/" if provided
        asm_filename = pathname + "/" + folder_name + ".asm"      # "StackArithmetic/SimpleAdd/" => "StackArithmetic/SimpleAdd/SimpleAdd.asm"

        for filename in os.listdir(pathname):               # translate all .vm files in specified directory
            if filename.endswith(".vm"):
                translate_file(pathname + "/" + filename)

    for i, line in enumerate(asm_lines):                # add newline character after each asm instruction
        asm_lines[i] = line + "\n"

    asm_file = open(asm_filename, "w")                  # open and write to .asm file
    asm_file.writelines(asm_lines)                      # after done translating all .vm files

def translate_file(filename):
    global asm_lines        # use global asm_lines to consolidate asm lines from multiple .vm files

    vm_file = open(filename, "r")
    file_prefix = filename.split("/")[-1].split(".")[0]  # "MemoryAccess/StaticTest/StaticTest.vm" => "StaticTest"

    for line in vm_file:
        parsed_fields = vmparser.parse(line)      # returns array - ["push", "local", "3"]

        if parsed_fields is None:               # returns None if comment line or empty line
            continue
        
        asm_lines += ["// " + line.strip()]     # adds vm comment (e.g. // push local 3) before asm instructions

        asm_codes = codeWriter.translate(parsed_fields, file_prefix) # returns array of codes

        asm_lines += asm_codes

main()


