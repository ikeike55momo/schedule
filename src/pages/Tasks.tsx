import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  progress: number;
  completed: boolean;
}

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    progress: 0,
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('タスクの取得に失敗しました');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: newTask.title,
            description: newTask.description,
            progress: newTask.progress,
            completed: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setTasks([data, ...tasks]);
      setNewTask({ title: '', description: '', progress: 0 });
      toast.success('タスクを追加しました');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('タスクの追加に失敗しました');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, completed: true } : task
      ));
      toast.success('タスクを完了しました');
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('タスクの完了に失敗しました');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.filter(task => task.id !== taskId));
      toast.success('タスクを削除しました');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('タスクの削除に失敗しました');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">タスク管理</h1>
        <Button onClick={handleAddTask}>
          <Plus className="w-4 h-4 mr-2" />
          新規タスク
        </Button>
      </div>

      {/* 新規タスク入力フォーム */}
      <Card className="p-4 space-y-4">
        <Input
          placeholder="タスクのタイトル"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
        />
        <Textarea
          placeholder="タスクの説明"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
        />
        <div className="flex items-center gap-4">
          <span className="text-sm">進捗: {newTask.progress}%</span>
          <input
            type="range"
            min="0"
            max="100"
            value={newTask.progress}
            onChange={(e) => setNewTask({ ...newTask, progress: parseInt(e.target.value) })}
            className="flex-1"
          />
        </div>
      </Card>

      {/* タスクリスト */}
      <div className="grid gap-4">
        {tasks.map(task => (
          <Card key={task.id} className={cn("p-4", task.completed && "opacity-60")}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">{task.title}</h3>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCompleteTask(task.id)}
                  disabled={task.completed}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>進捗</span>
                <span>{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-2" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
