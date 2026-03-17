"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
    Search,
    Filter,
    Clock,
    User,
    MapPin,
    Calendar,
    CheckCircle2,
    XCircle,
    Plus,
    CalendarDays,
    LayoutDashboard,
    FileText,
    Fingerprint,
    AlertCircle,
    TrendingUp,
    Users
} from 'lucide-react'
import { Card } from '@/components/ui-minimal'

interface Attendance {
    id: string
    employee_id: string
    hub_location: string
    job_type: string
    date: string
    shift_start_time: string
    clock_in: string
    clock_out: string
    late_minutes: number
    attendance_status: string
    applicants: {
        first_name: string
        last_name: string
    }
}

export default function AttendancePage() {
    const [attendance, setAttendance] = useState<Attendance[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [hubFilter, setHubFilter] = useState('All')
    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    })
    const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')
    const [selectedEmployeeForMonthly, setSelectedEmployeeForMonthly] = useState('')
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)) // YYYY-MM

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newEntry, setNewEntry] = useState({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        shift_start_time: '08:00',
        clock_in: '',
        clock_out: '',
        attendance_status: 'Present'
    })

    useEffect(() => {
        fetchAttendance()
        fetchEmployees()
    }, [hubFilter, dateRange, viewMode, selectedEmployeeForMonthly, selectedMonth])

    async function fetchEmployees() {
        const { data } = await supabase
            .from('applicants')
            .select('id, first_name, last_name, hub_location, job_type')
            .eq('application_status', 'Hired')
        setEmployees(data || [])
    }

    async function fetchAttendance() {
        setLoading(true)
        let query = supabase
            .from('attendance')
            .select(`
                *,
                applicants:employee_id (
                    first_name,
                    last_name
                )
            `)

        if (viewMode === 'monthly' && selectedEmployeeForMonthly) {
            query = query
                .eq('employee_id', selectedEmployeeForMonthly)
                .gte('date', `${selectedMonth}-01`)
                .lte('date', `${selectedMonth}-31`)
        } else {
            query = query
                .gte('date', dateRange.from)
                .lte('date', dateRange.to)
        }

        query = query.order('date', { ascending: false })

        if (hubFilter !== 'All') {
            query = query.eq('hub_location', hubFilter)
        }

        const { data, error } = await query
        if (error) console.error('Error fetching attendance:', error)
        else setAttendance(data || [])
        setLoading(false)
    }

    const calculateStats = () => {
        const today = new Date().toISOString().split('T')[0]
        const todayLogs = attendance.filter(a => a.date === today)
        return {
            present: todayLogs.filter(a => a.attendance_status === 'Present' || a.attendance_status === 'Late').length,
            late: todayLogs.filter(a => a.attendance_status === 'Late').length,
            absent: employees.length - todayLogs.length
        }
    }

    const stats = calculateStats()

    const calculateHours = (clockIn: string, clockOut: string) => {
        if (!clockIn || !clockOut) return '0.0h'
        try {
            const start = new Date(clockIn).getTime()
            const end = new Date(clockOut).getTime()
            const diff = (end - start) / (1000 * 60 * 60)
            return diff > 0 ? `${diff.toFixed(1)}h` : '0.0h'
        } catch (e) { return '0.0h' }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const selectedEmp = employees.find(emp => emp.id === newEntry.employee_id)
        if (!selectedEmp) return

        // Calculate Late Minutes
        let lateMins = 0
        let status = 'Present'

        if (newEntry.clock_in) {
            const shiftTime = new Date(`1970-01-01T${newEntry.shift_start_time}:00`)
            const actualTime = new Date(`1970-01-01T${newEntry.clock_in.split('T')[1]?.substring(0, 5) || newEntry.clock_in}:00`)

            if (actualTime > shiftTime) {
                lateMins = Math.floor((actualTime.getTime() - shiftTime.getTime()) / 60000)
                status = 'Late'
            }
        } else {
            status = 'Absent'
        }

        // Format times for Supabase (Timestamptz requires date)
        const formattedEntry = {
            ...newEntry,
            clock_in: newEntry.clock_in ? `${newEntry.date} ${newEntry.clock_in}:00` : null,
            clock_out: newEntry.clock_out ? `${newEntry.date} ${newEntry.clock_out}:00` : null,
        }

        const { error } = await supabase.from('attendance').insert([{
            ...formattedEntry,
            hub_location: selectedEmp.hub_location,
            job_type: selectedEmp.job_type,
            late_minutes: lateMins,
            attendance_status: status
        }])

        if (error) {
            alert(error.message)
        } else {
            setIsModalOpen(false)
            fetchAttendance()
        }
        setLoading(false)
    }

    const filteredAttendance = attendance.filter(a =>
        `${a.applicants?.first_name} ${a.applicants?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Timesheets & Attendance</h1>
                    <p className="text-sm text-gray-400">Employee work logs and monthly performance audit</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'daily' ? 'monthly' : 'daily')}
                        className="flex items-center justify-center gap-2 bg-white/5 text-white border border-white/10 px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/10 transition-all"
                    >
                        {viewMode === 'daily' ? <Calendar size={18} /> : <LayoutDashboard size={18} />}
                        Switch to {viewMode === 'daily' ? 'Monthly Timesheet' : 'Daily Audit'}
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all"
                    >
                        <Plus size={18} /> Manual Adjustment
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-emerald-500/5 border-emerald-500/10 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Present Today</p>
                        <h4 className="text-2xl font-black text-white">{stats.present}</h4>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Users size={24} />
                    </div>
                </Card>
                <Card className="p-4 bg-orange-500/5 border-orange-500/10 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Late Arrivals</p>
                        <h4 className="text-2xl font-black text-white">{stats.late}</h4>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <Clock size={24} />
                    </div>
                </Card>
                <Card className="p-4 bg-red-500/5 border-red-500/10 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Total Absent</p>
                        <h4 className="text-2xl font-black text-white">{stats.absent}</h4>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                        <AlertCircle size={24} />
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4 bg-black/40 border-white/10">
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-widest">
                            <Filter size={14} className="text-gray-500" />
                            Filter Work Logs
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {viewMode === 'daily' ? (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search employee..."
                                        className="w-full bg-black border border-white/10 rounded-md py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500/50 outline-none"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <MapPin size={16} className="text-gray-500" />
                                    <select
                                        className="bg-black border border-white/10 rounded-md py-2 px-4 text-white focus:border-blue-500/50 outline-none flex-1"
                                        value={hubFilter}
                                        onChange={(e) => setHubFilter(e.target.value)}
                                    >
                                        <option value="All">All Hubs</option>
                                        <option value="Manila North Hub">Manila North Hub</option>
                                        <option value="Cebu Central Hub">Cebu Central Hub</option>
                                        <option value="Davao Logistics">Davao Logistics</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 text-xs md:col-span-2">
                                    <Calendar size={16} className="text-gray-500" />
                                    <input
                                        type="date"
                                        className="bg-black border border-white/10 rounded-md py-2 px-4 text-white focus:border-blue-500/50 outline-none flex-1"
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                    />
                                    <span className="text-gray-500">to</span>
                                    <input
                                        type="date"
                                        className="bg-black border border-white/10 rounded-md py-2 px-4 text-white focus:border-blue-500/50 outline-none flex-1"
                                        value={dateRange.to}
                                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="md:col-span-2">
                                    <select
                                        className="w-full bg-black border border-white/10 rounded-md py-2 px-4 text-sm text-white focus:border-blue-500/50 outline-none"
                                        value={selectedEmployeeForMonthly}
                                        onChange={(e) => setSelectedEmployeeForMonthly(e.target.value)}
                                    >
                                        <option value="">Select Employee for Timesheet...</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <input
                                        type="month"
                                        className="w-full bg-black border border-white/10 rounded-md py-2 px-4 text-sm text-white focus:border-blue-500/50 outline-none"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Card>

            {/* Attendance Table */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                ) : filteredAttendance.length > 0 ? (
                    filteredAttendance.map((record) => (
                        <Card key={record.id} className="p-4 bg-black/40 border-white/10 flex flex-col md:flex-row items-center gap-6 hover:border-white/20 transition-all">
                            <div className="flex items-center gap-4 flex-1 w-full">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                                    {record.applicants?.first_name?.charAt(0)}{record.applicants?.last_name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">{record.applicants?.first_name} {record.applicants?.last_name}</h3>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{record.job_type} • {record.hub_location}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 w-full md:w-auto flex-1">
                                <div>
                                    <span className="text-[9px] text-gray-600 uppercase font-bold block mb-1 font-mono">Date</span>
                                    <div className="flex items-center gap-2 text-xs text-white">
                                        <CalendarDays size={14} className="text-gray-700" />
                                        {new Date(record.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[9px] text-gray-600 uppercase font-bold block mb-1 font-mono">Clock In</span>
                                    <div className="flex items-center gap-2 text-xs text-white">
                                        <Clock size={14} className="text-gray-700" />
                                        {record.clock_in ? new Date(record.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[9px] text-gray-600 uppercase font-bold block mb-1 font-mono">Total Hours</span>
                                    <div className="flex items-center gap-2 text-xs text-emerald-500 font-bold">
                                        <TrendingUp size={14} />
                                        {calculateHours(record.clock_in, record.clock_out)}
                                    </div>
                                </div>
                                <div className="hidden lg:block">
                                    <span className="text-[9px] text-gray-600 uppercase font-bold block mb-1 font-mono">Verif. Method</span>
                                    <div className={`flex items-center gap-1.5 text-[10px] font-bold ${record.clock_in && record.clock_in.includes('T') ? 'text-emerald-500' : 'text-orange-500 italic'}`}>
                                        {record.clock_in && record.clock_in.includes('T') ? <Fingerprint size={12} /> : <AlertCircle size={12} />}
                                        {record.clock_in && record.clock_in.includes('T') ? 'BIOMETRIC' : 'MANUAL'}
                                    </div>
                                </div>
                                <div className="flex items-center justify-end">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold border ${record.attendance_status === 'Present' ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' :
                                        record.attendance_status === 'Late' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]' :
                                            'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,44,44,0.1)]'
                                        }`}>
                                        {record.attendance_status === 'Present' ? <CheckCircle2 size={10} /> :
                                            record.attendance_status === 'Late' ? <Clock size={10} /> : <XCircle size={10} />}
                                        {record.attendance_status.toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
                        <FileText size={48} className="mx-auto text-gray-800 mb-4 opacity-20" />
                        <p className="text-gray-500 text-sm italic">No timesheet records found for the selection.</p>
                        {viewMode === 'monthly' && !selectedEmployeeForMonthly && (
                            <p className="text-[10px] text-orange-500/50 uppercase tracking-widest mt-2 font-bold">Please select an employee to view monthly logs</p>
                        )}
                    </div>
                )}
            </div>

            {/* Manual Entry Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg p-6 bg-[#0a0a0a] border-white/10 space-y-6 shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Manual Adjustment Audit</h2>
                                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mt-1">Manual Override Required</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Employee</label>
                                <select
                                    className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                    value={newEntry.employee_id}
                                    onChange={(e) => setNewEntry({ ...newEntry, employee_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.hub_location})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                        value={newEntry.date}
                                        onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Shift Start</label>
                                    <input
                                        type="time"
                                        className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                        value={newEntry.shift_start_time}
                                        onChange={(e) => setNewEntry({ ...newEntry, shift_start_time: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Clock In Time</label>
                                    <input
                                        type="time"
                                        className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                        value={newEntry.clock_in}
                                        onChange={(e) => setNewEntry({ ...newEntry, clock_in: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Clock Out Time</label>
                                    <input
                                        type="time"
                                        className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                        value={newEntry.clock_out}
                                        onChange={(e) => setNewEntry({ ...newEntry, clock_out: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button
                                    type="submit"
                                    className="flex-1 bg-white text-black py-3 rounded-md text-sm font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : 'Save Attendance'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-white/5 text-white py-3 rounded-md text-sm font-bold border border-white/10 hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    )
}
