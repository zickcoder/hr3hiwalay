"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
    Calendar,
    Clock,
    User,
    MapPin,
    Plus,
    Truck,
    ArrowRight,
    Search,
    Filter,
    Table,
    Trash2,
    Settings,
    UserCircle
} from 'lucide-react'
import { Card } from '@/components/ui-minimal'

interface Shift {
    id: string
    employee_id: string
    hub_location: string
    job_type: string
    shift_type: string
    route_assignment: string
    linehaul_schedule: string
    start_time: string
    end_time: string
    schedule_date: string
    applicants: {
        first_name: string
        last_name: string
    }
}

export default function ShiftsPage() {
    const [shifts, setShifts] = useState<Shift[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [hubFilter, setHubFilter] = useState('All')

    // Modal State
    const [showSelectionModal, setShowSelectionModal] = useState(false)
    const [showPermanentModal, setShowPermanentModal] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editingId, setEditingId] = useState('')
    const [newShift, setNewShift] = useState({
        employee_id: '',
        shift_type: 'Morning',
        route_assignment: '',
        linehaul_schedule: '',
        schedule_date: new Date().toISOString().split('T')[0],
        start_time: '06:00',
        end_time: '14:00'
    })

    useEffect(() => {
        if (!isEditing && newShift.employee_id) {
            const emp = employees.find(e => e.id === newShift.employee_id)
            if (emp?.shift_preference) {
                setNewShift(prev => ({ ...prev, shift_type: emp.shift_preference }))
            }
        }
    }, [newShift.employee_id, isEditing, employees])

    useEffect(() => {
        fetchShifts()
        fetchEmployees()
    }, [hubFilter])

    async function fetchEmployees() {
        const { data } = await supabase
            .from('applicants')
            .select('id, first_name, last_name, hub_location, job_type, shift_preference')
            .eq('application_status', 'Hired')
        setEmployees(data || [])
    }

    async function fetchShifts() {
        setLoading(true)
        let query = supabase
            .from('shifts')
            .select(`
                *,
                applicants:employee_id (
                    first_name,
                    last_name
                )
            `)
            .order('schedule_date', { ascending: true })

        if (hubFilter !== 'All') {
            query = query.eq('hub_location', hubFilter)
        }

        const { data, error } = await query
        if (error) console.error('Error fetching shifts:', error)
        else setShifts(data || [])
        setLoading(false)
    }

    async function handleDeleteShift(id: string) {
        if (!confirm('Are you sure you want to delete this shift assignment?')) return
        setLoading(true)
        const { error } = await supabase.from('shifts').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchShifts()
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const selectedEmp = employees.find(emp => emp.id === newShift.employee_id)
        if (!selectedEmp) return

        // Auto-calculate times based on shift type
        let start = '06:00'
        let end = '14:00'
        if (newShift.shift_type === 'Afternoon') { start = '14:00'; end = '22:00' }
        if (newShift.shift_type === 'Night') { start = '22:00'; end = '06:00' }
        if (newShift.shift_type === 'Split') { start = '08:00'; end = '17:00' }

        const payload = {
            ...newShift,
            start_time: start,
            end_time: end,
            hub_location: selectedEmp.hub_location,
            job_type: selectedEmp.job_type
        }

        const { error } = isEditing
            ? await supabase.from('shifts').update(payload).eq('id', editingId)
            : await supabase.from('shifts').insert([payload])

        if (error) {
            alert(error.message)
        } else {
            setIsModalOpen(false)
            fetchShifts()
        }
        setLoading(false)
    }

    async function handleUpdatePermanentSchedule(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase
            .from('applicants')
            .update({ shift_preference: newShift.shift_type })
            .eq('id', newShift.employee_id)

        if (error) alert(error.message)
        else {
            setShowPermanentModal(false)
            fetchEmployees()
            alert('Permanent schedule updated successfully.')
        }
        setLoading(false)
    }

    function openEditModal(shift: Shift) {
        setIsEditing(true)
        setEditingId(shift.id)
        setNewShift({
            employee_id: shift.employee_id,
            shift_type: shift.shift_type,
            route_assignment: shift.route_assignment,
            linehaul_schedule: shift.linehaul_schedule,
            schedule_date: shift.schedule_date,
            start_time: shift.start_time,
            end_time: shift.end_time
        })
        setIsModalOpen(true)
    }

    function openNewModal() {
        setIsEditing(false)
        setEditingId('')
        setNewShift({
            employee_id: '',
            shift_type: 'Morning',
            route_assignment: '',
            linehaul_schedule: '',
            schedule_date: new Date().toISOString().split('T')[0],
            start_time: '06:00',
            end_time: '14:00'
        })
        setIsModalOpen(true)
        setShowSelectionModal(false)
    }

    function openPermanentModal() {
        setNewShift(prev => ({ ...prev, employee_id: '' }))
        setShowPermanentModal(true)
        setShowSelectionModal(false)
    }

    const filteredShifts = shifts.filter(s =>
        `${s.applicants?.first_name} ${s.applicants?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Shift & Schedule</h1>
                    <p className="text-sm text-gray-400">Dispatch assignments and warehouse shift rotation</p>
                </div>
                <button
                    onClick={() => setShowSelectionModal(true)}
                    className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                    <Plus size={18} /> Assign Shift / Change Schedule
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search employee or route..."
                        className="w-full bg-black border border-white/10 rounded-md py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500/50 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="bg-black border border-white/10 rounded-md py-2 px-4 text-sm text-white focus:border-blue-500/50 outline-none"
                    value={hubFilter}
                    onChange={(e) => setHubFilter(e.target.value)}
                >
                    <option value="All">All Hubs</option>
                    <option value="Manila North Hub">Manila North Hub</option>
                    <option value="Cebu Central Hub">Cebu Central Hub</option>
                    <option value="Davao Logistics">Davao Logistics</option>
                </select>
            </div>

            {/* Shifts Grid */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                ) : filteredShifts.length > 0 ? (
                    filteredShifts.map((shift) => (
                        <Card key={shift.id} className="p-5 bg-black/40 border-white/10 flex flex-col md:flex-row items-center gap-8 hover:border-blue-500/20 transition-all group">
                            <div className="flex items-center gap-4 w-64">
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                    <User size={20} />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-sm font-bold text-white truncate">{shift.applicants?.first_name} {shift.applicants?.last_name}</h3>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{shift.job_type}</p>
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                                <div>
                                    <span className="text-[9px] text-gray-600 uppercase font-bold block mb-1">Schedule</span>
                                    <div className="flex items-center gap-2 text-xs text-white uppercase tracking-tighter">
                                        <Calendar size={14} className="text-gray-500" />
                                        {new Date(shift.schedule_date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[9px] text-gray-600 uppercase font-bold block mb-1">Shift Hours</span>
                                    <div className="flex items-center gap-2 text-xs text-white">
                                        <Clock size={14} className="text-gray-500" />
                                        {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                                    </div>
                                </div>
                                <div className="lg:col-span-2">
                                    <span className="text-[9px] text-gray-600 uppercase font-bold block mb-1">Assignment / Route</span>
                                    <div className="flex items-center gap-2 text-[11px] text-white">
                                        <Truck size={14} className="text-blue-500" />
                                        <span className="font-bold">{shift.route_assignment || shift.linehaul_schedule || 'Operations Support'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`px-3 py-1 rounded text-[9px] font-bold tracking-widest uppercase border ${shift.shift_type === 'Morning' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                    shift.shift_type === 'Night' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                    }`}>
                                    {shift.shift_type}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => openEditModal(shift)}
                                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                        title="Edit Shift"
                                    >
                                        <Plus size={14} className="rotate-45" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteShift(shift.id)}
                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all"
                                        title="Delete Shift"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white/2 rounded-xl border border-dashed border-white/5">
                        <Table size={48} className="mx-auto text-gray-800 mb-4" />
                        <p className="text-gray-500 text-sm italic">No shifts scheduled for this selection.</p>
                    </div>
                )}
            </div>

            {/* Selection Modal */}
            {showSelectionModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm p-6 bg-[#0a0a0a] border-white/10 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white tracking-tight">What would you like to do?</h2>
                            <button onClick={() => setShowSelectionModal(false)} className="text-gray-500 hover:text-white transition-colors">&times;</button>
                        </div>
                        <div className="grid gap-3">
                            <button
                                onClick={openNewModal}
                                className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-xl flex items-center gap-4 hover:bg-white/[0.07] hover:border-white/20 transition-all text-left group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                                    <Clock size={18} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Assign Daily Shift</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">Record an operational duty for a specific date</p>
                                </div>
                                <Plus size={14} className="ml-auto text-gray-700" />
                            </button>

                            <button
                                onClick={openPermanentModal}
                                className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-xl flex items-center gap-4 hover:bg-white/[0.07] hover:border-white/20 transition-all text-left group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                                    <Settings size={18} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Change Permanent Schedule</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">Update the hired working hours for an employee</p>
                                </div>
                                <ArrowRight size={14} className="ml-auto text-gray-700" />
                            </button>
                        </div>
                        <button
                            onClick={() => setShowSelectionModal(false)}
                            className="w-full py-2.5 text-[10px] uppercase font-black tracking-widest text-gray-500 hover:text-white transition-all"
                        >
                            Cancel
                        </button>
                    </Card>
                </div>
            )}

            {/* Permanent Schedule Modal */}
            {showPermanentModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md p-6 bg-[#0a0a0a] border-white/10 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Change Permanent Schedule</h2>
                                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Core Account Update</p>
                            </div>
                            <button onClick={() => setShowPermanentModal(false)} className="text-gray-500 hover:text-white transition-colors">&times;</button>
                        </div>

                        <form onSubmit={handleUpdatePermanentSchedule} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Employee</label>
                                <select
                                    className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                    value={newShift.employee_id}
                                    onChange={(e) => setNewShift({ ...newShift, employee_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.job_type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">New Standard Shift</label>
                                <select
                                    className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                    value={newShift.shift_type}
                                    onChange={(e) => setNewShift({ ...newShift, shift_type: e.target.value })}
                                >
                                    <option value="Morning">Morning (06:00 - 14:00)</option>
                                    <option value="Afternoon">Afternoon (14:00 - 22:00)</option>
                                    {employees.find(e => e.id === newShift.employee_id)?.job_type !== 'Rider' && (
                                        <option value="Night">Night (22:00 - 06:00)</option>
                                    )}
                                    <option value="Split">Split Shift (08:00 - 17:00)</option>
                                    <option value="Flexible">Flexible Schedule</option>
                                </select>
                            </div>

                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                                <p className="text-[10px] text-emerald-400/80 leading-relaxed italic">
                                    * This will update the employee's official hired preference. This does not create a daily record but changes their primary assignment.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-emerald-500 text-black py-3 rounded-md text-sm font-bold hover:bg-emerald-400 transition-all"
                                >
                                    Update Primary Schedule
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPermanentModal(false)}
                                    className="px-6 bg-white/5 text-white py-3 rounded-md text-sm font-bold border border-white/10 hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Daily Shift Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg p-6 bg-[#0a0a0a] border-white/10 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                {isEditing ? 'Change Schedule' : 'Assign Operational Shift'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Employee</label>
                                <select
                                    className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                    value={newShift.employee_id}
                                    onChange={(e) => setNewShift({ ...newShift, employee_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.job_type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Schedule Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                        value={newShift.schedule_date}
                                        onChange={(e) => setNewShift({ ...newShift, schedule_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Shift Type</label>
                                    <select
                                        className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                        value={newShift.shift_type}
                                        onChange={(e) => setNewShift({ ...newShift, shift_type: e.target.value })}
                                    >
                                        <option value="Morning">Morning (06:00 - 14:00)</option>
                                        <option value="Afternoon">Afternoon (14:00 - 22:00)</option>
                                        {employees.find(e => e.id === newShift.employee_id)?.job_type !== 'Rider' && (
                                            <option value="Night">Night (22:00 - 06:00)</option>
                                        )}
                                        <option value="Split">Split Shift (08:00 - 17:00)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Route / Operations Assignment</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Route A-102 (Main Hub to Bulacan)"
                                    className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                    value={newShift.route_assignment}
                                    onChange={(e) => setNewShift({ ...newShift, route_assignment: e.target.value })}
                                />
                            </div>

                            {/* Explicit Start/End removed per user request for simplicity */}

                            <div className="flex gap-3 pt-6">
                                <button
                                    type="submit"
                                    className="flex-1 bg-white text-black py-3 rounded-md text-sm font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : isEditing ? 'Update Schedule' : 'Confirm Assignment'}
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
