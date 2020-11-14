// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Fill.asm

// Runs an infinite loop that listens to the keyboard input.
// When a key is pressed (any key), the program blackens the screen,
// i.e. writes "black" in every pixel;
// the screen should remain fully black as long as the key is pressed. 
// When no key is pressed, the program clears the screen, i.e. writes
// "white" in every pixel;
// the screen should remain fully clear as long as no key is pressed.

// Put your code here.

@8192
D = A
@n
M = D

(MAIN)
  // (CLEAR)
  @color
  M = 0

  @i
  M = 0

  // Reset Addr
  @SCREEN
  D = A
  @addr
  M = D

  @KBD
  D = M

  // If not 0, pressed, draw dark
  // If 0, not pressed, loop
  @LOOP
  D;JEQ
  
  (DARK)
  @color
  M = -1

  (LOOP)
    @i
    D = M

    @n
    D = M - D

    // If n - i <= 0, i >= n
    @STOP
    D;JLE

    @color
    D = M
    @addr
    A = M
    M = D

    @addr
    M = M + 1

    @i
    M = M + 1

    @LOOP
    0;JMP

  (STOP)
    @MAIN
    0;JMP
