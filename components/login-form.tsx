"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Card } from '@/components/ui-minimal'
import { Loader2, ShieldCheck, Building2 } from 'lucide-react'

export default function LoginPage({ departmentId, departmentName }: { departmentId: number, departmentName: string }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showSplash, setShowSplash] = useState(true)
    const [protocolText, setProtocolText] = useState('Initiating Security Protocol...')
    const [attempts, setAttempts] = useState(0)

    // OTP State
    const [showOtpModal, setShowOtpModal] = useState(false)
    const [otpCode, setOtpCode] = useState('')
    const [otpError, setOtpError] = useState<string | null>(null)
    const [otpLoading, setOtpLoading] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const timer1 = setTimeout(() => setProtocolText('Verifying Terminal...'), 400)
        const timer2 = setTimeout(() => setProtocolText('Connecting Database...'), 800)
        const timer3 = setTimeout(() => setShowSplash(false), 1200)
        return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); }
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()


        setLoading(true)
        setError(null)

        const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError) {
            setError(`ACCESS DENIED: Terminal Authorization Failed`)
            setLoading(false)
            return
        }

        if (user) {
            const userDept = parseInt(user.user_metadata?.department_id)
            if (!userDept || userDept !== departmentId) {
                setError("ACCESS DENIED: Department Mismatch Detected")
                setLoading(false)
                return
            }
            // Clear attempts on success
            setAttempts(0)

            // Intercept for OTP Verification
            try {
                const res = await fetch('/api/auth/otp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                })

                const data = await res.json()

                if (data.success) {
                    setShowOtpModal(true)
                } else {
                    setError("Failed to initiate security verification.")
                }
            } catch (err) {
                setError("Network error during security verification.")
            }
            setLoading(false)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setOtpLoading(true)
        setOtpError(null)

        try {
            const res = await fetch('/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: otpCode })
            })

            const data = await res.json()

            if (data.success) {
                // Use window.location.href instead of router.push to force a hard navigation
                // This clears Next.js client-side cache and guarantees middleware sees the fresh auth cookies
                window.location.href = `/hr${departmentId}/dashboard`
            } else {
                setOtpError(data.error || "Invalid verification code.")
            }
        } catch (err) {
            setOtpError("Network error during verification.")
        }
        setOtpLoading(false)
    }

    const handleResendOtp = async () => {
        setResendLoading(true)
        setOtpError(null)
        try {
            const res = await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            })

            const data = await res.json()

            if (data.success) {
                setOtpError("A new code has been sent.")
            } else {
                setOtpError("Failed to resend code.")
            }
        } catch (err) {
            setOtpError("Network error.")
        }
        setResendLoading(false)
    }

    if (showSplash) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6 text-white text-center">
                <div className="space-y-8 animate-pulse">
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping"></div>
                        <div className="absolute inset-0 rounded-full border border-blue-500/50 flex items-center justify-center">
                            <ShieldCheck className="text-blue-500" size={40} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-xl font-bold tracking-[0.4em] uppercase text-white">Welcome Admin</h1>
                        <p className="text-[10px] text-blue-500/60 font-mono font-bold uppercase tracking-widest">{protocolText}</p>
                    </div>
                    <div className="w-48 h-1 bg-white/5 mx-auto rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 animate-[loading_2.4s_ease-in-out]"></div>
                    </div>
                </div>
                <style jsx>{`
                    @keyframes loading {
                        0% { width: 0%; transform: translateX(-100%); }
                        50% { width: 50%; }
                        100% { width: 100%; transform: translateX(0); }
                    }
                `}</style>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-6 text-white overflow-hidden relative">
            {/* High-tech background grid */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

            {/* OTP Modal */}
            {showOtpModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-sm p-8 space-y-6 border-blue-500/30 bg-[#050505] shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] text-center animate-in zoom-in duration-300">
                        <ShieldCheck className="mx-auto text-blue-500 mb-2" size={48} />
                        <h2 className="text-xl font-bold tracking-[0.2em] uppercase text-white">Identity Verification</h2>
                        <p className="text-xs text-gray-400">A verification code has been sent to confirm your identity. Please enter the code to continue.</p>

                        {otpError && (
                            <div className={`p-2 text-[10px] font-bold border rounded uppercase tracking-widest ${otpError.includes('sent') ? 'border-green-500/50 text-green-500 bg-green-500/10' : 'border-red-500/50 text-red-500 bg-red-500/10'}`}>
                                {otpError}
                            </div>
                        )}

                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <Input
                                type="text"
                                placeholder="000000"
                                maxLength={6}
                                className="bg-white/5 border-white/20 text-center text-2xl tracking-[0.5em] py-6 font-mono focus:border-blue-500/50"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                required
                            />

                            <Button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest text-[10px]" disabled={otpLoading}>
                                {otpLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify Identity'}
                            </Button>
                        </form>

                        <div className="flex items-center justify-between w-full px-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowOtpModal(false)
                                    setOtpCode('')
                                    setOtpError(null)
                                }}
                                className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={resendLoading}
                                className="text-[10px] text-blue-500/80 hover:text-blue-400 uppercase tracking-widest font-bold disabled:opacity-50 transition-colors"
                            >
                                {resendLoading ? 'Sending...' : 'Resend Code'}
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            <Card className="w-full max-w-md p-10 space-y-8 relative z-10 border-white/5 bg-black/60 backdrop-blur-xl shadow-2xl">
                <div className="text-center space-y-3">
                    <div className="inline-flex p-3 rounded-lg border border-white/10 bg-white/5 mb-4 text-gray-400">
                        <Building2 size={24} />
                    </div>
                    <h1 className="text-xs font-bold tracking-[0.5em] uppercase text-gray-500">{departmentName}</h1>
                    <h2 className="text-2xl font-bold tracking-tight">Terminal Authentication</h2>
                </div>

                {error && (
                    <div className="p-3 text-[10px] font-bold border border-red-500/50 text-red-500 rounded bg-red-500/10 uppercase tracking-widest text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1">Admin Identifier</label>
                        <Input
                            type="email"
                            placeholder="admin@freight.logistics"
                            className="bg-black/40 border-white/10 text-xs py-5 focus:border-blue-500/50"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1">Access Cipher</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            className="bg-black/40 border-white/10 text-xs py-5 focus:border-blue-500/50"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full py-6 bg-white text-blue-600 hover:bg-gray-200 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-white/5" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Authenticating...
                            </>
                        ) : (
                            'Authorize Entry'
                        )}
                    </Button>
                </form>

                <div className="text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="text-[9px] font-bold text-gray-600 hover:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
                    >
                        <span>← Return to Command Center</span>
                    </button>
                </div>
            </Card>
        </div>
    )
}
