import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import DepartmentLayoutClient from './dept-layout-client'

export default async function DepartmentLayout({
    children,
    departmentId,
    departmentName,
}: {
    children: React.ReactNode
    departmentId: number
    departmentName: string
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const displayName = user?.email || 'Test Admin'
    const initials = displayName.substring(0, 2).toUpperCase()

    return (
        <DepartmentLayoutClient
            departmentId={departmentId}
            departmentName={departmentName}
            displayName={displayName}
            initials={initials}
        >
            {children}
        </DepartmentLayoutClient>
    )
}
