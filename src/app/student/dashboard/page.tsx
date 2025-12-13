'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format, startOfMonth } from 'date-fns'
import { tr } from 'date-fns/locale'

interface DailyEntry {
    id: number
    date: string
    kk: number
    rsl: number
    prt: number
    cvs: number
    orc: number
    thc: number
    alm: number
    trk: number
    total_points: number
}

interface Profile {
    full_name: string
    email: string
    role?: string
}

const SUBJECTS = [
    { key: 'kk', label: 'KK', color: 'bg-blue-500' },
    { key: 'rsl', label: 'RSL', color: 'bg-purple-500' },
    { key: 'prt', label: 'PRT', color: 'bg-green-500' },
    { key: 'cvs', label: 'CVS', color: 'bg-yellow-500' },
    { key: 'orc', label: 'ORC', color: 'bg-red-500' },
    { key: 'thc', label: 'THC', color: 'bg-indigo-500' },
    { key: 'alm', label: 'ALM', color: 'bg-pink-500' },
    { key: 'trk', label: 'TRK', color: 'bg-teal-500' },
]

export default function StudentDashboard() {
    const [profile, setProfile] = useState<Profile | null>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [todayEntry, setTodayEntry] = useState<any>({
        kk: '',
        rsl: '',
        prt: '',
        cvs: '',
        orc: '',
        thc: '',
        alm: '',
        trk: '',
    })
    const [entries, setEntries] = useState<DailyEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // Load profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, email, role')
                .eq('id', user.id)
                .single()

            if (!profileData) {
                await supabase.auth.signOut()
                router.push('/login')
                return
            }

            setProfile(profileData)

            // Load all entries
            const { data: entriesData, error: entriesError } = await supabase
                .from('daily_entries')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })

            console.log('Entries loaded:', entriesData)
            console.log('Entries error:', entriesError)

            setEntries(entriesData || [])

            // Load today's entry
            const today = format(new Date(), 'yyyy-MM-dd')
            const todayData = entriesData?.find(e => e.date === today)
            // Input alanlarını sıfırla, çünkü ekleme yapacağız
            setTodayEntry({
                kk: '',
                rsl: '',
                prt: '',
                cvs: '',
                orc: '',
                thc: '',
                alm: '',
                trk: '',
            })
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const today = format(new Date(), 'yyyy-MM-dd')

            // Önce bugünün mevcut kaydını çek
            const { data: existingEntry } = await supabase
                .from('daily_entries')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .single()

            // Mevcut kayıt varsa üzerine ekle, yoksa yeni değerleri kullan
            const newKk = (existingEntry?.kk || 0) + (Number(todayEntry.kk) || 0)
            const newRsl = (existingEntry?.rsl || 0) + (Number(todayEntry.rsl) || 0)
            const newPrt = (existingEntry?.prt || 0) + (Number(todayEntry.prt) || 0)
            const newCvs = (existingEntry?.cvs || 0) + (Number(todayEntry.cvs) || 0)
            const newOrc = (existingEntry?.orc || 0) + (Number(todayEntry.orc) || 0)
            const newThc = (existingEntry?.thc || 0) + (Number(todayEntry.thc) || 0)
            const newAlm = (existingEntry?.alm || 0) + (Number(todayEntry.alm) || 0)
            const newTrk = (existingEntry?.trk || 0) + (Number(todayEntry.trk) || 0)

            const { data, error } = await supabase
                .from('daily_entries')
                .upsert({
                    user_id: user.id,
                    date: today,
                    kk: newKk,
                    rsl: newRsl,
                    prt: newPrt,
                    cvs: newCvs,
                    orc: newOrc,
                    thc: newThc,
                    alm: newAlm,
                    trk: newTrk,
                }, {
                    onConflict: 'user_id,date'
                })
                .select()

            console.log('Save result:', data)
            console.log('Save error:', error)

            if (error) throw error

            // Input alanlarını sıfırla
            setTodayEntry({
                kk: '',
                rsl: '',
                prt: '',
                cvs: '',
                orc: '',
                thc: '',
                alm: '',
                trk: '',
            })

            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 2000)
            await loadData() // Verileri yeniden yükle
        } catch (error) {
            console.error('Save error:', error)
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
            alert('Hata: ' + errorMessage)
        } finally {
            setSaving(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Yükleniyor...</p>
            </div>
        )
    }

    const weeklyTotal = entries
        .filter(e => {
            const entryDate = new Date(e.date)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return entryDate >= weekAgo
        })
        .reduce((sum, e) => sum + e.total_points, 0)

    const monthlyTotal = entries
        .filter(e => {
            const entryDate = new Date(e.date)
            const monthStart = startOfMonth(new Date())
            return entryDate >= monthStart
        })
        .reduce((sum, e) => sum + e.total_points, 0)

    return (
        <div className="min-h-screen bg-rose-50">
            <nav className="bg-rose-900 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <h1 className="text-xl font-bold text-white">
                            {profile?.role === 'admin' ? 'Admin - Soru Girişi' : 'Öğrenci Paneli'}
                        </h1>
                        <div className="flex items-center gap-4">
                            {profile?.role === 'admin' && (
                                <a
                                    href="/admin/dashboard"
                                    className="text-sm text-rose-100 hover:text-white font-medium"
                                >
                                    Admin Paneli
                                </a>
                            )}
                            <span className="text-sm text-rose-100 font-medium">{profile?.full_name}</span>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-rose-200 hover:text-white font-medium"
                            >
                                Çıkış
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-rose-700 rounded-xl shadow-lg p-6 text-white">
                        <h3 className="text-lg font-bold mb-2">Haftalık Toplam</h3>
                        <p className="text-4xl font-bold">{weeklyTotal} puan</p>
                    </div>
                    <div className="bg-pink-700 rounded-xl shadow-lg p-6 text-white">
                        <h3 className="text-lg font-bold mb-2">Aylık Toplam</h3>
                        <p className="text-4xl font-bold">{monthlyTotal} puan</p>
                    </div>
                </div>

                {/* Today's Entry Form */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-rose-200">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Bugünün Soruları ({format(new Date(), 'dd MMMM yyyy', { locale: tr })})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        {SUBJECTS.map(subject => (
                            <div key={subject.key}>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    {subject.label}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={todayEntry[subject.key]}
                                    onChange={(e) =>
                                        setTodayEntry({
                                            ...todayEntry,
                                            [subject.key]: e.target.value === '' ? '' : parseInt(e.target.value),
                                        })
                                    }
                                    className="w-full px-4 py-3 border-2 border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-gray-900 font-semibold text-lg"
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || showSuccess || (
                            (Number(todayEntry.kk) || 0) === 0 &&
                            (Number(todayEntry.rsl) || 0) === 0 &&
                            (Number(todayEntry.prt) || 0) === 0 &&
                            (Number(todayEntry.cvs) || 0) === 0 &&
                            (Number(todayEntry.orc) || 0) === 0 &&
                            (Number(todayEntry.thc) || 0) === 0 &&
                            (Number(todayEntry.alm) || 0) === 0 &&
                            (Number(todayEntry.trk) || 0) === 0
                        )}
                        className="w-full py-3 px-4 bg-rose-700 text-white font-bold text-lg rounded-lg hover:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all relative"
                    >
                        {showSuccess ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                                Kaydedildi
                            </span>
                        ) : saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>

                {/* Recent Entries */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-rose-200">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Girilen Kayıtlar</h2>
                    {entries.length === 0 ? (
                        <p className="text-gray-900 text-center py-8 font-medium">Henüz kayıt yok</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-rose-200">
                                <thead className="bg-rose-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                            Tarih
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                            KK
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                            RSL
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                            PRT
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                            CVS
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                            ORC
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                            THC
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                            ALM
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                            TRK
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                            Toplam Puan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-rose-100">
                                    {entries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-rose-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {format(new Date(entry.date), 'dd MMMM yyyy', { locale: tr })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {entry.kk}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {entry.rsl}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {entry.prt}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {entry.cvs}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {entry.orc}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {entry.thc}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {entry.alm}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {entry.trk}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-rose-800">
                                                {entry.total_points}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
