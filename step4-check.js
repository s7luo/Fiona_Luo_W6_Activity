/*
WEEK 6 WORKSHOP: POSE SIMON SAYS

STEP 4 — RECORD WHETHER THE ACTION HAPPENED

Step 3 checked the pose only at the instant the prompt ended. That can miss
an action that happened earlier during the prompt.

Step 4 adds actionDetected. While the program is in the PROMPTING state, it
continuously checks whether the requested gesture has occurred. If it happens
at any point, actionDetected becomes true and stays true until the next
prompt.

This is still not "Simon Says." It is the base version:
- The system gives an instruction.
- It watches for compliance during the instruction.
- It reports compliance or non-compliance.

Students will change the feedback in full-sketch.js.
*/

// Webcam, pose model, and most recent detections.
let video;
let bodyPose;
let poses = [];
// Used to ignore pose data if detection has stopped updating.
let lastPoseTime = -10000;

// The state machine controls waiting, prompt timing, and result display.
let currentState = "WAITING";
let currentPrompt = null;
let stateStartTime = 0;

// Remembers a successful gesture for the full prompt, even if it is brief.
let actionDetected = false;

const WAIT_TIME = 1500;
const PROMPT_TIME = 4000;
const RESULT_TIME = 2000;

const prompts = [
  { text: "Raise your left hand", action: "leftHandUp" },
  { text: "Raise your right hand", action: "rightHandUp" },
  { text: "Raise both hands", action: "bothHandsUp" }
];

function preload() {
  // Load MoveNet before setup() starts camera-based detection.
  bodyPose = ml5.bodyPose({ flipped: true });
}

function setup() {
  createCanvas(640, 480);

  // Keep the webcam element hidden; draw() paints its frames on the canvas.
  video = createCapture(VIDEO, { flipped: true });
  video.size(width, height);
  video.hide();

  // Send each camera frame through MoveNet and receive results in gotPoses().
  bodyPose.detectStart(video, gotPoses);

  // Begin the initial WAITING state timer.
  stateStartTime = millis();
}

function gotPoses(results) {
  // Keep the newest prediction and its timestamp for gesture checks.
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
  // Elapsed time is measured from the moment the current state began.
  let elapsed = millis() - stateStartTime;

  if (currentState === "WAITING") {
    // Start a random prompt once the ready interval has passed.
    if (elapsed > WAIT_TIME) {
      chooseNewPrompt();
    }
  } else if (currentState === "PROMPTING") {
    // Latch success: once true, actionDetected stays true until a new prompt.
    if (checkAction(currentPrompt.action)) {
      actionDetected = true;
    }

    if (elapsed > PROMPT_TIME) {
      // Stop checking and show the recorded outcome.
      currentState = "RESULT";
      stateStartTime = millis();
    }
  } else if (currentState === "RESULT") {
    // Cycle back to WAITING after the result has been shown.
    if (elapsed > RESULT_TIME) {
      currentState = "WAITING";
      stateStartTime = millis();
    }
  }
}

function chooseNewPrompt() {
  // Pick a prompt whose action field names one of the gesture checks below.
  let index = floor(random(prompts.length));
  currentPrompt = prompts[index];

  // Reset the previous outcome and start timing the new prompt.
  actionDetected = false;
  currentState = "PROMPTING";
  stateStartTime = millis();
}

function leftHandUp() {
  // Gesture checks use the most recent pose that is not too old.
  let pose = getCurrentPose();
  if (!pose) return false;

  let wrist = pose.left_wrist;
  let shoulder = pose.left_shoulder;

  if (!wrist || !shoulder) return false;
  if (wrist.confidence < 0.3 || shoulder.confidence < 0.3) return false;

  // In canvas coordinates, a smaller y-value means the wrist is higher.
  return wrist.y < shoulder.y;
}

function rightHandUp() {
  // Mirror the left-hand test for the other wrist and shoulder.
  let pose = getCurrentPose();
  if (!pose) return false;

  let wrist = pose.right_wrist;
  let shoulder = pose.right_shoulder;

  if (!wrist || !shoulder) return false;
  if (wrist.confidence < 0.3 || shoulder.confidence < 0.3) return false;

  return wrist.y < shoulder.y;
}

function bothHandsUp() {
  // Require both separate hand-up checks to succeed.
  return leftHandUp() && rightHandUp();
}

function checkAction(actionName) {
  // Map the prompt's action label to the corresponding gesture function.
  if (actionName === "leftHandUp") return leftHandUp();
  if (actionName === "rightHandUp") return rightHandUp();
  if (actionName === "bothHandsUp") return bothHandsUp();
  return false;
}

function getCurrentPose() {
  // Treat missing or stale tracking as no pose, not as a detected gesture.
  if (poses.length === 0 || millis() - lastPoseTime > 700) return null;
  return poses[0];
}

function drawSkeleton() {
  // Wait for a detected person and valid native camera dimensions.
  if (
    poses.length === 0 ||
    video.elt.videoWidth === 0 ||
    video.elt.videoHeight === 0
  ) return;

  let pose = poses[0];

  noStroke();
  fill(0, 255, 180);
  for (let keypoint of pose.keypoints) {
    // Draw only keypoints whose confidence is above the display threshold.
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
  // A limb segment is valid only if both endpoints have confident detections.
  if (!pointA || !pointB) return;
  if (pointA.confidence < 0.3 || pointB.confidence < 0.3) return;
  line(width - pointA.x, pointA.y, width - pointB.x, pointB.y);
}

function drawInterface() {
  noStroke();

  // Render different instructions and feedback for each game state.
  if (currentState === "WAITING") {
    fill(0, 190);
    rect(20, 20, width - 40, 150, 14);
    fill(255);
    textAlign(CENTER, TOP);
    textSize(28);
    text("Get ready...", width / 2, 55);
    textSize(16);
    text("A prompt will appear shortly.", width / 2, 110);
  } else if (currentState === "PROMPTING") {
    fill(0, 190);
    rect(20, 20, width - 40, 150, 14);
    fill(255);
    textAlign(CENTER, TOP);
    textSize(34);
    text(currentPrompt.text, width / 2, 55);
    textSize(16);
    text("Do the action before time runs out.", width / 2, 120);
  } else if (currentState === "RESULT") {
    fill(0, 190);
    rect(20, 20, width - 40, 150, 14);

    if (actionDetected) {
      fill(120, 255, 160);
      textSize(34);
      text("COMPLIANCE DETECTED", width / 2, 55);
    } else {
      fill(255, 130, 130);
      textSize(34);
      text("NON-COMPLIANCE DETECTED", width / 2, 55);
    }

    fill(255);
    textSize(16);
    text("Prompt: " + currentPrompt.text, width / 2, 120);
  }
}
