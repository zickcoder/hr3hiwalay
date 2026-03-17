"use client"

import { useState } from 'react'
import { Sidebar } from './sidebar'
import SecuritySplash from './security-splash'
import { Menu, X } from 'lucide-react'

export default function DepartmentLayoutClient({
    children,
    departmentId,
    departmentName,
    displayName,
    initials,
}: {
    children: React.ReactNode
    departmentId: number
    departmentName: string
    displayName: string
    initials: string
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative">
            <SecuritySplash />

            <Sidebar
                departmentId={departmentId}
                departmentName={departmentName}
                displayName={displayName}
                initials={initials}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-auto flex flex-col min-w-0">
                <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-8 bg-[#0a0a0a] sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-white/5 rounded-md transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1 md:gap-2">
                            <span className="hidden sm:inline">Enterprise System</span>
                            <span className="text-white/20 hidden sm:inline">/</span>
                            <span className="text-white font-medium">{departmentName}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="hidden md:flex flex-col items-end text-right">
                            <span className="text-xs font-semibold">{displayName}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Dept {departmentId} Administrator</span>
                        </div>
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-white/20 flex items-center justify-center text-[10px] md:text-xs font-bold bg-white/5 hover:border-white transition-colors cursor-pointer">
                            {initials}
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-6">
                    {children}
                </main>
            </main>
        </div>
    )
}
