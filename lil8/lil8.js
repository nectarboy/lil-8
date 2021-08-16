// Lil-8 is a very minimalistic JS game engine.
// The point of this game engine is to not use variables,
// only working with 32 bytes of ram, and using immediate / constant values.
// If u wanna be a lil bitch and use variables, idc do what u want with this uwu
// nectarboy - 2021

function Lil8(canvas) {
    const that = this;

    // --- Lil-8 Constants - TODO - make more masks
    const WIDTH = 128;
    const HEIGHT = 128;
    const STACK_SIZE = 8;
    const STACK_MASK = STACK_SIZE - 1;

    const MS_PERFRAME = 1000 / 60;

    // --- Initializaztion of components
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const ctx = canvas.getContext('2d');
    const frameBuf = ctx.createImageData(WIDTH, HEIGHT);

    // Hardcoded pallete (NES pallete)
    const pallete = [
        [0x66,0x66,0x66],[0x00,0x22,0x88],[0x00,0x00,0xcc],[0x66,0x44,0xcc],[0x88,0x00,0x66],[0xaa,0x00,0x66],[0xaa,0x22,0x00],[0x88,0x44,0x00],[0x66,0x44,0x00],[0x22,0x44,0x00],[0x00,0x66,0x22],[0x00,0x88,0x00],[0x00,0x44,0x44],[0x00,0x00,0x00],[0x00,0x00,0x00],[0x00,0x00,0x00],
        [0xaa,0xaa,0xaa],[0x00,0x66,0xbb],[0x00,0x44,0xff],[0x88,0x00,0xff],[0xaa,0x00,0xff],[0xff,0x00,0x88],[0xff,0x00,0x00],[0xcc,0x66,0x00],[0x88,0x66,0x00],[0x22,0x88,0x00],[0x00,0x88,0x00],[0x00,0xaa,0x66],[0x00,0x88,0x88],[0x00,0x00,0x00],[0x00,0x00,0x00],[0x00,0x00,0x00],
        [0xff,0xff,0xff],[0x66,0xaa,0xff],[0x88,0x88,0xff],[0xbb,0x66,0xff],[0xff,0x00,0xff],[0xff,0x66,0xff],[0xff,0x88,0x00],[0xff,0xaa,0x00],[0xbb,0xbb,0x00],[0x66,0xbb,0x00],[0x00,0xff,0x00],[0x44,0xff,0xbb],[0x00,0xff,0xff],[0x00,0x00,0x00],[0x00,0x00,0x00],[0x00,0x00,0x00],
        [0xff,0xff,0xff],[0xaa,0xbb,0xff],[0xbb,0xaa,0xff],[0xff,0xaa,0xff],[0xff,0x88,0xff],[0xff,0xaa,0xaa],[0xff,0xbb,0x88],[0xff,0xff,0x44],[0xff,0xff,0x66],[0xaa,0xff,0x44],[0x88,0xff,0x66],[0x44,0xff,0xbb],[0x88,0xbb,0xff],[0x00,0x00,0x00],[0x00,0x00,0x00],[0x00,0x00,0x00]
    ];

    // --- Accessible variables
    this.ram = new Uint8Array(32); // 32 bytes of ram
    this.stack = new Uint8Array(8); // 8 stack bytes

    var sp = 0;
    this.Push = function(val) {
        this.stack[sp] = val;
        sp = (sp + 1) & STACK_MASK;
    };

    this.Pop = function(val) {
        sp = (sp - 1) & STACK_MASK;
        return this.stack[sp];
    };

    // --- Drawing / rendering methods
    this.PutPixel = function(x, y, col) {
        x &= 0x7f;
        y &= 0x7f;
        col &= 0x3f;

        const ind = 4 * (y * WIDTH + x);
        frameBuf.data[ind]      = pallete[col][0];
        frameBuf.data[ind + 1]  = pallete[col][1];
        frameBuf.data[ind + 2]  = pallete[col][2];
        frameBuf.data[ind + 3]  = 0xff;
    };

    this.FillScreen = function(col) {
        for (var i = 0; i < WIDTH; i++)
            for (var ii = 0; ii < HEIGHT; ii++)
                this.PutPixel(i, ii, col);
    };

    this.RenderScreen = function() {
        ctx.putImageData(frameBuf, 0, 0);
    };

    // --- Controller
    // Key logic
    const keysPressedThisFrame = [];
    const keys = {
        up: [false, false], down: [false, false], left: [false, false], right: [false, false],
        z: [false, false], x: [false, false]
    };

    function CheckKeysPressedThisFrame() {
        for (var i = 0; i < keysPressedThisFrame.length; i++)
            keysPressedThisFrame[i][1] = false;

        keysPressedThisFrame.length = 0;
    }

    function SwitchKeyState(code, val) {
        var key;
        switch (code) {
            case 'ArrowUp': case 'KeyW':
                key = keys.up;
                break;
            case 'ArrowDown': case 'KeyS':
                key = keys.down;
                break;
            case 'ArrowLeft': case 'KeyA':
                key = keys.left;
                break;
            case 'ArrowRight': case 'KeyD':
                key = keys.right;
                break;

            case 'KeyZ':
                key = keys.z;
                break;
            case 'KeyX':
                key = keys.x;
                break;

            default:
                return;
        }

        key[0] = val;
        key[1] = val;
    }

    // Key events
    const keycodesFired = {};
    function OnKeyDown(e) {
        if (keycodesFired[e.keyCode])
            return;
        keycodesFired[e.keyCode] = true;

        SwitchKeyState(e.code, true);
    }

    function OnKeyUp(e) {
        delete keycodesFired[e.keyCode];
        SwitchKeyState(e.code, false);
    }

    // Listeners
    function StartKeyListeners() {
        document.addEventListener('keydown', OnKeyDown);
        document.addEventListener('keyup', OnKeyUp);
    }

    function StopKeyListeners() {
        document.removeEventListener('keydown', OnKeyDown);
        document.removeEventListener('keyup', OnKeyUp);
    }

    // Controller methods
    this.KeyPressed = function(but) {
        return keys[but][0];
    };

    this.KeyPressedNow = function(but) {
        return keys[but][1];
    };

    // --- Program loops
    var timeout = null; // Null when not running, timeout id otherwise
    var loopFunc = () => {}; // Defaults to noop function

    function Loop() {
        loopFunc();
        CheckKeysPressedThisFrame();

        timeout = setTimeout(Loop, MS_PERFRAME);
    };

    this.SetLoopFunc = function(func) {
        if (typeof func !== 'function')
            throw 'Lil8.SetLoopFunc :: not a function ...';

        loopFunc = func;
    };

    var running = false;
    this.Start = function() {
        if (running)
            return;
        running = true;

        // Start
        StartKeyListeners();
        Loop();
    };

    this.Stop = function() {
        if (!running)
            return;
        running = false;

        // Stop
        StopKeyListeners();

        clearTimeout(timeout);
        timeout = null;
    };

    // --- Preparation
    this.Reset = function() {
        // Reset ram and stack
        this.ram.fill(0);
        this.stack.fill(0);
        sp = 0;
        // Reset keys
        for (key in keys)
            keys[key].fill(false);

        this.FillScreen(0);
        this.RenderScreen();
    };

    this.Reset(); // All good to go :)

}
