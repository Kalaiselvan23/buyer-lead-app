import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { buyerSchema, checkEmailUniqueness } from "@/lib/validations"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = buyerSchema.parse(body)

    // Check for email uniqueness if email is provided
    if (validatedData.email && validatedData.email.trim() !== "") {
      const isEmailUnique = await checkEmailUniqueness(validatedData.email, user.id)
      if (!isEmailUnique) {
        return NextResponse.json(
          { 
            error: "A buyer with this email already exists. Please use a different email or leave it empty.",
            field: "email"
          }, 
          { status: 400 }
        )
      }
    }

    const buyer = await prisma.buyer.create({
      data: {
        ...validatedData,
        ownerId: user.id,
      },
    })

    // Create history entry
    await prisma.buyerHistory.create({
      data: {
        buyerId: buyer.id,
        changedBy: user.id,
        diff: {
          action: "created",
          changes: validatedData,
        },
      },
    })

    return NextResponse.json(buyer, { status: 201 })
  } catch (error: any) {
    console.error("Create buyer error:", error)

    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const search = searchParams.get("search") || ""
    const city = searchParams.get("city") || ""
    const propertyType = searchParams.get("propertyType") || ""
    const status = searchParams.get("status") || ""
    const timeline = searchParams.get("timeline") || ""

    const pageSize = 10
    const skip = (page - 1) * pageSize

    // Build where clause - ALWAYS filter by current user's ID
    const where: any = {
      ownerId: user.id, // This ensures only buyers belonging to the current user are returned
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    if (city) where.city = city
    if (propertyType) where.propertyType = propertyType
    if (status) where.status = status
    if (timeline) where.timeline = timeline

    const [buyers, total] = await Promise.all([
      prisma.buyer.findMany({
        where,
        include: {
          owner: {
            select: { name: true, email: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.buyer.count({ where }),
    ])

    return NextResponse.json({
      buyers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Get buyers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
