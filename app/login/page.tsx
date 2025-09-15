import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"

export default async function LoginPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/buyers")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Buyer Lead Manager</h1>
          <p className="text-gray-600">Manage your real estate buyer leads efficiently</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
