// Camera and video elements
const video = document.getElementById('videoElement');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const expressionOutput = document.getElementById('expression-output');

let stream = null;
let isProcessing = false;

// Initialize camera access
async function initCamera() {
    try {
        const streamLocal = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user' 
            } 
        });

        stream = streamLocal;

        // Set video source
        video.srcObject = stream;
        console.log('Video srcObject set:', video.srcObject);

        // Enable start button
        startBtn.disabled = false;

        console.log('Camera access granted');
        expressionOutput.textContent = 'Camera access granted. Click Start Recognition to begin.';
    } catch (error) {
        console.error('Error accessing camera:', error);
        expressionOutput.textContent = 'Camera error: ' + error.message;

        // Provide helpful error messages
        if (error.name === 'NotAllowedError') {
            expressionOutput.textContent = 'Camera access denied. Please allow camera permissions.';
        } else if (error.name === 'NotFoundError') {
            expressionOutput.textContent = 'No camera found. Please check your device.';
        } else {
            expressionOutput.textContent = 'Camera error: ' + error.message;
        }
    }
}

// Emotion to emoji and color mapping
const emotionMap = {
    'happy': { emoji: '😄', color: 'emotion-happy' },
    'sad': { emoji: '😢', color: 'emotion-sad' },
    'angry': { emoji: '😠', color: 'emotion-angry' },
    'surprise': { emoji: '😲', color: 'emotion-surprise' },
    'fear': { emoji: '😨', color: 'emotion-fear' },
    'disgust': { emoji: '🤢', color: 'emotion-disgust' },
    'neutral': { emoji: '😐', color: 'emotion-neutral' }
};

// Process video frame for emotion detection
async function processFrame() {
    if (!isProcessing) return;
    
    try {
        // Create canvas to capture frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Send to backend for processing
        const response = await fetch('/process_frame', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.dominant_emotion) {
                const emotion = data.dominant_emotion.toLowerCase();
                const emotionData = emotionMap[emotion] || { emoji: '😐', color: 'emotion-neutral' };
                
                // Update emoji
                document.getElementById('emoji-display').textContent = emotionData.emoji;
                
                // Update text and color
                const outputElement = document.getElementById('expression-output');
                outputElement.textContent = emotion;
                outputElement.className = `emotion-text ${emotionData.color}`;

                // Update container background class
                const container = document.querySelector('.container');
                container.className = 'container'; // reset classes
                container.classList.add(`bg-${emotion}`);

            } else {
                document.getElementById('emoji-display').textContent = '😐';
                document.getElementById('expression-output').textContent = 'No face detected';
                document.getElementById('expression-output').className = 'emotion-text emotion-neutral';

                // Reset container background
                const container = document.querySelector('.container');
                container.className = 'container';
            }
        }
    } catch (error) {
        console.error('Error processing frame:', error);
        document.getElementById('emoji-display').textContent = '⚠️';
        document.getElementById('expression-output').textContent = 'Processing error';
        document.getElementById('expression-output').className = 'emotion-text emotion-neutral';
    }
    
    // Continue processing if still active
    if (isProcessing) {
        setTimeout(processFrame, 1000); // Process every 1 second
    }
}

// Start recognition
startBtn.addEventListener('click', async () => {
    if (!stream) {
        await initCamera();
    }
    
    if (stream) {
        isProcessing = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        expressionOutput.textContent = 'Analyzing...';
        
        // Start processing frames
        processFrame();
    }
});

// Stop recognition
stopBtn.addEventListener('click', () => {
    isProcessing = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    expressionOutput.textContent = 'Recognition stopped';
});

// Initialize camera on page load
document.addEventListener('DOMContentLoaded', initCamera);

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && stream) {
        // Stop processing when tab is not visible
        isProcessing = false;
    }
});

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});
