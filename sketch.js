// =================================================================
// 圖片變數與參數
// =================================================================

// 角色 1 (Player 1 - 舊精靈) 的圖片變數
let spriteSheet;
let leftSprite; 
let rightImg; 
let bgImage; 

// 角色 2 (Player 2 - 新精靈 111.png) 的圖片變數
let newSpriteImg; 

// 舊精靈圖片參數
const RIGHT_TOTAL_FRAMES = 3; 
const FRAME_W = 51;
const FRAME_H = 47;

// 新精靈 111.png 圖片參數
const NEW_SPRITE_FRAMES = [
  [0, 0, 110, 151],    
  [110, 0, 110, 151],  
  [220, 0, 120, 151],  
  [340, 0, 150, 151],  
  [490, 0, 170, 151]   
];
const NEW_TOTAL_FRAMES = NEW_SPRITE_FRAMES.length;
const REF_FRAME_H = NEW_SPRITE_FRAMES[0][3];

// 角色縮放比例
const NEW_SPRITE_SCALE = 1.56; // 使 111.png 與原本精靈視覺大小接近
const SCALE = 5; // 舊精靈縮放

// 遊戲參數
const MOVE_SPEED = 4;
const FRAME_DELAY = 7; 
const GRAVITY = 0.8;
const JUMP_STRENGTH = 20;

// 角色狀態物件
let player1 = {};
let player2 = {};

// =================================================================
// 遊戲問答狀態管理
// =================================================================

let questions = []; // 題庫數組
let currentQuestion; // 當前題目物件
let inputAnswer = ""; // 玩家輸入的答案 (現在是數字字串)
let currentStatus = "START"; // 遊戲狀態: "START", "ASKING", "ANSWERING", "END"

const QUESTION_COUNT = 5; // 總共要回答的題數

// 對話框顯示參數
const DIALOG_DURATION = 180; // 對話框停留幀數 (現在只用於控制正確/錯誤反饋的顯示時間)
let dialogTimer = 0; 
let dialogText = "";
let dialogSpeaker = 0; // 0: 提問者 (Player 2), 1: 回答者 (Player 1)

// =================================================================
// preload - 載入資源 (路徑保持不變)
// =================================================================

function preload() {
  // Player 1 圖片
  spriteSheet = loadImage('./1/all.png');
  leftSprite = loadImage('./2/all.png');
  rightImg = loadImage('./1/999.png');
  
  // Player 2 圖片 (111.png)
  newSpriteImg = loadImage('./111.png');
  
  // 背景圖片
  bgImage = loadImage('./背景/1.jpg');
}

// =================================================================
// 數學題生成和管理
// =================================================================

// 產生一個介於 min 和 max 之間的隨機整數
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成一題簡單的加、減、乘數學題
function generateQuestion() {
    const operationOptions = ['+', '-', '*'];
    const op = operationOptions[getRandomInt(0, operationOptions.length - 1)];
    let a, b, answer;

    if (op === '*') {
        a = getRandomInt(2, 9);
        b = getRandomInt(2, 9);
        answer = a * b;
    } else if (op === '-') {
        b = getRandomInt(5, 20);
        a = getRandomInt(b, b + 20); 
        answer = a - b;
    } else {
        a = getRandomInt(10, 50);
        b = getRandomInt(10, 50);
        answer = a + b;
    }

    return {
        text: `【題目】${a} ${op} ${b} = ?\n(按 Enter 開始回答)`, // 增加提示
        correctAnswer: answer,
        op: op
    };
}

// 建立題庫並開始遊戲
function startGame() {
    questions = [];
    for (let i = 0; i < QUESTION_COUNT; i++) {
        questions.push(generateQuestion());
    }
    currentQuestion = questions.shift(); // 取出第一道題
    currentStatus = "ASKING";
    // 提問者 (Player 2) 提問
    setDialog(currentQuestion.text, 0); 
    inputAnswer = "";
}

// =================================================================
// setup (保持不變)
// =================================================================

