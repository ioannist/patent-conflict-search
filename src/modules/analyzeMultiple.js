const { parseClaim } = require('./claimParser');
const { buildQuery } = require('./queryBuilder');
const { makeProjectPQRequest, parseClaimsFile, saveResultsToFile } = require('./utils');
const { assessConflictRisk, generateRiskSummary } = require('./riskAssessment');
const { 
  generateCheckpointId, 
  hasCheckpoint, 
  saveCheckpoint, 
  loadCheckpoint, 
  updateCheckpoint,
  markProcessed,
  markCompleted 
} = require('./checkpoint');
const path = require('path');

/**
 * Analyzes multiple patent claims from a file
 * @param {string} filePath - Path to the file containing claims
 * @param {Object} options - Options for analysis
 * @param {string} options.dateRange - Date range for the search
 * @param {boolean} options.execute - Whether to execute the search query
 * @param {string} options.outputFormat - Output format (json or text)
 * @param {string} options.checkpoint - Optional checkpoint ID
 * @param {boolean} options.resume - Whether to resume from a checkpoint
 * @param {number} options.riskThreshold - Risk threshold for filtering search results
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeMultiple(filePath, options) {
  try {
    // Generate a checkpoint ID if checkpointing is requested
    const checkpointId = options.checkpoint ? 
      options.checkpoint : 
      path.basename(filePath);
    
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
          await saveResultsToFile(`multiple-${checkpointId}`, checkpoint.data);
        }
        
        return formatOutput(checkpoint.data, options.outputFormat);
      }
      
      // If we have parsed claims, we can continue from where we left off
      if (checkpoint.data && Array.isArray(checkpoint.data)) {
        console.log('Found partial results in checkpoint. Continuing analysis...');
        
        // Get the original claims
        const allClaims = await parseClaimsFile(filePath);
        const processedIndices = checkpoint.processed.map(Number);
        const results = [...checkpoint.data];
        
        // Process the remaining claims
        for (let i = 0; i < allClaims.length; i++) {
          // Skip already processed claims
          if (processedIndices.includes(i)) {
            console.log(`Skipping already processed claim ${i + 1} of ${allClaims.length}...`);
            continue;
          }
          
          console.log(`Analyzing claim ${i + 1} of ${allClaims.length}...`);
          
          // For simplicity, we consider all claims from file as independent
          const analysis = await parseClaim(allClaims[i], true);
          
          // Build the query
          const query = buildQuery(analysis, options.dateRange);
          
          // Prepare the result object
          const result = {
            claimNumber: i + 1,
            analysis,
            query
          };
          
          // Execute the query if requested
          if (options.execute) {
            console.log(`Executing search query for claim ${i + 1}...`);
            const searchResults = await makeProjectPQRequest(query.query);
            
            // Assess conflict risk for the patents
            console.log(`Analyzing patent conflict risks for claim ${i + 1}...`);
            const riskAssessedResults = await assessConflictRisk(allClaims[i], searchResults);
            
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
            
            // Generate risk summary
            console.log(`Generating risk summary for claim ${i + 1}...`);
            const riskSummary = generateRiskSummary(riskAssessedResults, riskThreshold);
            
            result.searchResults = filteredResults;
            result.riskSummary = riskSummary;
          }
          
          results.push(result);
          
          // Mark this claim as processed
          await markProcessed(checkpointId, i.toString());
          
          // Save checkpoint after each claim
          await updateCheckpoint(checkpointId, 'data', results);
        }
        
        // Mark the checkpoint as completed
        await markCompleted(checkpointId);
        
        // Save results to results directory
        await saveResultsToFile(`multiple-${checkpointId}`, results);
        
        return formatOutput(results, options.outputFormat);
      }
    }
    
    // Start fresh analysis
    console.log('Starting new analysis...');
    
    // Parse the claims file to extract individual claims
    const claims = await parseClaimsFile(filePath);
    
    if (!claims || claims.length === 0) {
      throw new Error('No claims found in the file');
    }
    
    console.log(`Found ${claims.length} claims in the file.`);
    
    // Analyze each claim
    const results = [];
    
    for (let i = 0; i < claims.length; i++) {
      console.log(`Analyzing claim ${i + 1} of ${claims.length}...`);
      
      // For simplicity, we consider all claims from file as independent
      // This can be enhanced in future versions
      const analysis = await parseClaim(claims[i], true);
      
      // Build the query
      const query = buildQuery(analysis, options.dateRange);
      
      // Prepare the result object
      const result = {
        claimNumber: i + 1,
        analysis,
        query
      };
      
      // Execute the query if requested
      if (options.execute) {
        console.log(`Executing search query for claim ${i + 1}...`);
        const searchResults = await makeProjectPQRequest(query.query);
        
        // Assess conflict risk for the patents
        console.log(`Analyzing patent conflict risks for claim ${i + 1}...`);
        const riskAssessedResults = await assessConflictRisk(claims[i], searchResults);
        
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
        
        // Generate risk summary
        console.log(`Generating risk summary for claim ${i + 1}...`);
        const riskSummary = generateRiskSummary(riskAssessedResults, riskThreshold);
        
        result.searchResults = filteredResults;
        result.riskSummary = riskSummary;
      }
      
      results.push(result);
      
      // Save checkpoint after each claim if checkpointing is enabled
      if (options.checkpoint) {
        await markProcessed(checkpointId, i.toString());
        await updateCheckpoint(checkpointId, 'data', results);
      }
    }
    
    // Mark the checkpoint as completed if checkpointing is enabled
    if (options.checkpoint) {
      await markCompleted(checkpointId);
    }
    
    // Save results to results directory
    await saveResultsToFile(`multiple-${checkpointId}`, results);
    
    return formatOutput(results, options.outputFormat);
  } catch (error) {
    console.error('Error in analyzeMultiple:', error);
    throw new Error(`Multiple claim analysis failed: ${error.message}`);
  }
}

/**
 * Formats the output according to the specified format
 * @param {Array} results - The analysis results
 * @param {string} format - Output format (json or text)
 * @returns {Object|string} - Formatted output
 */
function formatOutput(results, format = 'json') {
  if (format.toLowerCase() === 'json') {
    return results;
  } else if (format.toLowerCase() === 'text') {
    // Format as text
    let output = 'MULTIPLE CLAIM ANALYSIS\n';
    output += '======================\n\n';
    
    results.forEach((result, index) => {
      output += `CLAIM ${result.claimNumber}\n`;
      output += '------\n\n';
      
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
      
      output += 'GENERATED QUERY:\n';
      output += result.query.query + '\n\n';
      
      if (result.searchResults) {
        output += 'SEARCH RESULTS:\n';
        
        if (result.searchResults.length === 0) {
          output += 'No results found.\n';
        } else {
          result.searchResults.forEach((patent, i) => {
            output += `Result ${i + 1}:\n`;
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
        }
        
        // Add risk summary if available
        if (result.riskSummary) {
          output += 'RISK SUMMARY:\n';
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
      
      output += '\n';
    });
    
    return output;
  } else {
    throw new Error(`Unsupported output format: ${format}`);
  }
}

module.exports = {
  analyzeMultiple
};