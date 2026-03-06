# Use the latest official Node.js image (includes Debian base)
FROM node:20

# Accept build args for user/group alignment with host
ARG WWWUSER=1000
ARG WWWGROUP=1000

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    supervisor && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Align the node user's uid/gid with the host user so volume files
# are not owned by root when mounted locally
RUN groupmod -g ${WWWGROUP} node && \
    usermod -u ${WWWUSER} -g ${WWWGROUP} node

# Show versions
RUN node -v && npm -v

# Install dependencies as root first (needs write access to /usr/local)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy application code
COPY --chown=node:node . .

# Add Supervisor config
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Fix permissions on /app so the node user owns everything
RUN chown -R node:node /app

# Drop to node user for runtime
USER node

# Expose your app port
EXPOSE 3000

# Run Supervisor (supervisord needs root — use gosu or just keep it root-started)
USER root
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]