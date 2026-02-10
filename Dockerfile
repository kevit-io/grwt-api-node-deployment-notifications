# Use Node.js official image
FROM node:20

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies (if applicable)
RUN npm install

# Copy the source code into the container
COPY . .

# Expose the port that your application runs on
EXPOSE 5000

# Command to run your application
CMD ["npm","run","start:prod"]
