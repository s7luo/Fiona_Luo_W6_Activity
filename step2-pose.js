/*
WEEK 6 WORKSHOP: POSE SIMON SAYS

STEP 2 — POSE ESTIMATION

Step 1 displayed camera pixels. Step 2 adds BodyPose, using MoveNet, to
estimate body keypoints.

New pipeline:

webcam -> BodyPose / MoveNet -> keypoints -> visible skeleton

MoveNet returns estimated locations for body parts such as the nose,
shoulders, elbows, wrists, hips, knees, and ankles. Each keypoint also has a
confidence score. A confidence score is not certainty: it is the model's
estimate of how reliable that detection is.

This sketch uses ml5.js version 1:
- ml5.bodyPose("MoveNet", options)
- bodyPose.detectStart(video, gotPoses)
- poses[0] is the first detected person
- pose.left_wrist, pose.right_wrist, pose.left_shoulder, and
  pose.right_shoulder are named keypoint objects
- each keypoint has x, y, and confidence properties
*/

let video;
let bodyPose;
let poses = [];
// Set once continuous pose detection starts; this flag is available for
// model-dependent behavior but does not control the status text in this sketch.
let poseReady = false;

function preload() {
  // Load MoveNet with its default, unmirrored keypoint coordinates.
  bodyPose = ml5.bodyPose({ flipped: true });
}

function setup() {
  createCanvas(640, 480);

  // Match the webcam dimensions to the canvas.
  video = createCapture(VIDEO, { flipped: true });
  video.size(width, height);
  video.hide();

  // Start continuous pose detection.
  bodyPose.detectStart(video, gotPoses);
  poseReady = true;
}

function gotPoses(results) {
  // Replace the previous frame's detections with the latest model results.
  poses = results;
}

function draw() {
  background(20);

  image(video,0,0);

  drawSkeleton();

  drawPanel(
    "STEP 2: POSE ESTIMATION",
    poses.length > 0
      ? "MoveNet is estimating body keypoints."
      : "Looking for a body...",
  );
}

function drawSkeleton() {
  // Wait for both a detected person and valid native camera dimensions.
  if (
    poses.length === 0 ||
    video.elt.videoWidth === 0 ||
    video.elt.videoHeight === 0
  )
    return;

  let pose = poses[0];

  // Draw all detected keypoints.
  noStroke();
  fill(0, 255, 180);
  for (let keypoint of pose.keypoints) {
    // Hide low-confidence points to reduce noisy detections.
    if (keypoint.confidence > 0.3) {
      circle(width - keypoint.x, keypoint.y, 10);
    }
  }

  // Draw each arm through the elbow to the wrist.
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
  // Draw a connection only when both endpoints were detected confidently.
  if (!pointA || !pointB) return;
  if (pointA.confidence < 0.3 || pointB.confidence < 0.3) return;
  line(width - pointA.x, pointA.y, width - pointB.x, pointB.y);
}

function drawPanel(title, message) {
  noStroke();
  fill(0, 190);
  rect(20, 20, width - 40, 110, 14);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(22);
  text(title, 45, 45);

  textSize(16);
  text(message, 45, 85, width - 90);
}
