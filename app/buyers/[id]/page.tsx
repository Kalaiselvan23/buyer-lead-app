import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { BuyerDetails } from "@/components/buyers/buyer-details"

interface BuyerPageProps {
  params: Promise<{ id: string }>
}

export default async function BuyerPage({ params }: BuyerPageProps) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const buyer = await prisma.buyer.findUnique({
    where: { id },
    include: {
      owner: {
        select: { name: true, email: true },
      },
      history: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { changedAt: "desc" },
        take: 10,
      },
    },
  })

  if (!buyer) {
    notFound()
  }

  return <BuyerDetails buyer={buyer} currentUserId={user.id} />
}
