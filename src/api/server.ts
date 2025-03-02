
// Simple mock server implementation for handling API requests
class MockServer {
  private routes: Map<string, Map<string, Function>>;
  
  constructor() {
    this.routes = new Map();
  }
  
  get(path: string, handler: Function) {
    this.registerRoute('GET', path, handler);
  }
  
  post(path: string, handler: Function) {
    this.registerRoute('POST', path, handler);
  }
  
  private registerRoute(method: string, path: string, handler: Function) {
    if (!this.routes.has(method)) {
      this.routes.set(method, new Map());
    }
    this.routes.get(method)?.set(path, handler);
  }
  
  async handleRequest(method: string, path: string, body?: any) {
    const methodRoutes = this.routes.get(method);
    if (!methodRoutes) {
      return this.createResponse(404, { error: 'Method not supported' });
    }
    
    const handler = methodRoutes.get(path);
    if (!handler) {
      return this.createResponse(404, { error: 'Route not found' });
    }
    
    try {
      const req = { method, body };
      let responseData: any = null;
      
      const res = {
        status: (code: number) => ({
          json: (data: any) => {
            responseData = { status: code, data };
            return responseData;
          }
        }),
        json: (data: any) => {
          responseData = { status: 200, data };
          return responseData;
        }
      };
      
      await handler(req, res);
      return responseData;
    } catch (error) {
      console.error('Error handling request:', error);
      return this.createResponse(500, { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  private createResponse(status: number, data: any) {
    return { status, data };
  }
}

// Initialize server instance
export const server = new MockServer();

// Patch global fetch to intercept API calls to our mock server
const originalFetch = window.fetch;
window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  
  if (url.startsWith('/api/')) {
    const method = init?.method || 'GET';
    const body = init?.body instanceof FormData ? Object.fromEntries(init.body as any) : init?.body;
    
    const response = await server.handleRequest(method, url, body);
    
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.status === 200 ? 'OK' : 'Error',
      json: async () => response.data,
      text: async () => JSON.stringify(response.data)
    } as Response;
  }
  
  return originalFetch(input, init);
};
