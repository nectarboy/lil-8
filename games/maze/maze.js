const lil = new Lil8(document.getElementById('canvas'));
const ram = lil.ram;

// --- Address constants
const I = 0;
const II = 1;
const PLAYER_X = 4;
const PLAYER_Y = 5;
const LEVEL_DAT = 16;

// --- Immediate constants
const BG_COL = 29;
const FG_COL = 60;
const PLAYER_COL = 3;
const PLAYERSTART_X = 8;
const PLAYERSTART_Y = 8;
const LEVEL_BYTES = 16;
const LEVEL_BYTESPERROW = 2;
const TILE_SIZE = 8;

// --- Data
const levelData = [
    0b11111111, 0b11111111,
    0b10000100, 0b00001001,
    0b11001111, 0b10101001,
    0b10000000, 0b00101111,
    0b11101110, 0b00000001,
    0b10100011, 0b10111111,
    0b10100000, 0b10000001,
    0b11111111, 0b11111111,
];

// --- Game
function Reset() {
    lil.Reset();

    // Load level data
    ram[I] = 0;
    while (ram[I] < LEVEL_BYTES) {
        ram[ram[I] + LEVEL_DAT] = levelData[ram[I]];
        ram[I]++;
    }

    ram[PLAYER_X] = PLAYERSTART_X;
    ram[PLAYER_Y] = PLAYERSTART_Y;
}

function DrawTile(x, y, col) {
    ram[I] = 0;
    while (ram[I] < TILE_SIZE) {

        ram[II] = 0;
        while (ram[II] < TILE_SIZE) {
            lil.PutPixel(x + ram[I], y + ram[II], col);
            ram[II]++;
        }

        ram[I]++;
    }
}

function DrawLevel() {
    ram[I] = 0;
    while (ram[I] < LEVEL_BYTES) {

        const byte = ram[ram[I] + LEVEL_DAT];
        const bx = 0|(ram[I] % LEVEL_BYTESPERROW);
        const by = 0|(ram[I] / LEVEL_BYTESPERROW);

        ram[II] = 0;
        while (ram[II] < 8) {
            const col = (0x80 & (byte << ram[II])) ? FG_COL : BG_COL;

            const x = TILE_SIZE * (bx * 8 + ram[II]);
            const y = TILE_SIZE * by;

            // Stack magic ;-;
            lil.Push(ram[I]);
            lil.Push(ram[II]);
            DrawTile(x, y, col);
            ram[II] = lil.Pop();
            ram[I] = lil.Pop();

            ram[II]++;
        }

        ram[I]++;
    }
}

function DrawPlayer() {
    DrawTile(ram[PLAYER_X], ram[PLAYER_Y], PLAYER_COL);
}

function Main() {
    lil.FillScreen(BG_COL);

    // --- Update game state
    // Horizontal movement
    if (lil.KeyPressed('right'))
        ram[PLAYER_X]++;
    if (lil.KeyPressed('left'))
        ram[PLAYER_X]--;
    // Vertical movement
    if (lil.KeyPressed('down'))
        ram[PLAYER_Y]++;
    if (lil.KeyPressed('up'))
        ram[PLAYER_Y]--;
    //ram[PLAYER_Y]++;

    // --- Draw everything
    DrawLevel();
    DrawPlayer();

    lil.RenderScreen();
}

// --- Execution
Reset();
lil.SetLoopFunc(Main);
lil.Start();