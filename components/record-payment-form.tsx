"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { getLoans, getPaymentsByLoan, createPayment, initializeDB, type Loan, type Payment } from "@/lib/db"
import { calculatePaymentStatus } from "@/lib/loan-utils"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle } from "lucide-react"

interface FormData {
  loanId: string
  amount: string
}

interface FormErrors {
  loanId?: string
  amount?: string
}

export default function RecordPaymentForm() {
  const router = useRouter()
  const [loans, setLoans] = useState<Loan[]>([])
  const [selectedLoanPayments, setSelectedLoanPayments] = useState<Payment[]>([])
  const [formData, setFormData] = useState<FormData>({
    loanId: "",
    amount: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadLoans = async () => {
      try {
        await initializeDB()
        const loansData = await getLoans()
        // Filter to only active loans
        const activeLoans = loansData.filter((loan) => loan.status === "active")
        setLoans(activeLoans)
      } catch (error) {
        console.error("[v0] Failed to load loans:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLoans()
  }, [])

  useEffect(() => {
    const loadPayments = async () => {
      if (!formData.loanId) {
        setSelectedLoanPayments([])
        return
      }

      try {
        const payments = await getPaymentsByLoan(formData.loanId)
        setSelectedLoanPayments(payments)
      } catch (error) {
        console.error("[v0] Failed to load payments:", error)
      }
    }

    loadPayments()
  }, [formData.loanId])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.loanId) {
      newErrors.loanId = "Please select a loan"
    }

    const amount = Number.parseFloat(formData.amount)
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = "Please enter a valid payment amount"
    }

    // Get selected loan to check remaining balance
    const selectedLoan = loans.find((l) => l._id === formData.loanId)
    if (selectedLoan) {
      const status = calculatePaymentStatus(selectedLoan, selectedLoanPayments)
      if (amount > status.remaining) {
        newErrors.amount = `Payment exceeds remaining balance of KSh ${status.remaining.toLocaleString()}`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")
    setSubmitSuccess(false)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await initializeDB()

      const payment = await createPayment({
        loanId: formData.loanId,
        amount: Number.parseFloat(formData.amount),
        date: new Date().toISOString().split("T")[0],
      })

      console.log("[v0] Payment recorded successfully:", payment._id)
      setSubmitSuccess(true)

      // Reset form
      setFormData({
        loanId: "",
        amount: "",
      })

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error("[v0] Failed to record payment:", error)
      setSubmitError("Failed to record payment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedLoan = loans.find((l) => l._id === formData.loanId)
  const loanStatus = selectedLoan ? calculatePaymentStatus(selectedLoan, selectedLoanPayments) : null

  if (isLoading) {
    return (
      <Card className="p-8 text-center bg-card border-border">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading loans...</p>
      </Card>
    )
  }

  if (loans.length === 0) {
    return (
      <Card className="p-8 text-center bg-card border-border">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground mb-4">No active loans available</p>
        <Button onClick={() => router.back()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          Go Back
        </Button>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-card border-border">
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitSuccess && (
          <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-primary">Payment recorded successfully! Redirecting...</p>
          </div>
        )}

        {submitError && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{submitError}</p>
          </div>
        )}

        {/* Select Loan */}
        <div className="space-y-2">
          <label htmlFor="loanId" className="block text-sm font-medium text-foreground">
            Select Loan
          </label>
          <select
            id="loanId"
            name="loanId"
            value={formData.loanId}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border bg-input text-foreground focus:outline-none focus:ring-2 transition ${
              errors.loanId ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
            }`}
          >
            <option value="">-- Select a loan --</option>
            {loans.map((loan) => (
              <option key={loan._id} value={loan._id}>
                {loan.memberName} (ID: {loan.memberId}) - KSh {loan.amount.toLocaleString()}
              </option>
            ))}
          </select>
          {errors.loanId && <p className="text-xs text-destructive">{errors.loanId}</p>}
        </div>

        {/* Loan Status Display */}
        {loanStatus && selectedLoan && (
          <Card className="p-4 bg-secondary/20 border-secondary/30 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Loan Amount</p>
                <p className="font-semibold text-foreground">KSh {selectedLoan.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                <p className="font-semibold text-foreground">{selectedLoan.dueDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Already Paid</p>
                <p className="font-semibold text-primary">KSh {loanStatus.totalPaid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                <p className="font-semibold text-accent">KSh {loanStatus.remaining.toLocaleString()}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (loanStatus.totalPaid / selectedLoan.amount) * 100)}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {Math.round((loanStatus.totalPaid / selectedLoan.amount) * 100)}% paid
            </p>
          </Card>
        )}

        {/* Payment Amount */}
        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium text-foreground">
            Payment Amount (KSh)
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            max={loanStatus?.remaining || undefined}
            className={`w-full px-4 py-2 rounded-lg border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition ${
              errors.amount ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
            }`}
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          {loanStatus && (
            <p className="text-xs text-muted-foreground">Maximum: KSh {loanStatus.remaining.toLocaleString()}</p>
          )}
        </div>

        {/* Payment Summary */}
        {formData.amount && loanStatus && (
          <Card className="p-4 bg-accent/10 border-accent/30">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Payment Amount</p>
                <p className="font-semibold text-foreground">
                  KSh {Number.parseFloat(formData.amount).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">New Balance</p>
                <p className="font-semibold text-primary">
                  KSh {Math.max(0, loanStatus.remaining - Number.parseFloat(formData.amount)).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-border hover:bg-card bg-transparent"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isSubmitting || !selectedLoan}
          >
            {isSubmitting ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      </form>
    </Card>
  )
}
