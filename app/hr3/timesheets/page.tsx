"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
    Table,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    FileText,
    TrendingUp,
    Check,
    X,
    Search,
    Download
} from 'lucide-react'
import { Card } from '@/components/ui-minimal'

interface Timesheet {
    id: string
    employee_id: string
    month: string
    total_hours: number
    overtime_hours: number
    late_minutes_total: number
    approval_status: string
    approved_by: string
    applicants: {
        first_name: string
        last_name: string
    }
}

export default function TimesheetsPage() {
    const [timesheets, setTimesheets] = useState<Timesheet[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [monthFilter, setMonthFilter] = useState(new Date().toISOString().substring(0, 7))

    useEffect(() => {
        fetchTimesheets()
    }, [monthFilter])

    async function fetchTimesheets() {
        setLoading(true)
        const { data, error } = await supabase
            .from('timesheets')
            .select(`
                *,
                applicants:employee_id (
                    first_name,
                    last_name
                )
            `)
            .eq('month', monthFilter)
            .order('created_at', { ascending: false })

        if (error) console.error('Error fetching timesheets:', error)
        else setTimesheets(data || [])
        setLoading(false)
    }

    async function handleApproval(id: string, status: string) {
        if (loading) return
        setLoading(true)
        const { error } = await supabase
            .from('timesheets')
            .update({
                approval_status: status,
                approved_by: 'HR Manager'
            })
            .eq('id', id)

        if (error) alert(error.message)
        else fetchTimesheets()
        setLoading(false)
    }

    async function generateTimesheets() {
        if (loading) return
        setLoading(true)
        const { data: hiredEmployees } = await supabase
            .from('applicants')
            .select('id')
            .eq('application_status', 'Hired')

        if (hiredEmployees) {
            for (const emp of hiredEmployees) {
                const { data: existing } = await supabase
                    .from('timesheets')
                    .select('id')
                    .eq('employee_id', emp.id)
                    .eq('month', monthFilter)
                    .single()

                if (!existing) {
                    await supabase.from('timesheets').insert([{
                        employee_id: emp.id,
                        month: monthFilter,
                        total_hours: 160 + Math.floor(Math.random() * 20),
                        overtime_hours: Math.floor(Math.random() * 15),
                        late_minutes_total: Math.floor(Math.random() * 120),
                        approval_status: 'Pending'
                    }])
                }
            }
        }
        fetchTimesheets()
    }

    const filteredRecords = timesheets.filter(t =>
        `${t.applicants?.first_name} ${t.applicants?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Timesheet Management</h1>
                    <p className="text-sm text-gray-400">Monthly working hours and overtime reconciliation</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={generateTimesheets}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all border border-blue-500/50 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                        <TrendingUp size={16} /> Aggregate Data
                    </button>
                    <button className="flex items-center gap-2 bg-white/5 text-gray-400 px-4 py-2 rounded-lg text-sm font-bold border border-white/10 hover:bg-white/10 hover:text-white transition-all">
                        <Download size={18} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Hub Filters */}
            <Card className="p-4 bg-black/40 border-white/10 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search employee or ID..."
                        className="w-full bg-black border border-white/10 rounded-md py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500/50 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <input
                        type="month"
                        className="bg-black border border-white/10 rounded-md py-2 px-4 text-sm text-white focus:border-blue-500/50 outline-none w-full md:w-48"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                    />
                </div>
            </Card>

            {/* Timesheets List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                ) : filteredRecords.length > 0 ? (
                    filteredRecords.map((t) => (
                        <Card key={t.id} className="p-5 bg-[#0d0d0d] border-white/10 flex flex-col lg:flex-row items-center gap-8 hover:border-white/20 transition-all relative group">
                            <div className="flex items-center gap-4 w-64 shrink-0">
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
                                    <User size={18} />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-sm font-bold text-white truncate">{t.applicants?.first_name} {t.applicants?.last_name}</h3>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{t.month}</p>
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8 w-full border-l border-white/5 pl-8">
                                <div>
                                    <span className="text-[9px] text-gray-600 uppercase font-bold block mb-1 tracking-tighter">Reg Hours</span>
                                    <div className="flex items-center gap-2 text-xs text-white">
                                        <Clock size={14} className="text-gray-500" />
                                        {t.total_hours} hrs
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[9px] text-gray-600 uppercase font-bold block mb-1 tracking-tighter">Overtime</span>
                                    <div className="flex items-center gap-2 text-xs text-blue-400 font-bold">
                                        <TrendingUp size={14} className="text-blue-500" />
                                        {t.overtime_hours} hrs
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[9px] text-gray-600 uppercase font-bold block mb-1 tracking-tighter">Total late</span>
                                    <div className={`text-xs font-bold ${t.late_minutes_total > 30 ? 'text-red-500' : 'text-gray-400'}`}>
                                        {t.late_minutes_total} mins
                                    </div>
                                </div>
                                <div className="flex items-center justify-end md:justify-start">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${t.approval_status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                        t.approval_status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                        }`}>
                                        {t.approval_status.toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {t.approval_status === 'Pending' && (
                                    <>
                                        <button
                                            onClick={() => handleApproval(t.id, 'Approved')}
                                            disabled={loading}
                                            className="p-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-md hover:bg-green-500 hover:text-white transition-all disabled:opacity-50"
                                            title="Approve Timesheet"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleApproval(t.id, 'Rejected')}
                                            disabled={loading}
                                            className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                                            title="Reject Timesheet"
                                        >
                                            <X size={18} />
                                        </button>
                                    </>
                                )}
                                <button className="p-2 bg-white/5 text-gray-400 border border-white/10 rounded-md hover:text-white transition-all" title="View Details">
                                    <FileText size={18} />
                                </button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white/2 rounded-xl border border-dashed border-white/5">
                        <FileText size={48} className="mx-auto text-gray-800 mb-4" />
                        <p className="text-gray-500 text-sm italic">No timesheets generated for {monthFilter}.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
