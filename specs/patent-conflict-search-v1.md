# Patent Claim Analyzer - Automated Prior Art Search (Node.js, Project PQ, Google Gemini)

This system automates the generation of patent search queries based on input claims, leveraging the Project PQ API for patent searches and the Google Gemini API for intelligent claim analysis and query optimization.

To implement this we'll...

1.  Define the core data structures and search strategies.
2.  Implement the claim parsing and query generation logic, integrating Google Gemini.
3.  Create a command-line interface (CLI) to interact with Project PQ.
4.  Build tests.

## Data Structures (Adapted for Project PQ and Gemini)

```javascript
class SearchQuery {
  constructor() {
    this.query = "";  // Project PQ uses a single query string
    this.advanced = {}; // Project PQ Advanced Search parameters (optional)
  }
}

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

class APIResult { // Adapted for Project PQ's response structure
  constructor() {
      this.patentNumber = "";   // Project PQ's patent identifier
      this.title = "";
      this.abstract = "";
      this.publicationDate = ""; // Formatted date string.
      this.assignee = ""; //Primary Assignee, from Project PQ response
      this.inventors = []; // From Project PQ Response
      this.applicationNumber = ""; // From Project PQ.
      this.conflictRisk = null; // Risk level assessed by Gemini (1-10)
      this.conflictComment = ""; // Explanation of the risk assessment
    //   this.relevanceScore = null; // Project PQ doesn't provide this natively.
    //   this.snippet = null;       // We might construct this from the abstract.
  }
}

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
```

## Implementation Notes

-   `PROJECT_PQ_API_KEY = process.env.PROJECT_PQ_API_KEY` - Load from `.env` file
-   `GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY` - Load from `.env` file
-   `DEFAULT_DATE_RANGE = "last_10_years"` - in `constants.js`. Also support specific date ranges (YYYY-MM-DD).  Project PQ supports date ranges within its query language.
-   The CLI will output generated search queries and/or Project PQ results to standard output.
-   Libraries:
    -   `commander` (for building the CLI)
    -   `axios` (for making API calls to Project PQ and Gemini)
    -   `@google/generative-ai` (for interacting with the Gemini API)
    -   `jest` (for testing)
    -   `dotenv` (for managing environment variables)
    -   `lowdb` (for local JSON database to store checkpoints)
-   Error handling and rate limiting:
    -   Implement exponential backoff strategy for both API services
    -   Start with a small delay, doubling with each failed request
    -   For Gemini API: Maximum delay between retries of 3 minutes with continuous retries
    -   For Project PQ API: Maximum of 3 retry attempts before failing
    -   Log detailed error information for debugging
-   Checkpoint functionality:
    -   Store progress in a local JSON database file (using lowdb)
    -   Save results after each successful API call
    -   Allow resuming from the last successful operation
    -   Useful for batch processing of multiple claims
-   Claim file parsing:
    -   For `analyze-multiple`, the input file is a text file without a specific format
    -   Use Gemini to intelligently parse and separate individual claims from the file
    -   Handle both independent and dependent claims with the same analysis process
-   Risk assessment:
    -   After collecting patent search results, analyze each patent for conflict risk
    -   Use Gemini to assess risk level on a scale of 1-10 and provide explanation
    -   Generate summary statistics and overall risk assessment

## CLI API

```
patent-analyzer analyze [claim_text] \
    --date-range, -d <date_range> [DEFAULT_DATE_RANGE] \
    --independent, -i  [true] \
    --execute, -e  [false] \
    --file, -f <claim_file_path> \
    --output-format <format> [json] # json, text
    --checkpoint <checkpoint_id> \
    --resume

patent-analyzer analyze-multiple <claims_file_path> \
    --date-range, -d <date_range> [DEFAULT_DATE_RANGE] \
    --execute, -e [false] \
    --output-format <format> [json] # json, text
    --checkpoint <checkpoint_id> \
    --resume

patent-analyzer search <query_text> \
	--date-range, -d <date_range> [DEFAULT_DATE_RANGE] \
	--output-format <format> [json] # json, text

```

- `patent-analyzer analyze`: Takes a single claim as text input or from a file, uses Gemini for analysis, and generates a Project PQ query.
- `patent-analyzer analyze-multiple`: Reads multiple claims from a file, uses Gemini, and generates Project PQ queries.
- `patent-analyzer search`: Executes a raw Project PQ query.
- `--date-range, -d`: Specifies the date range (Project PQ-compatible format: `[YYYY-MM-DD TO YYYY-MM-DD]` or named ranges).
- `--independent, -i`: Flag indicating if the claim is independent.
- `--execute, -e`: Flag; if present, executes the query against Project PQ.
- `--file, -f`: Path to a file containing a single claim (required if claim_text is not provided).
- `--output-format`: "json" or "text".
- `--checkpoint`: Specify a unique ID for the checkpoint (defaults to the filename or a hash of the claim).
- `--resume`: Resume from the last successful operation in the checkpoint.

