let spriteSheet;
const SPRITE_WIDTH = 359; // 圖片精靈總寬度
const FRAME_H = 47;
const TOTAL_FRAMES = 7;
const FRAME_DELAY = 7; // 切換間隔（以 draw() 的 frame 計數為單位）

let frameW; // 單一畫格寬度

function preload() {
  // 從 1118/ 資料夾往上層到 777/，再進入 1/
  spriteSheet = loadImage('../1/all.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noSmooth();
  // 動態計算單一畫格寬度
  frameW = SPRITE_WIDTH / TOTAL_FRAMES;
}
function draw() {
  // 修正背景色
  background('#cea395ff');

  // 計算目前幀
  const idx = floor(frameCount / FRAME_DELAY) % TOTAL_FRAMES;
  const sx = idx * frameW;
  const sy = 0;

  // 放大三倍並置中繪製
  const SCALE = 3;
  const drawW = frameW * SCALE;
  const drawH = FRAME_H * SCALE;
  const dx = width / 2 - drawW / 2;
  const dy = height / 2 - drawH / 2;

  // 使用 image(img, dx, dy, dWidth, dHeight, sx, sy, sWidth, sHeight)
  image(spriteSheet, dx, dy, drawW, drawH, sx, sy, frameW, FRAME_H);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
