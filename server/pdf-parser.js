const extractPdfText = async (buffer) => {
  try {
    console.log('Starting PDF text extraction...');
    
    // Use pdf-to-markdown tool from markdownify-mcp server
    const result = await use_mcp_tool({
      serverName: "github.com/zcaceres/markdownify-mcp",
      toolName: "pdf-to-markdown",
      arguments: { filepath: buffer.toString('base64') }
    });

    if (result.error) {
      throw new Error(result.error);
    }

    // Convert markdown to plain text while preserving structure
    const text = result.markdown
      .replace(/^#+\s+/gm, '')           // Remove headers
      .replace(/\*\*/g, '')              // Remove bold
      .replace(/\*/g, '')                // Remove italic
      .replace(/`/g, '')                 // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Replace links with text
      .replace(/\n{3,}/g, '\n\n')        // Normalize line breaks
      .trim();

    console.log('Extracted text from PDF:');
    console.log(text.slice(0, 500) + '...'); // Log first 500 chars
    console.log('\nExtracted markdown from PDF:');
    console.log(result.markdown.slice(0, 500) + '...'); // Log first 500 chars

    return { text, markdown: result.markdown };
  } catch (error) {
    console.error('Error in PDF extraction:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

async function use_mcp_tool({ serverName, toolName, arguments: args }) {
  try {
    const result = await fetch(`http://localhost:1337/tool/${toolName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serverName: serverName,
        toolName: toolName,
        arguments: args,
      }),
    });

    const data = await result.json();
    if (data.error) {
      return { error: data.error };
    }
    return data;
  } catch (error) {
    console.error(`Error calling ${toolName} tool on ${serverName}:`, error);
    return { error: error.message };
  }
}

export { extractPdfText };
