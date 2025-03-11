const { makeGeminiRequest } = require('./utils');
const { ClaimAnalysis } = require('./dataTypes');

/**
 * Parses a patent claim using Google Gemini
 * @param {string} claimText - The text of the patent claim
 * @param {boolean} independent - Whether the claim is independent
 * @returns {Promise<ClaimAnalysis>} - Parsed claim analysis
 */
async function parseClaim(claimText, independent = true) {
  // Create a new ClaimAnalysis object
  const analysis = new ClaimAnalysis();
  analysis.claimText = claimText;
  analysis.independent = independent;
  
  // Construct prompt for Gemini
  const prompt = `
  Please analyze the following patent claim and extract key information.
  
  Patent Claim:
  "${claimText}"
  
  Is this an independent claim: ${independent ? 'Yes' : 'No'}
  
  Instructions:
  1. Identify key technical terms and phrases in the claim.
  2. Identify broader concepts related to the claim.
  3. If possible, suggest relevant CPC (Cooperative Patent Classification) and IPC (International Patent Classification) codes.
  
  Please provide your analysis in the following JSON format with no additional text or explanation:
  {
    "keywords": ["keyword1", "keyword2", ...],
    "concepts": ["concept1", "concept2", ...],
    "cpcClasses": ["code1", "code2", ...],
    "ipcClasses": ["code1", "code2", ...]
  }
  
  Notes:
  - Include 5-10 of the most relevant keywords
  - Include 3-5 broader concepts
  - Only include classification codes if you have high confidence in their accuracy
  - Format your response as valid, parseable JSON only. Include nothing else outside the JSON.
  `;
  
  try {
    // Call Gemini to analyze the claim
    const geminiResponse = await makeGeminiRequest(prompt);
    
    // Store the raw response for debugging
    analysis.geminiAnalysis = geminiResponse;
    
    // Parse the JSON response
    let parsedResponse;
    try {
      // First attempt: try to parse the entire response as JSON
      parsedResponse = JSON.parse(geminiResponse);
    } catch (e) {
      // Second attempt: try to extract JSON using regex
      const match = geminiResponse.match(/\{[\s\S]*\}/);
      if (match) {
        parsedResponse = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse Gemini response as JSON');
      }
    }
    
    // Populate the analysis object
    if (Array.isArray(parsedResponse.keywords)) {
      analysis.keywords = parsedResponse.keywords;
    }
    
    if (Array.isArray(parsedResponse.concepts)) {
      analysis.concepts = parsedResponse.concepts;
    }
    
    if (Array.isArray(parsedResponse.cpcClasses)) {
      analysis.cpcClasses = parsedResponse.cpcClasses;
    }
    
    if (Array.isArray(parsedResponse.ipcClasses)) {
      analysis.ipcClasses = parsedResponse.ipcClasses;
    }
    
    return analysis;
  } catch (error) {
    console.error('Error parsing claim:', error);
    throw new Error(`Failed to parse claim: ${error.message}`);
  }
}

module.exports = {
  parseClaim
};