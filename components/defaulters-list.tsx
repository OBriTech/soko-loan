"use client"

import { useEffect, useState } from "react"
import { type Loan, initializeDB, getLoans, getPayments } from "@/lib/db"
import { calculatePaymentStatus, isLoanDefaulted, calculateLatePenalty } from "@/lib/loan-utils"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function DefaultersList() {
  const [defaulters, setDefaulters] = useState<Array<Loan & { daysLate: number; penalty: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        await initializeDB()
        const loansData = await getLoans()
        const paymentsData = await getPayments()

        const defaultersList = loansData
          .map((loan) => {
            const loanPayments = paymentsData.filter((p) => p.loanId === loan._id)
            if (isLoanDefaulted(loan, loanPayments)) {
              const status = calculatePaymentStatus(loan, loanPayments)
              const daysLate = Math.floor(
                (new Date().getTime() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24),
              )
              const penalty = calculateLatePenalty(loan._id!, loanPayments, loan.dueDate)
              return {
                ...loan,
                daysLate: Math.max(0, daysLate),
                penalty,
              }
            }
            return null
          })
          .filter((item): item is Loan & { daysLate: number; penalty: number } => item !== null)
          .sort((a, b) => b.daysLate - a.daysLate)

        setDefaulters(defaultersList)
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
          <h1 className="text-3xl font-bold text-foreground">Defaulters</h1>
          <p className="text-muted-foreground mt-2">Members with overdue loans</p>
        </div>

        {defaulters.length === 0 ? (
          <Card className="p-8 text-center bg-card border-border">
            <p className="text-primary font-medium">No defaulters</p>
            <p className="text-muted-foreground text-sm mt-1">All loans are on track</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {defaulters.map((defaulter) => (
              <Card
                key={defaulter._id}
                className="p-4 bg-card border-destructive/30 hover:border-destructive/50 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{defaulter.memberName}</p>
                    <p className="text-sm text-muted-foreground">Member ID: {defaulter.memberId}</p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-destructive">{defaulter.daysLate} days late</span>
                      <span className="text-muted-foreground">Loan: KSh {defaulter.amount}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-destructive/10 text-destructive rounded p-2">
                      <p className="text-xs font-medium">10% Penalty</p>
                      <p className="text-sm font-bold">KSh {defaulter.penalty}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
