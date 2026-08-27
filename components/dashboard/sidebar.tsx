'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, AppWindow, Activity, Bell, Timer, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/apps", label: "Applications", icon: AppWindow },
    { href: "/events", label: "Events Log", icon: Activity },
    { href: "/alerts", label: "Alerts", icon: Bell },
    { href: "/pomodoro", label: "Pomodoro", icon: Timer },
    { href: "/admin", label: "Admin", icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 border-r bg-background flex flex-col">
            <div className="h-14 px-4 flex items-center border-b">
                <span className="font-semibold tracking-tight text-lg">
                    Vibradex
                </span>
            </div>

            <nav className="flex-1 overflow-auto p-2 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                                "hover:bg-muted",
                                isActive && "bg-muted font-medium"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>
            <div className="border-t p-3 text-xs text-muted-foreground">
                v0.1.0
            </div>
        </aside>
    )
}
