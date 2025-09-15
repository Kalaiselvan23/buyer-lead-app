import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { buyerSchema, checkEmailUniqueness } from "@/lib/validations"

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

    const buyer = await prisma.buyer.findFirst({
      where: { 
        id,
        ownerId: user.id // Ensure user can only access their own buyers
      },
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
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 })
    }

    return NextResponse.json(buyer)
  } catch (error) {
    console.error("Get buyer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First verify the buyer exists and belongs to the user
    const existingBuyer = await prisma.buyer.findFirst({
      where: { 
        id,
        ownerId: user.id // Ensure user can only update their own buyers
      },
    })

    if (!existingBuyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = buyerSchema.parse(body)

    // Check for email uniqueness if email is provided and has changed
    if (validatedData.email && validatedData.email.trim() !== "" && 
        validatedData.email !== existingBuyer.email) {
      const isEmailUnique = await checkEmailUniqueness(validatedData.email, user.id, id)
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

    // Compute field-level diffs so UI can render From/To correctly
    const fieldsToTrack: Array<keyof typeof existingBuyer> = [
      "fullName",
      "email",
      "phone",
      "city",
      "propertyType",
      "bhk",
      "purpose",
      "budgetMin",
      "budgetMax",
      "timeline",
      "source",
      "status",
      "notes",
      "tags",
    ] as any

    const isEqual = (a: any, b: any) => {
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false
        return a.every((v, i) => v === b[i])
      }
      return a === b
    }

    const changes: Record<string, { from: any; to: any }> = {}
    for (const field of fieldsToTrack) {
      const prevVal = (existingBuyer as any)[field]
      const nextVal = (validatedData as any)[field]
      if (!isEqual(prevVal ?? null, nextVal ?? null)) {
        changes[field as string] = { from: prevVal ?? null, to: nextVal ?? null }
      }
    }

    const updatedBuyer = await prisma.buyer.update({
      where: { id },
      data: validatedData,
      include: {
        owner: {
          select: { name: true, email: true },
        },
      },
    })

    // Create history entry with computed diffs
    await prisma.buyerHistory.create({
      data: {
        buyerId: id,
        changedBy: user.id,
        diff: {
          action: "updated",
          changes,
        },
      },
    })

    return NextResponse.json(updatedBuyer)
  } catch (error: any) {
    console.error("Update buyer error:", error)

    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First verify the buyer exists and belongs to the user
    const existingBuyer = await prisma.buyer.findFirst({
      where: { 
        id,
        ownerId: user.id // Ensure user can only delete their own buyers
      },
    })

    if (!existingBuyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 })
    }

    // Delete the buyer (cascade will handle history)
    await prisma.buyer.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete buyer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
