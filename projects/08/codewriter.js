// 存放生成的symbol
const symbols = []

// 初始化
function writeInit() {
    let output = '@256\n'
               + 'D=A\n'
               + '@SP\n'
               + 'M=D\n'

    output += writeCall('call Sys.init 0', 'call')
    return output
} 

let index = 0
function writeArithmetic(command) {
    let output

    let output1 = '@SP\n'
                + 'AM=M-1\n'
                + 'D=M\n'
                + 'A=A-1\n'

    let output2 = '@SP\n'
                + 'AM=M-1\n'

    let output3 = '@SP\n'
                + 'M=M+1\n'

    switch (command) {
        case 'add':
            output = output1 + 'M=M+D\n'
            break
        case 'sub':
            output = output1 + 'M=M-D\n'
            break
        case 'neg':
            output = output2 + 'M=-M\n' + output3
            break
        case 'eq':
            output = createJudgementString('JEQ', index++)
            break
        case 'gt':
            output = createJudgementString('JGT', index++)
            break
        case 'lt':
            output = createJudgementString('JLT', index++)
            break
        case 'and':
            output = output1 + 'M=M&D\n'
            break
        case 'or':
            output = output1 + 'M=M|D\n'
            break
        case 'not':
            output = output2 + 'M=!M\n' + output3
            break
    }

    return output
}

function writePushPop(command, type, fileName) {
    let v1 = arg1(command).toUpperCase()
    let v2 = arg2(command, type)

    return processSegment(v1, v2, type, fileName)
}

function writeLabel(command) {
    let label = command.split(' ').pop()
    let output = '(' + label + ')\r\n'

    return output
}

function writeGoto(command) {
    let label = command.split(' ').pop()
    let output = '@' + label + '\r\n'
               + '0;JMP\n'

    return output
}

function writeIf(command) {
    let label = command.split(' ').pop()
    let output = '@SP\n'
               + 'AM=M-1\n'
               + 'D=M\n'
               + '@' + label + '\r\n'
               + 'D;JNE\n'

    return output
}

let callIndex = -1
const callArry = ['LCL', 'ARG', 'THIS', 'THAT']
function writeCall(command, type) {
    callIndex++
    let funcName = arg1(command).toUpperCase()
    let argumentNum = arg2(command, type)
    let output = '@' + funcName + 'RETURN_ADDRESS' + callIndex + '\r\n'
               + 'D=A\n'
               + '@SP\n'
               + 'A=M\n'
               + 'M=D\n'
               + '@SP\n'
               + 'M=M+1\n'

    callArry.forEach(symbol => {
        output += '@' + symbol + '\r\n'
                + 'D=M\n'
                + '@SP\n'
                + 'A=M\n'
                + 'M=D\n'
                + '@SP\n'
                + 'M=M+1\n'
    }) 

    output += '@' + argumentNum + '\r\n'
            + 'D=A\n'
            + '@5\n'
            + 'D=A+D\n'
            + '@SP\n'
            + 'D=M-D\n'
            + '@ARG\n'
            + 'M=D\n'
            + '@SP\n'
            + 'D=M\n'
            + '@LCL\n'
            + 'M=D\n'
            + '@' + funcName + '\r\n'
            + '0;JMP\n'
            + '(' + funcName + 'RETURN_ADDRESS' + callIndex + ')\r\n'

    return output
}

const pointerArry = ['THAT', 'THIS', 'ARG', 'LCL']
function writeReturn(command) {
    let str = ''
    pointerArry.forEach(symbol=> {
        str += '@R13\n'
             + 'D=M-1\n'
             + 'AM=D\n'
             + 'D=M\n'
             + '@' + symbol + '\r\n'
             + 'M=D\n'
    })

    let output = '@LCL\n'
               + 'D=M\n'
               + '@R13\n'
               + 'M=D\n'
               + '@5\n'
               + 'A=D-A\n'
               + 'D=M\n'
               + '@R14\n' // 保存返回地址
               + 'M=D\n'
               + '@SP\n'
               + 'AM=M-1\n'
               + 'D=M\n'
               + '@ARG\n'
               + 'A=M\n'
               + 'M=D\n'
               + '@ARG\n'
               + 'D=M+1\n'
               + '@SP\n'
               + 'M=D\n'
               + str
               + '@R14\n'
               + 'A=M\n'
               + '0;JMP\n'

    return output
}

function writeFunction(command, type) {
    let funcName = arg1(command).toUpperCase()
    let localNum = arg2(command, type)
    let output = '(' + funcName + ')\r\n'

    while (localNum--) {
        output += writePushPop('push constant 0', 'push')
    }

    return output
}

