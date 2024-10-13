#!/bin/bash

# Initialize your project setup script

# Clone the repository
echo "Cloning repository..."
git clone <repository-url>

# Change directory to the cloned repository
cd CalendarApp || { echo "Directory not found"; exit 1; }

# Install dependencies
echo "Installing dependencies..."
npm install

# Run the audit for security issues
echo "Running npm audit..."
npm audit

# Setup complete message
echo "Setup complete! Follow the instructions below to run the project."
echo "To run the project, use the following commands:"
echo "npm start"
