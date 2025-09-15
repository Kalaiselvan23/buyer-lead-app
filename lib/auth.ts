import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { prisma } from "./prisma"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "buyer")

export async function createToken(userId: string) {
  return await new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret)
    const rawUserId: unknown = (payload as any).userId
    if (rawUserId == null) return null
    return typeof rawUserId === "string" ? rawUserId : String(rawUserId)
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) return null

  const userId = await verifyToken(token)
  if (!userId) return null

  return await prisma.user.findUnique({
    where: { id: userId },
  })
}

export async function setAuthCookie(userId: string) {
  const token = await createToken(userId)
  const cookieStore = await cookies()

  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("auth-token")
}
