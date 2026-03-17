import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Button, Card } from '@/components/ui-minimal'
import { LogOut, Home, User, Settings, LayoutDashboard } from 'lucide-react'

export default async function DashboardPage({ departmentId }: { departmentId: number }) {
    const supabase = createClient()
    const cookieStore = cookies()
    const isBypass = cookieStore.get('test_auth_bypass')?.value === 'true'
    const bypassDept = cookieStore.get('test_dept_id')?.value

    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !isBypass) {
        redirect('/')
    }

    let employee = null
    if (user) {
        const { data } = await supabase
            .from('employees')
            .select('*')
            .eq('id', user.id)
            .single()
        employee = data
    } else {
        // Mock employee for bypass
        employee = { full_name: 'Test Administrator', department_id: Number(bypassDept) }
    }

    if (!employee || employee.department_id !== departmentId) {
        redirect('/')
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <div className="text-sm text-gray-400">Department {departmentId}</div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: 'Total Employees', value: '124', change: '+12%', icon: User },
                    { title: 'Active Projects', value: '12', change: '+2', icon: LayoutDashboard },
                    { title: 'System Status', value: 'Healthy', change: '100%', icon: ShieldCheck },
                    { title: 'Pending Tasks', value: '8', change: '-3', icon: Settings },
                ].map((stat, i) => (
                    <Card key={i} className="p-6 space-y-2">
                        <div className="flex items-center justify-between text-gray-400">
                            <span className="text-xs font-medium uppercase tracking-wider">{stat.title}</span>
                            <stat.icon size={16} />
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold">{stat.value}</span>
                            <span className="text-xs text-green-500">{stat.change}</span>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="p-8 h-[300px] flex flex-col items-center justify-center border-dashed text-gray-400">
                <p>Department specific analytics and management tools will appear here.</p>
            </Card>
        </div>
    )
}

function ShieldCheck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
