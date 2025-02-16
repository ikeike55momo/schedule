import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListTodo, Users, Book, FileText, Settings as SettingsIcon, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tasks } from './pages/Tasks';
import { Attendance } from './pages/Attendance';
import { Knowledge } from './pages/Knowledge';
import { Documents } from './pages/Documents';
import { Settings } from './pages/Settings';
import { supabase } from './lib/supabaseClient';
import { toast } from 'sonner';

export function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<'tasks' | 'attendance' | 'knowledge' | 'documents' | 'settings'>('tasks');

  // -------------------- ログアウト --------------------
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('ログアウトしました');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('ログアウトに失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* サイドバー */}
        <aside className={cn(
          "h-screen bg-card border-r transition-all",
          isSidebarCollapsed ? "w-16" : "w-64"
        )}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              {!isSidebarCollapsed && <h2 className="text-lg font-semibold">Team Schedule</h2>}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                >
                  {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="p-4 space-y-4">
              <Button
                variant={activeView === 'tasks' ? "secondary" : "ghost"}
                className={cn("w-full justify-start gap-2", isSidebarCollapsed && "justify-center px-0")}
                onClick={() => setActiveView('tasks')}
              >
                <ListTodo className="w-4 h-4" /> {!isSidebarCollapsed && "タスク管理"}
              </Button>
              <Button
                variant={activeView === 'attendance' ? "secondary" : "ghost"}
                className={cn("w-full justify-start gap-2", isSidebarCollapsed && "justify-center px-0")}
                onClick={() => setActiveView('attendance')}
              >
                <Users className="w-4 h-4" /> {!isSidebarCollapsed && "勤怠管理"}
              </Button>
              <Button
                variant={activeView === 'knowledge' ? "secondary" : "ghost"}
                className={cn("w-full justify-start gap-2", isSidebarCollapsed && "justify-center px-0")}
                onClick={() => setActiveView('knowledge')}
              >
                <Book className="w-4 h-4" /> {!isSidebarCollapsed && "ナレッジ"}
              </Button>
              <Button
                variant={activeView === 'documents' ? "secondary" : "ghost"}
                className={cn("w-full justify-start gap-2", isSidebarCollapsed && "justify-center px-0")}
                onClick={() => setActiveView('documents')}
              >
                <FileText className="w-4 h-4" /> {!isSidebarCollapsed && "文書管理"}
              </Button>
              <Button
                variant={activeView === 'settings' ? "secondary" : "ghost"}
                className={cn("w-full justify-start gap-2", isSidebarCollapsed && "justify-center px-0")}
                onClick={() => setActiveView('settings')}
              >
                <SettingsIcon className="w-4 h-4" /> {!isSidebarCollapsed && "設定"}
              </Button>
            </div>
          </ScrollArea>
        </aside>

        {/* メインコンテンツ */}
        <main className="flex-1 p-6">
          {activeView === 'tasks' && <Tasks />}
          {activeView === 'attendance' && <Attendance />}
          {activeView === 'knowledge' && <Knowledge />}
          {activeView === 'documents' && <Documents />}
          {activeView === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}
