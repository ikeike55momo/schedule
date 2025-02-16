import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, File, Upload, Search, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface Document {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  created_at: string;
}

export function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    fetchDocuments();
  }, [currentPath]);

  const fetchDocuments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('path', currentPath)
        .order('type')
        .order('name');

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('ドキュメントの取得に失敗しました');
    }
  }, [currentPath]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`${currentPath}${file.name}`, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            name: file.name,
            path: currentPath,
            size: file.size,
            type: 'file',
          },
        ]);

      if (dbError) throw dbError;

      fetchDocuments();
      toast.success('ファイルをアップロードしました');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('ファイルのアップロードに失敗しました');
    }
  };

  const handleCreateFolder = async () => {
    const folderName = window.prompt('フォルダ名を入力してください');
    if (!folderName) return;

    try {
      const { error } = await supabase
        .from('documents')
        .insert([
          {
            name: folderName,
            path: currentPath,
            size: 0,
            type: 'folder',
          },
        ]);

      if (error) throw error;

      fetchDocuments();
      toast.success('フォルダを作成しました');
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('フォルダの作成に失敗しました');
    }
  };

  const handleDelete = async (document: Document) => {
    if (!window.confirm(`${document.name}を削除してもよろしいですか？`)) return;

    try {
      if (document.type === 'file') {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([`${document.path}${document.name}`]);

        if (storageError) throw storageError;
      }

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;

      fetchDocuments();
      toast.success(`${document.name}を削除しました`);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('削除に失敗しました');
    }
  };

  const handleNavigate = (document: Document) => {
    if (document.type === 'folder') {
      setCurrentPath(`${currentPath}${document.name}/`);
    }
  };

  const handleNavigateUp = () => {
    const newPath = currentPath.split('/').slice(0, -2).join('/') + '/';
    setCurrentPath(newPath);
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">文書管理</h1>
        <div className="flex gap-2">
          <Button onClick={handleCreateFolder}>
            <Folder className="w-4 h-4 mr-2" />
            新規フォルダ
          </Button>
          <Button asChild>
            <label>
              <Upload className="w-4 h-4 mr-2" />
              ファイルアップロード
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </Button>
        </div>
      </div>

      {/* パスと検索 */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={handleNavigateUp}
          disabled={currentPath === '/'}
        >
          上へ
        </Button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ファイルを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* ファイル一覧 */}
      <Card>
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="p-4 space-y-2">
            {filteredDocuments.map(doc => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2 hover:bg-secondary rounded-lg cursor-pointer"
                onClick={() => handleNavigate(doc)}
              >
                <div className="flex items-center gap-3">
                  {doc.type === 'folder' ? (
                    <Folder className="w-4 h-4" />
                  ) : (
                    <File className="w-4 h-4" />
                  )}
                  <span>{doc.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {formatFileSize(doc.size)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