### Example CLI Calls

```bash
# Analyze a single independent claim, use Gemini, and get the Project PQ query
patent-analyzer analyze "A computer-implemented method..." -i

# Analyze a claim from a file, execute the search on Project PQ
patent-analyzer analyze --file claim.txt -e

# Analyze multiple claims with checkpointing
patent-analyzer analyze-multiple claims.txt -e --checkpoint claims-batch-1

# Resume a previously interrupted multiple claim analysis
patent-analyzer analyze-multiple claims.txt -e --checkpoint claims-batch-1 --resume

# Execute a raw Project PQ query
patent-analyzer search 'ABST/"dynamic vocabulary" AND CPC/G06N3/08'

# Analyze a dependent claim, and get text output
patent-analyzer analyze "The method of claim 1..." --output-format text
```

## Project Structure

```
- patent-analyzer/
  - package.json
  - .env  # Store API keys here
  - data/
    - checkpoints/  # Local JSON database files for checkpoints
  - src/
    - index.js  # Main entry point
    - cli.js     # Defines the CLI using `commander`
    - modules/
      - dataTypes.js # SearchQuery, ClaimAnalysis, APIResult, AnalysisSummary
      - constants.js
        - DEFAULT_DATE_RANGE
        - PROJECT_PQ_API_URL = "https://www.projectpq.ai/api/v1/patents/search"
      - utils.js
        - makeProjectPQRequest(query) -> Promise<APIResult[]>
        - makeGeminiRequest(prompt) -> Promise<string>  # Returns Gemini's response
        - formatDateRange(dateRange) -> string # Formats for Project PQ
        - parseProjectPQResponse(responseData) -> APIResult[]
        - readClaimFromFile(filePath) -> Promise<string>  # Reads a single claim from a file
      - riskAssessment.js
        - assessConflictRisk(claim, patents) -> Promise<APIResult[]>  # Assess risk for each patent
        - generateRiskSummary(patents) -> AnalysisSummary  # Generate summary statistics
      - checkpoint.js
        - saveCheckpoint(id, data) -> Promise<void>
        - loadCheckpoint(id) -> Promise<object>
        - hasCheckpoint(id) -> Promise<boolean>
      - analyze.js    # Single claim analysis, integrates Gemini
      - analyzeMultiple.js  # Multiple claims, integrates Gemini
      - search.js    # Executes raw Project PQ queries
      - queryBuilder.js
        - buildQuery(claimAnalysis) -> SearchQuery # Builds Project PQ query string
      - claimParser.js
        - parseClaim(claimText, independent) -> ClaimAnalysis # Uses Gemini
  - test/
    - analyze.test.js
    - analyzeMultiple.test.js
    - search.test.js
    - queryBuilder.test.js
    - claimParser.test.js
    - utils.test.js
    - checkpoint.test.js
    - riskAssessment.test.js
```

## Validation (Close the Loop)

-   `npm test` (using `jest`).
-   `node src/index.js --help`

## Detailed Breakdown of Key Modules:

**1. `claimParser.js`:**

   -   **`parseClaim(claimText, independent)`:**
       -   Construct a prompt for the Gemini API.  The prompt should instruct Gemini to:
           -   Identify key terms and phrases in the claim.
           -   Identify broader concepts related to the claim.
           -   Suggest relevant CPC and IPC classification codes, *if possible*. (Gemini may not be an expert on patent classifications, so this might require a hybrid approach with a separate classification mapping.)
           -   Output the analysis in a structured JSON format that matches our ClaimAnalysis structure.
       -   Call `utils.makeGeminiRequest` to send the prompt to Gemini.
       -   Parse Gemini's response (which should be structured JSON, as requested in the prompt).
       -   Create and return a `ClaimAnalysis` object, populating it with the extracted information from Gemini's response.
       -   Include the raw Gemini response for debugging purposes.

