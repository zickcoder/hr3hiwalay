"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
    DollarSign,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Receipt,
    Fuel,
    Wrench,
    Plus,
    Search,
    MapPin,
    Image as ImageIcon,
    Loader2,
    AlertTriangle
} from 'lucide-react'
import { Card } from '@/components/ui-minimal'

interface Claim {
    id: string
    employee_id: string
    hub_location: string
    claim_type: string
    amount: number
    receipt_url: string
    claim_date: string
    approval_status: string
    approved_by: string
    applicants: {
        first_name: string
        last_name: string
    }
}

export default function ClaimsPage() {
    const [claims, setClaims] = useState<Claim[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [hubFilter, setHubFilter] = useState('All')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)

    const [newClaim, setNewClaim] = useState({
        employee_id: '',
        claim_type: 'Fuel',
        amount: 0,
        receipt_url: '',
        claim_date: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        fetchClaims()
        fetchEmployees()
    }, [hubFilter])

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) {
        let file: File | undefined

        if ('files' in e && e.files) {
            file = e.files[0]
        } else if ('dataTransfer' in e && e.dataTransfer.files) {
            file = e.dataTransfer.files[0]
        }

        if (!file) return

        // Basic validation
        if (!file.type.startsWith('image/')) {
            setUploadError('Please upload an image file (PNG, JPG).')
            return
        }

        setIsUploading(true)
        setUploadError(null)

        try {
            // In a real app, we would upload to Supabase Storage here.
            // For now, we simulate a successful upload and use a local preview URL.
            // const { data, error } = await supabase.storage.from('receipts').upload(...)

            const reader = new FileReader()
            reader.onloadend = () => {
                setNewClaim(prev => ({ ...prev, receipt_url: reader.result as string }))
                setIsUploading(false)
            }
            reader.readAsDataURL(file)

        } catch (err) {
            setUploadError('Failed to process image. Try again.')
            setIsUploading(false)
        }
    }

    async function fetchEmployees() {
        const { data } = await supabase
            .from('applicants')
            .select('id, first_name, last_name, hub_location')
            .eq('application_status', 'Hired')
        setEmployees(data || [])
    }

    async function fetchClaims() {
        setLoading(true)
        let query = supabase
            .from('claims')
            .select(`
                *,
                applicants:employee_id (
                    first_name,
                    last_name
                )
            `)
            .order('claim_date', { ascending: false })

        if (hubFilter !== 'All') {
            query = query.eq('hub_location', hubFilter)
        }

        const { data, error } = await query
        if (error) console.error('Error fetching claims:', error)
        else setClaims(data || [])
        setLoading(false)
    }

    async function handleApproval(id: string, status: string) {
        if (loading) return
        setLoading(true)
        const { error } = await supabase
            .from('claims')
            .update({
                approval_status: status,
                approved_by: 'Fleet Manager'
            })
            .eq('id', id)

        if (error) alert(error.message)
        else fetchClaims()
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (loading) return

        // VALIDATION: Check if proof is provided
        if (!newClaim.receipt_url) {
            setUploadError("PROOFS REQUIRED: You need to input proof first or contact admin if no proof.")
            return
        }

        setLoading(true)

        const selectedEmp = employees.find(emp => emp.id === newClaim.employee_id)
        if (!selectedEmp) return

        const { error } = await supabase.from('claims').insert([{
            ...newClaim,
            hub_location: selectedEmp.hub_location
        }])

        if (error) {
            alert(error.message)
        } else {
            setIsModalOpen(false)
            // Reset form
            setNewClaim({
                employee_id: '',
                claim_type: 'Fuel',
                amount: 0,
                receipt_url: '',
                claim_date: new Date().toISOString().split('T')[0]
            })
            fetchClaims()
        }
        setLoading(false)
    }

    const filteredClaims = claims.filter(c =>
        `${c.applicants?.first_name} ${c.applicants?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getClaimIcon = (type: string) => {
        switch (type) {
            case 'Fuel': return <Fuel size={14} className="text-blue-500" />
            case 'Repair': return <Wrench size={14} className="text-orange-500" />
            default: return <Receipt size={14} className="text-green-500" />
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Claims & Reimbursement</h1>
                    <p className="text-sm text-gray-400">Fleet operational costs and rider expense tracking</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all font-mono tracking-tighter"
                >
                    <Plus size={18} /> SUBMIT CLAIM
                </button>
            </div>

            {/* Filter Bar */}
            <Card className="p-4 bg-black/40 border-white/10 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search employee or claim type..."
                        className="w-full bg-black border border-white/10 rounded-md py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500/50 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="bg-black border border-white/10 rounded-md py-2 px-4 text-sm text-white focus:border-blue-500/50 outline-none w-full md:w-auto"
                    value={hubFilter}
                    onChange={(e) => setHubFilter(e.target.value)}
                >
                    <option value="All">All Hubs</option>
                    <option value="Manila North Hub">Manila North Hub</option>
                    <option value="Cebu Central Hub">Cebu Central Hub</option>
                    <option value="Davao Logistics">Davao Logistics</option>
                </select>
            </Card>

            {/* Claims Grid */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                ) : filteredClaims.length > 0 ? (
                    filteredClaims.map((claim) => (
                        <Card key={claim.id} className="p-5 bg-[#0d0d0d] border-white/10 flex flex-col lg:flex-row items-center gap-8 group hover:border-white/20 transition-all">
                            <div className="flex items-center gap-4 w-60 shrink-0">
                                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                                    <Receipt size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-tight">{claim.applicants?.first_name} {claim.applicants?.last_name}</h3>
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{claim.hub_location}</p>
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8 w-full border-x border-white/5 px-8">
                                <div>
                                    <span className="text-[9px] text-gray-600 uppercase font-bold block mb-1">Claim Type</span>
                                    <div className="flex items-center gap-2 text-xs text-white">
                                        {getClaimIcon(claim.claim_type)}
                                        {claim.claim_type}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[9px] text-gray-600 uppercase font-bold block mb-1">Amount</span>
                                    <div className="text-xs text-white font-mono font-bold tracking-tight">
                                        ₱ {Number(claim.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[9px] text-gray-600 uppercase font-bold block mb-1">Receipt</span>
                                    <a
                                        href={claim.receipt_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors"
                                    >
                                        <ImageIcon size={14} /> VIEW SCAN
                                    </a>
                                </div>
                                <div className="flex items-center justify-end md:justify-start">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-[10px] font-bold border ${claim.approval_status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                        claim.approval_status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                        }`}>
                                        {claim.approval_status.toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {claim.approval_status === 'Pending' && (
                                    <>
                                        <button
                                            onClick={() => handleApproval(claim.id, 'Approved')}
                                            disabled={loading}
                                            className="bg-white text-black text-[10px] font-bold px-4 py-2 rounded-sm hover:bg-gray-200 transition-all uppercase tracking-tighter disabled:opacity-50"
                                        >
                                            Authorize
                                        </button>
                                        <button
                                            onClick={() => handleApproval(claim.id, 'Rejected')}
                                            disabled={loading}
                                            className="bg-white/5 text-gray-500 text-[10px] font-bold px-4 py-2 rounded-sm border border-white/10 hover:text-white transition-all uppercase tracking-tighter disabled:opacity-50"
                                        >
                                            Decline
                                        </button>
                                    </>
                                )}
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white/2 rounded-xl border border-dashed border-white/5">
                        <Receipt size={48} className="mx-auto text-gray-800 mb-4" />
                        <p className="text-gray-500 text-sm italic">No reimbursement claims logged.</p>
                    </div>
                )}
            </div>

            {/* Create Claim Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg p-6 bg-[#0a0a0a] border-white/10 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white tracking-tight uppercase tracking-[0.2em] text-xs">Submission Terminal</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Employee Profile</label>
                                <select
                                    className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                    value={newClaim.employee_id}
                                    onChange={(e) => setNewClaim({ ...newClaim, employee_id: e.target.value })}
                                    required
                                >
                                    <option value="">Search Employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Expense Category</label>
                                    <select
                                        className="w-full bg-black border border-white/10 rounded-md p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                        value={newClaim.claim_type}
                                        onChange={(e) => setNewClaim({ ...newClaim, claim_type: e.target.value })}
                                    >
                                        <option value="Fuel">Fuel Reimbursement</option>
                                        <option value="Repair">Vehicle Repair</option>
                                        <option value="Accident">Accident Coverage</option>
                                        <option value="Allowance">Operational Allowance</option>
                                        <option value="Other">Other Expenses</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount (PHP)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-mono">₱</span>
                                        <input
                                            type="number"
                                            className="w-full bg-black border border-white/10 rounded-md py-3 pl-8 pr-4 text-sm text-white focus:border-blue-500/50 outline-none font-mono"
                                            value={newClaim.amount}
                                            onChange={(e) => setNewClaim({ ...newClaim, amount: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Proof of Purchase (Receipt)</label>

                                <input
                                    type="file"
                                    id="receipt-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e as any)}
                                />

                                <div
                                    onClick={() => document.getElementById('receipt-upload')?.click()}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => { e.preventDefault(); handleFileChange(e as any); }}
                                    className={`border-2 border-dashed ${newClaim.receipt_url ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10'} rounded-xl p-8 hover:bg-white/5 transition-all text-center group cursor-pointer relative overflow-hidden h-40 flex flex-col items-center justify-center`}
                                >
                                    {isUploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 size={24} className="animate-spin text-blue-500" />
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Processing Scan...</p>
                                        </div>
                                    ) : newClaim.receipt_url ? (
                                        <>
                                            <img src={newClaim.receipt_url} alt="Receipt Preview" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                                            <div className="relative z-10 flex flex-col items-center gap-2">
                                                <CheckCircle2 size={32} className="text-blue-500" />
                                                <p className="text-[10px] text-white uppercase font-bold tracking-widest">Scan Loaded Successfully</p>
                                                <p className="text-[8px] text-blue-400/60 uppercase font-bold">Click to re-upload</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon size={32} className="mx-auto text-gray-700 group-hover:text-blue-500 transition-colors mb-2" />
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Drag & Drop Scan or Browse</p>
                                        </>
                                    )}
                                </div>

                                {uploadError && (
                                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md animate-in fade-in duration-300">
                                        <AlertTriangle size={14} className="text-red-500 shrink-0" />
                                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight leading-relaxed">
                                            {uploadError}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="submit"
                                    className="flex-1 bg-white text-black py-4 rounded-md text-xs font-bold hover:bg-gray-200 transition-all uppercase tracking-widest shadow-xl shadow-white/5"
                                >
                                    Authorize Submission
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-white/5 text-white py-4 rounded-md text-xs font-bold border border-white/10"
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
