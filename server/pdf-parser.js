import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

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
