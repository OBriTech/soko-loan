"use client"

import { useEffect, useState } from "react"
import { getLoans, getPayments, initializeDB, type Loan, type Payment } from "@/lib/db"
import { calculatePaymentStatus, isLoanDefaulted, calculateLatePenalty } from "@/lib/loan-utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertTriangle, TrendingUp } from "lucide-react"

interface DefaulterInfo {
  loan: Loan
  payments: Payment[]
  status: ReturnType<typeof calculatePaymentStatus>
  daysOverdue: number
  penalty: number
}

export default function DefaultersPage() {
  const [defaulters, setDefaulters] = useState<DefaulterInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDefaulters: 0,
    totalOutstanding: 0,
    totalPenalties: 0,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        await initializeDB()
        const loansData = await getLoans()
        const paymentsData = await getPayments()

        // Filter defaulted loans
        const defaultedLoans: DefaulterInfo[] = []
        let totalOutstanding = 0
        let totalPenalties = 0

        loansData.forEach((loan) => {
          const loanPayments = paymentsData.filter((p) => p.loanId === loan._id)
          if (isLoanDefaulted(loan, loanPayments)) {
            const status = calculatePaymentStatus(loan, loanPayments)
            const daysOverdue = Math.floor(
              (new Date().getTime() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24),
            )
            const penalty = calculateLatePenalty(loan._id || "", loanPayments, loan.dueDate)

            defaultedLoans.push({
              loan,
              payments: loanPayments,
              status,
              daysOverdue,
              penalty,
            })

            totalOutstanding += status.remaining
            totalPenalties += penalty
          }
        })

        // Sort by days overdue (descending)
        defaultedLoans.sort((a, b) => b.daysOverdue - a.daysOverdue)

        setDefaulters(defaultedLoans)
        setStats({
          totalDefaulters: defaultedLoans.length,
          totalOutstanding,
          totalPenalties,
        })
      } catch (error) {
        console.error("[v0] Failed to load defaulters:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-foreground">Defaulters</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card className="p-8 text-center bg-card border-border">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading defaulters...</p>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Defaulters</h1>
            <p className="text-muted-foreground mt-1">Track overdue loans and payment status</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-card border-border">
            <div className="text-sm text-muted-foreground mb-2">Total Defaulters</div>
            <div className="text-3xl font-bold text-destructive">{stats.totalDefaulters}</div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="text-sm text-muted-foreground mb-2">Outstanding Balance</div>
            <div className="text-3xl font-bold text-foreground">KSh {stats.totalOutstanding.toLocaleString()}</div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="text-sm text-muted-foreground mb-2">Total Penalties</div>
            <div className="text-3xl font-bold text-accent">KSh {stats.totalPenalties.toLocaleString()}</div>
          </Card>
        </div>

        {/* Defaulters List */}
        {defaulters.length === 0 ? (
          <Card className="p-8 text-center bg-card border-border">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">Great news! No defaulters at the moment.</p>
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Back to Dashboard</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {defaulters.map((defaulter) => {
              const loan = defaulter.loan
              const status = defaulter.status
              const daysOverdue = defaulter.daysOverdue
              const penalty = defaulter.penalty

              return (
                <Card
                  key={loan._id}
                  className="p-6 bg-card border-destructive/30 hover:border-destructive/50 transition"
                >
                  <div className="space-y-4">
                    {/* Member and Urgency */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          <h3 className="text-lg font-semibold text-foreground">{loan.memberName}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">ID: {loan.memberId}</p>
                      </div>
                      <div className="text-right">
                        <div className="px-3 py-1 rounded-full bg-destructive/20 border border-destructive/50">
                          <p className="text-sm font-bold text-destructive">{daysOverdue} days overdue</p>
                        </div>
                      </div>
                    </div>

                    {/* Financial Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-destructive/5 rounded-lg border border-destructive/10">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Original Amount</p>
                        <p className="font-semibold text-foreground">KSh {loan.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Already Paid</p>
                        <p className="font-semibold text-primary">KSh {status.totalPaid.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
                        <p className="font-semibold text-destructive">KSh {status.remaining.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Late Penalty</p>
                        <p className="font-semibold text-accent">KSh {penalty.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Repayment Progress</span>
                        <span className="font-medium text-foreground">
                          {Math.round((status.totalPaid / loan.amount) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-destructive h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (status.totalPaid / loan.amount) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Loan Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-medium text-foreground">{loan.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Issued Date</p>
                        <p className="font-medium text-foreground">{loan.issuedDate}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-border">
                      <Link href="/record-payment" className="flex-1">
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                          Record Payment
                        </Button>
                      </Link>
                      <Link href="/loans" className="flex-1">
                        <Button variant="outline" className="w-full border-border hover:bg-card bg-transparent">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
