FROM python:3.11-slim

WORKDIR /app

# Install system build dependencies and libsndfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY backend/ ./backend/
COPY processing/ ./processing/
COPY ml/ ./ml/
COPY workers/ ./workers/
COPY data/ ./data/

ENV PYTHONPATH=/app
ENV ENVIRONMENT=production
ENV USE_IN_MEMORY_QUEUE=false

CMD ["python", "-m", "workers.worker"]
