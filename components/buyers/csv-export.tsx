"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const exportFields = [
  { id: "fullName", label: "Full Name", required: true },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone", required: true },
  { id: "city", label: "City", required: true },
  { id: "propertyType", label: "Property Type", required: true },
  { id: "bhk", label: "BHK" },
  { id: "purpose", label: "Purpose", required: true },
  { id: "budgetMin", label: "Budget Min" },
  { id: "budgetMax", label: "Budget Max" },
  { id: "timeline", label: "Timeline", required: true },
  { id: "source", label: "Source", required: true },
  { id: "status", label: "Status", required: true },
  { id: "notes", label: "Notes" },
  { id: "tags", label: "Tags" },
  { id: "createdAt", label: "Created Date" },
  { id: "updatedAt", label: "Updated Date" },
  { id: "owner", label: "Owner" },
]

export function CSVExport() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [selectedFields, setSelectedFields] = useState<string[]>(
    exportFields.filter((field) => field.required).map((field) => field.id),
  )
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState("")

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    if (checked) {
      setSelectedFields((prev) => [...prev, fieldId])
    } else {
      const field = exportFields.find((f) => f.id === fieldId)
      if (!field?.required) {
        setSelectedFields((prev) => prev.filter((id) => id !== fieldId))
      }
    }
  }

  const selectAll = () => {
    setSelectedFields(exportFields.map((field) => field.id))
  }

  const selectRequired = () => {
    setSelectedFields(exportFields.filter((field) => field.required).map((field) => field.id))
  }

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      setError("Please select at least one field to export")
      return
    }

    setIsExporting(true)
    setError("")

    try {
      // Build query params from current filters
      const exportParams = new URLSearchParams()
      exportParams.set("fields", selectedFields.join(","))

      // Copy current search/filter params
      searchParams.forEach((value, key) => {
        if (key !== "page") {
          // Don't include pagination in export
          exportParams.set(key, value)
        }
      })

      const response = await fetch(`/api/buyers/export?${exportParams}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `buyer_leads_${new Date().toISOString().split("T")[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        
        // Show success toast
        toast({
          title: "Export Successful",
          description: "Your buyer leads have been exported successfully.",
        })
        
        // Navigate back to home page after a short delay
        setTimeout(() => {
          router.push("/")
        }, 1000)
      } else {
        const data = await response.json()
        setError(data.error || "Export failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsExporting(false)
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Export Buyer Leads</h1>
            <p className="text-gray-600">Download your buyer leads data as CSV</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Export Info */}
        <Card>
          <CardHeader>
            <CardTitle>Export Information</CardTitle>
            <CardDescription>Your current filters and search will be applied to the export</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {searchParams.get("search") && (
                <div className="text-sm">
                  <span className="font-medium">Search:</span> {searchParams.get("search")}
                </div>
              )}
              {searchParams.get("city") && (
                <div className="text-sm">
                  <span className="font-medium">City:</span> {searchParams.get("city")}
                </div>
              )}
              {searchParams.get("propertyType") && (
                <div className="text-sm">
                  <span className="font-medium">Property Type:</span> {searchParams.get("propertyType")}
                </div>
              )}
              {searchParams.get("status") && (
                <div className="text-sm">
                  <span className="font-medium">Status:</span> {searchParams.get("status")}
                </div>
              )}
              {searchParams.get("timeline") && (
                <div className="text-sm">
                  <span className="font-medium">Timeline:</span> {searchParams.get("timeline")}
                </div>
              )}
              {!Array.from(searchParams.keys()).some((key) => key !== "page") && (
                <div className="text-sm text-gray-500">All leads will be exported (no filters applied)</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Field Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Fields to Export</CardTitle>
            <CardDescription>Choose which fields to include in your CSV export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={selectRequired}>
                Required Only
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exportFields.map((field) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={selectedFields.includes(field.id)}
                    onCheckedChange={(checked) => handleFieldToggle(field.id, checked as boolean)}
                    disabled={field.required}
                  />
                  <Label htmlFor={field.id} className="text-sm">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-500">* Required fields cannot be deselected</div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Export Button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Ready to export</p>
                <p className="text-sm text-gray-600">{selectedFields.length} fields selected</p>
              </div>
              <Button onClick={handleExport} disabled={isExporting}>
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export CSV"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
