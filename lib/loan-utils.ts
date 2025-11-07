import type { Loan, Payment } from "./db"

export const calculateDailyRepayment = (amount: number) => {
  // 10 days, so divide equally
  return Math.round((amount * 100) / 10) / 100
}

export const calculateLoanSchedule = (loan: Loan) => {
  const dailyRepayment = calculateDailyRepayment(loan.amount)
  const schedule = []

  for (let i = 0; i < 10; i++) {
    const dueDate = new Date(loan.issuedDate)
    dueDate.setDate(dueDate.getDate() + i + 1)

    schedule.push({
      day: i + 1,
      dueDate: dueDate.toISOString().split("T")[0],
      amount: dailyRepayment,
      isPaid: false,
    })
  }

  return schedule
}

export const calculatePaymentStatus = (loan: Loan, payments: Payment[]) => {
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalDue = loan.amount

  return {
    totalPaid,
    totalDue,
    remaining: Math.max(0, totalDue - totalPaid),
    isPaid: totalPaid >= totalDue,
    isOverdue: totalPaid < totalDue && new Date() > new Date(loan.dueDate),
  }
}

export const isLoanDefaulted = (loan: Loan, payments: Payment[]) => {
  const status = calculatePaymentStatus(loan, payments)
  return status.isOverdue && !status.isPaid
}

export const calculateLatePenalty = (loanId: string, payments: Payment[], dueDate: string) => {
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const loanAmount = totalPaid / 0.9 // Work backwards from paid amount (90% of original)

  if (new Date() > new Date(dueDate)) {
    const daysLate = Math.floor((new Date().getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24))
    if (daysLate > 0) {
      return Math.round(loanAmount * 0.1 * 100) / 100 // 10% flat penalty
    }
  }

  return 0
}

export const rollForwardPayment = (payment: number, dailyRepayment: number) => {
  const excess = payment - dailyRepayment
  return Math.max(0, excess)
}
