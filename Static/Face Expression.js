const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureButton = document.getElementById("capture");
const emotionLabel = document.getElementById("emotion-label");
const ctx = canvas.getContext("2d");

// Set canvas size to match the video
canvas.width = 640;
canvas.height = 480;

// Start the video stream
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    console.error("Error accessing webcam:", err);
  });

// Function to send the captured image to the backend
async function sendFrameToBackend(frame) {
  try {
    const response = await fetch("/process_frame", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: frame }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending frame to backend:", error);
    return null;
  }
}

// Capture image when button is clicked
captureButton.addEventListener("click", async () => {
  // Draw the current frame from video onto the canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert the canvas image to Base64
  const frameData = canvas.toDataURL("image/jpeg");

  // Send the image to the backend for processing
  emotionLabel.textContent = "Processing...";
  const data = await sendFrameToBackend(frameData);

  // Display the detected emotion
  if (data && data.dominant_emotion) {
    emotionLabel.textContent = `Detected Emotion: ${data.dominant_emotion}`;
  } else {
    emotionLabel.textContent = "No face detected. Try again!";
  }
});
