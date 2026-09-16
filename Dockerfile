# Use official Python 3.10 slim image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=7860

# Install system dependencies required for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy all application code
COPY . .

# Expose port 7860 (default port for Hugging Face Spaces)
EXPOSE 7860

# Start app using Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:7860", "--timeout", "120", "app:app"]
