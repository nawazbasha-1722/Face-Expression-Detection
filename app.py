from flask import Flask, request, jsonify, render_template
from fer.fer import FER
import cv2
import numpy as np
import base64
import os

# Define the Flask app
app = Flask(__name__, 
            static_folder="static",  # Folder for static files
            template_folder="templates"  # Folder for template files
            )

# Emotion detector setup
detector = FER()

# Route to render the main page (index.html)
@app.route("/")
def index():
    return render_template("Face-Expression.html")  # Ensure this file exists in the 'templates' folder

# Route to process the frame and detect emotions
@app.route("/process_frame", methods=["POST"])
def process_frame():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({"error": "No image data provided"}), 400
        
        image_data = data['image']
        # Decode the image data (assuming format "data:image/jpeg;base64,xxxx")
        if "," in image_data:
            header, encoded = image_data.split(",", 1)
        else:
            encoded = image_data
            
        frame_data = base64.b64decode(encoded)
        np_image = np.frombuffer(frame_data, np.uint8)
        frame = cv2.imdecode(np_image, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Failed to decode image"}), 400

        emotions = detector.detect_emotions(frame)
        if emotions:
            dominant_emotions = emotions[0]['emotions']
            dominant_emotion = max(dominant_emotions, key=dominant_emotions.get)
            return jsonify({"dominant_emotion": dominant_emotion})

        return jsonify({"error": "No emotions detected"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# New route to upload photo and detect emotions
@app.route("/upload_photo", methods=["GET", "POST"])
def upload_photo():
    if request.method == "POST":
        if "photo" not in request.files:
            return render_template("upload.html", error="No file part")
        file = request.files["photo"]
        if file.filename == "":
            return render_template("upload.html", error="No selected file")
        if file:
            # Read image file as numpy array
            file_bytes = np.frombuffer(file.read(), np.uint8)
            img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
            emotions = detector.detect_emotions(img)
            if emotions:
                dominant_emotions = emotions[0]['emotions']
                dominant_emotion = max(dominant_emotions, key=dominant_emotions.get)
                return render_template("upload.html", emotion=dominant_emotion)
            else:
                return render_template("upload.html", error="No emotions detected")
    return render_template("upload.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    app.run(host="0.0.0.0", port=port, debug=False)
