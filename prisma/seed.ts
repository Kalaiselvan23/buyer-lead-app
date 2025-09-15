import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create demo user
  const hashedPassword = await bcrypt.hash("demo123", 10)

  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
    },
  })

  // Create sample buyers
  const sampleBuyers = [
    {
      fullName: "Rajesh Kumar",
      email: "rajesh@example.com",
      phone: "9876543210",
      city: "CHANDIGARH" as const,
      propertyType: "APARTMENT" as const,
      bhk: "THREE" as const,
      purpose: "BUY" as const,
      budgetMin: 5000000,
      budgetMax: 7000000,
      timeline: "THREE_TO_SIX_MONTHS" as const,
      source: "WEBSITE" as const,
      status: "NEW" as const,
      notes: "Looking for a 3BHK apartment in Sector 22",
      tags: ["urgent", "verified"],
      ownerId: user.id,
    },
    {
      fullName: "Priya Sharma",
      email: "priya@example.com",
      phone: "9876543211",
      city: "MOHALI" as const,
      propertyType: "VILLA" as const,
      bhk: "FOUR" as const,
      purpose: "BUY" as const,
      budgetMin: 8000000,
      budgetMax: 12000000,
      timeline: "ZERO_TO_THREE_MONTHS" as const,
      source: "REFERRAL" as const,
      status: "QUALIFIED" as const,
      notes: "Interested in Phase 11 area",
      tags: ["high-budget", "ready-to-buy"],
      ownerId: user.id,
    },
    {
      fullName: "Amit Singh",
      phone: "9876543212",
      city: "ZIRAKPUR" as const,
      propertyType: "PLOT" as const,
      purpose: "BUY" as const,
      budgetMin: 2000000,
      budgetMax: 3000000,
      timeline: "MORE_THAN_SIX_MONTHS" as const,
      source: "WALK_IN" as const,
      status: "CONTACTED" as const,
      notes: "Looking for residential plot near VIP Road",
      tags: ["plot", "investment"],
      ownerId: user.id,
    },
  ]

  for (const buyer of sampleBuyers) {
    await prisma.buyer.create({
      data: buyer,
    })
  }

  console.log("Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
