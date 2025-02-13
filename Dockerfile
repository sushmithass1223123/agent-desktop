# Stage 1: Build the Angular app
FROM node:18 AS builder

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

# Copy decorate-angular-cli file for post install actions
COPY decorate-angular-cli.js ./

# Install node modules
RUN npm install --force

# Copy the rest of the application code and build it
COPY . .
RUN npm run build --prod

# Stage 2: Serve the Angular app using Nginx
FROM nginx:1.24-alpine

# Copy built app from the builder stage to Nginx's HTML directory
COPY --from=builder /app/dist/agent-desktop /usr/share/nginx/html/agent-desktop
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose the port Nginx will use
EXPOSE 80

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
