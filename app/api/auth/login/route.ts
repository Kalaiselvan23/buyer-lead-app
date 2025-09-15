import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { setAuthCookie } from "@/lib/auth"
import { generateMagicLinkToken, sendMagicLinkEmail } from "@/lib/email"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  isDemo: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, isDemo } = loginSchema.parse(body)

    // For demo purposes
    if (isDemo && email === "demo@example.com") {
      let user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: "Demo User",
          },
        })
      }

      await setAuthCookie(user.id)
      return NextResponse.json({ success: true, isDemoLogin: true })
    }

    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
        },
      })
    }

    // Clean up expired tokens for this email
    await prisma.magicLinkToken.deleteMany({
      where: {
        email,
        OR: [
          { expiresAt: { lt: new Date() } },
          { used: true }
        ]
      }
    })

    // Generate new magic link token
    const token = generateMagicLinkToken()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store token in database
    await prisma.magicLinkToken.create({
      data: {
        token,
        email,
        userId: user.id,
        expiresAt,
      },
    })

    // Send magic link email
    const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const emailResult = await sendMagicLinkEmail(email, token, baseUrl)

    if (!emailResult.success) {
      console.error('Failed to send magic link email:', emailResult.error)
      return NextResponse.json(
        { error: "Failed to send magic link. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Magic link sent to your email. Please check your inbox and click the link to sign in.",
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
