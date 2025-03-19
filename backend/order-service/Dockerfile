FROM python:3.9-slim

WORKDIR /app

# Install MySQL client and development libraries
RUN apt-get update && apt-get install -y default-libmysqlclient-dev build-essential pkg-config

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ .

EXPOSE 5003

CMD ["flask", "run", "--host=0.0.0.0", "--port=5003"] 