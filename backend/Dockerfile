FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Set PYTHONPATH to ensure app module can be imported
ENV PYTHONPATH=/app

# Install system dependencies required for pyswisseph compilation
# pyswisseph needs C++ compiler and Python development headers to build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

# Strip any CR characters before making the script executable. A checkout on
# Windows can leave CRLF endings, which turns the shebang into "/bin/bash\r" and
# fails at startup with a misleading "no such file or directory". .gitattributes
# prevents that at checkout; this makes the image correct regardless.
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
