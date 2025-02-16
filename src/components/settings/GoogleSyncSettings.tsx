import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useMcpTool } from '@/hooks/useMcpTool';
import { toast } from 'sonner';

interface GoogleSyncSettingsProps {
  schedules: Array<{
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    memo?: string;
    user_id: string;
  }>;
  currentUserId: string;
  isAdmin: boolean;
}

export const GoogleSyncSettings = ({ schedules, currentUserId, isAdmin }: GoogleSyncSettingsProps) => {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetRange, setSheetRange] = useState('シート1!A:E');
  const [syncMode, setSyncMode] = useState<'personal' | 'team'>('personal');
  const { syncWithGoogleSheets, syncWithGoogleCalendar } = useMcpTool();

  const handleSyncToSheets = async () => {
    if (!spreadsheetId) {
      toast.error('スプレッドシートIDを入力してください');
      return;
    }

    try {
      await syncWithGoogleSheets({
        schedules,
        arguments: {
          spreadsheetId,
          sheetRange,
        },
      });
      toast.success('スプレッドシートに同期しました');
    } catch (error) {
      console.error('Spreadsheet sync error:', error);
      toast.error('スプレッドシートとの同期に失敗しました', {
        description: error instanceof Error ? error.message : undefined
      });
    }
  };

  const handleGoogleCalendarSync = async () => {
    try {
      const schedulesToSync = syncMode === 'personal'
        ? schedules.filter(s => s.user_id === currentUserId)
        : schedules;

      await syncWithGoogleCalendar({
        schedules: schedulesToSync,
        arguments: {
          syncMode,
          userId: syncMode === 'personal' ? currentUserId : undefined,
        },
      });
      toast.success(`${syncMode === 'personal' ? '個人' : 'チーム全体'}の予定をGoogle Calendarに同期しました`);
    } catch (error) {
      console.error('Calendar sync error:', error);
      toast.error('Google Calendarとの同期に失敗しました', {
        description: error instanceof Error ? error.message : undefined
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Google Calendar連携</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>同期モード</Label>
            <div className="flex gap-4">
              <Button
                variant={syncMode === 'personal' ? 'secondary' : 'ghost'}
                onClick={() => setSyncMode('personal')}
              >
                個人の予定
              </Button>
              <Button
                variant={syncMode === 'team' ? 'secondary' : 'ghost'}
                onClick={() => setSyncMode('team')}
              >
                チーム全体の予定
              </Button>
            </div>
          </div>
          <Button
            onClick={handleGoogleCalendarSync}
            className="w-full"
          >
            Google Calendarに同期
          </Button>
        </div>
      </Card>

      {isAdmin && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">スプレッドシート連携</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>スプレッドシートID</Label>
              <Input
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="スプレッドシートのURLからIDをコピー"
              />
              <p className="text-sm text-muted-foreground">
                例: https://docs.google.com/spreadsheets/d/[スプレッドシートID]/edit
              </p>
            </div>
            <div className="space-y-2">
              <Label>シート範囲</Label>
              <Input
                value={sheetRange}
                onChange={(e) => setSheetRange(e.target.value)}
                placeholder="例: シート1!A:E"
              />
            </div>
            <Button
              onClick={handleSyncToSheets}
              className="w-full"
            >
              スプレッドシートに同期
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};