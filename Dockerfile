# Use the latest official Node.js image (includes Debian base)
FROM node:20

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    supervisor && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Show versions
RUN node -v && npm -v

# Install dependencies (leverage cache)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .


# Add Supervisor config
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose your app port
EXPOSE 3000

# Run Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]