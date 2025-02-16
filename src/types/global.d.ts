interface Window {
  mcpTool: {
    use: (params: {
      serverName: string;
      toolName: string;
      arguments: Record<string, unknown>;
    }) => Promise<McpToolResponse>;
  };
}