import { useState } from 'react';

interface McpToolResponse {
  content: {
    type: string;
    text: string;
  }[];
  ok: boolean;
}

interface ToolState {
  loading: boolean;
  data: McpToolResponse | null;
  error: string | null;
}

interface Schedule {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  memo?: string;
  user_id: string;
}

interface ExecuteToolArgs {
  toolName: string;
  arguments: Record<string, string>;
}

interface SyncCalendarArgs {
  schedules: Schedule[];
  arguments: {
    syncMode: 'personal' | 'team';
    userId?: string;
  };
}

interface SyncSheetsArgs {
  schedules: Schedule[];
  arguments: {
    spreadsheetId: string;
    sheetRange: string;
  };
}

export const useMcpTool = () => {
  const [toolState, setToolState] = useState<ToolState>({ loading: false, data: null, error: null });
  const [pendingRequests, setPendingRequests] = useState<number>(0);

  const execute = async (args: ExecuteToolArgs): Promise<McpToolResponse> => {
    setPendingRequests((prev) => prev + 1);
    setToolState({ loading: true, data: null, error: null });

    try {
      const response = await window.mcpTool.use({
        serverName: 'supabase',
        methodName: 'execute',
        arguments: args.arguments,
        toolName: args.toolName,
      }) as McpToolResponse;

      if (!response.ok) {
        throw new Error(response.content[0]?.text || 'エラーが発生しました');
      }

      setToolState({ loading: false, data: response, error: null });
      return response;
    } catch (error: unknown) {
      console.error('Error invoking function:', error);
      const message = error instanceof Error ? error.message : 'エラーが発生しました';
      setToolState({ loading: false, data: null, error: message });
      throw error;
    } finally {
      setPendingRequests((prev) => Math.max(0, prev - 1));
    }
  };

  const syncWithGoogleCalendar = async (args: SyncCalendarArgs): Promise<McpToolResponse> => {
    setPendingRequests((prev) => prev + 1);
    setToolState({ loading: true, data: null, error: null });

    try {
      const response = await window.mcpTool.use({
        serverName: 'supabase',
        toolName: 'google_calendar',
        arguments: {
          schedules: JSON.stringify(args.schedules),
          ...args.arguments,
        },
      }) as McpToolResponse;

      if (!response.ok) {
        throw new Error(response.content[0]?.text || 'エラーが発生しました');
      }

      setToolState({ loading: false, data: response, error: null });
      return response;
    } catch (error: unknown) {
      console.error('Error syncing with Google Calendar:', error);
      const message = error instanceof Error ? error.message : 'エラーが発生しました';
      setToolState({ loading: false, data: null, error: message });
      throw error;
    } finally {
      setPendingRequests((prev) => Math.max(0, prev - 1));
    }
  };

  const syncWithGoogleSheets = async (args: SyncSheetsArgs): Promise<McpToolResponse> => {
    setPendingRequests((prev) => prev + 1);
    setToolState({ loading: true, data: null, error: null });

    try {
      const response = await window.mcpTool.use({
        serverName: 'supabase',
        toolName: 'google_sheets',
        arguments: {
          schedules: JSON.stringify(args.schedules),
          ...args.arguments,
        },
      }) as McpToolResponse;

      if (!response.ok) {
        throw new Error(response.content[0]?.text || 'エラーが発生しました');
      }

      setToolState({ loading: false, data: response, error: null });
      return response;
    } catch (error: unknown) {
      console.error('Error syncing with Google Sheets:', error);
      const message = error instanceof Error ? error.message : 'エラーが発生しました';
      setToolState({ loading: false, data: null, error: message });
      throw error;
    } finally {
      setPendingRequests((prev) => Math.max(0, prev - 1));
    }
  };

  return {
    execute,
    syncWithGoogleCalendar,
    syncWithGoogleSheets,
    toolState,
    pendingRequests,
  };
};