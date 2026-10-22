# Week 6 Workshop: Pose Simon Says

Build a webcam-based pose game with p5.js and ml5.js. The workshop progresses from displaying webcam video, to estimating body keypoints with MoveNet, to checking hand-raising gestures and using a timed state machine. The bonus sketch adds the Simon Says rule.

## Open the workshop

1. Open this folder in Visual Studio Code and start Live Server.
2. Open `index.html` in the browser and allow webcam access.
3. To load a different workshop step, change the sketch filename in the script tag near the end of `index.html`. For example:

```html
<script src="step1-webcam.js"></script>
```

Only load one sketch file at a time.

## Workshop steps

- `sketch.js` — blank p5.js starting point.
- `step1-webcam.js` — display mirrored webcam video.
- `step2-pose.js` — show MoveNet keypoints and a simple skeleton.
- `step3-prompt.js` — add gesture prompts and WAITING / PROMPTING / RESULT states.
- `step4-check.js` — remember whether a requested gesture occurred during its prompt.
