"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit, ArrowLeft, Trash2, Clock, History } from "lucide-react"
import { formatCurrency, formatEnumValue } from "@/lib/utils"
import type { Buyer, User, BuyerHistory } from "@prisma/client"
import Link from "next/link"

interface BuyerWithOwnerAndHistory extends Buyer {
  owner: Pick<User, "name" | "email">
  history: (BuyerHistory & {
    user: Pick<User, "name" | "email">
  })[]
}

interface BuyerDetailsProps {
  buyer: BuyerWithOwnerAndHistory
  currentUserId: string
}

export function BuyerDetails({ buyer, currentUserId }: BuyerDetailsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  const canEdit = buyer.ownerId === currentUserId
  const canDelete = buyer.ownerId === currentUserId

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this buyer lead? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    setError("")

    try {
      const response = await fetch(`/api/buyers/${buyer.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/buyers")
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete buyer")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      NEW: "bg-blue-100 text-blue-800",
      QUALIFIED: "bg-green-100 text-green-800",
      CONTACTED: "bg-yellow-100 text-yellow-800",
      VISITED: "bg-purple-100 text-purple-800",
      NEGOTIATION: "bg-orange-100 text-orange-800",
      CONVERTED: "bg-emerald-100 text-emerald-800",
      DROPPED: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const formatBudget = (min?: number | null, max?: number | null) => {
    if (!min && !max) return "Not specified"
    if (min && max) return `${formatCurrency(min)} - ${formatCurrency(max)}`
    if (min) return `From ${formatCurrency(min)}`
    if (max) return `Up to ${formatCurrency(max)}`
    return "Not specified"
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{buyer.fullName}</h1>
            <p className="text-gray-600">Buyer Lead Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/buyers/${buyer.id}/history`}>
            <Button variant="outline">
              <History className="h-4 w-4 mr-2" />
              Full History
            </Button>
          </Link>
          {canEdit && (
            <Button onClick={() => router.push(`/buyers/${buyer.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-lg">{buyer.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-lg">{buyer.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{buyer.email || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">City</label>
                  <p className="text-lg">{formatEnumValue(buyer.city)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Property Type</label>
                  <p className="text-lg">{formatEnumValue(buyer.propertyType)}</p>
                </div>
                {buyer.bhk && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">BHK</label>
                    <p className="text-lg">{formatEnumValue(buyer.bhk)}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Purpose</label>
                  <p className="text-lg">{formatEnumValue(buyer.purpose)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Timeline</label>
                  <p className="text-lg">{formatEnumValue(buyer.timeline)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Budget</label>
                <p className="text-lg">{formatBudget(buyer.budgetMin, buyer.budgetMax)}</p>
              </div>
            </CardContent>
          </Card>

          {buyer.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{buyer.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status & Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(buyer.status)}>{formatEnumValue(buyer.status)}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Source</label>
                <p>{formatEnumValue(buyer.source)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Owner</label>
                <p>{buyer.owner.name || buyer.owner.email}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm">{new Date(buyer.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm">{new Date(buyer.updatedAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {buyer.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {buyer.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent History */}
          {buyer.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Changes
                </CardTitle>
                <CardDescription>
                  Last 5 changes to this lead
                  {buyer.history.length > 5 && (
                    <Link href={`/buyers/${buyer.id}/history`} className="ml-2 text-blue-600 hover:underline">
                      View all history
                    </Link>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {buyer.history.slice(0, 5).map((entry) => {
                    const diff = entry.diff as any
                    const action = diff?.action || "updated"
                    const changes = diff?.changes || {}

                    return (
                      <div key={entry.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{entry.user.name || entry.user.email}</p>
                            <Badge variant="secondary" className="text-xs">
                              {action}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">{new Date(entry.changedAt).toLocaleString()}</p>
                          {action === "updated" && Object.keys(changes).length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Updated {Object.keys(changes).length} field{Object.keys(changes).length !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {buyer.history.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link href={`/buyers/${buyer.id}/history`}>
                      <Button variant="outline" size="sm">
                        <History className="h-4 w-4 mr-2" />
                        View Full History
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
