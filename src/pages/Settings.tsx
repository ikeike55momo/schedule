import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Bell, Lock, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  notification_settings: {
    email: boolean;
    push: boolean;
    slack: boolean;
  };
  security_settings: {
    two_factor: boolean;
    session_timeout: number;
  };
}

export function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.session?.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('プロフィールの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session) {
        toast.error('ログインが必要です');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.session?.user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success('設定を更新しました');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('設定の更新に失敗しました');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${session.session?.user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile({ avatar_url: publicUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('アバターの更新に失敗しました');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!profile) {
    return <div>ログインが必要です</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">プロフィール</TabsTrigger>
          <TabsTrigger value="notifications">通知</TabsTrigger>
          <TabsTrigger value="security">セキュリティ</TabsTrigger>
        </TabsList>

        {/* プロフィール設定 */}
        <TabsContent value="profile">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <img
                  src={profile.avatar_url || '/default-avatar.png'}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
                <label className="absolute bottom-0 right-0 p-1 bg-background border rounded-full cursor-pointer">
                  <User className="w-4 h-4" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="フルネーム"
                  value={profile.full_name}
                  onChange={(e) => updateProfile({ full_name: e.target.value })}
                />
                <Input
                  placeholder="メールアドレス"
                  value={profile.email}
                  onChange={(e) => updateProfile({ email: e.target.value })}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 通知設定 */}
        <TabsContent value="notifications">
          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <span className="font-medium">メール通知</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    重要な更新をメールで受け取る
                  </p>
                </div>
                <Switch
                  checked={profile.notification_settings.email}
                  onCheckedChange={(checked) =>
                    updateProfile({
                      notification_settings: {
                        ...profile.notification_settings,
                        email: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <span className="font-medium">プッシュ通知</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ブラウザのプッシュ通知を受け取る
                  </p>
                </div>
                <Switch
                  checked={profile.notification_settings.push}
                  onCheckedChange={(checked) =>
                    updateProfile({
                      notification_settings: {
                        ...profile.notification_settings,
                        push: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <span className="font-medium">Slack通知</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Slackで通知を受け取る
                  </p>
                </div>
                <Switch
                  checked={profile.notification_settings.slack}
                  onCheckedChange={(checked) =>
                    updateProfile({
                      notification_settings: {
                        ...profile.notification_settings,
                        slack: checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* セキュリティ設定 */}
        <TabsContent value="security">
          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span className="font-medium">二要素認証</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    アカウントのセキュリティを強化する
                  </p>
                </div>
                <Switch
                  checked={profile.security_settings.two_factor}
                  onCheckedChange={(checked) =>
                    updateProfile({
                      security_settings: {
                        ...profile.security_settings,
                        two_factor: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span className="font-medium">セッションタイムアウト</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  非アクティブ時のセッション終了時間（分）
                </p>
                <Input
                  type="number"
                  min="5"
                  max="120"
                  value={profile.security_settings.session_timeout}
                  onChange={(e) =>
                    updateProfile({
                      security_settings: {
                        ...profile.security_settings,
                        session_timeout: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
