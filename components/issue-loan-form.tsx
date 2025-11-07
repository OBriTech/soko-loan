"use client"

import type React from "react"

import { useState } from "react"
import { createLoan, initializeDB } from "@/lib/db"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface FormData {
  memberId: string
  memberName: string
  amount: string
  dueDate: string
  totalInterest: string
}

interface FormErrors {
  memberId?: string
  memberName?: string
  amount?: string
  dueDate?: string
  totalInterest?: string
}

export default function IssueLoanForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    memberId: "",
    memberName: "",
    amount: "",
    dueDate: "",
    totalInterest: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.memberId.trim()) {
      newErrors.memberId = "Member ID is required"
    }

    if (!formData.memberName.trim()) {
      newErrors.memberName = "Member name is required"
    }

    const amount = Number.parseFloat(formData.amount)
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = "Please enter a valid loan amount"
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required"
    } else {
      const dueDate = new Date(formData.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (dueDate < today) {
        newErrors.dueDate = "Due date must be in the future"
      }
    }

    const interest = Number.parseFloat(formData.totalInterest)
    if (!formData.totalInterest || isNaN(interest) || interest < 0) {
      newErrors.totalInterest = "Please enter a valid interest amount"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await initializeDB()

      const newLoan = await createLoan({
        memberId: formData.memberId.trim(),
        memberName: formData.memberName.trim(),
        amount: Number.parseFloat(formData.amount),
        issuedDate: new Date().toISOString().split("T")[0],
        dueDate: formData.dueDate,
        totalInterest: Number.parseFloat(formData.totalInterest),
        status: "active",
      })

      console.log("[v0] Loan created successfully:", newLoan._id)

      // Redirect to home dashboard
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to create loan:", error)
      setSubmitError("Failed to create loan. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const today = new Date().toISOString().split("T")[0]
  const minDueDate = new Date()
  minDueDate.setDate(minDueDate.getDate() + 10)
  const minDueDateString = minDueDate.toISOString().split("T")[0]

  return (
    <Card className="p-6 bg-card border-border">
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{submitError}</p>
          </div>
        )}

        {/* Member Information Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Member Information</h2>

          <div className="space-y-2">
            <label htmlFor="memberId" className="block text-sm font-medium text-foreground">
              Member ID
            </label>
            <input
              type="text"
              id="memberId"
              name="memberId"
              value={formData.memberId}
              onChange={handleChange}
              placeholder="e.g., MEM001"
              className={`w-full px-4 py-2 rounded-lg border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition ${
                errors.memberId ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
              }`}
            />
            {errors.memberId && <p className="text-xs text-destructive">{errors.memberId}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="memberName" className="block text-sm font-medium text-foreground">
              Member Name
            </label>
            <input
              type="text"
              id="memberName"
              name="memberName"
              value={formData.memberName}
              onChange={handleChange}
              placeholder="Full name of the member"
              className={`w-full px-4 py-2 rounded-lg border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition ${
                errors.memberName ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
              }`}
            />
            {errors.memberName && <p className="text-xs text-destructive">{errors.memberName}</p>}
          </div>
        </div>

        {/* Loan Details Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Loan Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium text-foreground">
                Loan Amount (KSh)
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
                className={`w-full px-4 py-2 rounded-lg border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition ${
                  errors.amount ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
                }`}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="totalInterest" className="block text-sm font-medium text-foreground">
                Total Interest (KSh)
              </label>
              <input
                type="number"
                id="totalInterest"
                name="totalInterest"
                value={formData.totalInterest}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full px-4 py-2 rounded-lg border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition ${
                  errors.totalInterest
                    ? "border-destructive focus:ring-destructive"
                    : "border-border focus:ring-primary"
                }`}
              />
              {errors.totalInterest && <p className="text-xs text-destructive">{errors.totalInterest}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="dueDate" className="block text-sm font-medium text-foreground">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              min={minDueDateString}
              className={`w-full px-4 py-2 rounded-lg border bg-input text-foreground focus:outline-none focus:ring-2 transition ${
                errors.dueDate ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
              }`}
            />
            <p className="text-xs text-muted-foreground">Minimum due date is {minDueDateString}</p>
            {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
          </div>
        </div>

        {/* Summary Card */}
        {formData.amount && formData.totalInterest && (
          <Card className="p-4 bg-secondary/20 border-secondary/30">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Loan Amount</p>
                <p className="font-semibold text-foreground">
                  KSh {Number.parseFloat(formData.amount).toLocaleString() || "0"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Interest</p>
                <p className="font-semibold text-foreground">
                  KSh {Number.parseFloat(formData.totalInterest).toLocaleString() || "0"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="font-semibold text-primary">
                  KSh{" "}
                  {(Number.parseFloat(formData.amount) + Number.parseFloat(formData.totalInterest)).toLocaleString() ||
                    "0"}
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
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Issue Loan"}
          </Button>
        </div>
      </form>
    </Card>
  )
}
