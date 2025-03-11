const { SearchQuery } = require('./dataTypes');
const { formatDateRange } = require('./utils');

/**
 * Builds a Project PQ query from a claim analysis
 * @param {ClaimAnalysis} claimAnalysis - The claim analysis to convert
 * @param {string} dateRange - Date range for the search
 * @returns {SearchQuery} - The constructed search query
 */
function buildQuery(claimAnalysis, dateRange) {
  const query = new SearchQuery();
  const queryParts = [];
  
  // Add keywords to the query (prioritize these)
  if (claimAnalysis.keywords && claimAnalysis.keywords.length > 0) {
    const keywordParts = claimAnalysis.keywords.map(keyword => `ABST/"${keyword}"`);
    queryParts.push(`(${keywordParts.join(' OR ')})`);
  }
  
  // Add concepts as a broader search
  if (claimAnalysis.concepts && claimAnalysis.concepts.length > 0) {
    const conceptParts = claimAnalysis.concepts.map(concept => `(ABST/"${concept}" OR TTL/"${concept}")`);
    queryParts.push(`(${conceptParts.join(' OR ')})`);
  }
  
  // Add CPC classification codes if available
  if (claimAnalysis.cpcClasses && claimAnalysis.cpcClasses.length > 0) {
    const cpcParts = claimAnalysis.cpcClasses.map(code => `CPC/${code}`);
    queryParts.push(`(${cpcParts.join(' OR ')})`);
  }
  
  // Add IPC classification codes if available
  if (claimAnalysis.ipcClasses && claimAnalysis.ipcClasses.length > 0) {
    const ipcParts = claimAnalysis.ipcClasses.map(code => `IPC/${code}`);
    queryParts.push(`(${ipcParts.join(' OR ')})`);
  }
  
  // Combine all query parts with AND
  query.query = queryParts.join(' AND ');
  
  // Add date range if provided
  if (dateRange) {
    query.query += ` AND ${formatDateRange(dateRange)}`;
  }
  
  return query;
}

module.exports = {
  buildQuery
};