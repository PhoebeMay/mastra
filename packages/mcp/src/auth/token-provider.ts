/**
 * Simple token-based dynamic authentication for MCP
 */

export type TokenProvider = () => Promise<string> | string;
