// Mock the makeGeminiRequest function
jest.mock('../src/modules/utils', () => ({
  makeGeminiRequest: jest.fn()
}));

const { assessConflictRisk, generateRiskSummary } = require('../src/modules/riskAssessment');
const { makeGeminiRequest } = require('../src/modules/utils');
const { AnalysisSummary } = require('../src/modules/dataTypes');

describe('riskAssessment', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    makeGeminiRequest.mockClear();
  });
  
  describe('assessConflictRisk', () => {
    test('should assess risk for each patent', async () => {
      // Mock patents
      const patents = [
        {
          patentNumber: 'US123456A',
          title: 'Test Patent 1',
          abstract: 'This is a test abstract.'
        },
        {
          patentNumber: 'US654321B',
          title: 'Test Patent 2',
          abstract: 'Another test abstract.'
        }
      ];
      
      // Mock Gemini response
      const mockGeminiResponse = JSON.stringify({
        patentAssessments: [
          {
            index: 0,
            patentNumber: 'US123456A',
            riskScore: 7,
            explanation: 'High overlap in core methodology.'
          },
          {
            index: 1,
            patentNumber: 'US654321B',
            riskScore: 3,
            explanation: 'Low overlap in key areas.'
          }
        ]
      });
      
      makeGeminiRequest.mockResolvedValue(mockGeminiResponse);
      
      const claimText = 'A method for doing something.';
      const result = await assessConflictRisk(claimText, patents);
      
      // Check that Gemini API was called
      expect(makeGeminiRequest).toHaveBeenCalledTimes(1);
      
      // Check that risk assessment was added to patents
      expect(result[0].conflictRisk).toBe(7);
      expect(result[0].conflictComment).toBe('High overlap in core methodology.');
      expect(result[1].conflictRisk).toBe(3);
      expect(result[1].conflictComment).toBe('Low overlap in key areas.');
    });
    
    test('should handle empty patent array', async () => {
      const patents = [];
      
      const result = await assessConflictRisk('Test claim', patents);
      
      // Should not call Gemini API
      expect(makeGeminiRequest).not.toHaveBeenCalled();
      
      // Should return empty array
      expect(result).toEqual([]);
    });
    
    test('should handle API errors gracefully', async () => {
      const patents = [
        {
          patentNumber: 'US123456A',
          title: 'Test Patent',
          abstract: 'Test abstract'
        }
      ];
      
      // Mock Gemini API error
      makeGeminiRequest.mockRejectedValue(new Error('API error'));
      
      const result = await assessConflictRisk('Test claim', patents);
      
      // Should return patents without risk data
      expect(result).toEqual(patents);
    });
  });
  
  describe('generateRiskSummary', () => {
    test('should generate summary statistics', () => {
      const patents = [
        {
          patentNumber: 'US123456A',
          title: 'High Risk Patent',
          conflictRisk: 8,
          conflictComment: 'High risk explanation'
        },
        {
          patentNumber: 'US234567B',
          title: 'Medium Risk Patent',
          conflictRisk: 5,
          conflictComment: 'Medium risk explanation'
        },
        {
          patentNumber: 'US345678C',
          title: 'Low Risk Patent',
          conflictRisk: 2,
          conflictComment: 'Low risk explanation'
        }
      ];
      
      const summary = generateRiskSummary(patents);
      
      // Check summary properties
      expect(summary).toBeInstanceOf(AnalysisSummary);
      expect(summary.totalPatentsAnalyzed).toBe(3);
      expect(summary.highRiskPatents.length).toBe(1);
      expect(summary.mediumRiskPatents.length).toBe(1);
      expect(summary.lowRiskPatents.length).toBe(1);
      expect(summary.averageRiskScore).toBe(5);
      expect(summary.highestRiskPatent).toEqual(patents[0]);
      expect(summary.overallRiskAssessment).toContain('HIGH RISK');
    });
    
    test('should handle patents without risk assessment', () => {
      const patents = [
        {
          patentNumber: 'US123456A',
          title: 'Patent without risk data'
        }
      ];
      
      const summary = generateRiskSummary(patents);
      
      // Check summary properties
      expect(summary.totalPatentsAnalyzed).toBe(0);
      expect(summary.highRiskPatents.length).toBe(0);
      expect(summary.mediumRiskPatents.length).toBe(0);
      expect(summary.lowRiskPatents.length).toBe(0);
      expect(summary.overallRiskAssessment).toContain('No patents were assessed');
    });
  });
});