interface McpToolResponse {
  content: {
    type: string;
    text: string;
  }[];
  isError?: boolean;
}

interface WebSocketError extends Event {
  code?: number;
  reason?: string;
}

declare global {
  interface Window {
    mcpTool: {
      use: (params: {
        serverName: string;
        toolName: string;
        arguments: Record<string, unknown>;
      }) => Promise<McpToolResponse>;
    };
  }
}

// MCPツールの初期化
export const initializeMcpTool = () => {
  if (!window.mcpTool) {
    let ws: WebSocket | null = null;
    const pendingRequests: Map<string, { 
      resolve: (value: McpToolResponse) => void;
      reject: (reason: unknown) => void;
    }> = new Map();

    const connectWebSocket = (): Promise<WebSocket> => {
      return new Promise((resolve, reject) => {
        if (ws?.readyState === WebSocket.OPEN) {
          resolve(ws);
          return;
        }

        ws = new WebSocket(import.meta.env.VITE_MCP_WS_URL || 'ws://localhost:3001');
        console.log('Connecting to WebSocket server...');
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          resolve(ws!);
        };

        ws.onerror = (event: WebSocketError) => {
          console.error('WebSocket error:', event);
          reject(new Error(`WebSocket connection failed: ${event.type}`));
        };

        ws.onclose = () => {
          console.log('WebSocket closed');
          ws = null;
        };

        ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            console.log('Received response:', response);
            
            // レスポンスを対応するリクエストに紐付ける
            const requestId = response.requestId;
            const pending = pendingRequests.get(requestId);
            if (pending) {
              pendingRequests.delete(requestId);
              pending.resolve(response);
            }
          } catch (error) {
            console.error('Error handling message:', error);
          }
        };
      });
    };

    window.mcpTool = {
      use: async (params) => {
        try {
          const socket = await connectWebSocket();
          
          return new Promise((resolve, reject) => {
            const requestId = Math.random().toString(36).substring(7);
            pendingRequests.set(requestId, { resolve, reject });

            const request = {
              type: 'call_tool',
              requestId,
              params
            };

            console.log('Sending request:', request);
            socket.send(JSON.stringify(request));

            // タイムアウト設定
            setTimeout(() => {
              pendingRequests.delete(requestId);
              reject(new Error('Request timeout'));
            }, 10000);
          });
        } catch (error) {
          console.error('MCP tool error:', error);
          throw error;
        }
      },
    };
  }
};