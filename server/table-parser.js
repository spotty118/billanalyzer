// Helper functions for parsing tables in markdown/text content

function parseMarkdownTable(text) {
  const tables = [];
  let currentTable = null;
  let headers = null;
  
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('|')) {
      // Start new table if not already in one
      if (!currentTable) {
        currentTable = [];
        headers = line.split('|')
          .map(cell => cell.trim())
          .filter(Boolean);
        continue;
      }
      
      // Skip separator row
      if (line.includes('---')) continue;
      
      // Process table row
      const cells = line.split('|')
        .map(cell => cell.trim())
        .filter(Boolean);
      
      if (cells.length) {
        const row = {};
        cells.forEach((cell, index) => {
          if (headers && headers[index]) {
            row[headers[index].toLowerCase()] = cell;
          }
        });
        currentTable.push(row);
      }
    } else if (currentTable) {
      // End of table
      if (currentTable.length > 0) {
        tables.push({
          headers: headers,
          rows: currentTable
        });
      }
      currentTable = null;
      headers = null;
    }
  }
  
  // Add final table if exists
  if (currentTable && currentTable.length > 0) {
    tables.push({
      headers: headers,
      rows: currentTable
    });
  }
  
  return tables;
}

function findTablesWithPrices(text) {
  const tables = parseMarkdownTable(text);
  const pricePattern = /\$\s*-?\d+\.\d{2}/;
  
  return tables.filter(table => {
    // Check if any header suggests price content
    const hasPriceHeader = table.headers.some(header => 
      /price|amount|charge|fee|cost|total|payment/i.test(header)
    );
    
    // Check if any row contains prices
    const hasPrice = table.rows.some(row =>
      Object.values(row).some(cell => pricePattern.test(cell))
    );
    
    return hasPriceHeader || hasPrice;
  });
}

function categorizeTable(headers) {
  // Check for common table types in Verizon bills
  const patterns = {
    lineCharges: /line|phone|device|equipment/i,
    planCharges: /plan|service|subscription/i,
    taxes: /tax|fee|surcharge/i,
    usage: /usage|data|minutes|texts/i,
    summary: /summary|total|balance/i
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (headers.some(header => pattern.test(header))) {
      return type;
    }
  }
  
  return 'other';
}

function extractChargesFromTable(table) {
  const tableType = categorizeTable(table.headers);
  console.log('Table type:', tableType);
  const charges = [];
  const pricePattern = /\$\s*(-?\d+\.\d{2})/;
  
  // Try to identify description and amount columns
  const descriptionCol = table.headers.find(header => 
    /description|item|service|charge|details/i.test(header)
  );
  
  const amountCol = table.headers.find(header => 
    /amount|price|charge|cost|total/i.test(header)
  );
  
  table.rows.forEach(row => {
    let description = '';
    let amount = null;
    
    // If we found specific columns, use them
    if (descriptionCol && amountCol) {
      description = row[descriptionCol.toLowerCase()];
      const amountMatch = row[amountCol.toLowerCase()].match(pricePattern);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1]);
      }
    } else {
      // Otherwise check all cells for price pattern
      Object.entries(row).forEach(([header, value]) => {
        const priceMatch = value.match(pricePattern);
        if (priceMatch) {
          amount = parseFloat(priceMatch[1]);
        } else if (!description) {
          description = value;
        }
      });
    }
    
    if (description && amount !== null) {
      charges.push({
        description: description.trim(),
        amount,
        source: 'table',
        tableType,
        hasTotal: /total|subtotal/i.test(description)
      });
    }
  });
  
  return charges;
}

export { parseMarkdownTable, findTablesWithPrices, extractChargesFromTable };
