import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { BuyerForm } from "@/components/buyers/buyer-form"

interface EditBuyerPageProps {
  params: Promise<{ id: string }>
}

export default async function EditBuyerPage({ params }: EditBuyerPageProps) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const buyer = await prisma.buyer.findUnique({
    where: { id },
  })

  if (!buyer) {
    notFound()
  }

  // Check ownership
  if (buyer.ownerId !== user.id) {
    redirect("/buyers")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <BuyerForm buyer={buyer} isEdit={true} />
    </div>
  )
}
