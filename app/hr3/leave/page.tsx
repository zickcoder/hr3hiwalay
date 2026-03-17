"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    AlertTriangle,
    Plus,
    CalendarCheck,
    Search,
    ChevronRight,
    MessageSquare,
    ArrowRight
} from 'lucide-react'
import { Card } from '@/components/ui-minimal'

interface LeaveRequest {
    id: string
    employee_id: string
    leave_type: string
    start_date: string
    end_date: string
    reason: string
    approval_status: string
    approved_by: string
    applicants: {
        first_name: string
        last_name: string
        hub_location: string
    }
}

export default function LeavePage() {
    const [requests, setRequests] = useState<LeaveRequest[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [newRequest, setNewRequest] = useState({
        employee_id: '',
        leave_type: 'Vacation',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: ''
    })

    useEffect(() => {
        fetchRequests()
        fetchEmployees()
    }, [])

    async function fetchEmployees() {
        const { data } = await supabase
            .from('applicants')
            .select('id, first_name, last_name, hub_location')
            .eq('application_status', 'Hired')
        setEmployees(data || [])
    }

    async function fetchRequests() {
        setLoading(true)
        const { data, error } = await supabase
            .from('leave_requests')
            .select(`
                *,
                applicants:employee_id (
                    first_name,
                    last_name,
                    hub_location
                )
            `)
            .order('start_date', { ascending: false })

        if (error) console.error('Error fetching leave requests:', error)
        else setRequests(data || [])
        setLoading(false)
    }

    async function handleApproval(id: string, status: string) {
        if (loading) return
        setLoading(true)
        const { error } = await supabase
            .from('leave_requests')
            .update({
                approval_status: status,
                approved_by: 'HR Manager'
            })
            .eq('id', id)

        if (error) alert(error.message)
        else fetchRequests()
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (loading) return
        setLoading(true)

        const { error } = await supabase.from('leave_requests').insert([newRequest])

        if (error) {
            alert(error.message)
        } else {
            setIsModalOpen(false)
            fetchRequests()
        }
        setLoading(false)
    }

    const filteredRequests = requests.filter(r =>
        `${r.applicants?.first_name} ${r.applicants?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Leave Management</h1>
                    <p className="text-sm text-gray-400">Handle time-off requests and staffing coverage</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all"
                >
                    <Plus size={18} /> New Request
                </button>
            </div>

            {/* Warning Alert Concept */}
            <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex items-center gap-4">
                <div className="p-2 bg-yellow-500/10 rounded-full text-yellow-500">
                    <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-tight">Staffing Warning</h4>
                    <p className="text-[10px] text-gray-500">Manila North Hub has 4 active leaves for next week. Peak capacity reduced by 15%.</p>
                </div>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                ) : filteredRequests.length > 0 ? (
                    filteredRequests.map((req) => (
                        <Card key={req.id} className="p-5 bg-black/40 border-white/10 flex flex-col md:flex-row items-center gap-8 group hover:border-white/20 transition-all">
                            <div className="flex items-center gap-4 w-64 shrink-0">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                                    {req.applicants?.first_name?.charAt(0)}{req.applicants?.last_name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">{req.applicants?.first_name} {req.applicants?.last_name}</h3>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{req.applicants?.hub_location}</p>
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                                <div>
                                    <span className="text-[9px] text-gray-600 uppercase font-bold block mb-1">Leave Type</span>
                                    <div className="flex items-center gap-2 text-xs text-white">
                                        <CalendarCheck size={14} className="text-purple-500" />
                                        {req.leave_type}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[9px] text-gray-600 uppercase font-bold block mb-1">Duration</span>
                                    <div className="text-xs text-white tracking-tighter font-medium">
                                        {new Date(req.start_date).toLocaleDateString()} <ArrowRight size={10} className="inline mx-1 text-gray-500" /> {new Date(req.end_date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <span className="text-[9px] text-gray-600 uppercase font-bold block mb-1">Reason</span>
                                    <div className="text-[10px] text-gray-400 italic truncate w-32" title={req.reason}>
                                        "{req.reason || 'No reason provided'}"
                                    </div>
                                </div>
                                <div className="flex items-center justify-end md:justify-start">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${req.approval_status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                        req.approval_status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                        }`}>
                                        {req.approval_status.toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {req.approval_status === 'Pending' && (
                                    <>
                                        <button
                                            onClick={() => handleApproval(req.id, 'Approved')}
                                            disabled={loading}
                                            className="bg-white text-black text-[10px] font-bold px-3 py-1.5 rounded hover:bg-gray-200 transition-all uppercase disabled:opacity-50"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleApproval(req.id, 'Rejected')}
                                            disabled={loading}
                                            className="bg-white/5 text-gray-400 text-[10px] font-bold px-3 py-1.5 rounded border border-white/10 hover:text-white transition-all uppercase disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white/2 rounded-xl border border-dashed border-white/5">
                        <Calendar size={48} className="mx-auto text-gray-800 mb-4" />
                        <p className="text-gray-500 text-sm italic">No leave requests found.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg p-6 bg-[#0a0a0a] border-white/10 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white tracking-tight">Request Time Off</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Employee</label>
                                <select
                                    className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                    value={newRequest.employee_id}
                                    onChange={(e) => setNewRequest({ ...newRequest, employee_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Leave Type</label>
                                    <select
                                        className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                        value={newRequest.leave_type}
                                        onChange={(e) => setNewRequest({ ...newRequest, leave_type: e.target.value })}
                                    >
                                        <option value="Vacation">Vacation</option>
                                        <option value="Sick Leave">Sick Leave</option>
                                        <option value="Emergency">Emergency</option>
                                        <option value="Maternity/Paternity">Maternity/Paternity</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Balance Check</label>
                                    <div className="p-3 bg-white/5 border border-dashed border-white/10 rounded text-[10px] text-blue-400 font-bold text-center">
                                        EST. 15 DAYS REMAINING
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                        value={newRequest.start_date}
                                        onChange={(e) => setNewRequest({ ...newRequest, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                        value={newRequest.end_date}
                                        onChange={(e) => setNewRequest({ ...newRequest, end_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reason / Coverage Notes</label>
                                <textarea
                                    className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none min-h-[100px]"
                                    placeholder="Brief explanation for leave..."
                                    value={newRequest.reason}
                                    onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-white text-black py-3 rounded-md text-sm font-bold hover:bg-gray-200 transition-all"
                                >
                                    Submit Request
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-white/5 text-white py-3 rounded-md text-sm font-bold border border-white/10"
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
