"use client"

import { useEffect, useRef, useState } from 'react'
import * as faceapi from 'face-api.js'
import { Camera, CheckCircle2, AlertCircle, Scan, X, RefreshCw, LogIn, LogOut } from 'lucide-react'
import { Card } from './ui-minimal'

interface FaceScannerProps {
    employeeDescriptor: number[]
    onMatch: () => void
    onClose: () => void
    type: 'in' | 'out'
}

export function FaceScanner({ employeeDescriptor, onMatch, onClose, type }: FaceScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [status, setStatus] = useState<'initializing' | 'ready' | 'scanning' | 'matched' | 'error'>('initializing')
    const [errorMessage, setErrorMessage] = useState('')
    const [isModelsLoaded, setIsModelsLoaded] = useState(false)
    const [matchScore, setMatchScore] = useState<number | null>(null)

    useEffect(() => {
        const load = async () => {
            try {
                const MODEL_URL = '/models'
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ])
                setIsModelsLoaded(true)
                startCamera()
            } catch (err) {
                console.error('FaceAPI Init Error:', err)
                setStatus('error')
                setErrorMessage('Failed to load recognition models.')
            }
        }
        load()

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    async function startCamera() {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
            setStatus('ready')
        } catch (err) {
            console.error('Camera Error:', err)
            setStatus('error')
            setErrorMessage('Could not access camera for face verification.')
        }
    }

    async function handleScan() {
        if (!videoRef.current || !canvasRef.current || !isModelsLoaded) return

        const scan = async () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || status === 'matched' || status === 'error') return

            const result = await faceapi.detectSingleFace(
                videoRef.current!,
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceDescriptor()

            if (result) {
                const distance = faceapi.euclideanDistance(result.descriptor, new Float32Array(employeeDescriptor))
                setMatchScore(distance)

                if (distance < 0.5) {
                    setStatus('matched')
                    onMatch()
                    return
                }

                setStatus('scanning')

                // Draw detection feedback
                const displaySize = { width: 640, height: 480 }
                faceapi.matchDimensions(canvasRef.current!, displaySize)
                const ctx = canvasRef.current!.getContext('2d')
                if (ctx) {
                    ctx.clearRect(0, 0, 640, 480)
                    const { x, y, width, height } = result.detection.box
                    ctx.strokeStyle = '#3b82f6'
                    ctx.lineWidth = 2
                    ctx.strokeRect(x, y, width, height)
                }
            } else {
                setMatchScore(null)
                const ctx = canvasRef.current?.getContext('2d')
                if (ctx) ctx.clearRect(0, 0, 640, 480)
            }

            requestAnimationFrame(scan)
        }

        scan()
    }

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4">
            <Card className="w-full max-w-lg bg-[#0a0a0a] border-white/10 overflow-hidden shadow-2xl rounded-2xl">
                <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                            {type === 'in' ? <LogIn size={20} className="text-emerald-500" /> : <LogOut size={20} className="text-emerald-500" />}
                            Face Verify {type === 'in' ? 'Time In' : 'Time Out'}
                        </h2>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Biometric Authentication</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        onPlay={handleScan}
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                    />
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{ transform: 'scaleX(-1)' }}
                    />

                    {/* Scanner Grid Effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(16,185,129,0)_50%,rgba(16,185,129,0.1)_50%),linear-gradient(90deg,rgba(16,185,129,0)_50%,rgba(16,185,129,0.1)_50%)] bg-[length:20px_20px]" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-scan-line" />

                    {status === 'initializing' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                            <RefreshCw className="text-emerald-500 animate-spin mb-4" size={32} />
                            <p className="text-xs font-bold text-white uppercase tracking-widest animate-pulse">Syncing Secure AI...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 z-10 p-8 text-center">
                            <AlertCircle className="text-red-500 mb-4" size={48} />
                            <p className="text-sm text-gray-400">{errorMessage}</p>
                            <button onClick={startCamera} className="mt-4 text-xs font-bold uppercase text-white hover:underline">Retry Connection</button>
                        </div>
                    )}

                    {status === 'matched' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-500/20 backdrop-blur-sm z-20">
                            <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                                <CheckCircle2 className="text-white" size={48} />
                            </div>
                            <p className="text-xl font-bold text-white mt-6 uppercase tracking-tighter">Identity Verified</p>
                            <p className="text-xs text-emerald-400 mt-2 font-bold uppercase tracking-widest">{type === 'in' ? 'Clocking In...' : 'Clocking Out...'}</p>
                        </div>
                    )}

                    {/* HUD display */}
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                        <div className="bg-black/60 backdrop-blur-md border border-white/5 rounded-lg px-3 py-2">
                            <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Confidence Score</p>
                            <p className="text-xs font-mono text-emerald-400">
                                {matchScore !== null ? `${Math.max(0, (1 - matchScore) * 100).toFixed(1)}%` : '0.0%'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Biometric Status</p>
                            <p className={`text-xs font-bold ${matchScore !== null && matchScore < 0.5 ? 'text-emerald-500' : 'text-orange-500'}`}>
                                {matchScore !== null && matchScore < 0.5 ? 'LOCK ACQUIRED' : 'SEARCHING...'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-[#0d0d0d] text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-6">
                        Do not move while identity is being verified
                    </p>
                    <div className="flex justify-center">
                        <button onClick={onClose} className="w-full sm:w-auto px-12 py-3 bg-white/5 text-gray-500 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white/10 hover:text-white transition-all text-center">
                            Cancel
                        </button>
                    </div>
                </div>
            </Card>
            <style jsx>{`
                @keyframes scan-line {
                    0% { top: 0% }
                    100% { top: 100% }
                }
                .animate-scan-line {
                    animation: scan-line 3s linear infinite;
                }
            `}</style>
        </div>
    )
}
