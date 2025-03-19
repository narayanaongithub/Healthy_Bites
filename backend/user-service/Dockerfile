FROM python:3.9-slim

WORKDIR /app

# Install system dependencies including MySQL development libraries
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    pkg-config \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH=/app
ENV FLASK_APP=src/app.py
ENV FLASK_RUN_HOST=0.0.0.0

EXPOSE 5002

CMD ["flask", "run", "--port=5002"] 