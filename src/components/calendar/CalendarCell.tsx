import React from 'react';
import { cn } from '@/lib/utils';
import { Schedule, Task, TimeRecord } from '@/types';

interface CalendarCellProps {
  date: Date;
  isCurrentMonth: boolean;
  schedules: Schedule[];
  tasks: Task[];
  timeRecords: TimeRecord[];
  onClick: (date: Date | null) => void;
  onTaskClick: (date: Date | null) => void;
  onTimeRecordClick: (date: Date | null) => void;
  onHover: (date: Date, event: React.MouseEvent) => void;
  onHoverOut: () => void;
}

export const CalendarCell: React.FC<CalendarCellProps> = ({
  date,
  isCurrentMonth,
  schedules,
  tasks,
  timeRecords,
  onClick,
  onTaskClick,
  onTimeRecordClick,
  onHover,
  onHoverOut
}) => {
  const dayNumber = date.getDate();
  const dateStr = date.toISOString().split('T')[0];
  
  return (
    <div
      className={cn(
        "h-40 border rounded-lg p-2 hover:bg-muted/50 cursor-pointer overflow-auto",
        !isCurrentMonth && "opacity-30"
      )}
      onClick={() => isCurrentMonth && onClick(date)}
      onMouseEnter={(e) => isCurrentMonth && onHover(date, e)}
      onMouseLeave={() => isCurrentMonth && onHoverOut()}
    >
      {isCurrentMonth && (
        <div className="flex flex-col h-full">
          <span className="text-sm font-medium">{dayNumber}</span>
          <div className="mt-1 space-y-2">
            {/* スケジュール */}
            <div className="space-y-1">
              {schedules
                .filter(s => {
                  console.log('Filtering schedule:', {
                    schedule: s,
                    startTime: s.startTime,
                    dateStr,
                    comparison: new Date(s.startTime).toISOString().split('T')[0] === dateStr
                  });
                  const scheduleDate = new Date(s.startTime.replace('+09:00', ''));
                  return scheduleDate.toISOString().split('T')[0] === dateStr;
                })
                .map(schedule => (
                  <div
                    key={schedule.id}
                    className="text-xs bg-primary/10 text-primary rounded px-1 py-0.5 hover:bg-primary/30 transition-all duration-200 ease-in-out cursor-pointer"
                    title={`${schedule.title} (${schedule.startTime}-${schedule.endTime})${schedule.memo ? `\n\nメモ: ${schedule.memo}` : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick(date);
                    }}
                  >
                    <div className="flex justify-between gap-1">
                      <span className="truncate">{schedule.title}</span>
                      <span className="text-primary/70 whitespace-nowrap">
                        {schedule.startTime}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
            
            {/* タスク */}
            {tasks.filter(t => t.dueDate?.toISOString().split('T')[0] === dateStr).length > 0 && (
              <div
                className="text-xs bg-orange-100 text-orange-700 rounded px-1 py-0.5 cursor-pointer hover:bg-orange-200 transition-all duration-200 ease-in-out"
                title={tasks
                  .filter(t => t.dueDate?.toISOString().split('T')[0] === dateStr)
                  .map(t => `${t.title}${t.description ? `: ${t.description}` : ''} (進捗: ${t.progress}%)`)
                  .join('\n')}
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskClick(date);
                }}
              >
                タスク: {tasks.filter(t => t.dueDate?.toISOString().split('T')[0] === dateStr).length}件
              </div>
            )}

            {/* 勤怠記録 */}
            {timeRecords.filter(r => r.date.split('T')[0] === dateStr).length > 0 && (
              <div
                className="text-xs bg-blue-100 text-blue-700 rounded px-1 py-0.5 cursor-pointer hover:bg-blue-200 transition-all duration-200 ease-in-out"
                title={timeRecords
                  .filter(r => r.date.split('T')[0] === dateStr)
                  .map(r => {
                    const type = r.type === 'clockIn' ? '出勤'
                      : r.type === 'clockOut' ? '退勤'
                      : r.type === 'breakStart' ? '休憩開始'
                      : '休憩終了';
                    return `${type}: ${r.time}${r.is_night_shift ? ' (夜勤)' : ''}`;
                  })
                  .join('\n')}
                onClick={(e) => {
                  e.stopPropagation();
                  onTimeRecordClick(date);
                }}
              >
                勤怠: {timeRecords.filter(r => r.date.split('T')[0] === dateStr).length}件
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};