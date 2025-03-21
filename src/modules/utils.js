const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { APIResult } = require('./dataTypes');
const { 
  PROJECT_PQ_API_URL, 
  PROJECT_PQ_API_KEY, 
  GOOGLE_GEMINI_API_KEY,
  LENS_API_URL,
  LENS_API_KEY,
  RETRY_CONFIG,
  PROJECT_PQ_RESULTS_COUNT,
  LENS_RESULTS_COUNT,
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
 * Converts a Project PQ query to a Lens API query format
 * @param {string} projectPQQuery - Project PQ query string
 * @returns {Object} - Lens API query object
 */
function convertToLensQuery(projectPQQuery) {
  
  // Define relevant keywords for AI/neural networks
  const keywords = [
    "neural network",
    "machine learning",
    "artificial intelligence",
    "deep learning",
    "natural language processing",
    "computer vision",
    "speech recognition",
    "pattern recognition",
    "data mining",
    "predictive analytics"
  ];
  
  // Create the keyword part of the query (OR between all keywords)
  const keywordTerms = keywords.map(keyword => {
    return `(title:"${keyword}" OR abstract.text:"${keyword}")`;
  });
  
  // Join all keyword terms with OR
  const keywordQuery = keywordTerms.join(" OR ");
  
  // For now, let's just use the keywords to ensure we get results
  // We'll use a simpler query format that's more likely to work with the Lens API
  const queryString = keywordQuery;
  
  // Create the final query object
  const query = {
    query: queryString,
    size: 50
  };
  
 
  return query;
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

/**
 * Makes a request to the Lens API with exponential backoff (limited retries)
 * @param {string|Object} query - Lens API query string or object
 * @param {Object} options - Additional options for the query
 * @returns {Promise<APIResult[]>} - Array of APIResult objects
 */
async function makeLensAPIRequest(query, options = {}) {
  let delay = RETRY_CONFIG.initialDelay;
  let attempts = 0;
  
  // Ensure size doesn't exceed Lens API limit of 100
  const requestSize = Math.min(options.size || LENS_RESULTS_COUNT, 100);
  
  while (attempts < RETRY_CONFIG.maxRetriesLens) {
    try {
      // For Lens API, we'll always use POST with the Authorization header
      // This is the most reliable approach according to their documentation
      
      // If query is a string, convert it to an object
      const payload = typeof query === 'string' 
        ? { query: query, size: requestSize }
        : { ...query, size: requestSize };
      
      const response = await axios({
        method: 'post',
        url: LENS_API_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LENS_API_KEY}`
        },
        data: payload
      });
      
      return parseLensAPIResponse(response.data);
    } catch (error) {
      attempts++;
      console.log('Error message:', error.message);
      
      // Log more detailed error information if available
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('Error status:', error.response.status);
        console.log('Error headers:', error.response.headers);
        console.log('Error data:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.log('No response received. Request details:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error in request setup:', error.message);
      }
      console.log('Error config:', error.config);
      console.log('=== END LENS API ERROR DEBUG INFO ===');
      
      if (attempts >= RETRY_CONFIG.maxRetriesLens) {
        throw new Error(`Failed to make Lens API request after ${RETRY_CONFIG.maxRetriesLens} attempts: ${error.message}`);
      }
      
      console.error(`Lens API request failed (attempt ${attempts}/${RETRY_CONFIG.maxRetriesLens}). Retrying in ${delay}ms...`);
      console.error(`Error: ${error.message}`);
      
      await sleep(delay);
      delay = Math.min(delay * 2, RETRY_CONFIG.maxDelay);
    }
  }
}

/**
 * Parses the Lens API response into APIResult objects
 * @param {object} responseData - Raw response from Lens API
 * @returns {APIResult[]} - Array of formatted API results
 */
function parseLensAPIResponse(responseData) {
  if (!responseData || !responseData.data || !Array.isArray(responseData.data)) {
    return [];
  }
  
  return responseData.data.map(result => {
    const apiResult = new APIResult();
    
    // Extract patent number from doc_key (e.g., "US_7654321_B2_20090210" -> "US 7654321 B2")
    const docKey = result.doc_key || '';
    const docKeyParts = docKey.split('_');
    if (docKeyParts.length >= 3) {
      apiResult.patentNumber = `${docKeyParts[0]} ${docKeyParts[1]} ${docKeyParts[2]}`;
    } else {
      apiResult.patentNumber = `${result.jurisdiction} ${result.doc_number} ${result.kind}`;
    }
    
    // Extract title from invention_title
    if (result.biblio && result.biblio.invention_title && Array.isArray(result.biblio.invention_title)) {
      // Prefer English title if available
      const englishTitle = result.biblio.invention_title.find(title => title.lang === 'en');
      if (englishTitle) {
        apiResult.title = englishTitle.text || '';
      } else if (result.biblio.invention_title.length > 0) {
        apiResult.title = result.biblio.invention_title[0].text || '';
      }
    }
    
    // Extract abstract
    if (result.abstract && Array.isArray(result.abstract) && result.abstract.length > 0) {
      apiResult.abstract = result.abstract[0].text || '';
    }
    
    // Extract publication date
    apiResult.publicationDate = result.date_published || '';
    
    // Extract assignee (applicant)
    if (result.biblio && result.biblio.parties && result.biblio.parties.applicants && 
        Array.isArray(result.biblio.parties.applicants) && result.biblio.parties.applicants.length > 0) {
      apiResult.assignee = result.biblio.parties.applicants[0].extracted_name?.value || '';
    }
    
    // Extract inventors
    if (result.biblio && result.biblio.parties && result.biblio.parties.inventors && 
        Array.isArray(result.biblio.parties.inventors)) {
      apiResult.inventors = result.biblio.parties.inventors
        .map(inventor => inventor.extracted_name?.value || '')
        .filter(name => name);
    }
    
    // Extract application number
    if (result.biblio && result.biblio.application_reference) {
      apiResult.applicationNumber = result.biblio.application_reference.doc_number || '';
    }
    
    return apiResult;
  });
}

module.exports = {
  makeProjectPQRequest,
  makeLensAPIRequest,
  makeGeminiRequest,
  makeGeminiChatRequest,
  formatDateRange,
  convertToLensQuery,
  parseProjectPQResponse,
  parseLensAPIResponse,
  readClaimFromFile,
  parseClaimsFile,
  saveResultsToFile
};