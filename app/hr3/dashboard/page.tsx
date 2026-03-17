"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
    Users,
    Clock,
    Calendar,
    Zap,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    MapPin,
    AlertCircle
} from 'lucide-react'
import { Card } from '@/components/ui-minimal'

export default function HR3Dashboard() {
    const [stats, setStats] = useState({
        presentToday: 0,
        lateToday: 0,
        onLeave: 0,
        monthlyOT: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardStats()
    }, [])

    async function fetchDashboardStats() {
        try {
            const today = new Date().toISOString().split('T')[0]

            // 1. Employees Present Today
            const { count: presentCount } = await supabase
                .from('attendance')
                .select('*', { count: 'exact', head: true })
                .eq('date', today)
                .eq('attendance_status', 'Present')

            // 2. Late Employees
            const { count: lateCount } = await supabase
                .from('attendance')
                .select('*', { count: 'exact', head: true })
                .eq('date', today)
                .eq('attendance_status', 'Late')

            // 3. On Leave
            const { count: leaveCount } = await supabase
                .from('leave_requests')
                .select('*', { count: 'exact', head: true })
                .eq('approval_status', 'Approved')
                .lte('start_date', today)
                .gte('end_date', today)

            // 4. Overtime (Demo calculation for current month)
            const { data: otData } = await supabase
                .from('timesheets')
                .select('overtime_hours')
            // .eq('month', today.substring(0, 7))

            const totalOT = otData?.reduce((acc, curr) => acc + (Number(curr.overtime_hours) || 0), 0) || 0

            setStats({
                presentToday: presentCount || 0,
                lateToday: lateCount || 0,
                onLeave: leaveCount || 0,
                monthlyOT: totalOT
            })
        } catch (error) {
            console.error('Error fetching HR3 stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-white">Workforce Operations Dashboard</h1>
                <p className="text-sm text-gray-400">Real-time attendance, shifts, and operational metrics</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4 bg-black/40 border-white/10 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Present Today</span>
                        <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
                            <Users size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white tracking-tight">{stats.presentToday}</div>
                    <div className="flex items-center gap-1 text-[10px] text-green-500 mt-1 font-bold">
                        <ArrowUpRight size={10} /> 92% Attendance Rate
                    </div>
                </Card>

                <Card className="p-4 bg-black/40 border-white/10 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Late Arrivals</span>
                        <div className="p-1.5 bg-yellow-500/10 rounded-lg text-yellow-500">
                            <Clock size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white tracking-tight">{stats.lateToday}</div>
                    <div className="flex items-center gap-1 text-[10px] text-yellow-500/50 mt-1">
                        Requires hub attention
                    </div>
                </Card>

                <Card className="p-4 bg-black/40 border-white/10 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">On Leave Today</span>
                        <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-500">
                            <Calendar size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white tracking-tight">{stats.onLeave}</div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                        Approved requests
                    </div>
                </Card>

                <Card className="p-4 bg-black/40 border-white/10 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Monthly Overtime</span>
                        <div className="p-1.5 bg-green-500/10 rounded-lg text-green-500">
                            <Zap size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white tracking-tight">{stats.monthlyOT}h</div>
                    <div className="flex items-center gap-1 text-[10px] text-blue-400 mt-1">
                        Proj: 420h this month
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Attendance Distribution */}
                <Card className="p-6 bg-black/40 border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-semibold text-white">Hub-wise Attendance</h3>
                        <MapPin size={16} className="text-gray-500" />
                    </div>
                    <div className="space-y-4">
                        {[
                            { hub: 'Manila North Hub', present: 142, total: 150, color: 'bg-blue-500' },
                            { hub: 'Cebu Central Hub', present: 88, total: 95, color: 'bg-blue-400' },
                            { hub: 'Davao Logistics', present: 64, total: 70, color: 'bg-blue-600' },
                            { hub: 'Bulacan Sorting', present: 110, total: 125, color: 'bg-blue-700' },
                        ].map((item, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between items-end">
                                    <span className="text-[11px] font-medium text-gray-400">{item.hub}</span>
                                    <span className="text-xs font-bold text-white">{Math.round((item.present / item.total) * 100)}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${item.color} transition-all duration-1000`}
                                        style={{ width: `${(item.present / item.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Overtime Trends */}
                <Card className="p-6 bg-black/40 border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-semibold text-white">Overtime Utilization</h3>
                        <BarChart3 size={16} className="text-gray-500" />
                    </div>
                    <div className="flex items-end justify-between h-40 gap-2 px-2">
                        {[40, 65, 30, 85, 45, 90, 60].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-blue-500/20 border border-blue-500/30 rounded-t-sm group-hover:bg-blue-500/40 transition-all duration-500 relative"
                                    style={{ height: `${h}%` }}
                                >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {h}h
                                    </div>
                                </div>
                                <span className="text-[9px] text-gray-600 uppercase font-bold tracking-tighter">Day {i + 1}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Critical Alerts */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 tracking-[0.2em]">Operations Alerts</h3>
                <div className="grid gap-3">
                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-4 group hover:bg-red-500/10 transition-colors">
                        <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
                            <AlertCircle size={18} />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-white">Understaffing Warning: Bulacan Sorting</div>
                            <div className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">Hub capacity at 72%. 5 approved leaves for night shift. Recommend rerouting parcels to Valenzuela.</div>
                        </div>
                        <button className="text-[10px] font-bold text-red-400 uppercase tracking-widest px-3 py-1.5 border border-red-500/20 rounded-md hover:bg-red-500/20">Review Staffing</button>
                    </div>

                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex items-center gap-4 group hover:bg-yellow-500/10 transition-colors">
                        <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                            <Clock size={18} />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-white">Unsigned Timesheets: February 2024</div>
                            <div className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">42 riders in Manila North have pending timesheet approvals. Deadline for payroll export is in 2 days.</div>
                        </div>
                        <button className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest px-3 py-1.5 border border-yellow-500/20 rounded-md hover:bg-yellow-500/20">Go to Timesheets</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
