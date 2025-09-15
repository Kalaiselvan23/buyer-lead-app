import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { setAuthCookie } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  if (!token || !email) {
    return NextResponse.redirect(new URL("/login?error=invalid-link", request.url))
  }

  try {
    // Find the magic link token
    const magicLinkToken = await prisma.magicLinkToken.findUnique({
      where: { token },
      include: { user: true },
    })

    // Validate token exists and matches email
    if (!magicLinkToken || magicLinkToken.email !== email) {
      return NextResponse.redirect(new URL("/login?error=invalid-link", request.url))
    }

    // Check if token has expired
    if (magicLinkToken.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.magicLinkToken.delete({
        where: { id: magicLinkToken.id },
      })
      return NextResponse.redirect(new URL("/login?error=link-expired", request.url))
    }

    // Check if token has already been used
    if (magicLinkToken.used) {
      return NextResponse.redirect(new URL("/login?error=link-already-used", request.url))
    }

    // Find or create user
    let user = magicLinkToken.user
    if (!user) {
      user = await prisma.user.findUnique({
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
    }

    // Mark token as used
    await prisma.magicLinkToken.update({
      where: { id: magicLinkToken.id },
      data: { used: true },
    })

    // Set auth cookie and redirect
    await setAuthCookie(user.id)
    return NextResponse.redirect(new URL("/buyers", request.url))
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.redirect(new URL("/login?error=verification-failed", request.url))
  }
}
