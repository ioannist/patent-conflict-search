const { parseClaim } = require('./claimParser');
const { buildQuery } = require('./queryBuilder');
const { makeProjectPQRequest, saveResultsToFile } = require('./utils');
const { search } = require('./search');
const { assessConflictRisk, generateRiskSummary } = require('./riskAssessment');
const path = require('path');
const { 
  generateCheckpointId,
  hasCheckpoint,
  saveCheckpoint,
  loadCheckpoint,
  markCompleted 
} = require('./checkpoint');

/**
 * Analyzes a single patent claim
 * @param {string} claimText - The text of the patent claim
 * @param {Object} options - Options for analysis
 * @param {string} options.dateRange - Date range for the search
 * @param {boolean} options.independent - Whether the claim is independent
 * @param {boolean} options.execute - Whether to execute the search query
 * @param {string} options.outputFormat - Output format (json or text)
 * @param {string} options.checkpoint - Optional checkpoint ID
 * @param {boolean} options.resume - Whether to resume from a checkpoint
 * @param {number} options.riskThreshold - Risk threshold for filtering search results
 * @param {string} options.source - Search source ("projectpq", "lens", or "all")
 * @returns {Promise<Object>} - Analysis results
 */
async function analyze(claimText, options) {
  try {
    // Generate a checkpoint ID if checkpointing is requested
    const checkpointId = options.checkpoint ? 
      options.checkpoint : 
      (options.file ? path.basename(options.file) : generateCheckpointId(null, claimText));
    
    // Log the checkpoint ID if checkpointing is enabled
    if (options.checkpoint || options.resume) {
      console.log(`Using checkpoint ID: ${checkpointId}`);
      console.log(`Checkpoint will be saved to: data/checkpoints/${checkpointId}.json`);
    }
    
    // Check if we should resume from a checkpoint
    if (options.checkpoint && options.resume && await hasCheckpoint(checkpointId)) {
      console.log(`Resuming from checkpoint: ${checkpointId}`);
      const checkpoint = await loadCheckpoint(checkpointId);
      
      if (checkpoint.completed) {
        console.log('Checkpoint was already completed. Returning saved results.');
        
        // Save results to results directory
        if (checkpoint.data) {
          await saveResultsToFile(checkpointId, checkpoint.data);
        }
        
        return formatOutput(checkpoint.data, options.outputFormat);
      }
      
      // If we have analysis but not search results, and execute is true, we can continue from there
      if (checkpoint.data.analysis && !checkpoint.data.searchResults && options.execute) {
        console.log('Found partial results in checkpoint. Continuing with search...');
        const query = checkpoint.data.query;
        
        // Use the search function instead of direct API call
        const searchResponse = await search(query.query, {
          dateRange: options.dateRange,
          outputFormat: 'json',
          claim: claimText,
          riskThreshold: options.riskThreshold,
          source: options.source
        });
        
        const result = {
          ...checkpoint.data,
          searchResults: searchResponse.results,
          riskSummary: searchResponse.riskSummary,
          sources: searchResponse.sources
        };
        
        // Save the complete results
        await saveCheckpoint(checkpointId, result);
        await markCompleted(checkpointId);
        
        // Save results to results directory
        await saveResultsToFile(checkpointId, result);
        
        return formatOutput(result, options.outputFormat);
      }
      
      // Otherwise, return the saved results
      return formatOutput(checkpoint.data, options.outputFormat);
    }
    
    // Start fresh analysis
    console.log('Starting new analysis...');
    
    // Parse the claim
    const analysis = await parseClaim(claimText, options.independent);
    
    // Build the query
    const query = buildQuery(analysis, options.dateRange);
    
    // Prepare the result object
    const result = {
      analysis,
      query
    };
    
    // Save checkpoint after analysis if checkpointing is enabled
    if (options.checkpoint) {
      await saveCheckpoint(checkpointId, result);
    }
    
    // If execute is true, execute the search query
    if (options.execute) {
      console.log('Executing search query...');
      
      // Use the search function instead of direct API call
      const searchResponse = await search(query.query, {
        dateRange: options.dateRange,
        outputFormat: 'json',
        claim: claimText,
        riskThreshold: options.riskThreshold,
        source: options.source
      });
      
      result.searchResults = searchResponse.results;
      result.riskSummary = searchResponse.riskSummary;
      result.sources = searchResponse.sources;
      
      // Save the results to a checkpoint
      if (options.checkpoint || options.resume) {
        await saveCheckpoint(checkpointId, result);
        await markCompleted(checkpointId);
      }
      
      // Save results to results directory
      await saveResultsToFile(checkpointId, result);
    }
    
    return formatOutput(result, options.outputFormat);
  } catch (error) {
    console.error('Error in analyze:', error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

/**
 * Formats the output according to the specified format
 * @param {Object} result - The analysis result
 * @param {string} format - Output format (json or text)
 * @returns {Object|string} - Formatted output
 */
function formatOutput(result, format = 'json') {
  if (format.toLowerCase() === 'json') {
    return result;
  } else if (format.toLowerCase() === 'text') {
    // Format as text
    let output = 'CLAIM ANALYSIS\n';
    output += '==============\n\n';
    
    output += `Claim Text: ${result.analysis.claimText}\n\n`;
    
    output += 'Keywords:\n';
    result.analysis.keywords.forEach(keyword => {
      output += `- ${keyword}\n`;
    });
    output += '\n';
    
    output += 'Concepts:\n';
    result.analysis.concepts.forEach(concept => {
      output += `- ${concept}\n`;
    });
    output += '\n';
    
    if (result.analysis.cpcClasses.length > 0) {
      output += 'CPC Classes:\n';
      result.analysis.cpcClasses.forEach(code => {
        output += `- ${code}\n`;
      });
      output += '\n';
    }
    
    if (result.analysis.ipcClasses.length > 0) {
      output += 'IPC Classes:\n';
      result.analysis.ipcClasses.forEach(code => {
        output += `- ${code}\n`;
      });
      output += '\n';
    }
    
    output += 'GENERATED QUERY\n';
    output += '===============\n\n';
    output += result.query.query + '\n\n';
    
    if (result.searchResults) {
      // Add source information if available
      if (result.sources) {
        output += 'SOURCES\n';
        output += '=======\n\n';
        output += `Project PQ: ${result.sources.projectpq} results\n`;
        output += `Lens API: ${result.sources.lens} results\n`;
        output += `Total: ${result.sources.total} results\n\n`;
      }
      
      output += 'SEARCH RESULTS\n';
      output += '==============\n\n';
      
      if (result.searchResults.length === 0) {
        output += 'No results found.\n';
      } else {
        result.searchResults.forEach((patent, index) => {
          output += `Result ${index + 1}:\n`;
          output += `Title: ${patent.title}\n`;
          output += `Patent Number: ${patent.patentNumber}\n`;
          output += `Publication Date: ${patent.publicationDate}\n`;
          output += `Assignee: ${patent.assignee}\n`;
          output += `Inventors: ${patent.inventors.join(', ')}\n`;
          output += `Source: ${patent.source || 'Unknown'}\n`;
          output += `Abstract: ${patent.abstract}\n`;
          
          // Add conflict risk information if available
          if (patent.conflictRisk !== null) {
            output += `Conflict Risk: ${patent.conflictRisk}/10\n`;
            output += `Risk Assessment: ${patent.conflictComment}\n`;
          }
          
          output += '\n';
        });
      }
      
      // Add risk summary if available
      if (result.riskSummary) {
        output += 'RISK SUMMARY\n';
        output += '============\n\n';
        output += `Total Patents Analyzed: ${result.riskSummary.totalPatentsAnalyzed}\n`;
        output += `Average Risk Score: ${result.riskSummary.averageRiskScore.toFixed(2)}/10\n`;
        output += `High Risk Patents: ${result.riskSummary.highRiskPatents.length}\n`;
        output += `Medium Risk Patents: ${result.riskSummary.mediumRiskPatents.length}\n`;
        output += `Low Risk Patents: ${result.riskSummary.lowRiskPatents.length}\n\n`;
        
        if (result.riskSummary.highestRiskPatent) {
          output += `Highest Risk Patent: ${result.riskSummary.highestRiskPatent.patentNumber} `;
          output += `(${result.riskSummary.highestRiskPatent.title}) - `;
          output += `Risk Score: ${result.riskSummary.highestRiskPatent.conflictRisk}/10\n\n`;
        }
        
        output += `Overall Assessment: ${result.riskSummary.overallRiskAssessment}\n\n`;
      }
    }
    
    return output;
  } else {
    throw new Error(`Unsupported output format: ${format}`);
  }
}

module.exports = {
  analyze
};