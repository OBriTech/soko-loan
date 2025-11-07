import IssueLoanForm from "@/components/issue-loan-form"

export default function IssueLoanPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground">Issue Loan</h1>
          <p className="text-muted-foreground mt-1">Create a new loan for a member</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <IssueLoanForm />
      </main>
    </div>
  )
}
