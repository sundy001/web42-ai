# Use latest Bun image
FROM oven/bun:latest AS runtime

# Set working directory
WORKDIR /app

# Copy only the built application files from dist
COPY dist/ .

# Copy production environment configuration
COPY .env.production .env

# Expose the application port
EXPOSE 3002

COPY ../../node_modules/swagger-ui-dist .

# Run the application with environment file
CMD ["", "bun", "--env-file=.env", "index.js"]