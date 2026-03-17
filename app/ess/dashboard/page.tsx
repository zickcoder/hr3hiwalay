"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    User, Clock, Calendar, ShieldCheck, MapPin,
    CheckCircle2, AlertCircle, FileText, ChevronRight,
    Briefcase, Phone, Mail, Hash, Send, X, ArrowLeft,
    LogIn, LogOut, Camera
} from 'lucide-react'
import { Card } from '@/components/ui-minimal'
import { FaceScanner } from '@/components/face-scanner'

export default function ESSDashboard() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [attendance, setAttendance] = useState<any[]>([])
    const [shifts, setShifts] = useState<any[]>([])
    const [leaveRequests, setLeaveRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'info' | 'schedule' | 'attendance' | 'leave'>('info')

    // Leave request form
    const [leaveForm, setLeaveForm] = useState({ leave_type: 'Sick Leave', start_date: '', end_date: '', reason: '' })
    const [submitLoading, setSubmitLoading] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    // Biometric Attendance State
    const [showScanner, setShowScanner] = useState(false)
    const [scannerType, setScannerType] = useState<'in' | 'out'>('in')
    const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null)
    const [isClocking, setIsClocking] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        loadSession()
    }, [])

    async function loadSession() {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser || authUser.user_metadata?.role !== 'employee') {
            router.replace('/ess/login')
            return
        }
        setUser(authUser)
        const empId = authUser.user_metadata?.employee_id
        if (empId) {
            await loadEmployeeData(empId)
        }
        setLoading(false)
    }

    async function loadEmployeeData(empId: string) {
        // Load profile
        const { data: emp } = await supabase
            .from('applicants')
            .select('*')
            .eq('id', empId)
            .single()
        setProfile(emp)

        // Load attendance
        const { data: att } = await supabase
            .from('attendance')
            .select('*')
            .eq('employee_id', empId)
            .order('date', { ascending: false })
            .limit(30)
        setAttendance(att || [])

        // Load leaves
        const { data: leaves } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('employee_id', empId)
            .order('created_at', { ascending: false })
        setLeaveRequests(leaves || [])

        // Load shifts
        const { data: sh } = await supabase
            .from('shifts')
            .select('*')
            .eq('employee_id', empId)
            .gte('schedule_date', new Date().toISOString().split('T')[0])
            .order('schedule_date', { ascending: true })
        setShifts(sh || [])

        // Load face profile
        const { data: acc } = await supabase
            .from('employee_accounts')
            .select('face_descriptor')
            .eq('employee_id', empId)
            .single()

        if (acc?.face_descriptor) {
            setFaceDescriptor(acc.face_descriptor)
        }
    }

    async function handleClockIn() {
        if (!user?.user_metadata?.employee_id) return
        setScannerType('in')
        setShowScanner(true)
    }

    async function handleClockOut() {
        if (!user?.user_metadata?.employee_id) return
        setScannerType('out')
        setShowScanner(true)
    }

    async function onBiometricMatch() {
        const empId = user.user_metadata.employee_id
        const type = scannerType

        setIsClocking(true)
        try {
            const now = new Date().toISOString()
            const today = now.split('T')[0]

            if (type === 'in') {
                const { data: existing } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('employee_id', empId)
                    .eq('date', today)
                    .single()

                if (existing) {
                    alert('You have already clocked in for today.')
                } else {
                    const { error: insError } = await supabase.from('attendance').insert({
                        employee_id: empId,
                        date: today,
                        clock_in: now,
                        attendance_status: 'Present',
                        hub_location: profile?.hub_location || 'Unknown',
                        job_type: profile?.job_type || 'Unknown'
                    })
                    if (insError) throw insError
                }
            } else {
                const { data: existing } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('employee_id', empId)
                    .eq('date', today)
                    .single()

                if (existing) {
                    const { error: updError } = await supabase.from('attendance')
                        .update({ clock_out: now })
                        .eq('id', existing.id)
                    if (updError) throw updError
                } else {
                    const { error: insError } = await supabase.from('attendance').insert({
                        employee_id: empId,
                        date: today,
                        clock_out: now,
                        attendance_status: 'Present',
                        hub_location: profile?.hub_location || 'Unknown',
                        job_type: profile?.job_type || 'Unknown'
                    })
                    if (insError) throw insError
                }
            }

            loadEmployeeData(empId)
            setTimeout(() => setShowScanner(false), 1500)
        } catch (err) {
            console.error('Clocking error:', err)
            alert('Failed to record attendance. Please try again.')
        } finally {
            setIsClocking(false)
        }
    }

    async function handleSignOut() {
        await supabase.auth.signOut()
        router.replace('/ess/login')
    }

    async function handleSubmitLeave(e: React.FormEvent) {
        e.preventDefault()
        if (!user?.user_metadata?.employee_id) return
        setSubmitLoading(true)
        setSubmitError(null)
        setSubmitSuccess(false)

        const { error } = await supabase.from('leave_requests').insert({
            employee_id: user.user_metadata.employee_id,
            leave_type: leaveForm.leave_type,
            start_date: leaveForm.start_date,
            end_date: leaveForm.end_date,
            reason: leaveForm.reason,
            approval_status: 'Pending'
        })

        if (error) {
            setSubmitError('Failed to submit request. Please try again.')
        } else {
            setSubmitSuccess(true)
            setLeaveForm({ leave_type: 'Sick Leave', start_date: '', end_date: '', reason: '' })
            loadEmployeeData(user.user_metadata.employee_id)
        }
        setSubmitLoading(false)
    }

    const statusColor = (s: string) => {
        if (s === 'Approved') return 'text-green-400 bg-green-500/10 border-green-500/20'
        if (s === 'Rejected') return 'text-red-400 bg-red-500/10 border-red-500/20'
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    }

    const attendanceColor = (s: string) => {
        if (s === 'Present') return 'text-green-400'
        if (s === 'Absent') return 'text-red-400'
        return 'text-yellow-400'
    }

    const getShiftDisplay = (pref: string) => {
        if (!pref) return 'Not Assigned'
        const times: Record<string, string> = {
            'Day': '08:00 AM - 05:00 PM',
            'Morning': '06:00 AM - 02:00 PM',
            'Afternoon': '02:00 PM - 10:00 PM',
            'Night': '10:00 PM - 06:00 AM',
            'Split': '08:00 AM - 05:00 PM',
            'Flexible': 'Flexible Schedule',
        }
        // Handle both "Night" and "Night Shift" inputs
        const key = pref.replace(' Shift', '')
        return `${key} Shift (${times[key] || 'Contact Manager'})`
    }

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="space-y-4 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto" />
                <p className="text-gray-500 text-xs animate-pulse">Loading your portal...</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#070707] text-white">
            {/* Top Nav */}
            <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
                            {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                        </div>
                        <div className="truncate">
                            <p className="text-xs font-bold text-white truncate">{profile?.first_name} {profile?.last_name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider truncate">{profile?.job_type}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-500/60 font-bold uppercase tracking-widest">
                            <ShieldCheck size={11} /> Secure Session
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-red-400 font-bold uppercase tracking-widest transition-colors"
                        >
                            <LogOut size={12} /> Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
                {/* Welcome Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/40 via-black to-black border border-emerald-500/10 p-6 sm:p-8">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <ShieldCheck size={120} className="sm:size-40" />
                    </div>
                    <p className="text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">Welcome back</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{profile?.first_name} {profile?.last_name}</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mt-4 text-[10px] sm:text-[11px] text-gray-500">
                        <span className="flex items-center gap-1.5"><Briefcase size={11} /> {profile?.job_type}</span>
                        <span className="flex items-center gap-1.5"><MapPin size={11} /> {profile?.hub_location}</span>
                        <span className="flex items-center gap-1.5"><Clock size={11} /> {getShiftDisplay(profile?.shift_preference)}</span>
                        <span className="flex items-center gap-1.5 font-mono"><Hash size={11} /> ID: LOG-{profile?.first_name?.substring(0, 2).toUpperCase()}{profile?.id?.substring(0, 6).toUpperCase()}</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-6 pt-6 border-t border-white/5">
                        <div>
                            <div className="text-xl sm:text-2xl font-bold text-white">{attendance.filter(a => a.attendance_status === 'Present').length}</div>
                            <div className="text-[10px] text-gray-600 uppercase font-bold tracking-tighter">Days Present</div>
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-bold text-white">{attendance.filter(a => a.attendance_status === 'Absent').length}</div>
                            <div className="text-[10px] text-gray-600 uppercase font-bold tracking-tighter">Days Absent</div>
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-bold text-white">{leaveRequests.filter(l => l.approval_status === 'Pending').length}</div>
                            <div className="text-[10px] text-gray-600 uppercase font-bold tracking-tighter">Pending Leaves</div>
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-bold text-emerald-400">{shifts.length}</div>
                            <div className="text-[10px] text-emerald-500/60 uppercase font-bold tracking-tighter">Upcoming Shifts</div>
                        </div>
                    </div>
                </div>

                {/* Biometric Attendance Control */}
                <div className="mt-4 sm:mt-8">
                    {!faceDescriptor ? (
                        <Card className="p-4 bg-orange-500/10 border-orange-500/20 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="text-orange-500" size={20} />
                                <p className="text-[11px] sm:text-xs text-orange-200 leading-relaxed">Face recognition not registered. Please see your Hub Manager to register your face profile.</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={handleClockIn}
                                className="p-5 sm:p-8 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-2xl border border-emerald-400/20 shadow-xl shadow-emerald-500/10 flex flex-col items-center justify-center gap-2 sm:gap-3 hover:scale-[1.02] active:scale-95 transition-all group"
                            >
                                <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                                    <LogIn className="text-white" size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-bold text-sm sm:text-lg">TIME IN</p>
                                    <p className="text-emerald-200/60 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-0.5">Start Shift</p>
                                </div>
                            </button>
                            <button
                                onClick={handleClockOut}
                                className="p-5 sm:p-8 bg-gradient-to-br from-gray-800 to-black rounded-2xl border border-white/5 shadow-xl flex flex-col items-center justify-center gap-2 sm:gap-3 hover:scale-[1.02] active:scale-95 transition-all group"
                            >
                                <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                                    <LogOut className="text-white" size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-bold text-sm sm:text-lg">TIME OUT</p>
                                    <p className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-0.5">End Shift</p>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 w-full sm:w-auto overflow-x-auto">
                    {([
                        { key: 'info', label: 'Info', icon: User },
                        { key: 'schedule', label: 'Schedule', icon: Clock },
                        { key: 'attendance', label: 'Attendance', icon: CheckCircle2 },
                        { key: 'leave', label: 'Leave', icon: Calendar },
                    ] as const).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === key ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Icon size={13} /> {label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {activeTab === 'info' && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {[
                                { label: 'Full Name', value: `${profile?.first_name} ${profile?.last_name}`, icon: User },
                                { label: 'Position', value: profile?.job_type, icon: Briefcase },
                                { label: 'Hub Location', value: profile?.hub_location, icon: MapPin },
                                { label: 'Hired Shift', value: getShiftDisplay(profile?.shift_preference), icon: Clock },
                                { label: 'Email', value: profile?.email || user?.email, icon: Mail },
                                { label: 'Phone', value: profile?.phone || 'Not on file', icon: Phone },
                                { label: 'Status', value: profile?.application_status, icon: CheckCircle2 },
                            ].map(({ label, value, icon: Icon }) => (
                                <Card key={label} className="p-5 bg-[#0d0d0d] border-white/5 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                        <Icon size={16} className="text-emerald-400" />
                                    </div>
                                    <div className="truncate">
                                        <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">{label}</p>
                                        <p className="text-sm text-white font-medium mt-0.5 truncate">{value || '—'}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="space-y-4">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Upcoming Assignments</h2>
                            {shifts.length > 0 ? (
                                <div className="grid gap-4">
                                    {shifts.map(s => (
                                        <Card key={s.id} className="p-5 bg-[#0d0d0d] border-white/5 space-y-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                                        <Calendar size={13} />
                                                        <span className="text-[11px] font-bold uppercase tracking-tight">
                                                            {new Date(s.schedule_date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xl font-bold text-white">
                                                        {s.start_time?.substring(0, 5)} - {s.end_time?.substring(0, 5)}
                                                    </p>
                                                </div>
                                                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-bold uppercase text-gray-400">
                                                    {s.shift_type}
                                                </span>
                                            </div>
                                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={11} className="text-gray-600" />
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">{s.hub_location}</span>
                                                </div>
                                                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{s.route_assignment || 'General Duty'}</span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="p-12 border-dashed border-white/5 text-center bg-[#0d0d0d]">
                                    <Clock size={40} className="mx-auto text-gray-800 mb-3" />
                                    <p className="text-gray-500 text-sm">No shifts found.</p>
                                </Card>
                            )}
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div className="space-y-4">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">History</h2>
                            {attendance.length > 0 ? (
                                <div className="grid gap-3">
                                    {attendance.map(a => (
                                        <Card key={a.id} className="p-4 bg-[#0d0d0d] border-white/5 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full ${attendanceColor(a.attendance_status === 'Present' ? 'Present' : 'Absent') === 'text-green-400' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <div>
                                                    <p className="text-sm font-bold text-white">{a.date}</p>
                                                    <p className="text-[10px] text-gray-600 mt-0.5">
                                                        {a.clock_in ? `In: ${new Date(a.clock_in).toLocaleTimeString()}` : ''}
                                                        {a.clock_out ? ` • Out: ${new Date(a.clock_out).toLocaleTimeString()}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${attendanceColor(a.attendance_status)}`}>
                                                {a.attendance_status}
                                            </span>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="p-12 border-dashed border-white/5 text-center bg-[#0d0d0d]">
                                    <Clock size={40} className="mx-auto text-gray-800 mb-3" />
                                    <p className="text-gray-500 text-sm italic">No records found.</p>
                                </Card>
                            )}
                        </div>
                    )}

                    {activeTab === 'leave' && (
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="space-y-4">
                                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Apply Now</h2>
                                <Card className="p-6 bg-[#0d0d0d] border-white/5">
                                    <form onSubmit={handleSubmitLeave} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Leave Type</label>
                                            <select
                                                value={leaveForm.leave_type}
                                                onChange={e => setLeaveForm(p => ({ ...p, leave_type: e.target.value }))}
                                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                                            >
                                                <option>Sick Leave</option>
                                                <option>Vacation Leave</option>
                                                <option>Emergency Leave</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Start</label>
                                                <input
                                                    type="date"
                                                    value={leaveForm.start_date}
                                                    onChange={e => setLeaveForm(p => ({ ...p, start_date: e.target.value }))}
                                                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50 [color-scheme:dark]"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">End</label>
                                                <input
                                                    type="date"
                                                    value={leaveForm.end_date}
                                                    onChange={e => setLeaveForm(p => ({ ...p, end_date: e.target.value }))}
                                                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50 [color-scheme:dark]"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Reason</label>
                                            <textarea
                                                value={leaveForm.reason}
                                                onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))}
                                                rows={3}
                                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50 resize-none"
                                            />
                                        </div>
                                        {submitError && <p className="text-[10px] text-red-500 font-bold uppercase">{submitError}</p>}
                                        {submitSuccess && <p className="text-[10px] text-emerald-500 font-bold uppercase">Success!</p>}
                                        <button
                                            type="submit"
                                            disabled={submitLoading}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-lg transition-all"
                                        >
                                            {submitLoading ? 'Sending...' : 'Submit Request'}
                                        </button>
                                    </form>
                                </Card>
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">History</h2>
                                {leaveRequests.map(l => (
                                    <Card key={l.id} className="p-4 bg-[#0d0d0d] border-white/5 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-bold text-white">{l.leave_type}</p>
                                            <p className="text-[10px] text-gray-600 mt-0.5">{l.start_date} → {l.end_date}</p>
                                        </div>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${statusColor(l.approval_status)}`}>
                                            {l.approval_status}
                                        </span>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Face Scanner Modal */}
            {showScanner && faceDescriptor && (
                <FaceScanner
                    type={scannerType}
                    employeeDescriptor={faceDescriptor}
                    onMatch={onBiometricMatch}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    )
}
