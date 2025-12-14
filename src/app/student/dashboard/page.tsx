'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format, startOfMonth, subDays, eachDayOfInterval } from 'date-fns'
import { tr } from 'date-fns/locale'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
    slvt: number
    notes?: string
    total_points: number
}

interface Profile {
    full_name: string
    email: string
    role?: string
    dashboard_note?: string
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
    { key: 'slvt', label: 'SLVT', color: 'bg-orange-500' },
]

export default function StudentDashboard() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [formData, setFormData] = useState<any>({
        kk: '',
        rsl: '',
        prt: '',
        cvs: '',
        orc: 0,
        thc: 0,
        alm: '',
        trk: '',
        slvt: '',
        notes: '',
    })
    const [entries, setEntries] = useState<DailyEntry[]>([])
    const [dashboardNote, setDashboardNote] = useState('')
    const [savingNote, setSavingNote] = useState(false)
    const [isEditingNote, setIsEditingNote] = useState(false)
    const [showNoteSuccess, setShowNoteSuccess] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [selectedNote, setSelectedNote] = useState<{ date: string, note: string } | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const entry = entries.find(e => e.date === selectedDate)
        if (entry) {
            setFormData({
                kk: entry.kk,
                rsl: entry.rsl,
                prt: entry.prt,
                cvs: entry.cvs,
                orc: entry.orc,
                thc: entry.thc,
                alm: entry.alm,
                trk: entry.trk,
                slvt: entry.slvt,
                notes: entry.notes || '',
            })
        } else {
            setFormData({
                kk: '',
                rsl: '',
                prt: '',
                cvs: '',
                orc: 0,
                thc: 0,
                alm: '',
                trk: '',
                slvt: '',
                notes: '',
            })
        }
    }, [selectedDate, entries])

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
                .select('full_name, email, role, dashboard_note')
                .eq('id', user.id)
                .single()

            if (!profileData) {
                await supabase.auth.signOut()
                router.push('/login')
                return
            }

            setProfile(profileData)
            setDashboardNote(profileData.dashboard_note || '')

            // Load all entries
            const { data: entriesData, error: entriesError } = await supabase
                .from('daily_entries')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })

            console.log('Entries loaded:', entriesData)
            console.log('Entries error:', entriesError)

            setEntries(entriesData || [])

        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveNote = async () => {
        setSavingNote(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('profiles')
                .update({ dashboard_note: dashboardNote })
                .eq('id', user.id)

            if (error) throw error

            // Update local profile state
            if (profile) {
                setProfile({ ...profile, dashboard_note: dashboardNote })
            }

            setIsEditingNote(false)
            setShowNoteSuccess(true)
            setTimeout(() => setShowNoteSuccess(false), 2000)
        } catch (error) {
            console.error('Error saving note:', error)
            alert('Not kaydedilirken hata oluştu')
        } finally {
            setSavingNote(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('daily_entries')
                .upsert({
                    user_id: user.id,
                    date: selectedDate,
                    kk: Number(formData.kk) || 0,
                    rsl: Number(formData.rsl) || 0,
                    prt: Number(formData.prt) || 0,
                    cvs: Number(formData.cvs) || 0,
                    orc: Number(formData.orc) || 0,
                    thc: Number(formData.thc) || 0,
                    alm: Number(formData.alm) || 0,
                    trk: Number(formData.trk) || 0,
                    slvt: Number(formData.slvt) || 0,
                    notes: formData.notes,
                }, {
                    onConflict: 'user_id,date'
                })
                .select()

            console.log('Save result:', data)
            console.log('Save error:', error)

            if (error) throw error

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

    const weeklyTotal = useMemo(() => {
        return entries
            .filter(e => {
                const entryDate = new Date(e.date)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return entryDate >= weekAgo
            })
            .reduce((sum, e) => sum + e.total_points, 0)
    }, [entries])

    const monthlyTotal = useMemo(() => {
        return entries
            .filter(e => {
                const entryDate = new Date(e.date)
                const monthStart = startOfMonth(new Date())
                return entryDate >= monthStart
            })
            .reduce((sum, e) => sum + e.total_points, 0)
    }, [entries])

    // Prepare chart data
    const weeklyChartData = useMemo(() => {
        const endDate = new Date()
        const startDate = subDays(endDate, 6)
        const interval = eachDayOfInterval({ start: startDate, end: endDate })

        return interval.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const entry = entries.find(e => e.date === dateStr)
            return {
                date: format(date, 'd MMM', { locale: tr }),
                puan: entry ? entry.total_points : 0
            }
        })
    }, [entries])

    const monthlyChartData = useMemo(() => {
        const endDate = new Date()
        const startDate = subDays(endDate, 29)
        const interval = eachDayOfInterval({ start: startDate, end: endDate })

        return interval.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const entry = entries.find(e => e.date === dateStr)
            return {
                date: format(date, 'd MMM', { locale: tr }),
                puan: entry ? entry.total_points : 0
            }
        })
    }, [entries])

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
                {/* Dashboard Note */}
                <div className="bg-white rounded-xl shadow-lg px-6 pt-4 pb-3 mb-8 border-2 border-rose-200 relative">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            {isEditingNote ? (
                                <textarea
                                    value={dashboardNote}
                                    onChange={(e) => setDashboardNote(e.target.value)}
                                    className="w-full px-0 py-2 border-0 focus:outline-none text-gray-900 font-medium resize-none bg-transparent"
                                    placeholder="Kişisel notunuzu girebilirsiniz..."
                                    autoFocus
                                    rows={2}
                                />
                            ) : (
                                <div
                                    className="w-full py-2 border-0 text-gray-900 font-medium whitespace-pre-wrap cursor-pointer hover:bg-rose-50 transition-colors min-h-[3rem] rounded-lg"
                                    onClick={() => setIsEditingNote(true)}
                                >
                                    {dashboardNote || <span className="text-gray-400 italic">Kişisel notunuzu girebilirsiniz...</span>}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                if (isEditingNote) {
                                    handleSaveNote()
                                } else {
                                    setIsEditingNote(true)
                                }
                            }}
                            disabled={savingNote}
                            className="flex-shrink-0 p-2 text-rose-600 hover:bg-rose-50 rounded-full transition-colors mt-1"
                            title={isEditingNote ? "Kaydet" : "Düzenle"}
                        >
                            {savingNote ? (
                                // Loading Spinner
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : showNoteSuccess ? (
                                // Checkmark
                                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : isEditingNote ? (
                                // Save Icon
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                            ) : (
                                // Pencil Icon
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Statistics Summary */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-rose-200">
                    <div className="grid grid-cols-2 gap-4 divide-x divide-rose-100">
                        <div className="text-center">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Haftalık</h3>
                            <p className="text-2xl font-bold text-rose-700">{weeklyTotal}</p>
                        </div>
                        <div className="text-center pl-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Aylık</h3>
                            <p className="text-2xl font-bold text-pink-700">{monthlyTotal}</p>
                        </div>
                    </div>
                </div>

                {/* Today's Entry Form */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-rose-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            {selectedDate === format(new Date(), 'yyyy-MM-dd')
                                ? `Bugünün Soruları (${format(new Date(), 'dd MMMM yyyy', { locale: tr })})`
                                : `${format(new Date(selectedDate), 'dd MMMM yyyy', { locale: tr })} Kayıtları`
                            }
                        </h2>
                        <div className="flex items-center gap-2">
                            <label htmlFor="date-picker" className="text-sm font-bold text-gray-700">Tarih Seç:</label>
                            <input
                                id="date-picker"
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={format(new Date(), 'yyyy-MM-dd')}
                                className="px-3 py-2 border-2 border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-gray-900 font-semibold"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-9 gap-3 mb-6">
                        {SUBJECTS.map((subject, index) => {
                            // ORC ve THC'yi yan yana göstermek için
                            if (subject.key === 'orc') {
                                const thcSubject = SUBJECTS.find(s => s.key === 'thc')
                                return (
                                    <div key="orc-thc" className="grid grid-cols-2 gap-2 col-span-2 md:col-span-2">
                                        {/* ORC */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                                {subject.label}
                                            </label>
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData[subject.key] === 1}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            [subject.key]: e.target.checked ? 1 : 0,
                                                        })
                                                    }
                                                    className="w-10 h-10 appearance-none border-2 border-rose-300 rounded-lg focus:outline-none focus:ring-2 cursor-pointer focus:ring-rose-500 focus:border-transparent checked:bg-rose-500 checked:border-rose-500 checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTMuNSA0TDYgMTEuNUwyLjUgOCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=')] bg-center bg-no-repeat"
                                                />
                                            </div>
                                        </div>
                                        {/* THC */}
                                        {thcSubject && (
                                            <div>
                                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                                    {thcSubject.label}
                                                </label>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData[thcSubject.key] === 1}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                [thcSubject.key]: e.target.checked ? 1 : 0,
                                                            })
                                                        }
                                                        className="w-10 h-10 appearance-none border-2 border-rose-300 rounded-lg focus:outline-none focus:ring-2 cursor-pointer focus:ring-rose-500 focus:border-transparent checked:bg-rose-500 checked:border-rose-500 checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTMuNSA0TDYgMTEuNUwyLjUgOCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=')] bg-center bg-no-repeat"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            // THC'yi atla, çünkü ORC ile birlikte gösterildi
                            if (subject.key === 'thc') {
                                return null
                            }

                            // Diğer inputlar
                            return (
                                <div key={subject.key}>
                                    <label className="block text-sm font-bold text-gray-900 mb-1">
                                        {subject.label}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData[subject.key]}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                [subject.key]: e.target.value,
                                            })
                                        }
                                        className="w-full md:w-20 px-2 py-2 border-2 border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-gray-900 font-semibold text-base"
                                    />
                                </div>
                            )
                        })}
                    </div>

                    {/* Notes Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            Günün Notları
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-gray-900 font-medium min-h-[100px]"
                            placeholder="Bugün neler yaptınız?"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving || showSuccess || (
                            (Number(formData.kk) || 0) === 0 &&
                            (Number(formData.rsl) || 0) === 0 &&
                            (Number(formData.prt) || 0) === 0 &&
                            (Number(formData.cvs) || 0) === 0 &&
                            (Number(formData.orc) || 0) === 0 &&
                            (Number(formData.thc) || 0) === 0 &&
                            (Number(formData.alm) || 0) === 0 &&
                            (Number(formData.trk) || 0) === 0 &&
                            (Number(formData.slvt) || 0) === 0
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
                                            SLVT
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                            Notlar
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {entry.slvt}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-700 max-w-[200px]">
                                                {entry.notes ? (
                                                    <div
                                                        className="line-clamp-2 cursor-pointer hover:text-rose-600 transition-colors"
                                                        onClick={() => setSelectedNote({ date: format(new Date(entry.date), 'dd MMMM yyyy', { locale: tr }), note: entry.notes! })}
                                                        title="Tam notu görmek için tıklayın"
                                                    >
                                                        {entry.notes}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
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

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Weekly Chart */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-rose-200">
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Haftalık Gelişim</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weeklyChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="puan" stroke="#be123c" strokeWidth={2} name="Puan" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Monthly Chart */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-rose-200">
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Aylık Gelişim</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="puan" stroke="#be123c" strokeWidth={2} name="Puan" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>

            {/* Not Modal */}
            {selectedNote && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedNote(null)}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-rose-600 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
                            <h3 className="font-semibold">{selectedNote.date}</h3>
                            <button
                                onClick={() => setSelectedNote(null)}
                                className="text-white hover:text-rose-100 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-gray-700 whitespace-pre-wrap">{selectedNote.note}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
