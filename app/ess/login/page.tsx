"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Loader2, User, ArrowLeft } from 'lucide-react'
import { Card, Input, Button } from '@/components/ui-minimal'

export default function ESSLoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showSplash, setShowSplash] = useState(true)
    const [protocolText, setProtocolText] = useState('Initializing Employee Portal...')
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const t1 = setTimeout(() => setProtocolText('Verifying Access Level...'), 400)
        const t2 = setTimeout(() => setProtocolText('Loading Employee Portal...'), 900)
        const t3 = setTimeout(() => setShowSplash(false), 1400)
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError || !user) {
            setError('Access Denied: Invalid credentials.')
            setLoading(false)
            return
        }

        // Only allow employees (role = 'employee') to access this portal
        const role = user.user_metadata?.role
        if (role !== 'employee') {
            await supabase.auth.signOut()
            setError('Access Denied: This portal is for employees only.')
            setLoading(false)
            return
        }

        // Redirect to employee dashboard
        window.location.href = '/ess/dashboard'
    }

    if (showSplash) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6 text-white text-center">
                <div className="space-y-8 animate-pulse">
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping"></div>
                        <div className="absolute inset-0 rounded-full border border-emerald-500/50 flex items-center justify-center">
                            <User className="text-emerald-500" size={40} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-xl font-bold tracking-[0.4em] uppercase text-white">Employee Portal</h1>
                        <p className="text-[10px] text-emerald-500/60 font-mono font-bold uppercase tracking-widest">{protocolText}</p>
                    </div>
                    <div className="w-48 h-1 bg-white/5 mx-auto rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 animate-[ess-loading_1.8s_ease-in-out]"></div>
                    </div>
                </div>
                <style jsx>{`
                    @keyframes ess-loading {
                        0% { width: 0%; }
                        100% { width: 100%; }
                    }
                `}</style>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-6 text-white overflow-hidden relative">
            {/* Background grid */}
            <div
                className="absolute inset-0 opacity-5"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '40px 40px' }}
            />

            <Card className="w-full max-w-md p-10 space-y-8 relative z-10 border-white/5 bg-black/60 backdrop-blur-xl shadow-2xl">
                <div className="text-center space-y-3">
                    <div className="inline-flex p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 mb-4">
                        <User size={24} className="text-emerald-400" />
                    </div>
                    <h1 className="text-[10px] font-bold tracking-[0.5em] uppercase text-emerald-500/60">Freight Logistics</h1>
                    <h2 className="text-2xl font-bold tracking-tight">Employee Self-Service</h2>
                    <p className="text-xs text-gray-500">Log in with your provided credentials to access your account</p>
                </div>

                {error && (
                    <div className="p-3 text-[10px] font-bold border border-red-500/50 text-red-500 rounded bg-red-500/10 uppercase tracking-widest text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1">Employee Email / Login ID</label>
                        <Input
                            type="email"
                            placeholder="lastname.firstname@freight.logistics"
                            className="bg-black/40 border-white/10 text-xs py-5 focus:border-emerald-500/50"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1">Password</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            className="bg-black/40 border-white/10 text-xs py-5 focus:border-emerald-500/50"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg transition-all"
                        disabled={loading}
                    >
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Identity...</>
                        ) : (
                            'Access My Portal'
                        )}
                    </Button>
                </form>

                <div className="text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="text-[9px] font-bold text-gray-600 hover:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
                    >
                        <ArrowLeft size={10} /> Return to Main
                    </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[9px] text-gray-700 font-bold uppercase tracking-widest">
                    <ShieldCheck size={11} className="text-gray-600" />
                    Secure Employee Portal — Powered by Freight HR
                </div>
            </Card>
        </div>
    )
}
