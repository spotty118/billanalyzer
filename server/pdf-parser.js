import * as pdfjsLib from 'pdfjs-dist';
import { fileURLToPath } from 'url';
import path from 'path';

// Set up the worker source
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.js');

const extractPdfText = async (buffer) => {
  try {
    // Load the PDF document
    const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
    
    let text = '';
    
    // Extract text from each page
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      text += strings.join(' ') + '\n';
    }
    
    return { text };
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

export { extractPdfText };
