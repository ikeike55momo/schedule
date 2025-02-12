import { useState } from 'react';

interface McpToolResponse {
  content: {
    type: string;
    text: string;
  }[];
  isError?: boolean;
}

export const useMcpTool = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncWithGoogleCalendar = async (schedules: any[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await window.mcpTool.use({
        serverName: 'google',
        toolName: 'sync_calendar',
        arguments: {
          schedules
        }
      }) as McpToolResponse;

      if (response.isError) {
        console.error('Calendar sync error response:', response);
        throw new Error(response.content[0]?.text || '同期に失敗しました');
      }

      return response;
    } catch (err) {
      console.error('Calendar sync error details:', err);
      const message = err instanceof Error ? err.message : '同期中にエラーが発生しました';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const syncWithGoogleSheets = async (schedules: any[], spreadsheetId: string, range: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await window.mcpTool.use({
        serverName: 'google',
        toolName: 'sync_spreadsheet',
        arguments: {
          schedules,
          spreadsheetId,
          range
        }
      }) as McpToolResponse;

      if (response.isError) {
        console.error('Sync error response:', response);
        throw new Error(response.content[0]?.text || '同期に失敗しました');
      }

      return response;
    } catch (err) {
      console.error('Sync error details:', err);
      const message = err instanceof Error ? err.message : '同期中にエラーが発生しました';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    syncWithGoogleCalendar,
    syncWithGoogleSheets,
    isLoading,
    error
  };
};