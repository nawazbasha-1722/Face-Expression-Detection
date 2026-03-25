import requests
import base64

# Load a sample image and convert to base64
with open("Face/templates/sample_face.jpg", "rb") as image_file:
    encoded_string = base64.b64encode(image_file.read()).decode()

# Prepare the data payload
data = encoded_string

# Send POST request to the /process_frame endpoint
response = requests.post("http://127.0.0.1:5000/process_frame", data="data:image/jpeg;base64," + data)

print("Response status code:", response.status_code)
print("Response JSON:", response.json())
