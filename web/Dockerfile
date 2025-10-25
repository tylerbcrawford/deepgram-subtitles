FROM python:3.11-slim

# Install system dependencies as root
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg wget && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root user
RUN useradd -u 1000 -m -s /bin/bash appuser

# Switch to non-root user
USER appuser

# Set Python path
ENV PYTHONPATH=/deepgram-subtitles:/app

# Run gunicorn
CMD ["gunicorn", "-w", "2", "-k", "gevent", "--worker-connections", "100", "-b", "0.0.0.0:5000", "app:app"]