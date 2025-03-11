/**
 * SearchQuery class for Project PQ
 * Represents a search query for the Project PQ API
 */
class SearchQuery {
  constructor() {
    this.query = "";  // Project PQ uses a single query string
    this.advanced = {}; // Project PQ Advanced Search parameters (optional)
  }
}

/**
 * ClaimAnalysis class for parsed patent claims
 * Stores the analysis of a patent claim as processed by Gemini
 */
class ClaimAnalysis {
  constructor() {
    this.claimText = "";
    this.independent = true;
    this.keywords = [];       // Keywords extracted by Gemini
    this.concepts = [];        // Broader concepts identified by Gemini
    this.cpcClasses = [];      // CPC classifications (suggested by Gemini or mapped)
    this.ipcClasses = [];      // IPC classifications (suggested by Gemini or mapped)
    this.geminiAnalysis = ""; // Raw Gemini analysis output (for debugging/reference)
  }
}

/**
 * APIResult class for Project PQ responses
 * Standardizes the format of search results from Project PQ
 */
class APIResult {
  constructor() {
    this.patentNumber = "";   // Project PQ's patent identifier
    this.title = "";
    this.abstract = "";
    this.publicationDate = ""; // Formatted date string.
    this.assignee = ""; // Primary Assignee, from Project PQ response
    this.inventors = []; // From Project PQ Response
    this.applicationNumber = ""; // From Project PQ.
    this.conflictRisk = null; // Risk level assessed by Gemini (1-10)
    this.conflictComment = ""; // Explanation of the risk assessment
  }
}

/**
 * AnalysisSummary class for risk assessment summary
 * Provides an overview of patent conflict risks
 */
class AnalysisSummary {
  constructor() {
    this.totalPatentsAnalyzed = 0;      // Total number of patents analyzed
    this.highRiskPatents = [];          // List of high-risk patents (risk >= 7)
    this.mediumRiskPatents = [];        // List of medium-risk patents (risk 4-6)
    this.lowRiskPatents = [];           // List of low-risk patents (risk 1-3)
    this.averageRiskScore = 0;          // Average risk score across all patents
    this.highestRiskPatent = null;      // Patent with the highest conflict risk
    this.overallRiskAssessment = "";    // Overall risk assessment summary from Gemini
  }
}

module.exports = {
  SearchQuery,
  ClaimAnalysis,
  APIResult,
  AnalysisSummary
};