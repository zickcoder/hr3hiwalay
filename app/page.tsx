import Link from 'next/link'
import { ShieldCheck, User } from 'lucide-react'
import { Card } from '@/components/ui-minimal'

export default function Home() {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 space-y-12">
            <div className="text-center space-y-4">
                <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 mb-2">
                    <ShieldCheck size={32} />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Enterprise HR Gateway</h1>
                <p className="text-gray-500 max-w-md mx-auto text-sm uppercase tracking-[0.2em] font-medium">
                    Secure Access Portal • Logistics Network
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 w-full max-w-4xl">
                {/* HR3 Module Card */}
                <Link href="/hr3/dashboard" className="group">
                    <Card className="p-8 h-full bg-black/40 border-white/5 hover:border-blue-500/30 transition-all hover:scale-[1.02] cursor-pointer flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <ShieldCheck size={32} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold tracking-tight">HR3 Module</h2>
                            <p className="text-xs text-gray-500 leading-relaxed uppercase tracking-widest">Workforce Operations & Shift Management</p>
                        </div>
                        <div className="pt-4 w-full">
                            <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest py-2 border border-blue-500/20 rounded-lg group-hover:bg-blue-500/10">Authorize Admin Entry</div>
                        </div>
                    </Card>
                </Link>

                {/* ESS Portal Card */}
                <Link href="/ess/dashboard" className="group">
                    <Card className="p-8 h-full bg-black/40 border-white/5 hover:border-emerald-500/30 transition-all hover:scale-[1.02] cursor-pointer flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <User size={32} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold tracking-tight">Employee Portal</h2>
                            <p className="text-xs text-gray-500 leading-relaxed uppercase tracking-widest">Self-Service, Attendance & Leave</p>
                        </div>
                        <div className="pt-4 w-full">
                            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest py-2 border border-emerald-500/20 rounded-lg group-hover:bg-emerald-500/10">Authorized Employee Clock-In</div>
                        </div>
                    </Card>
                </Link>
            </div>

            <div className="text-[10px] text-gray-700 uppercase tracking-widest font-bold">
                Logged in as Authorized Personnel Only
            </div>
        </div>
    )
}
