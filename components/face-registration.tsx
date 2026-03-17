"use client"

import { useEffect, useRef, useState } from 'react'
import * as faceapi from 'face-api.js'
import { Camera, CheckCircle2, AlertCircle, Scan, X, RefreshCw } from 'lucide-react'
import { Card } from './ui-minimal'

interface FaceRegistrationProps {
    employeeName: string
    onCapture: (descriptor: Float32Array) => void
    onClose: () => void
}

export function FaceRegistration({ employeeName, onCapture, onClose }: FaceRegistrationProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [status, setStatus] = useState<'initializing' | 'ready' | 'detecting' | 'captured' | 'error'>('initializing')
    const [errorMessage, setErrorMessage] = useState('')
    const [detection, setDetection] = useState<any>(null)
    const [isModelsLoaded, setIsModelsLoaded] = useState(false)

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
                setErrorMessage('Failed to load face detection models.')
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
            setErrorMessage('Could not access camera. Please check permissions.')
        }
    }

    async function handleDetect() {
        if (!videoRef.current || !canvasRef.current || !isModelsLoaded) return

        const detect = async () => {
            if (status === 'captured' || status === 'error') return

            const result = await faceapi.detectSingleFace(
                videoRef.current!,
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceDescriptor()

            if (result) {
                setDetection(result)
                setStatus('detecting')

                // Draw detection on canvas
                const displaySize = { width: 640, height: 480 }
                faceapi.matchDimensions(canvasRef.current!, displaySize)
                const resizedDetections = faceapi.resizeResults(result, displaySize)

                const ctx = canvasRef.current!.getContext('2d')
                if (ctx) {
                    ctx.clearRect(0, 0, 640, 480)
                    // Draw box manually for cleaner look
                    const { x, y, width, height } = resizedDetections.detection.box
                    ctx.strokeStyle = '#3b82f6'
                    ctx.lineWidth = 3
                    ctx.strokeRect(x, y, width, height)

                    // Add corners
                    ctx.fillStyle = '#3b82f6'
                    const cornerSize = 20
                    ctx.fillRect(x - 2, y - 2, cornerSize, 4)
                    ctx.fillRect(x - 2, y - 2, 4, cornerSize)
                    ctx.fillRect(x + width - cornerSize + 2, y - 2, cornerSize, 4)
                    ctx.fillRect(x + width - 2, y - 2, 4, cornerSize)
                    ctx.fillRect(x - 2, y + height - cornerSize + 2, 4, cornerSize)
                    ctx.fillRect(x - 2, y + height - 2, cornerSize, 4)
                    ctx.fillRect(x + width - 2, y + height - cornerSize + 2, 4, cornerSize)
                    ctx.fillRect(x + width - cornerSize + 2, y + height - 2, cornerSize, 4)
                }
            } else {
                setDetection(null)
                const ctx = canvasRef.current?.getContext('2d')
                if (ctx) ctx.clearRect(0, 0, 640, 480)
            }

            if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
                requestAnimationFrame(detect)
            }
        }

        detect()
    }

    async function captureFace() {
        if (!detection) return
        setStatus('captured')
        onCapture(detection.descriptor)
    }

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4">
            <Card className="w-full max-w-2xl bg-[#0a0a0a] border-white/10 overflow-hidden shadow-2xl rounded-2xl">
                <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                            <Scan size={18} className="text-blue-500" />
                            Register Face Profile
                        </h2>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Hiring: {employeeName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        onPlay={handleDetect}
                        className="w-full h-full object-cover grayscale opacity-50"
                        style={{ transform: 'scaleX(-1)' }}
                    />
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{ transform: 'scaleX(-1)' }}
                    />

                    {status === 'initializing' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
                            <RefreshCw className="text-blue-500 animate-spin mb-4" size={32} />
                            <p className="text-sm font-bold text-white uppercase tracking-widest animate-pulse">Initializing AI Models...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 z-10 p-8 text-center">
                            <AlertCircle className="text-red-500 mb-4" size={48} />
                            <h3 className="text-lg font-bold text-white mb-2">Registration Error</h3>
                            <p className="text-sm text-gray-400 max-w-xs">{errorMessage}</p>
                            <button
                                onClick={startCamera}
                                className="mt-6 px-6 py-2 bg-white text-black font-bold text-xs uppercase rounded-full"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {status === 'captured' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/20 backdrop-blur-sm z-20">
                            <CheckCircle2 className="text-green-500 mb-4" size={64} />
                            <p className="text-xl font-bold text-white">Identity Verified</p>
                            <p className="text-sm text-green-400 mt-2 font-bold uppercase tracking-widest">Descriptor Saved ✓</p>
                        </div>
                    )}

                    {!detection && status === 'ready' && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <div className="w-48 h-64 border-2 border-dashed border-white/20 rounded-[40px] mb-4 mx-auto" />
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Position your face in the center</p>
                        </div>
                    )}
                </div>

                <div className="p-4 sm:p-8 bg-[#0d0d0d] flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${detection ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {detection ? 'Face Detected / Signal Strong' : 'No Face Detected'}
                        </span>
                    </div>

                    <div className="flex w-full sm:w-auto gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-6 py-3 border border-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white/5 transition-all text-center"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={!detection || status === 'captured'}
                            onClick={captureFace}
                            className={`flex-1 sm:flex-none px-8 py-3 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${detection && status !== 'captured'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95'
                                : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                }`}
                        >
                            <Camera size={14} />
                            Capture Identity
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
