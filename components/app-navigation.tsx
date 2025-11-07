"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Home, Plus, DollarSign, List, AlertTriangle } from "lucide-react"

const navigation = [
  {
    label: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    label: "Issue Loan",
    href: "/issue-loan",
    icon: Plus,
  },
  {
    label: "Record Payment",
    href: "/record-payment",
    icon: DollarSign,
  },
  {
    label: "All Loans",
    href: "/loans",
    icon: List,
  },
  {
    label: "Defaulters",
    href: "/defaulters",
    icon: AlertTriangle,
  },
]

export default function AppNavigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <BarChart3 className="w-6 h-6 text-primary" />
            <span className="font-bold text-foreground hidden sm:inline">Soko Loan</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    isActive
                      ? "bg-primary/20 text-primary border border-primary/50"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
