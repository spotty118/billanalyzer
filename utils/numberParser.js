/**
 * Utility functions for parsing numbers reliably from various string formats
 */

/**
 * Parses a string into a number, handling different formats
 * @param {string} value - The string to parse
 * @returns {number|null} - The parsed number or null if invalid
 */
function parseNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // If already a number, return it
  if (typeof value === 'number') {
    return value;
  }
  
  // Convert to string if not already
  const stringValue = String(value);
  
  // Remove all non-numeric characters except decimal point and minus sign
  // First handle special case of negative numbers with parentheses like (123.45)
  let cleanedValue = stringValue;
  if (cleanedValue.startsWith('(') && cleanedValue.endsWith(')')) {
    cleanedValue = '-' + cleanedValue.slice(1, -1);
  }
  
  // Remove currency symbols, thousand separators and other non-numeric chars
  // Keep decimal points and minus signs
  cleanedValue = cleanedValue.replace(/[^\d.-]/g, '');
  
  // Handle multiple decimal points (take the first one)
  const parts = cleanedValue.split('.');
  if (parts.length > 2) {
    cleanedValue = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Parse the cleaned string
  const result = parseFloat(cleanedValue);
  
  return isNaN(result) ? null : result;
}

/**
 * Formats a number as currency
 * @param {number} value - The number to format
 * @param {string} locale - The locale to use (default: 'en-US')
 * @param {string} currency - The currency code (default: 'USD')
 * @returns {string} - Formatted currency string
 */
function formatCurrency(value, locale = 'en-US', currency = 'USD') {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(value);
}

module.exports = {
  parseNumber,
  formatCurrency
};
