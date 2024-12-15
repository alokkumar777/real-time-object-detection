const video = document.createElement("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const detectionTableBody = document.querySelector("#detectionTable tbody");
const FPS = 30;
const FRAME_INTERVAL = 1000 / FPS;
const CONFIDENCE_THRESHOLD = 0.5; // Adjust the confidence threshold as needed

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.play();
      resolve(video);
    };
  });
}

function drawPredictions(predictions) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height);
  predictions.forEach((prediction) => {
    if (prediction.score >= CONFIDENCE_THRESHOLD) {
      // Filter based on confidence threshold
      const [x, y, width, height] = prediction.bbox;
      ctx.strokeStyle = "#da1e37";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = "#da1e37";
      ctx.font = "18px Arial";
      ctx.fillText(
        `${prediction.class} ${(prediction.score * 100).toFixed(2)}%`,
        x,
        y > 10 ? y - 5 : 10
      );
    }
  });
}

function updateDetectionTable(predictions) {
  detectionTableBody.innerHTML = "";
  predictions.forEach((prediction) => {
    if (prediction.score >= CONFIDENCE_THRESHOLD) {
      // Filter based on confidence threshold
      const row = detectionTableBody.insertRow();
      const cellObject = row.insertCell(0);
      const cellProbability = row.insertCell(1);
      cellObject.textContent = prediction.class;
      cellProbability.textContent = `${(prediction.score * 100).toFixed(2)}%`;
    }
  });
}

async function detectObjects() {
  const model = await cocoSsd.load();
  let lastDetectionTime = 0;

  async function detectFrame(currentTime) {
    if (currentTime - lastDetectionTime >= FRAME_INTERVAL) {
      const predictions = await model.detect(video);
      drawPredictions(predictions);
      updateDetectionTable(predictions);
      lastDetectionTime = currentTime;
    }
    requestAnimationFrame(detectFrame);
  }

  requestAnimationFrame(detectFrame);
}

(async function () {
  await setupCamera();
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  await detectObjects();
})();
