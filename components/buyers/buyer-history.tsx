"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, User, FileText, ChevronDown, ChevronRight } from "lucide-react"
import { formatEnumValue } from "@/lib/utils"
import type { BuyerHistory, User as PrismaUser } from "@prisma/client"

interface BuyerHistoryWithUser extends BuyerHistory {
  user: Pick<PrismaUser, "name" | "email">
}

interface BuyerHistoryProps {
  buyerId: string
  initialHistory?: BuyerHistoryWithUser[]
}

export function BuyerHistoryComponent({ buyerId, initialHistory = [] }: BuyerHistoryProps) {
  const [history, setHistory] = useState<BuyerHistoryWithUser[]>(initialHistory)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/buyers/${buyerId}/history`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (error) {
      console.error("Failed to fetch history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (initialHistory.length === 0) {
      fetchHistory()
    }
  }, [buyerId, initialHistory.length])

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries)
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId)
    } else {
      newExpanded.add(entryId)
    }
    setExpandedEntries(newExpanded)
  }

  const getActionColor = (action: string) => {
    const colors = {
      created: "bg-green-100 text-green-800",
      updated: "bg-blue-100 text-blue-800",
      imported: "bg-purple-100 text-purple-800",
      deleted: "bg-red-100 text-red-800",
    }
    return colors[action as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) return "Not set"
    if (typeof value === "boolean") return value ? "Yes" : "No"
    if (typeof value === "number") return value.toLocaleString()
    if (Array.isArray(value)) return value.join(", ")
    if (typeof value === "string") {
      // Try to format enum values
      const enumValues = [
        "CHANDIGARH",
        "MOHALI",
        "ZIRAKPUR",
        "PANCHKULA",
        "OTHER",
        "APARTMENT",
        "VILLA",
        "PLOT",
        "OFFICE",
        "RETAIL",
        "ONE",
        "TWO",
        "THREE",
        "FOUR",
        "STUDIO",
        "BUY",
        "RENT",
        "ZERO_TO_THREE_MONTHS",
        "THREE_TO_SIX_MONTHS",
        "MORE_THAN_SIX_MONTHS",
        "EXPLORING",
        "WEBSITE",
        "REFERRAL",
        "WALK_IN",
        "CALL",
        "NEW",
        "QUALIFIED",
        "CONTACTED",
        "VISITED",
        "NEGOTIATION",
        "CONVERTED",
        "DROPPED",
      ]
      if (enumValues.includes(value)) {
        return formatEnumValue(value)
      }
    }
    return String(value)
  }

  const formatFieldName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      fullName: "Full Name",
      email: "Email",
      phone: "Phone",
      city: "City",
      propertyType: "Property Type",
      bhk: "BHK",
      purpose: "Purpose",
      budgetMin: "Budget Min",
      budgetMax: "Budget Max",
      timeline: "Timeline",
      source: "Source",
      status: "Status",
      notes: "Notes",
      tags: "Tags",
    }
    return fieldNames[field] || field
  }

  const renderHistoryEntry = (entry: BuyerHistoryWithUser) => {
    const diff = entry.diff as any
    const action = diff?.action || "updated"
    const changes = diff?.changes || {}
    const isExpanded = expandedEntries.has(entry.id)

    return (
      <div key={entry.id} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{entry.user.name || entry.user.email}</span>
            </div>
            <Badge className={getActionColor(action)}>{action}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            {new Date(entry.changedAt).toLocaleString()}
          </div>
        </div>

        {action === "created" && <div className="text-sm text-gray-600">Created new buyer lead</div>}

        {action === "imported" && <div className="text-sm text-gray-600">Imported from CSV file</div>}

        {action === "updated" && Object.keys(changes).length > 0 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(entry.id)}
              className="flex items-center gap-1 p-0 h-auto"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="text-sm">
                {Object.keys(changes).length} field{Object.keys(changes).length !== 1 ? "s" : ""} changed
              </span>
            </Button>

            {isExpanded && (
              <div className="mt-3 space-y-2">
                {Object.entries(changes).map(([field, change]: [string, any]) => (
                  <div key={field} className="bg-gray-50 rounded p-3">
                    <div className="font-medium text-sm mb-1">{formatFieldName(field)}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">From:</span>
                        <div className="bg-red-50 border border-red-200 rounded px-2 py-1 mt-1">
                          {formatFieldValue(change.from)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">To:</span>
                        <div className="bg-green-50 border border-green-200 rounded px-2 py-1 mt-1">
                          {formatFieldValue(change.to)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-gray-500">Loading history...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Change History
        </CardTitle>
        <CardDescription>Complete history of changes made to this buyer lead</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No history available</div>
        ) : (
          <div className="space-y-4">{history.map(renderHistoryEntry)}</div>
        )}
      </CardContent>
    </Card>
  )
}
