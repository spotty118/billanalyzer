
declare module 'pdf-parse' {
  interface PDFParseResult {
    text: string;
    numpages: number;
    info: any;
    metadata: any;
    version: string;
  }

  function PDFParse(dataBuffer: Buffer): Promise<PDFParseResult>;
  
  export = PDFParse;
}