function setup() {
  createCanvas(windowWidth, windowHeight);
  noSmooth();
  
  // 以新精靈的高度為基準計算地面位置
  const drawH = REF_FRAME_H * NEW_SPRITE_SCALE; 
  const groundY = height - drawH / 2 - 10;
  
  // 初始化 Player 1 (左側 - 回答者)
  player1 = {
    x: width / 3, 
    y: groundY,
    vy: 0,
    onGround: true,
    moveLeftKey: LEFT_ARROW,
    moveRightKey: RIGHT_ARROW,
    jumpKey: UP_ARROW,
    isFlipped: false 
  };

  // 初始化 Player 2 (右側 - 提問者)
  player2 = {
    x: width * 2 / 3, 
    y: groundY,
    vy: 0,
    onGround: true,
    moveLeftKey: 65, // A 鍵
    moveRightKey: 68, // D 鍵
    jumpKey: 87, // W 鍵
    isFlipped: true 
  };
  
  startGame(); // 開始遊戲並生成第一道題
}

// =================================================================
// 角色更新與繪製 (保持不變)
// =================================================================

// 處理單一角色的物理和繪製
function updateAndDrawPlayer(p, isNewSprite) {
  // 1. === 更新物理與移動 ===
  const drawH = REF_FRAME_H * NEW_SPRITE_SCALE;
  const groundY = height - drawH / 2 - 10; // 統一地面高度
  
  p.y += p.vy;
  p.vy += GRAVITY;
  if (p.y >= groundY) {
    p.y = groundY;
    p.vy = 0;
    p.onGround = true;
  } else {
    p.onGround = false;
  }
  
  // 2. === 選擇精靈與移動邏輯 ===
  let img;
  let tf;
  let sx = 0, sy = 0, fw = 0, fh = 0; 
  let isMoving = false;
  let drawScale = SCALE;

  if (isNewSprite) {
    // Player 2: 使用 111.png (提問者)
    img = newSpriteImg;
    tf = NEW_TOTAL_FRAMES;
    drawScale = NEW_SPRITE_SCALE;
    
    // 計算目前幀
    const idx = floor(frameCount / FRAME_DELAY) % tf;
    [sx, sy, fw, fh] = NEW_SPRITE_FRAMES[idx];
    
    // 移動控制
    if (keyIsDown(p.moveRightKey)) {
      p.x += MOVE_SPEED;
      p.isFlipped = false;
      isMoving = true;
    } else if (keyIsDown(p.moveLeftKey)) {
      p.x -= MOVE_SPEED;
      p.isFlipped = true;
      isMoving = true;
    }
    // 站立時 Player 2 保持第 0 幀
    if (!isMoving) {
        [sx, sy, fw, fh] = NEW_SPRITE_FRAMES[0];
    }
    
  } else {
    // Player 1: 使用原本的精靈 (回答者)
    
    // 檢查奔跑
    if ((keyIsDown(p.moveRightKey) || keyIsDown(p.moveLeftKey)) && rightImg) {
      img = rightImg;
      fw = img.width / RIGHT_TOTAL_FRAMES;
      fh = img.height;
      tf = RIGHT_TOTAL_FRAMES;
      
      const idx = floor(frameCount / FRAME_DELAY) % tf;
      sx = idx * fw;
      sy = 0;
      isMoving = true;

      if (keyIsDown(p.moveRightKey)) {
        p.x += MOVE_SPEED;
        p.isFlipped = false;
      } else if (keyIsDown(p.moveLeftKey)) {
        p.x -= MOVE_SPEED;
        p.isFlipped = true;
      }
    } else {
      // 站立
      img = spriteSheet;
      fw = FRAME_W;
      fh = FRAME_H;
      sx = 0;
      sy = 0;
    }
    drawScale = SCALE; 
  }

  // 3. === 繪製精靈 ===
  const currentDrawW = fw * drawScale;
  const currentDrawH = fh * drawScale;
  
  p.x = constrain(p.x, currentDrawW / 2, width - currentDrawW / 2);

  const dx = p.x - currentDrawW / 2;
  const dy = p.y - currentDrawH / 2;
  
  if (img) {
    if (p.isFlipped) {
      push();
      translate(dx + currentDrawW, dy);
      scale(-1, 1);
      image(img, 0, 0, currentDrawW, currentDrawH, sx, sy, fw, fh);
      pop();
    } else {
      image(img, dx, dy, currentDrawW, currentDrawH, sx, sy, fw, fh);
    }
  }
}

