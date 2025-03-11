const { makeProjectPQRequest, saveResultsToFile } = require('./utils');
const { assessConflictRisk, generateRiskSummary } = require('./riskAssessment');
const crypto = require('crypto');

/**
 * Executes a raw Project PQ query
 * @param {string} queryText - The Project PQ query to execute
 * @param {Object} options - Options for the search
 * @param {string} options.dateRange - Date range for the search
 * @param {string} options.outputFormat - Output format (json or text)
 * @returns {Promise<Object>} - Search results
 */
async function search(queryText, options) {
  try {
    // Add date range if provided and not already in the query
    let finalQuery = queryText;
    if (options.dateRange && !queryText.includes(options.dateRange)) {
      finalQuery = `${queryText} AND ${options.dateRange}`;
    }
    
    // Generate a unique ID for the search based on the query
    const searchId = crypto
      .createHash('md5')
      .update(finalQuery)
      .digest('hex')
      .substring(0, 8);
    
    // Execute the query
    console.log('Executing search query...');
    const searchResults = await makeProjectPQRequest(finalQuery);
    
    // Skip risk assessment for raw queries since we don't have a claim to compare against
    // The user can specify a claim with options.claim if needed
    let riskAssessedResults = searchResults;
    let riskSummary = null;
    
    if (options.claim) {
      console.log('Analyzing patent conflict risks...');
      riskAssessedResults = await assessConflictRisk(options.claim, searchResults);
      
      // Apply risk threshold filtering to search results if specified
      const riskThreshold = options.riskThreshold || 0;
      let filteredResults = riskAssessedResults;
      
      if (riskThreshold > 0) {
        console.log(`Filtering results with risk threshold: ${riskThreshold}`);
        filteredResults = riskAssessedResults.filter(patent => 
          typeof patent.conflictRisk === 'number' && patent.conflictRisk >= riskThreshold
        );
        console.log(`Filtered from ${riskAssessedResults.length} to ${filteredResults.length} patents`);
      }
      
      console.log('Generating risk summary...');
      riskSummary = generateRiskSummary(riskAssessedResults, riskThreshold);
      
      // Update the results with filtered results
      riskAssessedResults = filteredResults;
    }
    
    // Prepare the result object
    const result = {
      query: finalQuery,
      results: riskAssessedResults,
      riskSummary
    };
    
    // Save results to results directory
    await saveResultsToFile(`search-${searchId}`, result);
    
    // Format the results according to the requested format
    return formatOutput(result, options.outputFormat);
  } catch (error) {
    console.error('Error in search:', error);
    throw new Error(`Search failed: ${error.message}`);
  }
}

/**
 * Formats the output according to the specified format
 * @param {Object} data - The search data
 * @param {string} data.query - The query that was executed
 * @param {Array} data.results - The search results
 * @param {Object} data.riskSummary - The risk summary (if available)
 * @param {string} format - Output format (json or text)
 * @returns {Object|string} - Formatted output
 */
function formatOutput(data, format = 'json') {
  if (format.toLowerCase() === 'json') {
    return data;
  } else if (format.toLowerCase() === 'text') {
    // Format as text
    let output = 'SEARCH QUERY\n';
    output += '============\n\n';
    output += data.query + '\n\n';
    
    output += 'SEARCH RESULTS\n';
    output += '==============\n\n';
    
    if (data.results.length === 0) {
      output += 'No results found.\n';
    } else {
      data.results.forEach((patent, index) => {
        output += `Result ${index + 1}:\n`;
        output += `Title: ${patent.title}\n`;
        output += `Patent Number: ${patent.patentNumber}\n`;
        output += `Publication Date: ${patent.publicationDate}\n`;
        output += `Assignee: ${patent.assignee}\n`;
        output += `Inventors: ${patent.inventors.join(', ')}\n`;
        output += `Abstract: ${patent.abstract}\n`;
        
        // Add conflict risk information if available
        if (patent.conflictRisk !== null) {
          output += `Conflict Risk: ${patent.conflictRisk}/10\n`;
          output += `Risk Assessment: ${patent.conflictComment}\n`;
        }
        
        output += '\n';
      });
      
      // Add risk summary if available
      if (data.riskSummary) {
        output += 'RISK SUMMARY\n';
        output += '============\n\n';
        output += `Total Patents Analyzed: ${data.riskSummary.totalPatentsAnalyzed}\n`;
        output += `Average Risk Score: ${data.riskSummary.averageRiskScore.toFixed(2)}/10\n`;
        output += `High Risk Patents: ${data.riskSummary.highRiskPatents.length}\n`;
        output += `Medium Risk Patents: ${data.riskSummary.mediumRiskPatents.length}\n`;
        output += `Low Risk Patents: ${data.riskSummary.lowRiskPatents.length}\n\n`;
        
        if (data.riskSummary.highestRiskPatent) {
          output += `Highest Risk Patent: ${data.riskSummary.highestRiskPatent.patentNumber} `;
          output += `(${data.riskSummary.highestRiskPatent.title}) - `;
          output += `Risk Score: ${data.riskSummary.highestRiskPatent.conflictRisk}/10\n\n`;
        }
        
        output += `Overall Assessment: ${data.riskSummary.overallRiskAssessment}\n\n`;
      }
    }
    
    return output;
  } else {
    throw new Error(`Unsupported output format: ${format}`);
  }
}

module.exports = {
  search
};