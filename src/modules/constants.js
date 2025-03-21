/**
 * Constants for the Patent Analyzer
 */

// Default date range for patent searches
const DEFAULT_DATE_RANGE = "last_10_years";

// Project PQ API URL
const PROJECT_PQ_API_URL = "https://api.projectpq.ai/search/102";

// Lens API URL
const LENS_API_URL = "https://api.lens.org/patent/search";

// API keys loaded from environment variables
const PROJECT_PQ_API_KEY = process.env.PROJECT_PQ_API_KEY;
const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const LENS_API_KEY = process.env.LENS_API_KEY;

// Number of search results to return (default: 50)
const PROJECT_PQ_RESULTS_COUNT = process.env.PROJECT_PQ_RESULTS_COUNT || 50;
const LENS_RESULTS_COUNT = process.env.LENS_RESULTS_COUNT || 50;

// Retry configuration for API calls
const RETRY_CONFIG = {
  initialDelay: 1000,      // Start with 1 second delay
  maxDelay: 180000,        // Max delay of 3 minutes
  maxRetriesGemini: 100,   // Effectively unlimited retries for Gemini
  maxRetriesPQ: 3,         // Maximum of 3 retries for Project PQ before giving up
  maxRetriesLens: 3        // Maximum of 3 retries for Lens API before giving up
};

// Checkpoint configuration
const CHECKPOINT_CONFIG = {
  dir: 'data/checkpoints', // Directory to store checkpoint files
  extension: '.json'       // File extension for checkpoint files
};

// Results configuration
const RESULTS_CONFIG = {
  dir: 'results',          // Directory to store result files
  extension: '.json'       // File extension for result files
};

module.exports = {
  DEFAULT_DATE_RANGE,
  PROJECT_PQ_API_URL,
  LENS_API_URL,
  PROJECT_PQ_API_KEY,
  LENS_API_KEY,
  GOOGLE_GEMINI_API_KEY,
  PROJECT_PQ_RESULTS_COUNT,
  LENS_RESULTS_COUNT,
  RETRY_CONFIG,
  CHECKPOINT_CONFIG,
  RESULTS_CONFIG
};