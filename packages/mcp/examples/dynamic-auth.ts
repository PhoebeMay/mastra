import { MCPClient, createBearerTokenProvider } from '@mastra/mcp';

// Example: Token that refreshes every 15 minutes
async function refreshMyToken(): Promise<string> {
  // Your token refresh logic here
  const response = await fetch('/api/refresh-token', {
    method: 'POST',
    // ... your refresh logic
  });
  const { token } = await response.json();
  return token;
}

// Create a dynamic token provider that refreshes every 15 minutes
const dynamicHeaderProvider = createBearerTokenProvider(
  refreshMyToken,
  15 * 60 * 1000, // 15 minutes
);

// Use with MCPClient
const mcp = new MCPClient({
  id: 'my-refreshable-client',
  servers: {
    myServer: {
      url: new URL('https://api.example.com/mcp'),
      headerProvider: dynamicHeaderProvider, // 🎉 Dynamic auth headers!
    },
  },
});

// The client will automatically refresh tokens as needed
const tools = await mcp.getTools();

// Example with custom headers
const customHeaderProvider = async () => {
  const token = await refreshMyToken();
  return {
    Authorization: `Bearer ${token}`,
    'X-Client-ID': 'my-client-id',
    'X-API-Version': '2024-01',
  };
};

const customMcp = new MCPClient({
  servers: {
    customServer: {
      url: new URL('https://api.example.com/mcp'),
      headerProvider: customHeaderProvider,
    },
  },
});

export { mcp, customMcp };
