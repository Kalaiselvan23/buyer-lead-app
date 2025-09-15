import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { csvBuyerSchema } from "@/lib/validations"
import { parse } from "csv-parse/sync"

interface ImportError {
  row: number
  field: string
  message: string
  value: string
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.type !== "text/csv") {
      return NextResponse.json({ error: "File must be CSV format" }, { status: 400 })
    }

    const text = await file.text()
    let records: any[]

    try {
      records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid CSV format" }, { status: 400 })
    }

    if (records.length === 0) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 })
    }

    if (records.length > 200) {
      return NextResponse.json({ error: "Maximum 200 rows allowed" }, { status: 400 })
    }

    const errors: ImportError[] = []
    const validRecords: any[] = []
    const emailSet = new Set<string>() // Track emails within the CSV

    // Validate each record
    records.forEach((record, index) => {
      const rowNumber = index + 2 // +2 because index starts at 0 and we have headers

      try {
        // Clean up the record
        const cleanRecord = {
          fullName: record.fullName?.trim(),
          email: record.email?.trim() || undefined,
          phone: record.phone?.trim(),
          city: record.city?.trim().toUpperCase(),
          propertyType: record.propertyType?.trim().toUpperCase(),
          bhk: record.bhk?.trim().toUpperCase() || undefined,
          purpose: record.purpose?.trim().toUpperCase(),
          budgetMin: record.budgetMin ? Number.parseInt(record.budgetMin) : undefined,
          budgetMax: record.budgetMax ? Number.parseInt(record.budgetMax) : undefined,
          timeline: record.timeline?.trim().toUpperCase().replace(/\s+/g, "_"),
          source: record.source?.trim().toUpperCase().replace(/\s+/g, "_"),
          status: record.status?.trim().toUpperCase() || "NEW",
          notes: record.notes?.trim() || undefined,
          tags: record.tags
            ? record.tags
                .split(",")
                .map((tag: string) => tag.trim())
                .filter(Boolean)
            : [],
        }

        // Check for duplicate emails within the CSV
        if (cleanRecord.email && cleanRecord.email.trim() !== "") {
          if (emailSet.has(cleanRecord.email.toLowerCase())) {
            errors.push({
              row: rowNumber,
              field: "email",
              message: "Duplicate email found within the CSV file",
              value: cleanRecord.email,
            })
            return // Skip this record
          }
          emailSet.add(cleanRecord.email.toLowerCase())
        }

        // Validate with Zod
        const validatedRecord = csvBuyerSchema.parse(cleanRecord)
        validRecords.push(validatedRecord)
      } catch (error: any) {
        if (error.errors) {
          error.errors.forEach((err: any) => {
            errors.push({
              row: rowNumber,
              field: err.path[0] || "unknown",
              message: err.message,
              value: record[err.path[0]] || "",
            })
          })
        } else {
          errors.push({
            row: rowNumber,
            field: "general",
            message: "Validation failed",
            value: JSON.stringify(record),
          })
        }
      }
    })

    // Check for existing emails in database for valid records
    if (validRecords.length > 0) {
      const emailsToCheck = validRecords
        .filter(record => record.email && record.email.trim() !== "")
        .map(record => record.email.trim())

      if (emailsToCheck.length > 0) {
        const existingBuyers = await prisma.buyer.findMany({
          where: {
            email: { in: emailsToCheck },
            ownerId: user.id,
          },
          select: { email: true },
        })

        const existingEmails = new Set(existingBuyers.map(buyer => buyer.email?.toLowerCase()))

        // Add errors for existing emails
        validRecords.forEach((record, index) => {
          if (record.email && record.email.trim() !== "" && 
              existingEmails.has(record.email.toLowerCase())) {
            errors.push({
              row: index + 2, // +2 for header row and 0-based index
              field: "email",
              message: "A buyer with this email already exists in your database",
              value: record.email,
            })
          }
        })

        // Remove records with existing emails from valid records
        const filteredValidRecords = validRecords.filter(record => 
          !record.email || record.email.trim() === "" || 
          !existingEmails.has(record.email.toLowerCase())
        )

        // Import valid records in a transaction
        let importedCount = 0
        if (filteredValidRecords.length > 0) {
          await prisma.$transaction(async (tx) => {
            for (const record of filteredValidRecords) {
              const buyer = await tx.buyer.create({
                data: {
                  ...record,
                  ownerId: user.id,
                },
              })

              // Create history entry
              await tx.buyerHistory.create({
                data: {
                  buyerId: buyer.id,
                  changedBy: user.id,
                  diff: {
                    action: "imported",
                    source: "csv",
                    data: record,
                  },
                },
              })

              importedCount++
            }
          })
        }

        return NextResponse.json({
          success: importedCount > 0,
          imported: importedCount,
          errors,
          message:
            importedCount > 0 ? `Successfully imported ${importedCount} buyer leads` : "No valid records found to import",
        })
      }
    }

    return NextResponse.json({
      success: false,
      imported: 0,
      errors,
      message: "No valid records found to import",
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
