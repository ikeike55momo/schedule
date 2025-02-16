import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Clock, UserCheck, UserMinus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface AttendanceRecord {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  date: string;
}

export function Attendance() {
  const [date, setDate] = useState<Date>(new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    checkCurrentStatus();
    fetchRecords();
  }, []);

  const checkCurrentStatus = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', session.session?.user.id)
        .is('clock_out', null)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') throw error;
        setIsWorking(false);
        setCurrentRecord(null);
      } else {
        setIsWorking(true);
        setCurrentRecord(data);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error('状態の確認に失敗しました');
    }
  };

  const fetchRecords = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', session.session?.user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('記録の取得に失敗しました');
    }
  };

  const handleClockIn = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session) {
        toast.error('ログインが必要です');
        return;
      }

      const now = new Date();
      const { data, error } = await supabase
        .from('attendance')
        .insert([
          {
            user_id: session.session?.user.id,
            clock_in: now.toISOString(),
            date: now.toISOString().split('T')[0],
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setIsWorking(true);
      setCurrentRecord(data);
      toast.success('出勤を記録しました');
      fetchRecords();
    } catch (error) {
      console.error('Error clocking in:', error);
      toast.error('出勤の記録に失敗しました');
    }
  };

  const handleClockOut = async () => {
    if (!currentRecord) return;

    try {
      const now = new Date();
      const { error } = await supabase
        .from('attendance')
        .update({ clock_out: now.toISOString() })
        .eq('id', currentRecord.id);

      if (error) throw error;

      setIsWorking(false);
      setCurrentRecord(null);
      toast.success('退勤を記録しました');
      fetchRecords();
    } catch (error) {
      console.error('Error clocking out:', error);
      toast.error('退勤の記録に失敗しました');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">勤怠管理</h1>
        <Button
          onClick={isWorking ? handleClockOut : handleClockIn}
          variant={isWorking ? "destructive" : "default"}
        >
          {isWorking ? (
            <>
              <UserMinus className="w-4 h-4 mr-2" />
              退勤
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4 mr-2" />
              出勤
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* カレンダー */}
        <Card className="p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => date && setDate(date)}
            className="rounded-md border"
          />
        </Card>

        {/* 勤怠記録 */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">本日の記録</h2>
          {currentRecord ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>出勤: {new Date(currentRecord.clock_in).toLocaleTimeString()}</span>
              </div>
              {currentRecord.clock_out && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>退勤: {new Date(currentRecord.clock_out).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">記録なし</p>
          )}
        </Card>
      </div>

      {/* 勤怠履歴 */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">勤怠履歴</h2>
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="flex justify-between items-center p-2 border-b">
              <div className="space-y-1">
                <div className="font-medium">{record.date}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(record.clock_in).toLocaleTimeString()} -{' '}
                  {record.clock_out
                    ? new Date(record.clock_out).toLocaleTimeString()
                    : '記録なし'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
