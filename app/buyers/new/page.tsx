import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { BuyerFormWrapper } from "@/components/buyers/buyer-form-wrapper"

export default async function NewBuyerPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <BuyerFormWrapper />
    </div>
  )
}
