# Project Guidelines for Claude

## Build & Test Commands
- `npm install` - Install dependencies
- `npm test` - Run all tests using Jest
- `npm test -- -t "testName"` - Run a specific test
- `node src/index.js --help` - Show CLI usage information
- `node src/index.js analyze "claim text"` - Test the analyze function

## Code Style Guidelines
- **Formatting**: Standard JS style
- **Imports**: Group imports by type (built-in, external, internal)
- **Types**: Use JSDoc comments for type documentation
- **Naming**: 
  - camelCase for variables and functions
  - PascalCase for classes
  - UPPER_SNAKE_CASE for constants
- **Error Handling**: Use try/catch with descriptive error messages
- **File Structure**: Follow the project structure outlined in specs
- **API Keys**: Store in .env file, never commit directly

## Architecture
- CLI-based tool using commander for command parsing
- Modular design with separate modules for analysis, parsing, etc.
- API integration with Project PQ and Google Gemini