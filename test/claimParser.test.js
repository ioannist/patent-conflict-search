// Mock the makeGeminiRequest function
jest.mock('../src/modules/utils', () => ({
  makeGeminiRequest: jest.fn()
}));

const { parseClaim } = require('../src/modules/claimParser');
const { makeGeminiRequest } = require('../src/modules/utils');
const { ClaimAnalysis } = require('../src/modules/dataTypes');

describe('claimParser', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    makeGeminiRequest.mockClear();
  });
  
  test('parseClaim should correctly parse a claim', async () => {
    // Mock Gemini response
    const mockGeminiResponse = JSON.stringify({
      keywords: ['computer', 'method', 'data', 'processing'],
      concepts: ['machine learning', 'artificial intelligence'],
      cpcClasses: ['G06F16/00', 'G06N20/00'],
      ipcClasses: ['G06F', 'G06N']
    });
    
    makeGeminiRequest.mockResolvedValue(mockGeminiResponse);
    
    const claim = 'A computer-implemented method for data processing.';
    const result = await parseClaim(claim, true);
    
    // Check that the Gemini API was called with the correct prompt
    expect(makeGeminiRequest).toHaveBeenCalledTimes(1);
    expect(makeGeminiRequest.mock.calls[0][0]).toContain(claim);
    
    // Check that the result is a ClaimAnalysis object with the correct properties
    expect(result).toBeInstanceOf(ClaimAnalysis);
    expect(result.claimText).toBe(claim);
    expect(result.independent).toBe(true);
    expect(result.keywords).toEqual(['computer', 'method', 'data', 'processing']);
    expect(result.concepts).toEqual(['machine learning', 'artificial intelligence']);
    expect(result.cpcClasses).toEqual(['G06F16/00', 'G06N20/00']);
    expect(result.ipcClasses).toEqual(['G06F', 'G06N']);
    expect(result.geminiAnalysis).toBe(mockGeminiResponse);
  });
  
  test('parseClaim should handle Gemini response that is not valid JSON', async () => {
    // Mock Gemini response with some text before and after the JSON
    const mockGeminiResponse = `
    Here's my analysis:
    {
      "keywords": ["computer", "method"],
      "concepts": ["machine learning"],
      "cpcClasses": ["G06F16/00"],
      "ipcClasses": ["G06F"]
    }
    Let me know if you need anything else.
    `;
    
    makeGeminiRequest.mockResolvedValue(mockGeminiResponse);
    
    const claim = 'A computer-implemented method.';
    const result = await parseClaim(claim, true);
    
    // Check that the result is parsed correctly despite the extra text
    expect(result).toBeInstanceOf(ClaimAnalysis);
    expect(result.keywords).toEqual(['computer', 'method']);
    expect(result.concepts).toEqual(['machine learning']);
    expect(result.cpcClasses).toEqual(['G06F16/00']);
    expect(result.ipcClasses).toEqual(['G06F']);
  });
  
  test('parseClaim should handle API errors', async () => {
    // Mock Gemini API error
    makeGeminiRequest.mockRejectedValue(new Error('API error'));
    
    const claim = 'A computer-implemented method.';
    
    // The function should throw an error
    await expect(parseClaim(claim, true)).rejects.toThrow('Failed to parse claim');
  });
});