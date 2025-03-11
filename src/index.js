#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

// Import the program from cli.js
const { program } = require('./cli');

// Validate environment variables
const { PROJECT_PQ_API_KEY, GOOGLE_GEMINI_API_KEY } = require('./modules/constants');

if (!PROJECT_PQ_API_KEY) {
  console.error('Error: PROJECT_PQ_API_KEY environment variable is not set.');
  console.error('Please create a .env file with your Project PQ API key.');
  process.exit(1);
}

if (!GOOGLE_GEMINI_API_KEY) {
  console.error('Error: GOOGLE_GEMINI_API_KEY environment variable is not set.');
  console.error('Please create a .env file with your Google Gemini API key.');
  process.exit(1);
}

// Parse command line arguments
program.parse(process.argv);