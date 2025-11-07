"use client"

import { useEffect, useState } from "react"
import { getLoans, getPayments, initializeDB, type Loan, type Payment } from "@/lib/db"
import { calculatePaymentStatus, calculateLoanSchedule } from "@/lib/loan-utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronDown, ChevronUp } from "lucide-react"

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [expandedLoans, setExpandedLoans] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        await initializeDB()
        const loansData = await getLoans()
        const paymentsData = await getPayments()
        setLoans(loansData.sort((a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime()))
        setPayments(paymentsData)
      } catch (error) {
        console.error("[v0] Failed to load loans:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const toggleExpanded = (loanId: string) => {
    const newExpanded = new Set(expandedLoans)
    if (newExpanded.has(loanId)) {
      newExpanded.delete(loanId)
    } else {
      newExpanded.add(loanId)
    }
    setExpandedLoans(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-foreground">All Loans</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card className="p-8 text-center bg-card border-border">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading loans...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">All Loans</h1>
              <p className="text-muted-foreground mt-1">View and manage all loans</p>
            </div>
            <Link href="/issue-loan">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">New Loan</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {loans.length === 0 ? (
          <Card className="p-8 text-center bg-card border-border">
            <p className="text-muted-foreground mb-4">No loans yet</p>
            <Link href="/issue-loan">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Issue Your First Loan</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => {
              const loanPayments = payments.filter((p) => p.loanId === loan._id)
              const status = calculatePaymentStatus(loan, loanPayments)
              const schedule = calculateLoanSchedule(loan)
              const isExpanded = expandedLoans.has(loan._id || "")

              return (
                <Card key={loan._id} className="bg-card border-border overflow-hidden">
                  {/* Main Loan Card */}
                  <button
                    onClick={() => toggleExpanded(loan._id || "")}
                    className="w-full p-6 text-left hover:bg-secondary/20 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{loan.memberName}</h3>
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${loan.status === "paid"
                              ? "bg-primary/20 text-primary"
                              : loan.status === "active"
                                ? "bg-accent/20 text-accent"
                                : "bg-destructive/20 text-destructive"
                              }`}
                          >
                            {loan.status === "paid" ? "Paid" : loan.status === "active" ? "Active" : "Defaulted"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">ID: {loan.memberId}</p>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Loan Amount</p>
                            <p className="font-semibold text-foreground">KSh {loan.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Paid</p>
                            <p className="font-semibold text-primary">KSh {status.totalPaid.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                            <p className="font-semibold text-accent">KSh {status.remaining.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                            <p className="font-semibold text-foreground">{loan.dueDate}</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (status.totalPaid / loan.amount) * 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Expand Button */}
                      <div className="flex-shrink-0 pt-2">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border px-6 py-4 bg-muted/30 space-y-4">
                      {/* Payment Schedule */}
                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Payment Schedule</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {schedule.map((day, index) => {
                            // Find if this day has been paid
                            const dayPayments = loanPayments.filter(
                              (p) =>
                                new Date(p.date).getTime() >= new Date(day.dueDate).getTime() &&
                                new Date(p.date).getTime() < new Date(day.dueDate).getTime() + 86400000
                            )
                            const dayTotal = dayPayments.reduce((sum, p) => sum + p.amount, 0)
                            const isPaid = dayTotal >= day.amount

                            return (
                              <div
                                key={index}
                                className="flex items-center justify-between text-sm p-2 rounded bg-background/50"
                              >
                                <div>
                                  <p className="text-foreground font-medium">Day {day.day}</p>
                                  <p className="text-xs text-muted-foreground">{day.dueDate}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-foreground font-medium">KSh {day.amount.toLocaleString()}</p>
                                  <p
                                    className={`text-xs font-medium ${isPaid ? "text-primary" : "text-muted-foreground"
                                      }`}
                                  >
                                    {isPaid ? "Paid" : "Pending"}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Payment History */}
                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Payment History</h4>
                        {loanPayments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No payments recorded yet</p>
                        ) : (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {loanPayments.map((payment) => (
                              <div
                                key={payment._id}
                                className="flex items-center justify-between text-sm p-2 rounded bg-background/50"
                              >
                                <div>
                                  <p className="text-foreground font-medium">{payment.date}</p>
                                </div>
                                <p className="text-primary font-medium">KSh {payment.amount.toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        {status.remaining > 0 && (
                          <Link href="/record-payment" className="flex-1">
                            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-sm py-2">
                              Record Payment
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          className="flex-1 border-border hover:bg-card bg-transparent text-sm py-2"
                          onClick={() => toggleExpanded(loan._id || "")}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
