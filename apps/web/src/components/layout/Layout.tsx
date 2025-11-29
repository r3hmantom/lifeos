import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Outlet, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { Toaster } from "@/components/ui/sonner"

export default function Layout() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full h-screen overflow-hidden flex flex-col">
                <div className="p-4 border-b flex items-center gap-4">
                    <SidebarTrigger />
                    <h1 className="font-semibold text-lg">LifeOS</h1>
                </div>
                <div className="flex-1 overflow-auto p-6">
                    <Outlet />
                </div>
            </main>
            <Toaster />
        </SidebarProvider>
    )
}
