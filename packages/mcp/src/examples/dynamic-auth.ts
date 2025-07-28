import { MCPClient } from '@mastra/mcp';

// Example: Simple token function
async function refreshMyToken(): Promise<string> {
  // Your token refresh logic here
  const response = await fetch('/api/refresh-token', {
    method: 'POST',
    // ... your refresh logic
  });
  const { token } = await response.json();
  return token;
}

// Example: Token function with caching
function createCachedTokenProvider(getToken: () => Promise<string>, refreshIntervalMs: number = 15 * 60 * 1000) {
  let cachedToken: string | null = null;
  let lastRefresh = 0;

  return async () => {
    const now = Date.now();
    if (!cachedToken || now - lastRefresh >= refreshIntervalMs) {
      cachedToken = await getToken();
      lastRefresh = now;
    }
    return cachedToken;
  };
}

const cachedTokenProvider = createCachedTokenProvider(refreshMyToken);

// Use with MCPClient
const mcp = new MCPClient({
  id: 'my-refreshable-client',
  servers: {
    myServer: {
      url: new URL('https://api.example.com/mcp'),
      authProvider: cachedTokenProvider, // Dynamic auth tokens!
    },
  },
});

// The client will automatically refresh tokens as needed
const tools = await mcp.getTools();
console.log('Available tools:', Object.keys(tools));

// Example with direct token function (no caching)
const directTokenMcp = new MCPClient({
  servers: {
    directServer: {
      url: new URL('https://api.example.com/mcp'),
      authProvider: refreshMyToken, // Direct function call each time
    },
  },
});

// Example with static headers for additional custom headers
const staticWithDynamicAuth = new MCPClient({
  servers: {
    hybridServer: {
      url: new URL('https://api.example.com/mcp'),
      authProvider: cachedTokenProvider,
      requestInit: {
        headers: {
          'X-Client-ID': 'my-client-id',
          'X-API-Version': '2024-01',
          // Authorization will be added dynamically by authProvider
        },
      },
    },
  },
});

export { mcp, directTokenMcp, staticWithDynamicAuth };
