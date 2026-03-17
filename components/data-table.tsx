"use client"

import { useState } from 'react'
import { Card, Input, Button } from './ui-minimal'
import { Search, Filter, Loader2 } from 'lucide-react'

interface DataTableProps<T> {
    data: T[]
    columns: {
        header: string
        accessor: keyof T | ((item: T) => React.ReactNode)
    }[]
    searchPlaceholder?: string
    loading?: boolean
}

export function DataTable<T>({
    data,
    columns,
    searchPlaceholder = "Search...",
    loading = false
}: DataTableProps<T>) {
    const [query, setQuery] = useState('')

    const filteredData = data.filter((item) => {
        return Object.values(item as object).some((val) =>
            String(val).toLowerCase().includes(query.toLowerCase())
        )
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <Input
                        placeholder={searchPlaceholder}
                        className="pl-10"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="flex items-center gap-2 border-white/20 hover:bg-white/5">
                    <Filter size={16} />
                    <span>Filter</span>
                </Button>
            </div>

            <Card className="overflow-hidden border-white/20">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                                {columns.map((col, i) => (
                                    <th key={i} className="px-6 py-4 font-medium text-gray-400 uppercase tracking-wider text-[10px]">
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                                        Loading records...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 italic">
                                        No records found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                                        {columns.map((col, j) => (
                                            <td key={j} className="px-6 py-4">
                                                {typeof col.accessor === 'function'
                                                    ? col.accessor(item)
                                                    : (item[col.accessor] as React.ReactNode)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
