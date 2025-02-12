import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Button } from '../ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { checkAllowedUser } from '../../lib/api'

const Login = (): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        const isAllowed = await checkAllowedUser(session.user.email)
        if (!isAllowed) {
          await supabase.auth.signOut()
          toast.error('アクセスが許可されていません', {
            description: 'このメールアドレスは登録されていません'
          })
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      console.log('Environment:', {
        isProd: import.meta.env.PROD,
        mode: import.meta.env.MODE,
        baseUrl: import.meta.env.BASE_URL
      });

      const redirectTo = 'https://ririaru-stg.cloud';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) {
        toast.error('ログインに失敗しました', {
          description: error.message
        })
        return
      }

      toast.success('ログインしました')
    } catch (error) {
      toast.error('予期せぬエラーが発生しました', {
        description: error instanceof Error ? error.message : '不明なエラー'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleGoogleLogin}
      className="gap-2"
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google logo"
          className="w-5 h-5"
        />
      )}
      {isLoading ? 'ログイン中...' : 'Googleでログイン'}
    </Button>
  )
}

export default Login