function createJudgementString(judge, index) {
    // 先将两个数相减 再根据给出条件 大于 等于 小于 来处理
    // 因为判断大小需要用到跳转 所以得随机产生两个不同的symbol作标签
    let str = '@SP\n'
            + 'AM=M-1\n'
            + 'D=M\n'
            + 'A=A-1\n'
            + 'D=M-D\n'
            + '@TRUE' + index + '\r\n' // 如果符合条件判断 则跳转到symbol1标记的地址
            + 'D;' + judge + '\r\n' // 否则接着往下处理
            + '@SP\n'
            + 'A=M-1\n'
            + 'M=0\n'
            + '@CONTINUE' + index +  '\r\n'
            + '0;JMP\n'
            + '(TRUE' + index + ')\r\n'
            + '@SP\n'
            + 'A=M-1\n'
            + 'M=-1\n'
            + '(CONTINUE' + index + ')\r\n'
    return str
}

function processSegment(v1, v2, type, fileName) {
    let output
    switch (v1) {
        case 'CONSTANT':
            output = '@' + v2 + '\r\n'
                    + 'D=A\n'
                    + '@SP\n'
                    + 'A=M\n'
                    + 'M=D\n'
                    + '@SP\n'
                    + 'M=M+1\n'
            break
        case 'STATIC':
            if (type == 'push') {
                output = '@' + fileName + '.' + v2 + '\r\n'
                        + 'D=M\n'
                        + '@SP\n'
                        + 'A=M\n'
                        + 'M=D\n'
                        + '@SP\n'
                        + 'M=M+1\n'
            } else {
                output = '@SP\n'
                        + 'AM=M-1\n'
                        + 'D=M\n'
                        + '@' + fileName + '.' + v2 + '\r\n'
                        + 'M=D\n'
            }
            break
        case 'POINTER':
            if (v2 == 0) {
                v1 = 'THIS'
            } else if (v2 == 1) {
                v1 = 'THAT'
            }

            if (type == 'push') {
                output = '@' + v1 + '\r\n'  
                        + 'D=M\n'
                        + '@SP\n'
                        + 'A=M\n'
                        + 'M=D\n'
                        + '@SP\n'
                        + 'M=M+1\n'
            } else {
                output = '@' + v1 + '\r\n'  
                        + 'D=A\n'
                        + '@R13\n'
                        + 'M=D\n'
                        + '@SP\n'
                        + 'AM=M-1\n'
                        + 'D=M\n'
                        + '@R13\n'
                        + 'A=M\n'
                        + 'M=D\n'
            }
            break
        case 'TEMP':
            if (type == 'push') {
                output = pushTemplate('@R5\n', v2, false)
            } else {
                output = popTemplate('@R5\n', v2, false)
            }

            break
        default:
            let str
            if (v1 == 'LOCAL') {
                str = '@LCL\n'  
            } else if (v1 == 'ARGUMENT') {
                str = '@ARG\n'  
            } else {
                str = '@' + v1 + '\r\n'  
            }
            
            if (type == 'push') {
                output = pushTemplate(str, v2, true)
            } else {
                output = popTemplate(str, v2, true)
            }
    }

    return output
}


function arg1(command, type) {
    if (type == 'arith') {
        return command
    } else {
        const tempArry = command.split(' ').slice(1)
        let arg = tempArry.shift()
        while (arg === '') {
            arg = tempArry.shift()
        }

        return arg
    }
}

let arg2Arry = ['push', 'pop', 'function', 'call']
function arg2(command, type) {
    if (arg2Arry.includes(type)) {
        return command.split(' ').pop()
    }
}


function popTemplate(str, v2, flag) {
    let str1 = flag? 'D=M\n' : 'D=A\n'
    let output = str
                + str1
                + '@' + v2 + '\r\n'
                + 'D=D+A\n'
                + '@R13\n'
                + 'M=D\n'
                + '@SP\n'
                + 'AM=M-1\n'
                + 'D=M\n'
                + '@R13\n'
                + 'A=M\n'
                + 'M=D\n'

    return output
}

function pushTemplate(str, v2, flag) {
    let str1 = flag? 'D=M\n' : 'D=A\n'
    let output = str  
                + str1
                + '@' + v2 + '\r\n'
                + 'A=D+A\n'
                + 'D=M\n'
                + '@SP\n'
                + 'A=M\n'
                + 'M=D\n'
                + '@SP\n'
                + 'M=M+1\n'

    return output
}

module.exports = {
    writePushPop,
    writeArithmetic,
    writeLabel,
    writeGoto,
    writeIf,
    writeCall,
    writeReturn,
    writeFunction,
    writeInit,
}