// =================================================================
// draw - 遊戲主迴圈
// =================================================================

function draw() {
  // 繪製背景
  if (bgImage) {
    image(bgImage, 0, 0, width, height);
  } else {
    background('#f5c9eaff');
  }

  // 繪製 Player 1 (回答者)
  updateAndDrawPlayer(player1, false);

  // 繪製 Player 2 (提問者)
  updateAndDrawPlayer(player2, true);

  // --- 遊戲狀態與文字繪製 ---
  if (currentStatus !== "START" && currentStatus !== "END") {
    
    // 繪製對話框 (題目/反饋)
    drawDialogBox();
    
    // 只有在 ANSWERING 狀態時才顯示輸入框和提示
    if (currentStatus === "ANSWERING") {
      
      // 繪製輸入答案框 (回答者 Player 1)
      fill(255);
      stroke(0);
      // 輸入框位置在 Player 1 頭上
      rect(player1.x - 100, player1.y - 200, 200, 30); 
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(18);
      // 顯示輸入的答案和游標
      text(inputAnswer + (frameCount % 60 < 30 ? "|" : ""), player1.x, player1.y - 185);
      
      // 提示剩餘題數
      textSize(14);
      fill(50);
      // 判斷當前題目是否已計算在內 (ANSWERING 狀態下當前題目在計數內)
      const remainingQuestions = questions.length + 1;
      text(`剩餘題目：${remainingQuestions} / ${QUESTION_COUNT}`, player1.x, player1.y - 230);
      
      // 提示輸入格式
      textSize(14);
      fill(100);
      text("請輸入數字後按 Enter 確認", player1.x, player1.y - 160);
    }
    
    // 提示：當處於 ASKING 且計時器為 0 (題目已顯示完畢) 時，提示玩家按 Enter
    if (currentStatus === "ASKING" && dialogTimer === 0) {
        fill(0, 0, 0, 150);
        rect(width/2 - 150, height/2 + 50, 300, 30, 5);
        fill(255);
        textSize(16);
        textAlign(CENTER, CENTER);
        text("按 Enter 鍵確認題目並開始作答", width/2, height/2 + 65);
    }
    
  } else if (currentStatus === "END") {
      // 顯示遊戲結束訊息
      drawDialogBox();
      textSize(24);
      fill(255, 0, 0);
      textAlign(CENTER, CENTER);
      text("挑戰完成！", width/2, height/4);
  }
}

// =================================================================
// 輔助函式 (對話框 - 調整邏輯)
// =================================================================

// 設置對話
function setDialog(text, speaker) {
    dialogText = text;
    dialogSpeaker = speaker;
    // 只有在顯示正確/錯誤反饋時才使用計時器
    if (speaker === 0 && (text.includes("正確") || text.includes("錯誤"))) {
        dialogTimer = DIALOG_DURATION;
    } else {
        // 題目顯示或回答者提示時，不使用計時器自動消失
        dialogTimer = 0; 
    }
}

