'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function OAuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const userId = searchParams.get('user_id')
    const email = searchParams.get('email')
    const name = searchParams.get('name')

    console.log('🔗 OAuth Callback received:', { accessToken: accessToken?.substring(0, 20) + '...', userId, email, name })

    if (accessToken && userId && email) {
      // Salva os dados no localStorage temporariamente para o AuthContext pegar
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('oauth_callback', JSON.stringify({
          access_token: accessToken,
          user_id: userId,
          email: email,
          name: name || ''
        }))
        
        // Dispara um evento customizado para o AuthContext detectar
        window.dispatchEvent(new CustomEvent('oauth-callback', {
          detail: { accessToken, userId, email, name }
        }))
        
        console.log('✅ OAuth data saved to localStorage and event dispatched')
        
        // Redireciona para a home
        setTimeout(() => {
          router.push('/')
        }, 500)
      }
    } else {
      console.error('❌ Invalid OAuth callback - missing parameters')
      router.push('/')
    }
  }, [searchParams, router])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'system-ui'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>✅ Login Successful!</h1>
        <p>Redirecting to app...</p>
      </div>
    </div>
  )
}
