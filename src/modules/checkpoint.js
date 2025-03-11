const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { mkdirp } = require('mkdirp');
const { CHECKPOINT_CONFIG } = require('./constants');

/**
 * Ensures the checkpoint directory exists
 * @returns {Promise<void>}
 */
async function ensureCheckpointDir() {
  const dir = path.resolve(CHECKPOINT_CONFIG.dir);
  await mkdirp(dir);
  return dir;
}

/**
 * Generates a checkpoint ID from input if not provided
 * @param {string} id - Optional custom ID
 * @param {string} input - Input string to hash if ID not provided
 * @returns {string} - The checkpoint ID
 */
function generateCheckpointId(id, input) {
  if (id) {
    return id;
  }
  
  // Generate a hash of the input to use as the ID
  return crypto
    .createHash('md5')
    .update(input || Date.now().toString())
    .digest('hex')
    .substring(0, 8);
}

/**
 * Gets the full path for a checkpoint file
 * @param {string} id - The checkpoint ID
 * @returns {Promise<string>} - Full path to the checkpoint file
 */
async function getCheckpointPath(id) {
  const dir = await ensureCheckpointDir();
  return path.join(dir, `${id}${CHECKPOINT_CONFIG.extension}`);
}

/**
 * Checks if a checkpoint with the given ID exists
 * @param {string} id - The checkpoint ID to check
 * @returns {Promise<boolean>} - Whether the checkpoint exists
 */
async function hasCheckpoint(id) {
  if (!id) return false;
  
  try {
    const filePath = await getCheckpointPath(id);
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Saves checkpoint data to a file
 * @param {string} id - The checkpoint ID
 * @param {object} data - The data to save
 * @returns {Promise<void>}
 */
async function saveCheckpoint(id, data) {
  if (!id) {
    throw new Error('Checkpoint ID is required');
  }
  
  try {
    const filePath = await getCheckpointPath(id);
    const adapter = new FileSync(filePath);
    const db = low(adapter);
    
    // Initialize the db with the data structure we need
    db.defaults({ 
      id, 
      timestamp: Date.now(),
      data: {}, 
      processed: [],
      completed: false
    }).write();
    
    // Update with the new data
    db.set('data', data)
      .set('timestamp', Date.now())
      .write();
    
    console.log(`Checkpoint saved: ${id}`);
  } catch (error) {
    console.error(`Error saving checkpoint: ${error.message}`);
    throw new Error(`Failed to save checkpoint: ${error.message}`);
  }
}

/**
 * Updates a specific field in the checkpoint
 * @param {string} id - The checkpoint ID
 * @param {string} field - The field to update
 * @param {any} value - The new value
 * @returns {Promise<void>}
 */
async function updateCheckpoint(id, field, value) {
  if (!id) {
    throw new Error('Checkpoint ID is required');
  }
  
  try {
    const filePath = await getCheckpointPath(id);
    const adapter = new FileSync(filePath);
    const db = low(adapter);
    
    db.set(field, value)
      .set('timestamp', Date.now())
      .write();
  } catch (error) {
    console.error(`Error updating checkpoint: ${error.message}`);
    throw new Error(`Failed to update checkpoint: ${error.message}`);
  }
}

/**
 * Loads checkpoint data from a file
 * @param {string} id - The checkpoint ID
 * @returns {Promise<object>} - The loaded checkpoint data
 */
async function loadCheckpoint(id) {
  if (!id) {
    throw new Error('Checkpoint ID is required');
  }
  
  try {
    const exists = await hasCheckpoint(id);
    if (!exists) {
      throw new Error(`Checkpoint '${id}' does not exist`);
    }
    
    const filePath = await getCheckpointPath(id);
    const adapter = new FileSync(filePath);
    const db = low(adapter);
    
    console.log(`Checkpoint loaded: ${id}`);
    return db.value();
  } catch (error) {
    console.error(`Error loading checkpoint: ${error.message}`);
    throw new Error(`Failed to load checkpoint: ${error.message}`);
  }
}

/**
 * Marks an item as processed in the checkpoint
 * @param {string} id - The checkpoint ID
 * @param {string} itemId - The ID of the processed item
 * @returns {Promise<void>}
 */
async function markProcessed(id, itemId) {
  if (!id || !itemId) {
    throw new Error('Checkpoint ID and item ID are required');
  }
  
  try {
    const filePath = await getCheckpointPath(id);
    const adapter = new FileSync(filePath);
    const db = low(adapter);
    
    const processed = db.get('processed').value() || [];
    
    if (!processed.includes(itemId)) {
      db.get('processed').push(itemId).write();
      db.set('timestamp', Date.now()).write();
    }
  } catch (error) {
    console.error(`Error marking item as processed: ${error.message}`);
    // Don't throw here, just log the error
  }
}

/**
 * Marks the checkpoint as completed
 * @param {string} id - The checkpoint ID
 * @returns {Promise<void>}
 */
async function markCompleted(id) {
  if (!id) {
    throw new Error('Checkpoint ID is required');
  }
  
  try {
    await updateCheckpoint(id, 'completed', true);
    console.log(`Checkpoint marked as completed: ${id}`);
  } catch (error) {
    console.error(`Error marking checkpoint as completed: ${error.message}`);
    // Don't throw here, just log the error
  }
}

module.exports = {
  generateCheckpointId,
  hasCheckpoint,
  saveCheckpoint,
  loadCheckpoint,
  updateCheckpoint,
  markProcessed,
  markCompleted
};