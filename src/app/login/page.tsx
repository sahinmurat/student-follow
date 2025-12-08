'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showRegistered, setShowRegistered] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    useEffect(() => {
        if (searchParams.get('registered') === 'true') {
            setShowRegistered(true)
            setTimeout(() => setShowRegistered(false), 5000)
        }
    }, [searchParams])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Convert username to email format for Supabase
            const email = `${username}@local.app`

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            // Get user profile to check role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()

            if (profile?.role === 'admin') {
                router.push('/admin/dashboard')
            } else {
                router.push('/student/dashboard')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Giriş başarısız')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#008B8B' }}>
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-2xl" style={{ borderWidth: '2px', borderColor: '#008B8B' }}>
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                        Soru Takip Sistemi
                    </h2>
                    <p className="mt-2 text-center text-sm font-bold text-gray-900">
                        Hesabınıza giriş yapın
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    {showRegistered && (
                        <div className="rounded-lg bg-green-50 border-2 border-green-400 p-4">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-bold text-green-900">Kayıt Başarılı! 🎉</p>
                                    <p className="text-xs text-green-700">Artık giriş yapabilirsiniz</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-bold text-gray-900 mb-1">
                                Kullanıcı Adı
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-2 text-gray-900 font-bold rounded-lg focus:outline-none focus:z-10 sm:text-sm transition-all"
                                style={{ borderWidth: '2px', borderColor: '#008B8B', color: '#4d4d4d' }}
                                placeholder="kullaniciadi"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-bold text-gray-900 mb-1">
                                Şifre
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-2 text-gray-900 font-bold rounded-lg focus:outline-none focus:z-10 sm:text-sm transition-all"
                                style={{ borderWidth: '2px', borderColor: '#008B8B', color: '#4d4d4d' }}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white focus:outline-none disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                            style={{ backgroundColor: '#008B8B' }}
                        >
                            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </div>

                    <div className="text-center">
                        <a href="/signup" className="text-sm font-bold transition-colors" style={{ color: '#008B8B' }}>
                            Hesabınız yok mu? Kayıt olun
                        </a>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#008B8B' }}><div className="text-white">Yükleniyor...</div></div>}>
            <LoginForm />
        </Suspense>
    )
}
