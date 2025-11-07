export interface Loan {
  _id?: string
  _rev?: string
  memberId: string
  memberName: string
  amount: number
  issuedDate: string
  dueDate: string
  status: "active" | "paid" | "defaulted"
  totalInterest: number
  type: "document"
}

export interface Payment {
  _id?: string
  _rev?: string
  loanId: string
  amount: number
  date: string
  type: "document"
}

let loansCache: Loan[] = []
let paymentsCache: Payment[] = []
let initialized = false

const LOANS_KEY = "soko-loans"
const PAYMENTS_KEY = "soko-payments"

export const initializeDB = async () => {
  try {
    // Load data from localStorage
    const loansData = localStorage.getItem(LOANS_KEY)
    const paymentsData = localStorage.getItem(PAYMENTS_KEY)

    loansCache = loansData ? JSON.parse(loansData) : []
    paymentsCache = paymentsData ? JSON.parse(paymentsData) : []

    initialized = true
    console.log("[v0] Databases initialized successfully")
  } catch (error) {
    console.error("[v0] Database initialization failed:", error)
    initialized = true
  }
}

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const saveLoans = () => {
  try {
    localStorage.setItem(LOANS_KEY, JSON.stringify(loansCache))
  } catch (error) {
    console.error("[v0] Failed to save loans:", error)
  }
}

const savePayments = () => {
  try {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(paymentsCache))
  } catch (error) {
    console.error("[v0] Failed to save payments:", error)
  }
}

export const createLoan = async (loan: Omit<Loan, "_id" | "_rev" | "type">): Promise<Loan> => {
  const newLoan: Loan = {
    ...loan,
    _id: generateId(),
    _rev: "1",
    type: "document",
  }
  loansCache.push(newLoan)
  saveLoans()
  return newLoan
}

export const getLoans = async (): Promise<Loan[]> => {
  return [...loansCache]
}

export const getLoan = async (id: string): Promise<Loan> => {
  const loan = loansCache.find((l) => l._id === id)
  if (!loan) throw new Error("Loan not found")
  return loan
}

export const updateLoan = async (loan: Loan): Promise<void> => {
  const index = loansCache.findIndex((l) => l._id === loan._id)
  if (index === -1) throw new Error("Loan not found")
  loansCache[index] = loan
  saveLoans()
}

export const createPayment = async (payment: Omit<Payment, "_id" | "_rev" | "type">): Promise<Payment> => {
  const newPayment: Payment = {
    ...payment,
    _id: generateId(),
    _rev: "1",
    type: "document",
  }
  paymentsCache.push(newPayment)
  savePayments()
  return newPayment
}

export const getPayments = async (): Promise<Payment[]> => {
  return [...paymentsCache]
}

export const getPaymentsByLoan = async (loanId: string): Promise<Payment[]> => {
  return paymentsCache.filter((p) => p.loanId === loanId)
}
