import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Search, Tag } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface Article {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export function Knowledge() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    tags: '',
  });

  const fetchArticles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('記事の取得に失敗しました');
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleCreateArticle = async () => {
    if (!newArticle.title || !newArticle.content) {
      toast.error('タイトルと内容を入力してください');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('articles')
        .insert([
          {
            title: newArticle.title,
            content: newArticle.content,
            tags: newArticle.tags.split(',').map(tag => tag.trim()),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setArticles([data, ...articles]);
      setNewArticle({ title: '', content: '', tags: '' });
      toast.success('記事を作成しました');
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error('記事の作成に失敗しました');
    }
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ナレッジベース</h1>
        <Button onClick={handleCreateArticle}>
          <Plus className="w-4 h-4 mr-2" />
          新規作成
        </Button>
      </div>

      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="記事を検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 新規記事フォーム */}
      <Card className="p-4 space-y-4">
        <Input
          placeholder="タイトル"
          value={newArticle.title}
          onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
        />
        <Textarea
          placeholder="内容"
          value={newArticle.content}
          onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
          rows={5}
        />
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4" />
          <Input
            placeholder="タグ（カンマ区切り）"
            value={newArticle.tags}
            onChange={(e) => setNewArticle({ ...newArticle, tags: e.target.value })}
          />
        </div>
      </Card>

      {/* 記事一覧 */}
      <div className="grid gap-4">
        {filteredArticles.map(article => (
          <Card key={article.id} className="p-4">
            <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
            <p className="text-muted-foreground mb-4">{article.content}</p>
            <div className="flex gap-2">
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              作成: {new Date(article.created_at).toLocaleString()}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
