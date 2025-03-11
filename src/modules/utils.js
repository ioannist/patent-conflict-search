const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { APIResult } = require('./dataTypes');
const { 
  PROJECT_PQ_API_URL, 
  PROJECT_PQ_API_KEY, 
  GOOGLE_GEMINI_API_KEY,
  RETRY_CONFIG,
  PROJECT_PQ_RESULTS_COUNT,
  RESULTS_CONFIG
} = require('./constants');

/**
 * Sleep function for backoff retry
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after the given time
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Makes a request to the Project PQ API with exponential backoff (limited retries)
 * @param {string} query - Project PQ query string
 * @returns {Promise<APIResult[]>} - Array of APIResult objects
 */
async function makeProjectPQRequest(query) {
  let delay = RETRY_CONFIG.initialDelay;
  let attempts = 0;
  
  while (attempts < RETRY_CONFIG.maxRetriesPQ) {
    try {
      const response = await axios({
        method: 'get',
        url: PROJECT_PQ_API_URL,
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          q: query,
          n: PROJECT_PQ_RESULTS_COUNT,  // Use the configured number of results
          token: PROJECT_PQ_API_KEY
        }
      });
      
      return parseProjectPQResponse(response.data);
    } catch (error) {
      attempts++;
      
      if (attempts >= RETRY_CONFIG.maxRetriesPQ) {
        throw new Error(`Failed to make Project PQ request after ${RETRY_CONFIG.maxRetriesPQ} attempts: ${error.message}`);
      }
      
      console.error(`Project PQ API request failed (attempt ${attempts}/${RETRY_CONFIG.maxRetriesPQ}). Retrying in ${delay}ms...`);
      console.error(`Error: ${error.message}`);
      
      await sleep(delay);
      delay = Math.min(delay * 2, RETRY_CONFIG.maxDelay);
    }
  }
}

/**
 * Makes a request to the Google Gemini API with exponential backoff (unlimited retries)
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise<string>} - Gemini's response text
 */
async function makeGeminiRequest(prompt) {
  let delay = RETRY_CONFIG.initialDelay;
  let attempts = 0;
  
  while (true) {
    try {
      const genAI = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      attempts++;
      
      console.error(`Gemini API request failed (attempt ${attempts}). Retrying in ${delay}ms...`);
      console.error(`Error: ${error.message}`);
      
      await sleep(delay);
      delay = Math.min(delay * 2, RETRY_CONFIG.maxDelay);
    }
  }
}

/**
 * Makes a request to the Google Gemini API with conversation history
 * @param {Array<Object>} history - Array of conversation history objects with 'role' and 'parts'
 * @param {string} newPrompt - The new prompt to send to Gemini
 * @returns {Promise<string>} - Gemini's response text
 */
async function makeGeminiChatRequest(history, newPrompt) {
  let delay = RETRY_CONFIG.initialDelay;
  let attempts = 0;
  
  while (true) {
    try {
      const genAI = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Create a chat session
      const chat = model.startChat({
        history: history
      });
      
      // Send the new message
      const result = await chat.sendMessage(newPrompt);
      return result.response.text();
    } catch (error) {
      attempts++;
      
      console.error(`Gemini Chat API request failed (attempt ${attempts}). Retrying in ${delay}ms...`);
      console.error(`Error: ${error.message}`);
      
      await sleep(delay);
      delay = Math.min(delay * 2, RETRY_CONFIG.maxDelay);
    }
  }
}

/**
 * Formats a date range for Project PQ queries
 * @param {string} dateRange - Date range string (either YYYY-MM-DD TO YYYY-MM-DD or named range)
 * @returns {string} - Formatted date range for Project PQ
 */
function formatDateRange(dateRange) {
  // If it's already in PQ format, return as is
  if (dateRange.startsWith('[') && dateRange.endsWith(']')) {
    return dateRange;
  }
  
  // If it's a named range like last_10_years, return as is
  if (dateRange.startsWith('last_')) {
    return dateRange;
  }
  
  // Otherwise, format it according to PQ requirements
  return `[${dateRange}]`;
}

