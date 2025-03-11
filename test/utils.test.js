const fs = require('fs').promises;
const path = require('path');
const { formatDateRange, readClaimFromFile } = require('../src/modules/utils');

// Mock fs.promises.readFile
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn()
  }
}));

describe('utils', () => {
  describe('formatDateRange', () => {
    test('should return date range as is if it is already in PQ format', () => {
      const dateRange = '[2020-01-01 TO 2020-12-31]';
      expect(formatDateRange(dateRange)).toBe(dateRange);
    });
    
    test('should return date range as is if it is a named range', () => {
      const dateRange = 'last_5_years';
      expect(formatDateRange(dateRange)).toBe(dateRange);
    });
    
    test('should format date range to PQ format if it is not in PQ format', () => {
      const dateRange = '2020-01-01 TO 2020-12-31';
      expect(formatDateRange(dateRange)).toBe('[2020-01-01 TO 2020-12-31]');
    });
  });
  
  describe('readClaimFromFile', () => {
    beforeEach(() => {
      // Clear mock calls between tests
      fs.readFile.mockClear();
    });
    
    test('should read claim from file and trim whitespace', async () => {
      const filePath = 'claim.txt';
      const fileContent = '  A computer-implemented method.  \n\n';
      
      fs.readFile.mockResolvedValue(fileContent);
      
      const result = await readClaimFromFile(filePath);
      
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.readFile.mock.calls[0][0]).toContain(filePath);
      expect(fs.readFile.mock.calls[0][1]).toBe('utf8');
      
      expect(result).toBe('A computer-implemented method.');
    });
    
    test('should throw an error if file cannot be read', async () => {
      const filePath = 'nonexistent.txt';
      const errorMessage = 'ENOENT: no such file or directory';
      
      fs.readFile.mockRejectedValue(new Error(errorMessage));
      
      await expect(readClaimFromFile(filePath)).rejects.toThrow('Failed to read claim file');
    });
  });
});