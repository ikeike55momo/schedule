import React from 'react';
import { ChevronLeft, ChevronRight, FileText, Trash2, User2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Schedule, Task, TimeRecord } from '@/types';
import { CalendarCell } from './CalendarCell.tsx';

interface CalendarViewProps {
  currentMonth: Date;
  schedules: Schedule[];
  tasks: Task[];
  timeRecords: TimeRecord[];
  viewMode: 'personal' | 'team';
  selectedDate: Date | null;
  isLoading?: boolean;
  onDateClick: (date: Date | null) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onViewModeChange: (mode: 'personal' | 'team') => void;
  onAddSchedule: () => Promise<void>;
  onEditSchedule: (scheduleId: string) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onAddTask: () => void;
  onAddTimeRecord: (isNightShift: boolean) => void;
  onDeleteTimeRecord: (recordId: string) => void;
  scheduleTitle: string;
  onScheduleTitleChange: (value: string) => void;
  scheduleStartTime: string;
  onScheduleStartTimeChange: (value: string) => void;
  scheduleEndTime: string;
  onScheduleEndTimeChange: (value: string) => void;
  scheduleMemo: string;
  onScheduleMemoChange: (value: string) => void;
  newTaskTitle: string;
  onNewTaskTitleChange: (value: string) => void;
  newTaskDescription: string;
  onNewTaskDescriptionChange: (value: string) => void;
  newTaskProgress: number;
  onNewTaskProgressChange: (value: number) => void;
  selectedTime: string;
  onSelectedTimeChange: (value: string) => void;
  selectedRecordType: TimeRecord['type'];
  onSelectedRecordTypeChange: (value: TimeRecord['type']) => void;
  onDateHover: (date: Date, event: React.MouseEvent) => void;
  onDateHoverOut: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentMonth,
  schedules,
  tasks,
  timeRecords,
  viewMode,
  selectedDate,
  isLoading = false,
  onDateClick,
  onPrevMonth,
  onNextMonth,
  onViewModeChange,
  onAddSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onAddTask,
  onAddTimeRecord,
  onDeleteTimeRecord,
  scheduleTitle,
  onScheduleTitleChange,
  scheduleStartTime,
  onScheduleStartTimeChange,
  scheduleEndTime,
  onScheduleEndTimeChange,
  scheduleMemo,
  onScheduleMemoChange,
  newTaskTitle,
  onNewTaskTitleChange,
  newTaskDescription,
  onNewTaskDescriptionChange,
  newTaskProgress,
  onNewTaskProgressChange,
  selectedTime,
  onSelectedTimeChange,
  selectedRecordType,
  onSelectedRecordTypeChange,
  onDateHover,
  onDateHoverOut,
}) => {
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant={viewMode === 'personal' ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange('personal')}
        >
          <User2 className="w-4 h-4 mr-2" />
          個人
        </Button>
        <Button
          variant={viewMode === 'team' ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange('team')}
        >
          <Users className="w-4 h-4 mr-2" />
          チーム
        </Button>
      </div>

      {/* カレンダーヘッダー */}
      <div className="grid grid-cols-7 gap-4">
        {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
          <div key={day} className="text-center font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-4">
        {Array.from({ length: 42 }).map((_, index) => {
          const dayNumber = index - firstDayOfMonth + 1;
          const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
          
          return (
            <CalendarCell
              key={index}
              date={date}
              isCurrentMonth={isCurrentMonth}
              schedules={schedules}
              tasks={tasks}
              timeRecords={timeRecords}
              onClick={onDateClick}
              onTaskClick={onDateClick}
              onTimeRecordClick={onDateClick}
              onHover={onDateHover}
              onHoverOut={onDateHoverOut}
            />
          );
        })}
      </div>

      {/* 日付選択モーダル */}
      {selectedDate && (
        <Dialog open onOpenChange={() => onDateClick(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
              </DialogTitle>
              <DialogDescription>
                スケジュール、タスク、勤怠情報の追加・編集ができます
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="schedule">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="schedule">スケジュール</TabsTrigger>
                <TabsTrigger value="task">タスク</TabsTrigger>
                <TabsTrigger value="attendance">勤怠</TabsTrigger>
              </TabsList>
              <TabsContent value="schedule" className="space-y-4">
                {selectedDate && schedules
                  .filter(s => {
                    // startTimeから日付部分を抽出して比較
                    const scheduleDate = s.startTime.split(' ')[0];
                    const selectedDateStr = selectedDate?.toISOString().split('T')[0];
                    console.log('Comparing dates:', { scheduleDate, selectedDateStr });
                    return scheduleDate === selectedDateStr;
                  })
                  .map(schedule => (
                    <Card key={schedule.id} className="p-4 mb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{schedule.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {schedule.startTime} - {schedule.endTime}
                          </p>
                          {schedule.memo && (
                            <p className="text-sm mt-2">{schedule.memo}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onEditSchedule(schedule.id)}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => onDeleteSchedule(schedule.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!scheduleTitle || !scheduleStartTime || !scheduleEndTime) {
                    return;
                  }
                  if (scheduleStartTime >= scheduleEndTime) {
                    return;
                  }
                  try {
                    await onAddSchedule();
                  } catch (error) {
                    console.error('Form submission error:', error);
                  }
                }}>
                  <div className="space-y-2">
                    <Label>タイトル</Label>
                    <Input
                      value={scheduleTitle}
                      onChange={(e) => onScheduleTitleChange(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>時間</Label>
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        className="flex-1"
                        value={scheduleStartTime}
                        onChange={(e) => onScheduleStartTimeChange(e.target.value)}
                        required
                      />
                      <span className="flex items-center">-</span>
                      <Input
                        type="time"
                        className="flex-1"
                        value={scheduleEndTime}
                        onChange={(e) => onScheduleEndTimeChange(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>メモ</Label>
                    <Textarea
                      value={scheduleMemo}
                      onChange={(e) => onScheduleMemoChange(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full mt-4"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      'スケジュールを追加中...'
                    ) : (
                      'スケジュールを追加'
                    )}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="task" className="space-y-4">
                <div className="space-y-2">
                  <Label>タスク名</Label>
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => onNewTaskTitleChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>進捗状況 ({newTaskProgress}%)</Label>
                  <Slider
                    value={[newTaskProgress]}
                    onValueChange={(value) => onNewTaskProgressChange(value[0])}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>詳細</Label>
                  <Textarea
                    value={newTaskDescription}
                    onChange={(e) => onNewTaskDescriptionChange(e.target.value)}
                  />
                </div>
                <Button onClick={onAddTask} className="w-full">
                  タスクを追加
                </Button>
              </TabsContent>
              <TabsContent value="attendance" className="space-y-4">
                <div className="space-y-2">
                  <Label>時刻</Label>
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => onSelectedTimeChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>種別</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={selectedRecordType}
                    onChange={(e) => onSelectedRecordTypeChange(e.target.value as TimeRecord['type'])}
                  >
                    <option value="clockIn">出勤</option>
                    <option value="clockOut">退勤</option>
                    <option value="breakStart">休憩開始</option>
                    <option value="breakEnd">休憩終了</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <Button onClick={() => onAddTimeRecord(false)} className="w-full">
                    記録
                  </Button>
                  
                  {/* 既存の記録一覧 */}
                  {selectedDate && timeRecords
                    .filter(record => record.date.split('T')[0] === selectedDate.toISOString().split('T')[0])
                    .map(record => (
                      <Card key={record.id} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{record.time}</div>
                            <div className="text-sm text-muted-foreground">
                              {record.type === 'clockIn' && '出勤'}
                              {record.type === 'clockOut' && '退勤'}
                              {record.type === 'breakStart' && '休憩開始'}
                              {record.type === 'breakEnd' && '休憩終了'}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => onDeleteTimeRecord(record.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};