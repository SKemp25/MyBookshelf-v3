import SignUpForm from "@/components/SignUpForm"

export default function SignUpPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-orange-400 to-orange-600 flex items-start justify-center p-4 py-8 overflow-auto">
      <div className="w-full flex justify-center items-start min-h-full">
        <SignUpForm />
      </div>
    </div>
  )
}
