/*
WEEK 6 WORKSHOP: POSE SIMON SAYS

STEP 1 — WEBCAM INPUT

This sketch receives and displays live webcam pixels. It does not yet
interpret the body or make any decisions.

Pipeline being built this week:

webcam -> BodyPose/MoveNet -> body keypoints -> gesture check
       -> simple state machine -> prompt and feedback

Important concepts:
- setup() runs once.
- draw() repeats continuously.
- createCapture(VIDEO) asks the browser for camera permission.
- A mirrored camera feels more like a mirror to the participant.
*/

// Store the webcam capture so draw() can display its current frame.
let video;

// p5.js calls setup() once after the page and libraries are ready.
function setup() {
  // Create a 640-by-480 drawing surface and request webcam access.
  createCanvas(640, 480);

  video = createCapture(VIDEO, { flipped: true });
  // Give the capture element the canvas dimensions, then hide its separate
  // browser element because draw() renders its frames onto the p5 canvas.
  video.size(width, height);
  video.hide();
}

// p5.js calls draw() repeatedly, so the displayed image stays live.
function draw() {
  background(20);

  image(video, 0, 0);

  // Add an on-screen label over the live video.
  drawPanel("STEP 1: WEBCAM INPUT", "The camera provides pixels. No body interpretation yet.");
}

// Draw the shared translucent title panel used by this step.
function drawPanel(title, message) {
  noStroke();
  fill(0, 190);
  rect(20, 20, width - 40, 110, 14);

  // Set text alignment and size before drawing each line of panel text.
  fill(255);
  textAlign(LEFT, TOP);
  textSize(22);
  text(title, 45, 45);

  textSize(16);
  text(message, 45, 85, width - 90);
}
