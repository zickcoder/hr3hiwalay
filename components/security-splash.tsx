"use client"

import { useState, useEffect } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'

export default function SecuritySplash() {
    const [isVisible, setIsVisible] = useState(true)
    const [progress, setProgress] = useState(0)
    const [binaryText, setBinaryText] = useState('')

    useEffect(() => {
        // Generate binary text ONLY on client to avoid hydration mismatch
        const text = Array(2000).fill(0).map(() => (Math.random() > 0.5 ? '1' : '0')).join('')
        setBinaryText(text)

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setTimeout(() => setIsVisible(false), 200)
                    return 100
                }
                return prev + 10 // Much faster progress
            })
        }, 30)
        return () => clearInterval(interval)
    }, [])

    if (!isVisible) return null

    return (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center p-6 transition-opacity duration-500">
            {/* Binary Background Effect */}
            <div className="absolute inset-0 opacity-[0.03] text-blue-500 font-mono text-[10px] select-none break-words overflow-hidden leading-none">
                {binaryText}
            </div>

            <div className="relative space-y-8 text-center z-10">
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 rounded-full border border-blue-600/30 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full border border-white/10 flex items-center justify-center bg-black/40 backdrop-blur-md">
                        <ShieldCheck className="text-blue-500" size={40} />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-xl font-bold tracking-[0.4em] uppercase text-white animate-pulse">Welcome Admin</h1>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-[0.2em]">Establishing Encrypted Stream...</span>
                        <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-100 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-[8px] text-gray-700 font-bold uppercase tracking-[0.1em]">
                    <Loader2 size={10} className="animate-spin" />
                    Secure Logistics Link Verified
                </div>
            </div>
        </div>
    )
}
