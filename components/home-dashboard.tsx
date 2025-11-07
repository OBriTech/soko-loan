"use client"

import { useEffect, useState } from "react"
import { type Loan, type Payment, initializeDB, getLoans, getPayments } from "@/lib/db"
import { calculatePaymentStatus, isLoanDefaulted } from "@/lib/loan-utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomeDashboard() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, paid: 0, defaulted: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        await initializeDB()
        const loansData = await getLoans()
        const paymentsData = await getPayments()

        setLoans(loansData)
        setPayments(paymentsData)

        // Calculate stats
        let activeCount = 0
        let paidCount = 0
        let defaultedCount = 0

        loansData.forEach((loan) => {
          const loanPayments = paymentsData.filter((p) => p.loanId === loan._id)
          if (isLoanDefaulted(loan, loanPayments)) {
            defaultedCount++
          } else if (loan.status === "paid") {
            paidCount++
          } else if (loan.status === "active") {
            activeCount++
          }
        })

        setStats({
          total: loansData.length,
          active: activeCount,
          paid: paidCount,
          defaulted: defaultedCount,
        })
      } catch (error) {
        console.error("[v0] Failed to load data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">Soko Loan</h1>
          <p className="text-muted-foreground mt-1">Loan Management System</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-card border-border">
            <div className="text-sm text-muted-foreground mb-2">Total Loans</div>
            <div className="text-3xl font-bold text-foreground">{stats.total}</div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="text-sm text-muted-foreground mb-2">Active</div>
            <div className="text-3xl font-bold text-accent">{stats.active}</div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="text-sm text-muted-foreground mb-2">Paid</div>
            <div className="text-3xl font-bold text-primary">{stats.paid}</div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="text-sm text-muted-foreground mb-2">Defaulted</div>
            <div className="text-3xl font-bold text-destructive">{stats.defaulted}</div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/issue-loan">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Issue Loan</Button>
          </Link>

          <Link href="/record-payment">
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Record Payment</Button>
          </Link>

          <Link href="/loans">
            <Button variant="outline" className="w-full border-border hover:bg-card bg-transparent">
              View Loans
            </Button>
          </Link>

          <Link href="/defaulters">
            <Button variant="outline" className="w-full border-border hover:bg-card bg-transparent">
              Defaulters
            </Button>
          </Link>
        </div>

        {/* Recent Loans */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Recent Loans</h2>
          {loans.length === 0 ? (
            <Card className="p-8 text-center bg-card border-border">
              <p className="text-muted-foreground">No loans yet. Create your first loan to get started.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {loans.slice(0, 5).map((loan) => {
                const loanPayments = payments.filter((p) => p.loanId === loan._id)
                const status = calculatePaymentStatus(loan, loanPayments)

                return (
                  <Card key={loan._id} className="p-4 bg-card border-border hover:border-primary/50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{loan.memberName}</p>
                        <p className="text-sm text-muted-foreground">KSh {loan.amount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          KSh {status.totalPaid} / {status.totalDue}
                        </p>
                        <p
                          className={`text-xs font-medium ${
                            status.isPaid
                              ? "text-primary"
                              : status.isOverdue
                                ? "text-destructive"
                                : "text-muted-foreground"
                          }`}
                        >
                          {status.isPaid ? "Paid" : status.isOverdue ? "Overdue" : "Active"}
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
