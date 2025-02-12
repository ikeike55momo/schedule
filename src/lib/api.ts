import { supabase } from './supabaseClient';

export async function checkAllowedUser(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('allowed_users')
      .select('email')
      .eq('email', email)
      .single();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking allowed user:', error);
    return false;
  }
}
import { toast } from 'sonner';

export interface TimeRecord {
  id: string;
  created_at: string;
  date: string;
  type: 'clockIn' | 'clockOut' | 'breakStart' | 'breakEnd';
  time: string;
  is_night_shift: boolean;
  user_id: string;
}

export const loadTimeRecords = async (userId: string): Promise<TimeRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('time_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    toast.error('勤怠記録の読み込みに失敗しました');
    console.error('Error loading time records:', error);
    return [];
  }
};

export const addTimeRecord = async ({
  userId,
  date,
  type,
  time,
  is_night_shift
}: {
  userId: string;
  date: string;
  type: 'clockIn' | 'clockOut' | 'breakStart' | 'breakEnd';
  time: string;
  is_night_shift: boolean;
}) => {
  try {
    const { data: newRecord, error } = await supabase
      .from('time_records')
      .insert({
        date,
        type,
        time,
        is_night_shift,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;

    const typeText = {
      clockIn: '出勤',
      clockOut: '退勤',
      breakStart: '休憩開始',
      breakEnd: '休憩終了'
    }[type];

    toast.success('勤怠を記録しました', {
      description: `${typeText} - ${new Date(newRecord.date).toLocaleDateString()} ${newRecord.time}${is_night_shift ? ' (夜勤)' : ''}`
    });

    return newRecord;
  } catch (error) {
    toast.error('勤怠の記録に失敗しました');
    console.error('Error adding time record:', error);
    throw error;
  }
};

export const deleteTimeRecord = async ({
  userId,
  recordId,
  date,
  time
}: {
  userId: string;
  recordId: string;
  date: string;
  time: string;
}) => {
  try {
    const { error } = await supabase
      .from('time_records')
      .delete()
      .eq('id', recordId)
      .eq('user_id', userId);

    if (error) throw error;

    toast.success('勤怠記録を削除しました', {
      description: `${new Date(date).toLocaleDateString()} ${time}`
    });
  } catch (error) {
    toast.error('勤怠記録の削除に失敗しました');
    console.error('Error deleting time record:', error);
    throw error;
  }
};