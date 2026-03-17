"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    User,
    Briefcase,
    UserPlus,
    TrendingUp,
    Award,
    Building2,
    BookOpen,
    Target,
    LogOut,
    Clock,
    Calendar,
    FileText,
    CalendarDays,
    Receipt,
    Wallet,
    BarChart3,
    ShieldCheck
} from 'lucide-react'

interface NavLink {
    href: string
    icon: any
    label: string
}

interface SidebarProps {
    departmentId: number
    departmentName: string
    displayName: string
    initials: string
    isOpen: boolean
    onClose: () => void
}

export function Sidebar({ departmentId, departmentName, displayName, initials, isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()

    const navLinks: NavLink[] = [
        { href: `/hr${departmentId}/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
    ]

    const hr1Links = [
        {
            section: 'Talent Acquisition', links: [
                { href: '/hr1/applicants', icon: User, label: 'Applicants' },
                { href: '/hr1/recruitment', icon: Briefcase, label: 'Recruitment' },
            ]
        },
        {
            section: 'Employee Experience', links: [
                { href: '/hr1/onboarding', icon: UserPlus, label: 'Onboarding' },
                { href: '/hr1/performance', icon: TrendingUp, label: 'Performance' },
                { href: '/hr1/recognition', icon: Award, label: 'Recognition' },
            ]
        }
    ]

    const hr2Links = [
        {
            section: 'Development', links: [
                { href: '/hr2/competency', icon: Target, label: 'Competencies' },
                { href: '/hr2/learning', icon: BookOpen, label: 'Learning Library' },
                { href: '/hr2/training', icon: Award, label: 'Training Records' },
            ]
        },
        {
            section: 'Career Pathing', links: [
                { href: '/hr2/succession', icon: TrendingUp, label: 'Succession' },
                { href: '/hr2/ess', icon: User, label: 'My Growth (ESS)' },
            ]
        }
    ]

    const hr3Links = [
        {
            section: 'Time & Attendance', links: [
                { href: '/hr3/time-attendance', icon: Clock, label: 'Attendance' },
                { href: '/hr3/shifts', icon: Calendar, label: 'Shifts & Routes' },
                { href: '/hr3/timesheets', icon: FileText, label: 'Timesheets' },
            ]
        },
        {
            section: 'Welfare & Claims', links: [
                { href: '/hr3/leave', icon: CalendarDays, label: 'Leave Requests' },
                { href: '/hr3/claims', icon: Receipt, label: 'Claims & Refunds' },
            ]
        }
    ]

    const hr4Links = [
        {
            section: 'Financials', links: [
                { href: '/hr4/payroll', icon: Wallet, label: 'Payroll Central' },
                { href: '/hr4/hcm', icon: Building2, label: 'Headcount (HCM)' },
            ]
        },
        {
            section: 'Intelligence', links: [
                { href: '/hr4/benefits', icon: ShieldCheck, label: 'HMO & Benefits' },
                { href: '/hr4/dashboard', icon: BarChart3, label: 'HR Intelligence' },
            ]
        }
    ]

    const isActive = (path: string) => pathname === path

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 border-r border-white/10 flex flex-col bg-[#050505] z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 border border-white rounded bg-white text-[#0a0a0a]">
                            <Building2 size={20} />
                        </div>
                        <span className="font-bold tracking-tight text-lg">LOGIS HR</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 p-3 rounded-md transition-all ${isActive(link.href)
                                ? 'bg-white text-[#0a0a0a] font-semibold'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <link.icon size={18} />
                            <span className="text-sm">{link.label}</span>
                        </Link>
                    ))}

                    {departmentId === 1 && hr1Links.map((group, i) => (
                        <div key={i} className="pt-4 space-y-1">
                            <div className="px-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                                {group.section}
                            </div>
                            {group.links.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-3 p-3 rounded-md transition-all ${isActive(link.href)
                                        ? 'bg-white text-[#0a0a0a] font-semibold'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <link.icon size={18} />
                                    <span className="text-sm">{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    ))}

                    {departmentId === 2 && hr2Links.map((group, i) => (
                        <div key={i} className="pt-4 space-y-1">
                            <div className="px-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                                {group.section}
                            </div>
                            {group.links.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-3 p-3 rounded-md transition-all ${isActive(link.href)
                                        ? 'bg-white text-[#0a0a0a] font-semibold'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <link.icon size={18} />
                                    <span className="text-sm">{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    ))}

                    {departmentId === 3 && hr3Links.map((group, i) => (
                        <div key={i} className="pt-4 space-y-1">
                            <div className="px-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                                {group.section}
                            </div>
                            {group.links.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-3 p-3 rounded-md transition-all ${isActive(link.href)
                                        ? 'bg-white text-[#0a0a0a] font-semibold'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <link.icon size={18} />
                                    <span className="text-sm">{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    ))}

                    {departmentId === 4 && hr4Links.map((group, i) => (
                        <div key={i} className="pt-4 space-y-1">
                            <div className="px-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                                {group.section}
                            </div>
                            {group.links.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-3 p-3 rounded-md transition-all ${isActive(link.href)
                                        ? 'bg-white text-[#0a0a0a] font-semibold'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <link.icon size={18} />
                                    <span className="text-sm">{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <form action="/auth/signout" method="post">
                        <button className="flex w-full items-center gap-3 p-3 rounded-md hover:bg-red-500/10 hover:text-red-500 transition-all text-gray-500 group">
                            <LogOut size={18} className="transition-colors group-hover:text-red-500" />
                            <span className="text-sm font-medium">Sign Out</span>
                        </button>
                    </form>
                </div>
            </aside>
        </>
    )
}
