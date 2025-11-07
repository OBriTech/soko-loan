"use client"

import { useEffect, useState } from "react"
import { type Loan, type Payment, initializeDB, getLoans, getPayments } from "@/lib/db"
import { calculatePaymentStatus } from "@/lib/loan-utils"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function LoansList() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        await initializeDB()
        const loansData = await getLoans()
        const paymentsData = await getPayments()
        setLoans(loansData)
        setPayments(paymentsData)
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Link href="/" className="text-primary hover:text-primary/80 text-sm mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">All Loans</h1>
          <p className="text-muted-foreground mt-2">View loan details and payment schedules</p>
        </div>

        {loans.length === 0 ? (
          <Card className="p-8 text-center bg-card border-border">
            <p className="text-muted-foreground">No loans found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => {
              const loanPayments = payments.filter((p) => p.loanId === loan._id)
              const status = calculatePaymentStatus(loan, loanPayments)
              const isExpanded = expandedLoan === loan._id

              return (
                <div key={loan._id}>
                  <Card
                    className="p-4 bg-card border-border cursor-pointer hover:border-primary/50 transition"
                    onClick={() => setExpandedLoan(isExpanded ? null : loan._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{loan.memberName}</p>
                        <p className="text-sm text-muted-foreground">ID: {loan.memberId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">KSh {loan.amount}</p>
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

                  {isExpanded && (
                    <Card className="mt-2 p-4 bg-card/50 border-border">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total Paid</p>
                            <p className="font-semibold text-foreground">KSh {status.totalPaid}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Remaining</p>
                            <p className="font-semibold text-foreground">KSh {status.remaining}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Issued Date</p>
                            <p className="font-semibold text-foreground">{loan.issuedDate}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Due Date</p>
                            <p className="font-semibold text-foreground">{loan.dueDate}</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border">
                          <p className="text-sm font-medium text-foreground mb-2">Payment History</p>
                          {loanPayments.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No payments recorded</p>
                          ) : (
                            <div className="space-y-1">
                              {loanPayments.map((payment, idx) => (
                                <div key={idx} className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">{payment.date}</span>
                                  <span className="text-primary">KSh {payment.amount}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
