import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { BuyerList } from "@/components/buyers/buyer-list"

export default async function BuyersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return <BuyerList />
}
