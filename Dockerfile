# Use the latest official Node.js image (includes Debian base)
FROM node:current

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    supervisor && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Show versions
RUN node -v && npm -v

# Upgrade npm to the latest
RUN npm install -g npm@latest

# Copy application code
COPY . .

# Install dependencies and build project
RUN npm install && \
    npm run build || echo "No build script found"

# Add Supervisor config
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose your app port
EXPOSE 1602

# Run Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
