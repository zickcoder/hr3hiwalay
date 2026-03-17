import DeptLayout from '@/components/dept-layout'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Layout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    // Protected Route: Check if user is logged in
    if (!session) {
        // redirect('/auth/login') 
    }

    return (
        <DeptLayout departmentId={3} departmentName="Workforce Operations">
            {children}
        </DeptLayout>
    )
}
