import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { stringify } from "csv-stringify/sync"
import { formatEnumValue } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fields = searchParams.get("fields")?.split(",") || []
    const search = searchParams.get("search") || ""
    const city = searchParams.get("city") || ""
    const propertyType = searchParams.get("propertyType") || ""
    const status = searchParams.get("status") || ""
    const timeline = searchParams.get("timeline") || ""

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields selected" }, { status: 400 })
    }

    // Build where clause - ALWAYS filter by current user's ID
    const where: any = {
      ownerId: user.id, // This ensures only buyers belonging to the current user are exported
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

    // Fetch buyers with owner info
    const buyers = await prisma.buyer.findMany({
      where,
      include: {
        owner: {
          select: { name: true, email: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    // Prepare CSV data
    const csvData: any[] = []

    // Add headers
    const headers = fields.map((field) => {
      switch (field) {
        case "fullName":
          return "Full Name"
        case "email":
          return "Email"
        case "phone":
          return "Phone"
        case "city":
          return "City"
        case "propertyType":
          return "Property Type"
        case "bhk":
          return "BHK"
        case "purpose":
          return "Purpose"
        case "budgetMin":
          return "Budget Min"
        case "budgetMax":
          return "Budget Max"
        case "timeline":
          return "Timeline"
        case "source":
          return "Source"
        case "status":
          return "Status"
        case "notes":
          return "Notes"
        case "tags":
          return "Tags"
        case "createdAt":
          return "Created At"
        case "updatedAt":
          return "Updated At"
        default:
          return field
      }
    })

    csvData.push(headers)

    // Add data rows
    buyers.forEach((buyer) => {
      const row: any[] = []
      fields.forEach((field) => {
        let value = buyer[field as keyof typeof buyer]

        if (field === "tags" && Array.isArray(value)) {
          value = value.join(", ")
        } else if (field === "createdAt" || field === "updatedAt") {
          value = new Date(value as string).toLocaleDateString()
        } else if (typeof value === "object" && value !== null) {
          value = formatEnumValue(String(value))
        } else if (value === null || value === undefined) {
          value = ""
        }

        row.push(String(value))
      })
      csvData.push(row)
    })

    const csv = stringify(csvData)

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="buyers-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export buyers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