**2. `queryBuilder.js`:**

   -   **`buildQuery(claimAnalysis)`:**
       -   Convert the `ClaimAnalysis` into a Project PQ query string (`SearchQuery.query`).
       -   Use Project PQ's query syntax:
           -   `ABST/"keyword"` for abstract searches.
           -   `TTL/"keyword"` for title searches.
           -   `CPC/G06N3/08` for CPC classification searches.
           -   `IPC/H04L` for IPC classification searches.
           -   `AND`, `OR`, `NOT` for boolean operators.
           -   Date ranges: `[YYYY-MM-DD TO YYYY-MM-DD]` or named ranges like `last_5_years`.
       -   Prioritize keywords from Gemini, but also consider concepts for broader searches.
       -   Optionally, use the `SearchQuery.advanced` field to construct more complex queries using Project PQ's advanced search parameters (if needed).
       - Construct the query string.

**3. `utils.js`:**

   -   **`makeProjectPQRequest(query)`:**
       -   Construct the request to the Project PQ API endpoint (`PROJECT_PQ_API_URL`).
       -   Include the `PROJECT_PQ_API_KEY` in the request headers (using `Authorization: Bearer YOUR_API_KEY`).
       -   Send the `query` string as part of the request (either in the URL or request body, depending on Project PQ's API design).
       -   Use `axios` to make the request with exponential backoff for retries.
       -   Limit to maximum 3 retry attempts.
       -   Parse the JSON response from Project PQ and return a Promise resolving to an array of `APIResult` objects.
   -   **`makeGeminiRequest(prompt)`:**
       -   Use the `@google/generative-ai` library to interact with the Gemini API.
       -   Initialize the Gemini client with your `GOOGLE_GEMINI_API_KEY`.
       -   Send the `prompt` to Gemini with exponential backoff for retries.
       -   Continue retrying indefinitely with a maximum delay of 3 minutes.
       -   Return a Promise that resolves to Gemini's textual response.
   -   **`formatDateRange(dateRange)`:**  Formats date ranges for Project PQ.
   -   **`parseProjectPQResponse(responseData)`:** Creates the unified `APIResult` from the Project PQ response.
   -   **`readClaimFromFile(filePath)`:** Reads a single claim from a file.

**4. `riskAssessment.js`:**

   -   **`assessConflictRisk(claim, patents)`:**
       -   Construct a prompt for Gemini that includes the input claim and patent data.
       -   Instruct Gemini to assess the conflict risk between the claim and each patent.
       -   For each patent, ask Gemini to provide:
           -   A numerical risk score (1-10)
           -   A brief explanation of the risk assessment
       -   Parse Gemini's response and update each patent object with risk data.
       -   Return the updated patent objects with conflict assessments.
   -   **`generateRiskSummary(patents)`:**
       -   Create an AnalysisSummary object.
       -   Categorize patents by risk level.
       -   Calculate average risk score.
       -   Identify the highest risk patent.
       -   Generate an overall risk assessment summary.
       -   Return the completed summary object.

**5. `checkpoint.js`:**

   -   **`saveCheckpoint(id, data)`:**
       -   Save the current state of processing to a local JSON file.
       -   Use the checkpoint ID to identify the specific process.
       -   Store data such as processed claims, analysis results, and queries.
   -   **`loadCheckpoint(id)`:**
       -   Load previously saved checkpoint data from the local JSON file.
       -   Return the stored state information for resuming operations.
   -   **`hasCheckpoint(id)`:**
       -   Check if a checkpoint exists for the given ID.
       -   Return a boolean indicating whether a resume is possible.

**6. `analyze.js` and `analyzeMultiple.js`:**

   -   Call `claimParser.parseClaim` to analyze the claim(s) using Gemini.
   -   Call `queryBuilder.buildQuery` to create the Project PQ query.
   -   Optionally call `utils.makeProjectPQRequest` to execute the search.
   -   If search results are obtained, call `riskAssessment.assessConflictRisk` to evaluate patent conflicts.
   -   Call `riskAssessment.generateRiskSummary` to create summary statistics.
   -   Use checkpoint functionality to save progress and allow resuming.
   -   Format the output (query and/or results) and print to `console.log`.
   -   `analyzeMultiple` uses `utils.parseClaimsFile` to extract claims from the input file.
   -   `analyze` can read claim text directly from a file if the --file option is specified.

**7. `cli.js`:** Uses `commander` to build the CLI.

   -   Defines commands: `analyze`, `analyze-multiple`, `search`.
   -   Defines options: `--date-range`, `--independent`, `--execute`, `--output-format`, `--file`, `--checkpoint`, `--resume`.
   -   Parses arguments and calls the appropriate functions.

**8. `index.js`:**  Entry point; calls `cli.js`.

**9. `.env`:**  Store your `PROJECT_PQ_API_KEY` and `GOOGLE_GEMINI_API_KEY` in this file. Load them using `dotenv` in `index.js`:

   ```javascript
   // index.js
   require('dotenv').config();
   const { program } = require('./cli');
   program.parse(process.argv);
   ```