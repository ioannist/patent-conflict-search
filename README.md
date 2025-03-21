# Patent Claim Analyzer

A command-line tool for automated patent claim analysis and prior art search using Google Gemini with Project PQ and Lens API integration.

## Features

- Analyze patent claims using Google Gemini AI
- Extract keywords, concepts, and relevant classification codes
- Generate optimized search queries for patent databases
- Search for prior art using Project PQ API and Lens API
- Combine search results from multiple patent databases
- AI-powered conflict risk assessment for each patent result
- Risk scoring on a scale of 1-10 with detailed explanations
- Risk threshold filtering to focus on higher-risk patents
- Summary statistics and overall risk assessment
- Support for both single claims and multiple claims from a file
- Checkpoint functionality to save progress and resume interrupted operations
- Robust error handling with configurable retry strategies

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ioannist/patent-conflict-search.git
cd patent-conflict-search
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the template:
```bash
cp .env.example .env
```

4. Add your API keys to the `.env` file:
```
PROJECT_PQ_API_KEY=your_project_pq_api_key_here
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key_here
LENS_API_KEY=your_lens_api_key_here
```

5. Make the CLI executable:
```bash
chmod +x src/index.js
```

6. Link the package (optional, for global usage):
```bash
npm link
```

## Usage

### Analyze a Single Claim

From command line:
```bash
patent-analyzer analyze "A computer-implemented method..." -i -e
```

From a file:
```bash
patent-analyzer analyze --file claim.txt -i -e
```

You can specify which patent database to use with the `--source` option:
```bash
# Search only in Project PQ
patent-analyzer analyze "A computer-implemented method..." -i -e -s projectpq

# Search only in Lens
patent-analyzer analyze "A computer-implemented method..." -i -e -s lens

# Search in both (default)
patent-analyzer analyze "A computer-implemented method..." -i -e -s all
```

### Analyze Multiple Claims from a File

```bash
patent-analyzer analyze-multiple claims.txt -e --output-format json
```

### Using Checkpoints for Resumable Operations

Create a checkpoint during analysis:
```bash
patent-analyzer analyze-multiple claims.txt -e --checkpoint my-analysis-1
```

Resume from a checkpoint after interruption:
```bash
patent-analyzer analyze-multiple claims.txt -e --checkpoint my-analysis-1 --resume
```

When using checkpoints, the tool will display the checkpoint ID and file path:
```
Using checkpoint ID: my-analysis-1
Checkpoint will be saved to: data/checkpoints/my-analysis-1.json
```

If you don't specify a checkpoint ID:
- For single claim analysis from a file: The filename will be used as the checkpoint ID
- For multiple claim analysis: The filename will be used as the checkpoint ID
- For claim text entered directly: An MD5 hash of the claim text will be used (first 8 characters)

### Execute a Patent Search Query

Simple search:
```bash
patent-analyzer search 'ABST/"dynamic vocabulary" AND CPC/G06N3/08'
```

Specify which database to search:
```bash
# Search only in Project PQ
patent-analyzer search 'ABST/"neural network"' -s projectpq

# Search only in Lens
patent-analyzer search 'ABST/"neural network"' -s lens

# Search in both (default)
patent-analyzer search 'ABST/"neural network"' -s all
```

Search with risk assessment:
```bash
patent-analyzer search 'ABST/"neural network"' --claim "A method for training a neural network using backpropagation"
```

You can also load the claim from a file:
```bash
patent-analyzer search 'ABST/"neural network"' --claim-file my-claim.txt
```

### Filtering Results by Risk Threshold

You can filter search results to only include patents with a risk score at or above a specified threshold:

```bash
# Only show patents with risk score 5 or higher
patent-analyzer analyze "A computer-implemented method..." -e -rt 5

# Only show high-risk patents (risk score 7 or higher)
patent-analyzer analyze-multiple claims.txt -e --risk-threshold 7

# Filter search results with risk score 3 or higher
patent-analyzer search 'ABST/"neural network"' --claim "My claim text" -rt 3
```

The risk threshold is applied to both the search results and the risk summary, ensuring that only patents meeting the threshold criteria are included in the final output.

### Options

- `--date-range, -d`: Specifies the date range (default: last_10_years)
- `--independent, -i`: Flag indicating if the claim is independent (default: true)
- `--execute, -e`: Execute the search query (default: false)
- `--file, -f`: Path to a file containing a single claim (required if claim_text is not provided)
- `--output-format`: Output format, either json or text (default: json)
- `--checkpoint`: Specify a unique ID for the checkpoint (default: auto-generated from input)
- `--resume`: Resume from the last successful operation in the checkpoint
- `--claim`: Claim text to assess conflict risk against search results (for search command)
- `--claim-file`: Path to file containing claim text (for search command)
- `--risk-threshold, -rt`: Filter out patents with risk score below this threshold (default: 0)
- `--source, -s`: Search source: "projectpq", "lens", or "all" (default: all)

## Risk Assessment

When using the `--execute` flag or directly using the search command with `--claim` or `--claim-file`, the tool will:

1. Perform conflict risk assessment for each patent result
2. Assign a risk score (1-10) to each patent
3. Provide an explanation of the risk assessment
4. Generate summary statistics including:
   - Total patents analyzed
   - Average risk score
   - Number of high/medium/low risk patents
   - Highest risk patent
   - Overall risk assessment and recommendations

Example risk assessment output:
```
RISK SUMMARY
============

Total Patents Analyzed: 8
Average Risk Score: 4.75/10
High Risk Patents: 2
Medium Risk Patents: 3
Low Risk Patents: 3

Highest Risk Patent: US9876543B2 (Method for training neural networks) - Risk Score: 8/10

Overall Assessment: MEDIUM RISK: 3 patents show moderate conflict potential. Recommended action: Consider claim refinement to reduce overlap with existing patents.
```

## Patent Database Sources

The tool supports searching in two patent databases:

1. **Project PQ** - A comprehensive patent database with advanced search capabilities.
2. **Lens** - The Lens provides public access to patent and scholarly data.

When running searches using both sources (the default), the tool:
- Converts the query as needed between database-specific formats
- Executes the search in parallel across both databases
- Combines and deduplicates the results
- Provides source information for each patent result
- Shows a summary of results from each source

Example sources summary:
```
SOURCES
=======

Project PQ: 35 results
Lens API: 42 results
Total: 77 results
```

## Error Handling

The tool implements robust error handling with different strategies:
- For Gemini API: Unlimited retries with exponential backoff (max 3 minutes between retries)
- For Project PQ API: Limited to 3 retry attempts before failing
- For Lens API: Limited to 3 retry attempts before failing

## Development

- Run tests:
```bash
npm test
```

- Run specific tests:
```bash
npm test -- -t "testName"
```

## License

ISC