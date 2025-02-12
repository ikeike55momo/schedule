import React, { useState, useEffect } from 'react';
import {
  Calendar,
  User2,
  ClipboardList,
  Plus,
  Check,
  Clock,
  Trash2,
  LogOut,
  Book,
  FileText,
  PanelLeftClose,
  PanelLeft,
  Shield,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import Login from './components/auth/Login';
import { Toaster, toast } from 'sonner';
import { TimeRecord, addTimeRecord, deleteTimeRecord, loadTimeRecords } from './lib/api';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { CalendarView } from '@/components/calendar/CalendarView';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { useMcpTool } from './hooks/useMcpTool';
import { GoogleSyncSettings } from './components/settings/GoogleSyncSettings';

// 型定義
interface Schedule {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  memo: string;
  date: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  progress: number;
  dueDate: Date | null;
  completed: boolean;
}

function App() {
  // state の定義
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeView, setActiveView] = useState<'calendar' | 'tasks' | 'attendance' | 'knowledge' | 'documents' | 'admin' | 'settings'>('calendar');
  const [isAdmin, setIsAdmin] = useState(false);

  // 管理者権限のチェック
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      setIsAdmin(!!admin);
    };

    checkAdminStatus();
  }, []);
  const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskProgress, setNewTaskProgress] = useState(0);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [selectedRecordDate, setSelectedRecordDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedRecordType, setSelectedRecordType] = useState<TimeRecord['type']>('clockIn');
  const [session, setSession] = useState<Session | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleStartTime, setScheduleStartTime] = useState('');
  const [scheduleEndTime, setScheduleEndTime] = useState('');
  const [scheduleMemo, setScheduleMemo] = useState('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // ホバー用 state（ホバーモーダル表示用）
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      toast.success('ログアウトしました');
    } catch (error) {
      toast.error('ログアウトに失敗しました', {
        description: error instanceof Error ? error.message : '不明なエラー'
      });
    }
  };

  // セッションおよび初期データ読み込み
  const loadSchedules = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSchedules(data.map(schedule => {
        console.log('Processing schedule:', schedule);
        
        // 日付と時刻を分離
        const [startDate, startTime] = schedule.start_time.split(' ');
        const [, endTime] = schedule.end_time.split(' ');
        
        return {
          id: schedule.id,
          title: schedule.title,
          startTime: startTime.substring(0, 5), // HH:mm形式に変換
          endTime: endTime.substring(0, 5), // HH:mm形式に変換
          memo: schedule.notes || '',
          date: startDate
        };
      }));
    } catch (error) {
      toast.error('スケジュールの読み込みに失敗しました');
      console.error('Error loading schedules:', error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadTasks(session.user.id);
        loadTimeRecordsData(session.user.id);
        loadSchedules(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadTasks(session.user.id);
        loadTimeRecordsData(session.user.id);
        loadSchedules(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadTimeRecordsData = async (userId: string) => {
    const records = await loadTimeRecords(userId);
    setTimeRecords(records);
  };

  const loadTasks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      toast.error('タスクの読み込みに失敗しました');
      console.error('Error loading tasks:', error);
    }
  };

  // カレンダー関連
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      const existingSchedules = schedules.filter(s => s.date === dateStr);
      if (existingSchedules.length > 0) {
        const schedule = existingSchedules[0];
        setScheduleTitle(schedule.title);
        setScheduleStartTime(schedule.startTime);
        setScheduleEndTime(schedule.endTime);
        setScheduleMemo(schedule.memo);
      } else {
        // 新規作成時は入力をクリア
        setScheduleTitle('');
        setScheduleStartTime('');
        setScheduleEndTime('');
        setScheduleMemo('');
      }
    }
  };

  const { isLoading: isSyncing } = useMcpTool();
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);

  const handleAddSchedule = async () => {
    console.log('handleAddSchedule start');
    if (!session?.user) {
      toast.error('ログインが必要です');
      return;
    }

    if (!selectedDate || !scheduleTitle || !scheduleStartTime || !scheduleEndTime) {
      toast.error('必須項目を入力してください');
      return;
    }

    try {
      setIsAddingSchedule(true);
      console.log('Creating schedule data');

      // 日付と時刻を結合
      const scheduleData = {
        title: scheduleTitle,
        start_time: `${selectedDate.toISOString().split('T')[0]} ${scheduleStartTime}:00`,
        end_time: `${selectedDate.toISOString().split('T')[0]} ${scheduleEndTime}:00`,
        notes: scheduleMemo,
        user_id: session.user.id
      };

      console.log('Creating schedule:', scheduleData);

      console.log('Attempting to insert schedule:', {
        ...scheduleData,
        start_time_parsed: new Date(scheduleData.start_time).toLocaleString(),
        end_time_parsed: new Date(scheduleData.end_time).toLocaleString()
      });

      const { data: newSchedule, error } = await supabase
        .from('schedules')
        .insert(scheduleData)
        .select()
        .single();

      console.log('Supabase response:', { newSchedule, error });

      if (error) {
        console.error('Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (!newSchedule) {
        console.error('No schedule data returned');
        throw new Error('スケジュールの作成に失敗しました');
      }

      console.log('Schedule created successfully:', newSchedule);

      const addedSchedule = {
        id: newSchedule.id,
        title: newSchedule.title,
        startTime: new Date(newSchedule.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        endTime: new Date(newSchedule.end_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        memo: newSchedule.notes || '',
        date: new Date(newSchedule.start_time).toISOString().split('T')[0]
      };

      console.log('Updating state with new schedule');
      setSchedules(prevSchedules => [...prevSchedules, addedSchedule]);
      toast.success('スケジュールを追加しました');

      // フォームをリセット
      setSelectedDate(null);
      setScheduleTitle('');
      setScheduleStartTime('');
      setScheduleEndTime('');
      setScheduleMemo('');

      console.log('Schedule add completed');
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error(error instanceof Error ? error.message : 'スケジュールの追加に失敗しました');
    } finally {
      console.log('Setting isAddingSchedule to false');
      setIsAddingSchedule(false);
    }
  };

  const handleEditSchedule = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
      setScheduleTitle(schedule.title);
      setScheduleStartTime(schedule.startTime);
      setScheduleEndTime(schedule.endTime);
      setScheduleMemo(schedule.memo);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!session?.user) return;
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId)
        .eq('user_id', session.user.id);

      if (error) throw error;
      setSchedules(schedules.filter(s => s.id !== scheduleId));
      toast.success('スケジュールを削除しました');
    } catch (error) {
      toast.error('スケジュールの削除に失敗しました');
      console.error('Error deleting schedule:', error);
    }
  };

  // タスク管理関連
  const handleAddTask = async () => {
    if (!session?.user) return;
    if (newTaskTitle.trim()) {
      try {
        const { data: newTask, error } = await supabase
          .from('tasks')
          .insert({
            title: newTaskTitle,
            description: newTaskDescription,
            progress: newTaskProgress,
            due_date: selectedDate?.toISOString(),
            completed: false,
            user_id: session.user.id
          })
          .select()
          .single();
        if (error) throw error;
        setTasks([...tasks, newTask]);
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskProgress(0);
        toast.success('タスクを追加しました', {
          description: newTask.title
        });
      } catch (error) {
        toast.error('タスクの追加に失敗しました');
        console.error('Error adding task:', error);
      }
    } else {
      toast.error('タスク名を入力してください');
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !session?.user) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId)
        .eq('user_id', session.user.id);
      if (error) throw error;
      setTasks(tasks.map(t => {
        if (t.id === taskId) {
          const updated = { ...t, completed: !t.completed };
          toast.success(
            updated.completed ? 'タスクを完了しました' : 'タスクを未完了に戻しました',
            { description: t.title }
          );
          return updated;
        }
        return t;
      }));
    } catch (error) {
      toast.error('タスクの更新に失敗しました');
      console.error('Error updating task:', error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !session?.user) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', session.user.id);
      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('タスクを削除しました', {
        description: task.title
      });
    } catch (error) {
      toast.error('タスクの削除に失敗しました');
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdateProgress = async (taskId: string, newProgress: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !session?.user) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ progress: newProgress })
        .eq('id', taskId)
        .eq('user_id', session.user.id);
      if (error) throw error;
      setTasks(tasks.map(t => {
        if (t.id === taskId) {
          const updated = { ...t, progress: newProgress };
          if (newProgress === 100 && !t.completed) {
            toast.success('タスクの進捗が100%になりました', {
              description: t.title
            });
          }
          return updated;
        }
        return t;
      }));
    } catch (error) {
      toast.error('タスクの更新に失敗しました');
      console.error('Error updating task:', error);
    }
  };

  // 勤怠管理関連
  const handleAddTimeRecord = async (is_night_shift: boolean = false) => {
    if (!session?.user) return;
    if (selectedTime) {
      try {
        const newRecord = await addTimeRecord({
          userId: session.user.id,
          date: selectedRecordDate.toISOString(),
          type: selectedRecordType,
          time: selectedTime,
          is_night_shift
        });
        setTimeRecords([...timeRecords, newRecord]);
        setSelectedTime('');
      } catch (error) {
        // API側でエラー処理済み
      }
    } else {
      toast.error('時刻を入力してください');
    }
  };

  const handleDeleteTimeRecord = async (recordId: string) => {
    if (!session?.user) return;
    const record = timeRecords.find(r => r.id === recordId);
    if (record) {
      try {
        await deleteTimeRecord({
          userId: session.user.id,
          recordId,
          date: record.date,
          time: record.time
        });
        setTimeRecords(timeRecords.filter(r => r.id !== recordId));
      } catch (error) {
        // API側でエラー処理済み
      }
    }
  };

  // ホバーイベント用コールバック（CalendarView 内の各セルで呼び出す前提）
  const handleDateHover = (date: Date, event: React.MouseEvent) => {
    setHoveredDate(date);
    setHoveredPosition({ x: event.clientX, y: event.clientY });
  };

  const handleDateHoverOut = () => {
    setHoveredDate(null);
  };

  // マウスムーブでホバー位置を更新（ホバー中のみ）
  const handleMouseMove = (e: React.MouseEvent) => {
    if (hoveredDate) {
      setHoveredPosition({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    // 最上位コンテナに relative と onMouseMove を設定
    <div className="flex h-screen relative" onMouseMove={handleMouseMove}>
      {!session ? (
        <div className="flex-1 flex items-center justify-center">
          <Login />
        </div>
      ) : (
        <>
          {/* サイドバー */}
          <div
            className={cn(
              "border-r bg-background transition-all duration-300",
              isSidebarCollapsed ? "w-16" : "w-64"
            )}
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                {!isSidebarCollapsed && (
                  <h2 className="text-lg font-semibold">Team Schedule</h2>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  >
                    {isSidebarCollapsed ? (
                      <PanelLeft className="w-4 h-4" />
                    ) : (
                      <PanelLeftClose className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-80px)]">
              <div className="p-4 space-y-4">
                <Button
                  variant={activeView === 'calendar' ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    isSidebarCollapsed && "justify-center px-0"
                  )}
                  onClick={() => setActiveView('calendar')}
                >
                  <Calendar className="w-4 h-4" />
                  {!isSidebarCollapsed && "カレンダー"}
                </Button>
                <Button
                  variant={activeView === 'tasks' ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    isSidebarCollapsed && "justify-center px-0"
                  )}
                  onClick={() => setActiveView('tasks')}
                >
                  <ClipboardList className="w-4 h-4" />
                  {!isSidebarCollapsed && "タスク管理"}
                </Button>
                <Button
                  variant={activeView === 'attendance' ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    isSidebarCollapsed && "justify-center px-0"
                  )}
                  onClick={() => setActiveView('attendance')}
                >
                  <User2 className="w-4 h-4" />
                  {!isSidebarCollapsed && "勤怠管理"}
                </Button>
                <Button
                  variant={activeView === 'knowledge' ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    isSidebarCollapsed && "justify-center px-0"
                  )}
                  onClick={() => setActiveView('knowledge')}
                >
                  <Book className="w-4 h-4" />
                  {!isSidebarCollapsed && "ナレッジ"}
                </Button>
                <Button
                  variant={activeView === 'documents' ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    isSidebarCollapsed && "justify-center px-0"
                  )}
                  onClick={() => setActiveView('documents')}
                >
                  <FileText className="w-4 h-4" />
                  {!isSidebarCollapsed && "ドキュメント"}
                </Button>
                <Button
                  variant={activeView === 'settings' ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    isSidebarCollapsed && "justify-center px-0"
                  )}
                  onClick={() => setActiveView('settings')}
                >
                  <Settings className="w-4 h-4" />
                  {!isSidebarCollapsed && "連携設定"}
                </Button>
                {isAdmin && (
                  <Button
                    variant={activeView === 'admin' ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2",
                      isSidebarCollapsed && "justify-center px-0"
                    )}
                    onClick={() => setActiveView('admin')}
                  >
                    <Shield className="w-4 h-4" />
                    {!isSidebarCollapsed && "管理者設定"}
                  </Button>
                )}
                <Separator />
              </div>
            </ScrollArea>
          </div>

          {/* メインコンテンツ */}
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              {activeView === 'calendar' && (
                <>
                  <CalendarView
                    currentMonth={currentMonth}
                    schedules={schedules}
                    tasks={tasks}
                    timeRecords={timeRecords}
                    viewMode={viewMode}
                    selectedDate={selectedDate}
                    isLoading={isAddingSchedule || isSyncing}
                    onDateClick={handleDateClick}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    onViewModeChange={setViewMode}
                    onAddSchedule={handleAddSchedule}
                    onEditSchedule={handleEditSchedule}
                    onDeleteSchedule={handleDeleteSchedule}
                    onAddTask={handleAddTask}
                    onAddTimeRecord={handleAddTimeRecord}
                    onDeleteTimeRecord={handleDeleteTimeRecord}
                    scheduleTitle={scheduleTitle}
                    onScheduleTitleChange={setScheduleTitle}
                    scheduleStartTime={scheduleStartTime}
                    onScheduleStartTimeChange={setScheduleStartTime}
                    scheduleEndTime={scheduleEndTime}
                    onScheduleEndTimeChange={setScheduleEndTime}
                    scheduleMemo={scheduleMemo}
                    onScheduleMemoChange={setScheduleMemo}
                    newTaskTitle={newTaskTitle}
                    onNewTaskTitleChange={setNewTaskTitle}
                    newTaskDescription={newTaskDescription}
                    onNewTaskDescriptionChange={setNewTaskDescription}
                    newTaskProgress={newTaskProgress}
                    onNewTaskProgressChange={setNewTaskProgress}
                    selectedTime={selectedTime}
                    onSelectedTimeChange={setSelectedTime}
                    selectedRecordType={selectedRecordType}
                    onSelectedRecordTypeChange={setSelectedRecordType}
                    // CalendarView 内の各セルでホバー時にこれらのコールバックを呼ぶ前提
                    onDateHover={handleDateHover}
                    onDateHoverOut={handleDateHoverOut}
                  />

                  {/* ホバーモーダル：大きめサイズ（幅 320px、padding 24px） */}
                  {hoveredDate && (
                    <div
                      className="absolute z-50 bg-white p-6 border rounded-lg shadow-2xl min-w-[320px] max-w-[480px]"
                      style={{ top: hoveredPosition.y + 20, left: hoveredPosition.x + 20 }}
                      onMouseEnter={() => {}}
                      onMouseLeave={handleDateHoverOut}
                    >
                      <h3 className="font-bold text-lg mb-3">
                        {hoveredDate.toLocaleDateString()}
                      </h3>
                      <div className="mb-3">
                        <h4 className="text-base font-semibold">スケジュール</h4>
                        {schedules
                          .filter(s => s.date === hoveredDate.toISOString().split('T')[0])
                          .map(schedule => (
                            <div key={schedule.id} className="text-sm p-1 hover:bg-gray-50 rounded">
                              <div className="font-medium">{schedule.title}</div>
                              <div className="text-gray-600">{schedule.startTime} - {schedule.endTime}</div>
                              {schedule.memo && (
                                <div className="text-gray-500 mt-1">{schedule.memo}</div>
                              )}
                            </div>
                          ))}
                        {schedules.filter(s => s.date === hoveredDate.toISOString().split('T')[0]).length === 0 && (
                          <div className="text-sm text-gray-500">予定はありません</div>
                        )}
                      </div>
                      <div className="mb-3">
                        <h4 className="text-base font-semibold">タスク</h4>
                        {tasks
                          .filter(task => task.dueDate && task.dueDate.toISOString().split('T')[0] === hoveredDate.toISOString().split('T')[0])
                          .map(task => (
                            <div key={task.id} className="text-sm p-1 hover:bg-gray-50 rounded">
                              <div className="font-medium">{task.title}</div>
                              <div className="text-gray-600">進捗: {task.progress}%</div>
                              {task.description && (
                                <div className="text-gray-500 mt-1">{task.description}</div>
                              )}
                            </div>
                          ))}
                        {tasks.filter(task => task.dueDate && task.dueDate.toISOString().split('T')[0] === hoveredDate.toISOString().split('T')[0]).length === 0 && (
                          <div className="text-sm text-gray-500">タスクはありません</div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-base font-semibold">タイムスタンプ</h4>
                        {timeRecords
                          .filter(record => record.date.split('T')[0] === hoveredDate.toISOString().split('T')[0])
                          .map(record => (
                            <div key={record.id} className="text-sm p-1 hover:bg-gray-50 rounded">
                              <div className="font-medium">
                                {record.time}{" "}
                                {record.type === 'clockIn'
                                  ? '出勤'
                                  : record.type === 'clockOut'
                                  ? '退勤'
                                  : record.type === 'breakStart'
                                  ? '休憩開始'
                                  : '休憩終了'}
                              </div>
                              {record.is_night_shift && (
                                <div className="text-gray-500">夜勤</div>
                              )}
                            </div>
                          ))}
                        {timeRecords.filter(record => record.date.split('T')[0] === hoveredDate.toISOString().split('T')[0]).length === 0 && (
                          <div className="text-sm text-gray-500">記録はありません</div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeView === 'tasks' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">タスク一覧</h1>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          新規タスク
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>新規タスク作成</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>タスク名</Label>
                            <Input
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>詳細</Label>
                            <Textarea
                              value={newTaskDescription}
                              onChange={(e) => setNewTaskDescription(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>進捗状況 ({newTaskProgress}%)</Label>
                            <Slider
                              value={[newTaskProgress]}
                              onValueChange={(value) => setNewTaskProgress(value[0])}
                              max={100}
                              step={10}
                              className="w-full"
                            />
                          </div>
                          <Button onClick={handleAddTask} className="w-full">
                            タスクを追加
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid gap-4">
                    {tasks.map((task) => (
                      <Card key={task.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className={cn(task.completed && "bg-primary text-primary-foreground")}
                              onClick={() => handleTaskComplete(task.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <div>
                              <h3 className={cn("font-medium", task.completed && "line-through text-muted-foreground")}>
                                {task.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-32">
                              <Slider
                                value={[task.progress]}
                                onValueChange={(value) => handleUpdateProgress(task.id, value[0])}
                                max={100}
                                step={10}
                                className="w-full"
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-12">
                              {task.progress}%
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleTaskDelete(task.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeView === 'attendance' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">勤怠管理</h1>
                  </div>

                  <Tabs defaultValue="day">
                    <TabsList>
                      <TabsTrigger value="day">日勤</TabsTrigger>
                      <TabsTrigger value="night">夜勤</TabsTrigger>
                    </TabsList>
                    <TabsContent value="day" className="space-y-4">
                      <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                          <Label>日付</Label>
                          <Input
                            type="date"
                            value={selectedRecordDate.toISOString().split('T')[0]}
                            onChange={(e) => setSelectedRecordDate(new Date(e.target.value))}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>時刻</Label>
                          <Input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>種別</Label>
                          <select
                            className="w-full px-3 py-2 border rounded-md"
                            value={selectedRecordType}
                            onChange={(e) => setSelectedRecordType(e.target.value as TimeRecord['type'])}
                          >
                            <option value="clockIn">出勤</option>
                            <option value="clockOut">退勤</option>
                            <option value="breakStart">休憩開始</option>
                            <option value="breakEnd">休憩終了</option>
                          </select>
                        </div>
                        <Button onClick={() => handleAddTimeRecord(false)}>
                          記録
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="night" className="space-y-4">
                      <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                          <Label>日付</Label>
                          <Input
                            type="date"
                            value={selectedRecordDate.toISOString().split('T')[0]}
                            onChange={(e) => setSelectedRecordDate(new Date(e.target.value))}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>時刻</Label>
                          <Input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>種別</Label>
                          <select
                            className="w-full px-3 py-2 border rounded-md"
                            value={selectedRecordType}
                            onChange={(e) => setSelectedRecordType(e.target.value as TimeRecord['type'])}
                          >
                            <option value="clockIn">出勤</option>
                            <option value="clockOut">退勤</option>
                            <option value="breakStart">休憩開始</option>
                            <option value="breakEnd">休憩終了</option>
                          </select>
                        </div>
                        <Button onClick={() => handleAddTimeRecord(true)}>
                          記録
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">記録一覧</h2>
                    <div className="grid gap-4">
                      {timeRecords
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((record) => (
                          <Card key={record.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">
                                    {new Date(record.date).toLocaleDateString()} {record.time}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {record.type === 'clockIn' && '出勤'}
                                    {record.type === 'clockOut' && '退勤'}
                                    {record.type === 'breakStart' && '休憩開始'}
                                    {record.type === 'breakEnd' && '休憩終了'}
                                    {record.is_night_shift && ' (夜勤)'}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteTimeRecord(record.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {activeView === 'knowledge' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">ナレッジ</h1>
                  </div>
                  <Card className="p-4">
                    <p>ナレッジ管理機能は開発中です。</p>
                  </Card>
                </div>
              )}

              {activeView === 'documents' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">ドキュメント</h1>
                  </div>
                  <Card className="p-4">
                    <p>ドキュメント管理機能は開発中です。</p>
                  </Card>
                </div>
              )}

              {activeView === 'admin' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">管理者設定</h1>
                  </div>
                  <AdminPanel />
                </div>
              )}

              {activeView === 'settings' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">連携設定</h1>
                  </div>
                  <GoogleSyncSettings
                    schedules={schedules.map(s => ({
                      ...s,
                      user_id: session?.user?.id || ''
                    }))}
                    currentUserId={session?.user?.id || ''}
                    isAdmin={isAdmin}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
      <Toaster richColors position="top-right" />
    </div>
  );
}

export default App;
