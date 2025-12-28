/**
 * Google Sheets Helper Functions via Apps Script
 * Communicates with Google Apps Script Web App as database proxy
 */

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
const APPS_SCRIPT_API_KEY = process.env.APPS_SCRIPT_API_KEY;
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;

/**
 * Call Apps Script Web App
 */
async function callAppsScript(action, params) {
  if (!APPS_SCRIPT_URL || !APPS_SCRIPT_API_KEY) {
    throw new Error('Apps Script configuration missing. Set APPS_SCRIPT_URL and APPS_SCRIPT_API_KEY');
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: APPS_SCRIPT_API_KEY,
      spreadsheetId: GOOGLE_SHEETS_ID,
      action,
      ...params,
    }),
  });

  const text = await response.text();
  
  // Try to parse JSON
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error('Apps Script returned non-JSON:', text.substring(0, 200));
    throw new Error('Apps Script authorization required. Open the URL in browser first.');
  }

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Apps Script request failed');
  }

  return data.data;

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Apps Script request failed');
  }

  return data.data;
}

/**
 * Append a row to a sheet tab
 * @param {string} sheetName - Name of the sheet tab
 * @param {Object} data - Object with column names as keys
 * @returns {Promise<void>}
 */
async function appendRow(sheetName, data) {
  // Convert object to array of values
  const values = Object.values(data);
  
  return await callAppsScript('appendRow', {
    sheetName,
    values,
  });
}

/**
 * Find rows matching a filter condition
 * @param {string} sheetName - Name of the sheet tab
 * @param {Object} filter - Object with column names and values to match
 * @returns {Promise<Array<Object>>} Matching rows
 */
async function findRows(sheetName, filter = {}) {
  return await callAppsScript('findRows', {
    sheetName,
    filter,
  });
}

/**
 * Find a single row by a unique identifier
 * @param {string} sheetName - Name of the sheet tab
 * @param {string} idColumn - Column name for the ID
 * @param {string} idValue - Value to find
 * @returns {Promise<Object|null>} Found row or null
 */
async function findRowById(sheetName, idColumn, idValue) {
  const rows = await findRows(sheetName, { [idColumn]: idValue });
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Update a row by finding it via ID column
 * @param {string} sheetName - Name of the sheet tab
 * @param {string} idColumn - Column name for the ID
 * @param {string} idValue - Value to find
 * @param {Object} updates - Object with column names and new values
 * @returns {Promise<boolean>} True if updated, false if not found
 */
async function updateRow(sheetName, idColumn, idValue, updates) {
  const result = await callAppsScript('updateRow', {
    sheetName,
    filter: { [idColumn]: idValue },
    updates,
  });

  return result.rowsUpdated > 0;
}

/**
 * Delete a row by finding it via ID column
 * @param {string} sheetName - Name of the sheet tab
 * @param {string} idColumn - Column name for the ID
 * @param {string} idValue - Value to find
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteRow(sheetName, idColumn, idValue) {
  const result = await callAppsScript('deleteRow', {
    sheetName,
    filter: { [idColumn]: idValue },
  });

  return result.rowsDeleted > 0;
}

module.exports = {
  appendRow,
  findRows,
  findRowById,
  updateRow,
  deleteRow,
};
