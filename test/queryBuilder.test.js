const { buildQuery } = require('../src/modules/queryBuilder');
const { ClaimAnalysis, SearchQuery } = require('../src/modules/dataTypes');

// Mock the formatDateRange function
jest.mock('../src/modules/utils', () => ({
  formatDateRange: jest.fn(dateRange => dateRange)
}));

describe('queryBuilder', () => {
  test('buildQuery should build a query with all fields', () => {
    // Create a claim analysis with all fields populated
    const analysis = new ClaimAnalysis();
    analysis.claimText = 'A computer-implemented method for data processing.';
    analysis.independent = true;
    analysis.keywords = ['computer', 'method', 'data', 'processing'];
    analysis.concepts = ['machine learning', 'artificial intelligence'];
    analysis.cpcClasses = ['G06F16/00', 'G06N20/00'];
    analysis.ipcClasses = ['G06F', 'G06N'];
    
    const dateRange = 'last_5_years';
    const result = buildQuery(analysis, dateRange);
    
    // Check that the result is a SearchQuery object
    expect(result).toBeInstanceOf(SearchQuery);
    
    // Check that the query includes keywords
    expect(result.query).toContain('ABST/"computer"');
    expect(result.query).toContain('ABST/"method"');
    expect(result.query).toContain('ABST/"data"');
    expect(result.query).toContain('ABST/"processing"');
    
    // Check that the query includes concepts
    expect(result.query).toContain('ABST/"machine learning"');
    expect(result.query).toContain('ABST/"artificial intelligence"');
    expect(result.query).toContain('TTL/"machine learning"');
    expect(result.query).toContain('TTL/"artificial intelligence"');
    
    // Check that the query includes CPC classes
    expect(result.query).toContain('CPC/G06F16/00');
    expect(result.query).toContain('CPC/G06N20/00');
    
    // Check that the query includes IPC classes
    expect(result.query).toContain('IPC/G06F');
    expect(result.query).toContain('IPC/G06N');
    
    // Check that the query includes the date range
    expect(result.query).toContain(dateRange);
  });
  
  test('buildQuery should handle missing fields', () => {
    // Create a claim analysis with only keywords
    const analysis = new ClaimAnalysis();
    analysis.claimText = 'A computer-implemented method.';
    analysis.independent = true;
    analysis.keywords = ['computer', 'method'];
    
    const result = buildQuery(analysis);
    
    // Check that the result is a SearchQuery object
    expect(result).toBeInstanceOf(SearchQuery);
    
    // Check that the query includes keywords
    expect(result.query).toContain('ABST/"computer"');
    expect(result.query).toContain('ABST/"method"');
    
    // Check that the query doesn't include other fields
    expect(result.query).not.toContain('TTL/');
    expect(result.query).not.toContain('CPC/');
    expect(result.query).not.toContain('IPC/');
  });
  
  test('buildQuery should handle empty claim analysis', () => {
    // Create an empty claim analysis
    const analysis = new ClaimAnalysis();
    
    const result = buildQuery(analysis);
    
    // Check that the result is a SearchQuery object with an empty query
    expect(result).toBeInstanceOf(SearchQuery);
    expect(result.query).toBe('');
  });
});