// 繪製對話框
function drawDialogBox() {
    const BOX_W = 300;
    const BOX_H = 100;
    const TEXT_PADDING = 15; 
    
    let speakerX, speakerY;
    
    // 判斷發言者位置
    if (dialogSpeaker === 0) { // 提問者 (Player 2)
        speakerX = player2.x;
        speakerY = player2.y - 250;
    } else { // 回答者 (Player 1)
        speakerX = player1.x;
        speakerY = player1.y - 250;
    }

    // --- 繪製框架 ---
    // 當處於 ASKING 或 ANSWERING 狀態 (且有對話內容/反饋) 或 END 狀態時，都繪製框
    if (currentStatus === "ASKING" || currentStatus === "END" || (currentStatus === "ANSWERING" && dialogSpeaker === 1) || dialogTimer > 0) { 
        fill(255, 255, 200, 240); 
        stroke(0);
        rect(speakerX - BOX_W / 2, speakerY - BOX_H / 2, BOX_W, BOX_H, 10);
        
        // --- 繪製文字 (使用左上角對齊) ---
        fill(0);
        textSize(16);
        textAlign(LEFT, TOP); 
        
        const textX = speakerX - BOX_W / 2 + TEXT_PADDING;
        const textY = speakerY - BOX_H / 2 + TEXT_PADDING;
        const textWidth = BOX_W - TEXT_PADDING * 2;
        const textHeight = BOX_H - TEXT_PADDING * 2;
        
        text(dialogText, textX, textY, textWidth, textHeight);
    }
    
    // --- 狀態和計時器處理 (只處理反饋計時) ---
    if (dialogTimer > 0) {
        dialogTimer--;
        
    } else if (currentStatus === "ANSWERING" && dialogSpeaker === 0 && dialogText.includes("答案錯誤")) {
        // 錯誤反饋結束，重啟遊戲
        // 延遲後重啟，讓玩家看到「答案錯誤」的提示
        setTimeout(() => {
             setDialog("提問者：我們重新開始一輪挑戰吧！", 0);
             setTimeout(startGame, DIALOG_DURATION * (1000 / 60) + 500); 
        }, 500); 
    }
}

// =================================================================
// 事件處理
// =================================================================

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  // Player 1 跳躍 (↑)
  if (keyCode === player1.jumpKey && player1.onGround) {
    player1.vy = -JUMP_STRENGTH;
    player1.onGround = false;
  }
  
  // Player 2 跳躍 (W)
  if (keyCode === player2.jumpKey && player2.onGround) {
    player2.vy = -JUMP_STRENGTH;
    player2.onGround = false;
  }
  
  // === 遊戲狀態轉換邏輯 (Enter 鍵觸發) ===
  if (keyCode === ENTER) {
      if (currentStatus === "ASKING") {
          // 玩家按下 Enter，確認題目，進入回答狀態
          currentStatus = "ANSWERING";
          // 提示玩家可以開始作答
          setDialog("回答者：請輸入答案並按 Enter 鍵確認。", 1); 
          return;
      }
      
      // === 遊戲輸入邏輯 (只在 ANSWERING 狀態下有效) ===
      if (currentStatus === "ANSWERING") {
          checkAnswer();
      }
  }
  
  // 數字輸入 (0-9) 和 Backspace 鍵
  if (currentStatus === "ANSWERING") {
    if (keyCode >= 48 && keyCode <= 57) { // 數字鍵 0-9
        inputAnswer += key;
    }
    if (keyCode === BACKSPACE) {
        inputAnswer = inputAnswer.substring(0, inputAnswer.length - 1);
    }
  }
}

// --- 檢查答案函式 ---
function checkAnswer() {
    if (inputAnswer === "") return; // 避免空輸入

    const playerAnswer = parseInt(inputAnswer);
    const correctAnswer = currentQuestion.correctAnswer;
    
    // 進入處理階段，暫時切換狀態，防止連續輸入
    currentStatus = "PROCESSING"; 
    
    if (playerAnswer === correctAnswer) {
        // 回答正確
        setDialog(`提問者：正確！答案是 ${playerAnswer}。`, 0); // 提問者 (Player 2)
        
        if (questions.length > 0) {
             currentQuestion = questions.shift();
             // 延遲後繼續下一題 (確保反饋顯示完畢)
             setTimeout(() => {
                 currentStatus = "ASKING";
                 setDialog(currentQuestion.text, 0); // 提問者提問
                 inputAnswer = "";
             }, DIALOG_DURATION * (1000 / 60) + 500);
        } else {
             // 遊戲結束
             currentStatus = "END";
             setDialog("提問者：太棒了！所有問題都回答完畢！", 0);
        }

    } else {
        // 回答錯誤
        setDialog(`提問者：答案錯誤！正確答案是 ${correctAnswer}。`, 0); // 提問者 (Player 2)
        // 錯誤後的重新開始邏輯將在 drawDialogBox() 的計時器結束時觸發。
    }
    inputAnswer = ""; // 清空輸入框
}