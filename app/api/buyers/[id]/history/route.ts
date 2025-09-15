import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify buyer exists and user has access
    const buyer = await prisma.buyer.findFirst({
      where: { 
        id,
        ownerId: user.id // Ensure user can only access history of their own buyers
      },
      select: { id: true },
    })

    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 })
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

    return NextResponse.json(history)
  } catch (error) {
    console.error("Get history error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
