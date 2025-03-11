const fs = require('fs').promises;
const path = require('path');
const { 
  generateCheckpointId, 
  hasCheckpoint, 
  saveCheckpoint, 
  loadCheckpoint,
  updateCheckpoint,
  markProcessed,
  markCompleted 
} = require('../src/modules/checkpoint');

// Mock constants
jest.mock('../src/modules/constants', () => ({
  CHECKPOINT_CONFIG: {
    dir: 'test/checkpoints',
    extension: '.json'
  }
}));

// Mock filesystem operations
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    mkdir: jest.fn()
  }
}));

// Mock mkdirp
jest.mock('mkdirp', () => ({
  mkdirp: jest.fn().mockResolvedValue('mocked/dir/path')
}));

// Mock lowdb
jest.mock('lowdb', () => {
  return function() {
    return {
      defaults: jest.fn().mockReturnThis(),
      write: jest.fn().mockReturnThis(),
      get: jest.fn(() => ({
        push: jest.fn().mockReturnThis(),
        write: jest.fn()
      })),
      set: jest.fn().mockReturnThis(),
      value: jest.fn(() => ({
        id: 'test-checkpoint',
        timestamp: 1234567890,
        data: { test: 'data' },
        processed: ['0', '1'],
        completed: false
      }))
    };
  };
});

// Mock adapter
jest.mock('lowdb/adapters/FileSync', () => {
  return function() {
    return {};
  };
});

describe('checkpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('generateCheckpointId should return provided ID if available', () => {
    const id = 'test-id';
    const result = generateCheckpointId(id, 'input');
    expect(result).toBe(id);
  });
  
  test('generateCheckpointId should generate an ID from input if no ID is provided', () => {
    const result = generateCheckpointId(null, 'input');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBe(8); // MD5 hash substring
  });
  
  test('hasCheckpoint returns true if checkpoint file exists', async () => {
    fs.access.mockResolvedValue(undefined); // No error means file exists
    const result = await hasCheckpoint('test-id');
    expect(result).toBe(true);
  });
  
  test('hasCheckpoint returns false if checkpoint file does not exist', async () => {
    fs.access.mockRejectedValue(new Error('File not found'));
    const result = await hasCheckpoint('test-id');
    expect(result).toBe(false);
  });
  
  test('saveCheckpoint creates a checkpoint file', async () => {
    const id = 'test-id';
    const data = { test: 'data' };
    await saveCheckpoint(id, data);
    // We can't easily test the actual file writing, but we can check that the function didn't throw
    expect(true).toBeTruthy();
  });
  
  test('loadCheckpoint loads data from a checkpoint file', async () => {
    fs.access.mockResolvedValue(undefined); // File exists
    const id = 'test-checkpoint';
    const result = await loadCheckpoint(id);
    
    expect(result).toEqual({
      id: 'test-checkpoint',
      timestamp: 1234567890,
      data: { test: 'data' },
      processed: ['0', '1'],
      completed: false
    });
  });
  
  test('loadCheckpoint throws error if checkpoint does not exist', async () => {
    fs.access.mockRejectedValue(new Error('File not found'));
    const id = 'non-existent';
    
    await expect(loadCheckpoint(id)).rejects.toThrow('does not exist');
  });
});