/**
 * Parses the Project PQ API response into APIResult objects
 * @param {object} responseData - Raw response from Project PQ
 * @returns {APIResult[]} - Array of formatted API results
 */
function parseProjectPQResponse(responseData) {
  if (!responseData || !responseData.results || !Array.isArray(responseData.results)) {
    return [];
  }
  
  return responseData.results.map(result => {
    const apiResult = new APIResult();
    
    apiResult.patentNumber = result.patentNumber || '';
    apiResult.title = result.title || '';
    apiResult.abstract = result.abstract || '';
    apiResult.publicationDate = result.publicationDate || '';
    apiResult.assignee = result.assignee ? result.assignee.name : '';
    apiResult.inventors = Array.isArray(result.inventors) 
      ? result.inventors.map(inv => inv.name) 
      : [];
    apiResult.applicationNumber = result.applicationNumber || '';
    
    return apiResult;
  });
}

/**
 * Reads a single claim from a file
 * @param {string} filePath - Path to the file containing a single claim
 * @returns {Promise<string>} - The claim text
 */
async function readClaimFromFile(filePath) {
  try {
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Read the file
    const content = await fs.readFile(resolvedPath, 'utf8');
    
    // Trim whitespace and return
    return content.trim();
  } catch (error) {
    console.error(`Error reading claim file: ${error.message}`);
    throw new Error(`Failed to read claim file: ${error.message}`);
  }
}

/**
 * Parses a claims file using Gemini to extract individual claims
 * @param {string} filePath - Path to the claims file
 * @returns {Promise<string[]>} - Array of claim texts
 */
async function parseClaimsFile(filePath) {
  try {
    // Read the claims file
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // Use Gemini to parse the claims
    const prompt = `
      I have a text file containing multiple patent claims. Please identify and separate each individual patent claim.
      Output the claims as a JSON array of strings where each string is a separate claim. 
      Don't include any other text in your response, just the JSON array.
      
      Here is the text:
      ${fileContent}
    `;
    
    const response = await makeGeminiRequest(prompt);
    
    // Extract the JSON array from the response
    // We need to handle cases where Gemini might include prose before/after the JSON
    let jsonResponse;
    try {
      // First attempt: try to parse the entire response as JSON
      jsonResponse = JSON.parse(response);
    } catch (e) {
      // Second attempt: try to extract JSON array using regex
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        jsonResponse = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse Gemini response as JSON');
      }
    }
    
    if (!Array.isArray(jsonResponse)) {
      throw new Error('Gemini did not return an array of claims');
    }
    
    return jsonResponse;
  } catch (error) {
    console.error('Error parsing claims file:', error);
    throw new Error(`Failed to parse claims file: ${error.message}`);
  }
}

/**
 * Saves results to the results directory
 * @param {string} filename - Name of the file (without path or extension)
 * @param {object} data - The data to save
 * @returns {Promise<string>} - Path to the saved file
 */
async function saveResultsToFile(filename, data) {
  try {
    // Ensure the results directory exists
    const resultsDir = path.resolve(RESULTS_CONFIG.dir);
    await fs.mkdir(resultsDir, { recursive: true });
    
    // Generate the file path
    const filePath = path.join(resultsDir, `${filename}${RESULTS_CONFIG.extension}`);
    
    // Write the data to the file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    console.log(`Results saved to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`Error saving results: ${error.message}`);
    throw new Error(`Failed to save results: ${error.message}`);
  }
}

module.exports = {
  makeProjectPQRequest,
  makeGeminiRequest,
  makeGeminiChatRequest,
  formatDateRange,
  parseProjectPQResponse,
  readClaimFromFile,
  parseClaimsFile,
  saveResultsToFile
};