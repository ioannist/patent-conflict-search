const { makeGeminiRequest, makeGeminiChatRequest } = require('./utils');
const { AnalysisSummary } = require('./dataTypes');

/**
 * Assesses the conflict risk between a claim and patents
 * @param {string} claimText - The text of the patent claim
 * @param {Array<Object>} patents - Array of patent objects from Project PQ
 * @returns {Promise<Array<Object>>} - Array of patents with risk assessments
 */
async function assessConflictRisk(claimText, patents) {
  if (!patents || patents.length === 0) {
    console.log('No patents to assess risk for.');
    return [];
  }

  console.log(`Assessing conflict risk for ${patents.length} patents...`);

  // Create a shortened version of the patent data for Gemini prompt
  const patentData = patents.map((patent, index) => ({
    index, // Keep track of the original index
    patentNumber: patent.patentNumber,
    title: patent.title,
    abstract: patent.abstract || 'No abstract available'
  }));

  // Define batch size for processing
  const BATCH_SIZE = 20;
  const totalBatches = Math.ceil(patentData.length / BATCH_SIZE);
  
  // Initialize conversation history
  let conversationHistory = [];
  
  // Initialize results array
  let allAssessments = [];
  
  // Process patents in batches
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, patentData.length);
    const batchPatents = patentData.slice(start, end);
    
    console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (patents ${start + 1}-${end})...`);
    
    // Construct prompt for this batch
    let prompt;
    
    if (batchIndex === 0) {
      // First batch - initialize the conversation with the claim and instructions
      prompt = `
        I need you to analyze the potential patent conflict risks between a proposed patent claim and existing patents.
        
        CLAIM TEXT:
        "${claimText}"
        
        I will provide patents in batches. For each patent, please:
        1. Assess the conflict risk on a scale of 1-10, where:
           - 1-3: Low risk of conflict
           - 4-6: Medium risk of conflict
           - 7-10: High risk of conflict
        2. Provide a brief explanation (1-2 sentences) for your risk assessment
        
        Here is the first batch of patents:
        ${batchPatents.map((patent, i) => `
        PATENT ${start + i + 1}:
        Patent Number: ${patent.patentNumber}
        Title: ${patent.title}
        Abstract: ${patent.abstract}
        `).join('\n')}
        
        IMPORTANT: Format your response as valid JSON with this EXACT structure:
        {
          "patentAssessments": [
            {
              "index": 0,
              "patentNumber": "US1234567A",
              "riskScore": 7,
              "explanation": "High overlap in core methodology and application area."
            }
          ]
        }
        
        Your response must:
        1. Start with the opening brace {
        2. End with the closing brace }
        3. Contain ONLY valid JSON - no additional text, explanations, or formatting
        4. Include ALL patents in this batch in the assessment
        5. Use the exact field names shown above
        6. Use integers (not strings) for index and riskScore fields
        
        DO NOT include any text before or after the JSON.
      `;
      
      // Add the initial prompt to conversation history
      conversationHistory.push({
        role: "user",
        parts: [{ text: prompt }]
      });
      
      // Make the initial request without history
      const response = await processGeminiRequest(prompt);
      
      // Add the response to conversation history
      conversationHistory.push({
        role: "model",
        parts: [{ text: response }]
      });
      
      // Parse and store the assessments
      try {
        const parsedResponse = parseGeminiResponse(response);
        allAssessments = allAssessments.concat(parsedResponse.patentAssessments);
      } catch (error) {
        console.error(`Error parsing first batch response: ${error.message}`);
        throw error;
      }
    } else {
      // Subsequent batches - reference previous assessments
      prompt = `
        Here is the next batch of patents to assess for conflict risk with the same claim:
        ${batchPatents.map((patent, i) => `
        PATENT ${start + i + 1}:
        Patent Number: ${patent.patentNumber}
        Title: ${patent.title}
        Abstract: ${patent.abstract}
        `).join('\n')}
        
        Please maintain consistency with your previous assessments. Format your response as valid JSON with the same structure as before.
        
        IMPORTANT: The "index" field should match the original index of each patent (${start} to ${end - 1} for this batch).
        
        DO NOT include any text before or after the JSON.
      `;
      
      // Add the new prompt to conversation history
      conversationHistory.push({
        role: "user",
        parts: [{ text: prompt }]
      });
      
      // Make the request with conversation history
      const response = await processGeminiRequest(prompt, conversationHistory);
      
      // Add the response to conversation history
      conversationHistory.push({
        role: "model",
        parts: [{ text: response }]
      });
      
      // Parse and store the assessments
      try {
        const parsedResponse = parseGeminiResponse(response);
        allAssessments = allAssessments.concat(parsedResponse.patentAssessments);
      } catch (error) {
        console.error(`Error parsing batch ${batchIndex + 1} response: ${error.message}`);
        throw error;
      }
    }
  }
  
  // Update the original patent objects with the risk assessments
  allAssessments.forEach(assessment => {
    if (assessment.index >= 0 && assessment.index < patents.length) {
      const patent = patents[assessment.index];
      patent.conflictRisk = assessment.riskScore;
      patent.conflictComment = assessment.explanation;
    }
  });
  
  return patents;
}

/**
 * Makes a request to Gemini with exponential backoff retry
 * @param {string} prompt - The prompt to send
 * @param {Array<Object>} [history] - Optional conversation history
 * @returns {Promise<string>} - Gemini's response
 */
async function processGeminiRequest(prompt, history = null) {
  let delay = 1000; // Start with 1 second delay
  let attempts = 0;
  const maxDelay = 180000; // Max delay of 3 minutes
  const maxAttempts = 100; // Maximum number of retry attempts
  
  while (attempts < maxAttempts) {
    try {
      let response;
      
      if (history) {
        // Use chat API with history
        response = await makeGeminiChatRequest(history, prompt);
      } else {
        // Use standard API without history
        response = await makeGeminiRequest(prompt);
      }
      
      // Try to parse the response to validate it's proper JSON
      // If it fails, throw an error to trigger a retry
      parseGeminiResponse(response);
      
      return response;
    } catch (error) {
      attempts++;
      
      console.error(`Gemini request failed (attempt ${attempts}/${maxAttempts}): ${error.message}`);
      
      if (attempts >= maxAttempts) {
        console.error('Maximum retry attempts reached. Giving up.');
        throw error;
      }
      
      console.log(`Retrying with backoff delay of ${delay}ms...`);
      
      // Sleep with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt, but cap at maxDelay
      delay = Math.min(delay * 2, maxDelay);
    }
  }
}

/**
 * Parses Gemini's response to extract JSON
 * @param {string} response - Gemini's response text
 * @returns {Object} - Parsed JSON object
 */
function parseGeminiResponse(response) {
  if (!response || typeof response !== 'string') {
    throw new Error('Empty or invalid response from Gemini');
  }
  
  let parsedResponse;
  let jsonText = response.trim();
  
  try {
    // First try: direct parsing of the entire response
    parsedResponse = JSON.parse(jsonText);
  } catch (e) {
    // Second try: Look for JSON object pattern using regex
    const jsonPattern = /\{[\s\S]*\}/;
    const match = jsonText.match(jsonPattern);
    
    if (match) {
      try {
        parsedResponse = JSON.parse(match[0]);
      } catch (innerError) {
        throw new Error(`Could not parse Gemini response as JSON: ${innerError.message}. Response starts with: "${jsonText.substring(0, 50)}..."`);
      }
    } else {
      // Third try: Check if response starts with text and then has JSON
      const possibleJsonStart = jsonText.indexOf('{');
      const possibleJsonEnd = jsonText.lastIndexOf('}');
      
      if (possibleJsonStart !== -1 && possibleJsonEnd !== -1 && possibleJsonEnd > possibleJsonStart) {
        try {
          const extractedJson = jsonText.substring(possibleJsonStart, possibleJsonEnd + 1);
          parsedResponse = JSON.parse(extractedJson);
        } catch (extractError) {
          throw new Error(`Could not parse Gemini response as JSON: ${e.message}. Response starts with: "${jsonText.substring(0, 50)}..."`);
        }
      } else {
        throw new Error(`Could not parse Gemini response as JSON: ${e.message}. Response starts with: "${jsonText.substring(0, 50)}..."`);
      }
    }
  }
  
  // Validate the response structure
  if (!parsedResponse || !Array.isArray(parsedResponse.patentAssessments)) {
    throw new Error('Unexpected response format from Gemini: missing patentAssessments array');
  }
  
  return parsedResponse;
}

/**
 * Generates a summary of risk assessments for a set of patents
 * @param {Array<Object>} patents - Array of patents with risk assessments
 * @param {number} riskThreshold - Minimum risk score to include in summary (default: 0)
 * @returns {Object} - Summary of risk assessments
 */
function generateRiskSummary(patents, riskThreshold = 0) {
  const summary = new AnalysisSummary();
  
  // Filter out patents without risk assessments
  const assessedPatents = patents.filter(patent => typeof patent.conflictRisk === 'number');
  
  // Apply risk threshold filtering
  const filteredPatents = assessedPatents.filter(patent => patent.conflictRisk >= riskThreshold);
  
  summary.totalPatentsAnalyzed = assessedPatents.length;
  
  if (filteredPatents.length === 0) {
    if (assessedPatents.length === 0) {
      summary.overallRiskAssessment = "No patents were assessed for risk.";
    } else if (riskThreshold > 0) {
      summary.overallRiskAssessment = `No patents met the minimum risk threshold of ${riskThreshold}.`;
    } else {
      summary.overallRiskAssessment = "No patents were found to have any risk.";
    }
    return summary;
  }
  
  // Categorize patents by risk level
  for (const patent of filteredPatents) {
    const risk = patent.conflictRisk;
    
    if (risk >= 7) {
      summary.highRiskPatents.push({
        patentNumber: patent.patentNumber,
        title: patent.title,
        riskScore: risk
      });
    } else if (risk >= 4) {
      summary.mediumRiskPatents.push({
        patentNumber: patent.patentNumber,
        title: patent.title,
        riskScore: risk
      });
    } else {
      summary.lowRiskPatents.push({
        patentNumber: patent.patentNumber,
        title: patent.title,
        riskScore: risk
      });
    }
  }
  
  // Calculate average risk score
  const totalRiskScore = filteredPatents.reduce((sum, patent) => sum + patent.conflictRisk, 0);
  summary.averageRiskScore = totalRiskScore / filteredPatents.length;
  
  // Find highest risk patent
  if (filteredPatents.length > 0) {
    summary.highestRiskPatent = filteredPatents.reduce((highest, patent) => 
      (patent.conflictRisk > (highest ? highest.conflictRisk : 0)) ? patent : highest, null);
  }
  
  // Generate overall risk assessment
  if (summary.highRiskPatents.length > 0) {
    summary.overallRiskAssessment = `HIGH RISK: ${summary.highRiskPatents.length} patents show significant conflict potential. Recommended action: Detailed review by patent attorney and possible claim revision.`;
  } else if (summary.mediumRiskPatents.length > 0) {
    summary.overallRiskAssessment = `MEDIUM RISK: ${summary.mediumRiskPatents.length} patents show moderate conflict potential. Recommended action: Consider claim refinement to reduce overlap with existing patents.`;
  } else {
    summary.overallRiskAssessment = `LOW RISK: All patents show minimal conflict potential. Recommended action: Proceed with patent application, but monitor for new prior art.`;
  }
  
  return summary;
}

module.exports = {
  assessConflictRisk,
  generateRiskSummary
};