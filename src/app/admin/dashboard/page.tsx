'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format, startOfWeek, startOfMonth } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Student {
    id: string
    full_name: string
    email: string
}

interface DailyEntry {
    id: number
    user_id: string
    date: string
    math: number
    physics: number
    chemistry: number
    biology: number
    turkish: number
    total_points: number
}

interface StudentWithStats extends Student {
    todayPoints: number
    weeklyPoints: number
    monthlyPoints: number
    totalPoints: number
}

export default function AdminDashboard() {
    const [students, setStudents] = useState<StudentWithStats[]>([])
    const [entries, setEntries] = useState<DailyEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')
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

            // Check if user is admin
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                router.push('/student/dashboard')
                return
            }

            // Load all students
            const { data: studentsData, error: studentsError } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                // Admin ve student'ları al (sadece student değil)

            console.log('Students loaded:', studentsData)
            console.log('Students error:', studentsError)

            // Load all entries
            const { data: entriesData, error: entriesError } = await supabase
                .from('daily_entries')
                .select('*')
                .order('date', { ascending: false })

            console.log('Entries loaded:', entriesData)
            console.log('Entries error:', entriesError)

            setEntries(entriesData || [])

            // Calculate statistics for each student
            const today = format(new Date(), 'yyyy-MM-dd')
            const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
            const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')

            const studentsWithStats: StudentWithStats[] = (studentsData || []).map(student => {
                const studentEntries = entriesData?.filter(e => e.user_id === student.id) || []

                return {
                    ...student,
                    todayPoints: studentEntries.find(e => e.date === today)?.total_points || 0,
                    weeklyPoints: studentEntries
                        .filter(e => e.date >= weekStart)
                        .reduce((sum, e) => sum + e.total_points, 0),
                    monthlyPoints: studentEntries
                        .filter(e => e.date >= monthStart)
                        .reduce((sum, e) => sum + e.total_points, 0),
                    totalPoints: studentEntries.reduce((sum, e) => sum + e.total_points, 0),
                }
            })

            setStudents(studentsWithStats)
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const getSortedStudents = () => {
        const sortField = selectedPeriod === 'today' ? 'todayPoints'
            : selectedPeriod === 'week' ? 'weeklyPoints'
                : 'monthlyPoints'

        return [...students].sort((a, b) => b[sortField] - a[sortField])
    }

    const getTotalStats = () => {
        return {
            totalStudents: students.length,
            todayTotal: students.reduce((sum, s) => sum + s.todayPoints, 0),
            weeklyTotal: students.reduce((sum, s) => sum + s.weeklyPoints, 0),
            monthlyTotal: students.reduce((sum, s) => sum + s.monthlyPoints, 0),
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Yükleniyor...</p>
            </div>
        )
    }

    const sortedStudents = getSortedStudents()
    const stats = getTotalStats()

    return (
        <div className="min-h-screen bg-cyan-50">
            <nav className="bg-cyan-900 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <h1 className="text-xl font-bold text-white">Admin Paneli</h1>
                        <div className="flex items-center gap-4">
                            <a
                                href="/student/dashboard"
                                className="text-sm text-cyan-100 hover:text-white font-medium"
                            >
                                Soru Gir
                            </a>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-cyan-200 hover:text-white font-medium"
                            >
                                Çıkış
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Overall Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-teal-600 rounded-xl shadow-lg p-6 text-white">
                        <h3 className="text-sm font-bold mb-2">Toplam Öğrenci</h3>
                        <p className="text-4xl font-bold">{stats.totalStudents}</p>
                    </div>
                    <div className="bg-cyan-600 rounded-xl shadow-lg p-6 text-white">
                        <h3 className="text-sm font-bold mb-2">Bugün Toplam</h3>
                        <p className="text-4xl font-bold">{stats.todayTotal}</p>
                    </div>
                    <div className="bg-sky-600 rounded-xl shadow-lg p-6 text-white">
                        <h3 className="text-sm font-bold mb-2">Haftalık Toplam</h3>
                        <p className="text-4xl font-bold">{stats.weeklyTotal}</p>
                    </div>
                    <div className="bg-teal-700 rounded-xl shadow-lg p-6 text-white">
                        <h3 className="text-sm font-bold mb-2">Aylık Toplam</h3>
                        <p className="text-4xl font-bold">{stats.monthlyTotal}</p>
                    </div>
                </div>

                {/* Period Filter */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-cyan-200">
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => setSelectedPeriod('today')}
                            className={`px-4 py-2 rounded-md font-medium ${selectedPeriod === 'today'
                                ? 'bg-cyan-700 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Günlük Sıralama
                        </button>
                        <button
                            onClick={() => setSelectedPeriod('week')}
                            className={`px-4 py-2 rounded-md font-medium ${selectedPeriod === 'week'
                                ? 'bg-cyan-700 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Haftalık Sıralama
                        </button>
                        <button
                            onClick={() => setSelectedPeriod('month')}
                            className={`px-4 py-2 rounded-md font-medium ${selectedPeriod === 'month'
                                ? 'bg-cyan-700 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Aylık Sıralama
                        </button>
                    </div>

                    {/* Leaderboard */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-cyan-200">
                            <thead className="bg-cyan-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                        Sıra
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                        Öğrenci
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                        Bugün
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                        Haftalık
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                        Aylık
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                        Toplam
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-cyan-100">
                                {sortedStudents.map((student, index) => (
                                    <tr key={student.id} className={index < 3 ? 'bg-cyan-50' : 'hover:bg-cyan-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                                                {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                                                {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                                                <span className="text-sm font-bold text-gray-900">{index + 1}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{student.full_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-700">{student.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-cyan-700">{student.todayPoints}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-teal-700">{student.weeklyPoints}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-sky-700">{student.monthlyPoints}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-lg font-bold text-cyan-800">{student.totalPoints}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-teal-200">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Son Girişler</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-teal-200">
                            <thead className="bg-teal-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                        Tarih
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                        Öğrenci
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                        Mat
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                        Fiz
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                        Kim
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                        Bio
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                        Tür
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">
                                        Toplam Puan
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-teal-100">
                                {entries.slice(0, 20).map((entry) => {
                                    const student = students.find(s => s.id === entry.user_id)
                                    return (
                                        <tr key={entry.id} className="hover:bg-teal-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {format(new Date(entry.date), 'dd MMM yyyy', { locale: tr })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {student?.full_name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">{entry.math}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">{entry.physics}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">{entry.chemistry}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">{entry.biology}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">{entry.turkish}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-teal-700">
                                                {entry.total_points}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    )
}
