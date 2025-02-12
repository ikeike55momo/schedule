import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface AllowedUser {
  id: string
  email: string
  created_at: string
}

export const AdminPanel = () => {
  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminStatus()
    loadAllowedUsers()
  }, [])

  const checkAdminStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    setIsAdmin(!!admin)
  }

  const loadAllowedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('allowed_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAllowedUsers(data || [])
    } catch (error) {
      toast.error('許可ユーザーの読み込みに失敗しました')
      console.error('Error loading allowed users:', error)
    }
  }

  const handleAddUser = async () => {
    if (!newEmail.trim()) {
      toast.error('メールアドレスを入力してください')
      return
    }

    try {
      setIsLoading(true)
      const { error } = await supabase
        .from('allowed_users')
        .insert({ email: newEmail.trim() })

      if (error) throw error

      toast.success('ユーザーを追加しました')
      setNewEmail('')
      loadAllowedUsers()
    } catch (error) {
      toast.error('ユーザーの追加に失敗しました')
      console.error('Error adding user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('allowed_users')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('ユーザーを削除しました')
      loadAllowedUsers()
    } catch (error) {
      toast.error('ユーザーの削除に失敗しました')
      console.error('Error deleting user:', error)
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">管理者権限がありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Input
          type="email"
          placeholder="メールアドレス"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleAddUser} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          追加
        </Button>
      </div>

      <div className="grid gap-4">
        {allowedUsers.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-muted-foreground">
                  追加日: {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDeleteUser(user.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}