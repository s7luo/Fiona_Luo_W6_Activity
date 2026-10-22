// Webcam, pose model, and newest pose-estimation results.
let video;
let bodyPose;
let poses = [];
// Timestamp used to reject stale detections if the model stops updating.
let lastPoseTime = -10000;

// State-machine data controls which screen is shown and for how long.
let currentState = "WAITING";
let currentPrompt = null;
let stateStartTime = 0;

// Game variables
let actionDetected = false;
let isSimon = false; // 新增：记录当前回合是否带有 "Simon says" 前缀

const WAIT_TIME = 1500;
const PROMPT_TIME = 4000;
const RESULT_TIME = 2500;

const prompts = [
  { text: "Raise your left hand", action: "leftHandUp" },
  { text: "Raise your right hand", action: "rightHandUp" },
  { text: "Raise both hands", action: "bothHandsUp" }
];

function preload() {
  bodyPose = ml5.bodyPose({ flipped: true });
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.size(width, height);
  video.hide();
  bodyPose.detectStart(video, gotPoses);
  stateStartTime = millis();
}

function gotPoses(results) {
  poses = results;
  lastPoseTime = millis();
}

function draw() {
  background(20);
  image(video, 0, 0);
  updateStateMachine();
  drawSkeleton();
  drawInterface();
}

function updateStateMachine() {
  let elapsed = millis() - stateStartTime;

  if (currentState === "WAITING") {
    if (elapsed > WAIT_TIME) {
      chooseNewPrompt();
    }
  } else if (currentState === "PROMPTING") {
    
    // 【核心修复】：加入 1200 毫秒（1.2秒）的阅读缓冲期。
    // 只有当提示文字在屏幕上显示超过 1.2 秒后，系统才开始检测动作。
    if (elapsed > 1200) {
      if (checkAction(currentPrompt.action)) {
        actionDetected = true;
      }
    }

    if (elapsed > PROMPT_TIME) {
      currentState = "RESULT";
      stateStartTime = millis();
    }
  } else if (currentState === "RESULT") {
    if (elapsed > RESULT_TIME) {
      currentState = "WAITING";
      stateStartTime = millis();
    }
  }
}

function chooseNewPrompt() {
  let index = floor(random(prompts.length));
  currentPrompt = prompts[index];

  // 50% 概率决定是否带有 Simon says 前缀
  isSimon = random() > 0.5;

  actionDetected = false;
  currentState = "PROMPTING";
  stateStartTime = millis();
}

function leftHandUp() {
  let pose = getCurrentPose();
  if (!pose) return false;
  let wrist = pose.left_wrist;
  let shoulder = pose.left_shoulder;
  if (!wrist || !shoulder) return false;
  if (wrist.confidence < 0.3 || shoulder.confidence < 0.3) return false;
  return wrist.y < shoulder.y;
}

function rightHandUp() {
  let pose = getCurrentPose();
  if (!pose) return false;
  let wrist = pose.right_wrist;
  let shoulder = pose.right_shoulder;
  if (!wrist || !shoulder) return false;
  if (wrist.confidence < 0.3 || shoulder.confidence < 0.3) return false;
  return wrist.y < shoulder.y;
}

function bothHandsUp() {
  return leftHandUp() && rightHandUp();
}

function checkAction(actionName) {
  if (actionName === "leftHandUp") return leftHandUp();
  if (actionName === "rightHandUp") return rightHandUp();
  if (actionName === "bothHandsUp") return bothHandsUp();
  return false;
}

function getCurrentPose() {
  if (poses.length === 0 || millis() - lastPoseTime > 700) return null;
  return poses[0];
}

function drawSkeleton() {
  if (poses.length === 0 || video.elt.videoWidth === 0 || video.elt.videoHeight === 0) return;
  let pose = poses[0];
  noStroke();
  fill(0, 255, 180);
  for (let keypoint of pose.keypoints) {
    if (keypoint.confidence > 0.3) {
      circle(width - keypoint.x, keypoint.y, 10);
    }
  }
  stroke(0, 255, 180);
  strokeWeight(4);
  drawLimb(pose.left_shoulder, pose.left_elbow);
  drawLimb(pose.left_elbow, pose.left_wrist);
  drawLimb(pose.right_shoulder, pose.right_elbow);
  drawLimb(pose.right_elbow, pose.right_wrist);
  drawLimb(pose.left_shoulder, pose.right_shoulder);
  noStroke();
}

function drawLimb(pointA, pointB) {
  if (!pointA || !pointB) return;
  if (pointA.confidence < 0.3 || pointB.confidence < 0.3) return;
  line(width - pointA.x, pointA.y, width - pointB.x, pointB.y);
}

function drawInterface() {
  noStroke();
  if (currentState === "WAITING") {
    drawPanel("POSE SIMON SAYS", "Get ready. A prompt is coming.");
  } else if (currentState === "PROMPTING") {
    let displayText = isSimon ? "Simon says: " + currentPrompt.text : currentPrompt.text;
    drawPanel("PROMPT", displayText);
    drawTimer();
    
    // 黄色调试文本：用来检查模型是否产生误判
    fill(255, 255, 0);
    textSize(18);
    text("Model sees action: " + actionDetected, width / 2, 200);

  } else if (currentState === "RESULT") {
    drawFeedback();
  }
}

function drawPanel(title, message) {
  fill(0, 190);
  rect(20, 20, width - 40, 160, 14);
  fill(255);
  textAlign(CENTER, TOP);
  textSize(20);
  text(title, width / 2, 45);
  textSize(34);
  text(message, width / 2, 90);
}

function drawTimer() {
  let elapsed = millis() - stateStartTime;
  let remaining = constrain(1 - elapsed / PROMPT_TIME, 0, 1);
  noFill();
  stroke(255);
  strokeWeight(8);
  arc(width / 2, 250, 90, 90, -HALF_PI, -HALF_PI + TWO_PI * remaining);
  noStroke();
}

function drawFeedback() {
  fill(0, 190);
  rect(20, 20, width - 40, 220, 14);

  // 评估 Simon Says 的四种情况
  let success = false;
  if (isSimon && actionDetected) success = true;       // 有前缀 + 做了动作 = 成功
  if (isSimon && !actionDetected) success = false;     // 有前缀 + 没做动作 = 失败
  if (!isSimon && actionDetected) success = false;     // 没前缀 + 做了动作 = 失败
  if (!isSimon && !actionDetected) success = true;     // 没前缀 + 没做动作 = 成功

  if (success) {
    fill(120, 255, 160);
    textAlign(CENTER, TOP);
    textSize(36);
    text("GOOD HUMAN", width / 2, 60);
    fill(255);
    textSize(16);
    text("Your obedient behavior has been accepted.", width / 2, 140);
  } else {
    fill(255, 130, 130);
    textAlign(CENTER, TOP);
    textSize(36);
    text("DEVIATION LOGGED", width / 2, 60);
    fill(255);
    textSize(16);
    text("You failed the Simon Says rule.", width / 2, 140);
  }

  fill(255);
  textSize(16);
  let finalPrompt = isSimon ? "Simon says: " + currentPrompt.text : currentPrompt.text;
  text("Prompt: " + finalPrompt, width / 2, 190);
}