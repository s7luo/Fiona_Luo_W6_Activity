/*
WEEK 6 WORKSHOP: POSE SIMON SAYS

STEP 3 — ADD A PROMPT AND A SIMPLE STATE MACHINE

Step 2 detected body keypoints. Step 3 adds a very small state machine.

A state machine is a way of organizing behaviour into named states. At any
moment, the program is in one state. Conditions move it to another state.

States in this sketch:
1. WAITING: wait briefly before giving a prompt.
2. PROMPTING: show an instruction and watch for the pose.
3. RESULT: show whether the participant complied.

The base version does not yet use "Simon Says." It simply asks the
participant to do something, watches during the prompt, and then reports
whether the requested pose was detected.

Pipeline:

webcam -> MoveNet keypoints -> gesture check -> state machine -> feedback
*/

// Webcam, pose model, and most recent detections.
let video;
let bodyPose;
let poses = [];
// Timestamp lets the game ignore stale detections if the model stops updating.
let lastPoseTime = -10000;

// State and timing data drive the WAITING -> PROMPTING -> RESULT cycle.
let currentState = "WAITING";
let currentPrompt = null;
let stateStartTime = 0;

// These timings make the game readable and give participants time to move.
const WAIT_TIME = 1500;       // milliseconds before the next prompt
const PROMPT_TIME = 4000;     // milliseconds to perform the action
const RESULT_TIME = 2000;     // milliseconds to show feedback

// Each prompt has display text and the name of a gesture-checking function.
const prompts = [
  { text: "Raise your left hand", action: "leftHandUp" },
  { text: "Raise your right hand", action: "rightHandUp" },
  { text: "Raise both hands", action: "bothHandsUp" }
];

function preload() {
  // Load MoveNet before setup() starts the webcam and detection loop.
  bodyPose = ml5.bodyPose({ flipped: true });
}

function setup() {
  createCanvas(640, 480);

  // Create a hidden capture element; its frames will be drawn on the canvas.
  video = createCapture(VIDEO, { flipped: true });
  video.size(width, height);
  video.hide();

  // Continuously run pose estimation and store each result through gotPoses().
  bodyPose.detectStart(video, gotPoses);

  // Start the first WAITING interval.
  stateStartTime = millis();
}

function gotPoses(results) {
  // Save the latest detections and the time they arrived.
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
  // Measure the duration of the current state without blocking the draw loop.
  let elapsed = millis() - stateStartTime;

  if (currentState === "WAITING") {
    // Once the pause expires, select and show the next random instruction.
    if (elapsed > WAIT_TIME) {
      chooseNewPrompt();
    }
  } else if (currentState === "PROMPTING") {
    // In this step, the pose is checked when the prompt timer ends.
    if (elapsed > PROMPT_TIME) {
      currentState = "RESULT";
      stateStartTime = millis();
    }
  } else if (currentState === "RESULT") {
    // After displaying feedback, begin another waiting interval.
    if (elapsed > RESULT_TIME) {
      currentState = "WAITING";
      stateStartTime = millis();
    }
  }
}

function chooseNewPrompt() {
  // Choose one prompt object; its action name selects a gesture-check function.
  let index = floor(random(prompts.length));
  currentPrompt = prompts[index];

  // Start timing the prompt from the moment it becomes active.
  currentState = "PROMPTING";
  stateStartTime = millis();
}

/*
Gesture checks.

Each function returns true only when the relevant keypoints are present and
confident enough. The y-axis increases downward in p5.js, so a hand raised
above a shoulder has a smaller y value than the shoulder.
*/

function leftHandUp() {
  // Require a recent pose and confident wrist/shoulder detections.
  let pose = getCurrentPose();
  if (!pose) return false;

  let wrist = pose.left_wrist;
  let shoulder = pose.left_shoulder;

  if (!wrist || !shoulder) return false;
  if (wrist.confidence < 0.3 || shoulder.confidence < 0.3) return false;

  // Canvas y-coordinates increase downward, so a raised wrist has a smaller y.
  return wrist.y < shoulder.y;
}

function rightHandUp() {
  // Apply the same vertical comparison to the participant's right arm.
  let pose = getCurrentPose();
  if (!pose) return false;

  let wrist = pose.right_wrist;
  let shoulder = pose.right_shoulder;

  if (!wrist || !shoulder) return false;
  if (wrist.confidence < 0.3 || shoulder.confidence < 0.3) return false;

  return wrist.y < shoulder.y;
}

function bothHandsUp() {
  // Both individual gesture checks must succeed.
  return leftHandUp() && rightHandUp();
}

function checkAction(actionName) {
  // Convert the prompt's action string into the matching gesture test.
  if (actionName === "leftHandUp") return leftHandUp();
  if (actionName === "rightHandUp") return rightHandUp();
  if (actionName === "bothHandsUp") return bothHandsUp();
  return false;
}

function getCurrentPose() {
  // Reject missing or stale results instead of treating them as valid tracking.
  if (poses.length === 0 || millis() - lastPoseTime > 700) return null;
  return poses[0];
}

function drawSkeleton() {
  // Nothing can be drawn until a person is detected and camera metadata exists.
  if (
    poses.length === 0 ||
    video.elt.videoWidth === 0 ||
    video.elt.videoHeight === 0
  ) return;

  let pose = poses[0];

  noStroke();
  fill(0, 255, 180);
  for (let keypoint of pose.keypoints) {
    // Filter uncertain locations while preserving all confident body points.
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
  // Avoid drawing a segment if either endpoint is absent or uncertain.
  if (!pointA || !pointB) return;
  if (pointA.confidence < 0.3 || pointB.confidence < 0.3) return;
  line(width - pointA.x, pointA.y, width - pointB.x, pointB.y);
}

function drawInterface() {
  noStroke();

  // The visible panel and timer match the current state of the game.
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
    // This is the part students will change in the in-class activity.
    let complied = checkAction(currentPrompt.action);

    fill(0, 190);
    rect(20, 20, width - 40, 150, 14);

    if (complied) {
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
