interface Window {
  mcpTool: {
    use: (params: {
      serverName: string;
      toolName: string;
      arguments: Record<string, any>;
    }) => Promise<{
      content: {
        type: string;
        text: string;
      }[];
      isError?: boolean;
    }>;
  };
}