'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Convert username to email format for Supabase
            const email = `${username}@local.app`

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: undefined,
                    data: {
                        full_name: fullName,
                        username: username,
                        role: 'student', // Herkes varsayılan olarak öğrenci
                    },
                },
            })

            if (error) throw error

            if (data.user) {
                router.push('/login?registered=true')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Kayıt başarısız')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#008B8B'}}>
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-2xl" style={{borderWidth: '2px', borderColor: '#008B8B'}}>
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                        Kayıt Ol
                    </h2>
                    <p className="mt-2 text-center text-sm font-bold text-gray-900">
                        Yeni hesap oluşturun
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSignup}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-bold text-gray-900 mb-1">
                                Ad Soyad
                            </label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-2 text-gray-900 font-bold rounded-lg focus:outline-none sm:text-sm transition-all"
                                style={{borderWidth: '2px', borderColor: '#008B8B', color: '#4d4d4d'}}
                                placeholder="Muster Muster"
                            />
                        </div>
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
                                className="appearance-none relative block w-full px-3 py-2 text-gray-900 font-bold rounded-lg focus:outline-none sm:text-sm transition-all"
                                style={{borderWidth: '2px', borderColor: '#008B8B', color: '#4d4d4d'}}
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
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-2 text-gray-900 font-bold rounded-lg focus:outline-none sm:text-sm transition-all"
                                style={{borderWidth: '2px', borderColor: '#008B8B', color: '#4d4d4d'}}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white focus:outline-none disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                            style={{backgroundColor: '#008B8B'}}
                        >
                            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                        </button>
                    </div>

                    <div className="text-center">
                        <a href="/login" className="text-sm font-bold transition-colors" style={{color: '#008B8B'}}>
                            Zaten hesabınız var mı? Giriş yapın
                        </a>
                    </div>
                </form>
            </div>
        </div>
    )
}
