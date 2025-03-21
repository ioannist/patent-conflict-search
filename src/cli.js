const { program } = require('commander');
const { analyze } = require('./modules/analyze');
const { analyzeMultiple } = require('./modules/analyzeMultiple');
const { search } = require('./modules/search');
const { readClaimFromFile } = require('./modules/utils');
const { DEFAULT_DATE_RANGE } = require('./modules/constants');

// Create the data/checkpoints directory if it doesn't exist
const { mkdirp } = require('mkdirp');
const path = require('path');
const { CHECKPOINT_CONFIG } = require('./modules/constants');

// Ensure the checkpoints directory exists
(async () => {
  try {
    await mkdirp(path.resolve(CHECKPOINT_CONFIG.dir));
  } catch (error) {
    console.warn(`Warning: Could not create checkpoints directory: ${error.message}`);
  }
})();

// Define the CLI commands and options
program
  .name('patent-analyzer')
  .description('Patent claim analyzer with Project PQ integration')
  .version('1.0.0');

// Analyze command
program
  .command('analyze')
  .description('Analyze a single patent claim')
  .argument('[claim_text]', 'The patent claim text to analyze (optional if --file is provided)')
  .option('-d, --date-range <date_range>', 'Date range for search', DEFAULT_DATE_RANGE)
  .option('-i, --independent', 'Flag indicating if the claim is independent', true)
  .option('-e, --execute', 'Execute the query against Project PQ', false)
  .option('-f, --file <claim_file_path>', 'Path to a file containing a single claim')
  .option('--output-format <format>', 'Output format (json or text)', 'json')
  .option('--checkpoint <checkpoint_id>', 'Checkpoint ID for resumable operations')
  .option('--resume', 'Resume from a checkpoint if it exists')
  .option('-rt, --risk-threshold <number>', 'Filter out patents with risk score below this threshold', 0)
  .option('-s, --source <source>', 'Search source: "projectpq", "lens", or "all"', 'all')
  .action(async (claimText, options) => {
    try {
      // Check if either claim_text or file option is provided, unless we're resuming
      if (!claimText && !options.file && !(options.checkpoint && options.resume)) {
        console.error('Error: Either claim text or --file option must be provided');
        process.exit(1);
      }

      // If file option is provided, read the claim from the file
      let finalClaimText = claimText;
      if (options.file) {
        console.log(`Reading claim from file: ${options.file}`);
        finalClaimText = await readClaimFromFile(options.file);
      }
      
      // Convert risk threshold to a number
      if (options.riskThreshold) {
        options.riskThreshold = Number(options.riskThreshold);
      }
      
      const result = await analyze(finalClaimText, options);
      
      if (options.outputFormat.toLowerCase() === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(result);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// Analyze multiple command
program
  .command('analyze-multiple')
  .description('Analyze multiple patent claims from a file')
  .argument('<claims_file_path>', 'Path to the file containing patent claims')
  .option('-d, --date-range <date_range>', 'Date range for search', DEFAULT_DATE_RANGE)
  .option('-e, --execute', 'Execute the query against Project PQ', false)
  .option('--output-format <format>', 'Output format (json or text)', 'json')
  .option('--checkpoint <checkpoint_id>', 'Checkpoint ID for resumable operations')
  .option('--resume', 'Resume from a checkpoint if it exists')
  .option('-rt, --risk-threshold <number>', 'Filter out patents with risk score below this threshold', 0)
  .option('-s, --source <source>', 'Search source: "projectpq", "lens", or "all"', 'all')
  .action(async (claimsFilePath, options) => {
    try {
      // Convert risk threshold to a number
      if (options.riskThreshold) {
        options.riskThreshold = Number(options.riskThreshold);
      }
      
      const result = await analyzeMultiple(claimsFilePath, options);
      
      if (options.outputFormat.toLowerCase() === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(result);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// Search command
program
  .command('search')
  .description('Execute a patent search query')
  .argument('<query_text>', 'The query to execute (using Project PQ syntax)')
  .option('-d, --date-range <date_range>', 'Date range for search', DEFAULT_DATE_RANGE)
  .option('--output-format <format>', 'Output format (json or text)', 'json')
  .option('--claim <claim_text>', 'Optional claim text to assess risks against search results')
  .option('--claim-file <claim_file_path>', 'Path to a file containing a single claim for risk assessment')
  .option('-rt, --risk-threshold <number>', 'Filter out patents with risk score below this threshold', 0)
  .option('-s, --source <source>', 'Search source: "projectpq", "lens", or "all"', 'all')
  .action(async (queryText, options) => {
    try {
      // If claim-file is provided, read the claim from the file
      if (options.claimFile) {
        console.log(`Reading claim from file: ${options.claimFile}`);
        options.claim = await readClaimFromFile(options.claimFile);
      }
      
      // Convert risk threshold to a number
      if (options.riskThreshold) {
        options.riskThreshold = Number(options.riskThreshold);
      }
      
      const result = await search(queryText, options);
      
      if (options.outputFormat.toLowerCase() === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(result);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

module.exports = {
  program
};