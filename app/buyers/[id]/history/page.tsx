import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { BuyerHistoryComponent } from "@/components/buyers/buyer-history"

interface HistoryPageProps {
  params: Promise<{ id: string }>
}

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const buyer = await prisma.buyer.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      ownerId: true,
    },
  })

  if (!buyer) {
    notFound()
  }

  const history = await prisma.buyerHistory.findMany({
    where: { buyerId: id },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { changedAt: "desc" },
  })

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/buyers/${id}`}>
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lead
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Change History</h1>
            <p className="text-gray-600">{buyer.fullName}</p>
          </div>
        </div>
      </div>

      <BuyerHistoryComponent buyerId={id} initialHistory={history} />
    </div>
  )
}
