"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X } from "lucide-react"

interface BuyerFormProps {
  buyer?: any
  onSuccess?: () => void
}

export function BuyerForm({ buyer, onSuccess }: BuyerFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    fullName: buyer?.fullName || "",
    email: buyer?.email || "",
    phone: buyer?.phone || "",
    city: buyer?.city || "",
    propertyType: buyer?.propertyType || "",
    bhk: buyer?.bhk || "",
    purpose: buyer?.purpose || "",
    budgetMin: buyer?.budgetMin?.toString() || "",
    budgetMax: buyer?.budgetMax?.toString() || "",
    timeline: buyer?.timeline || "",
    source: buyer?.source || "",
    status: buyer?.status || "NEW",
    notes: buyer?.notes || "",
    tags: buyer?.tags || [],
  })
  const [newTag, setNewTag] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setFieldErrors({})

    try {
      const submitData = {
        ...formData,
        budgetMin: formData.budgetMin ? Number.parseInt(formData.budgetMin) : undefined,
        budgetMax: formData.budgetMax ? Number.parseInt(formData.budgetMax) : undefined,
        tags: formData.tags,
      }

      const url = buyer ? `/api/buyers/${buyer.id}` : "/api/buyers"
      const method = buyer ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (response.ok) {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/buyers")
        }
      } else {
        if (data.field) {
          // Field-specific error
          setFieldErrors({ [data.field]: data.error })
        } else if (data.details) {
          // Validation errors
          const errors: Record<string, string> = {}
          data.details.forEach((detail: any) => {
            errors[detail.path[0]] = detail.message
          })
          setFieldErrors(errors)
        } else {
          setError(data.error || "Something went wrong")
        }
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{buyer ? "Edit Buyer" : "Add New Buyer"}</CardTitle>
        <CardDescription>
          {buyer ? "Update buyer information" : "Enter buyer details to add to your leads"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder="Enter full name"
                required
                className={fieldErrors.fullName ? "border-red-500" : ""}
              />
              {fieldErrors.fullName && (
                <p className="text-sm text-red-600">{fieldErrors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
                className={fieldErrors.email ? "border-red-500" : ""}
              />
              {fieldErrors.email && (
                <p className="text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
                required
                className={fieldErrors.phone ? "border-red-500" : ""}
              />
              {fieldErrors.phone && (
                <p className="text-sm text-red-600">{fieldErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Select value={formData.city} onValueChange={(value) => handleInputChange("city", value)}>
                <SelectTrigger className={fieldErrors.city ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHANDIGARH">Chandigarh</SelectItem>
                  <SelectItem value="MOHALI">Mohali</SelectItem>
                  <SelectItem value="ZIRAKPUR">Zirakpur</SelectItem>
                  <SelectItem value="PANCHKULA">Panchkula</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.city && (
                <p className="text-sm text-red-600">{fieldErrors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyType">Property Type *</Label>
              <Select value={formData.propertyType} onValueChange={(value) => handleInputChange("propertyType", value)}>
                <SelectTrigger className={fieldErrors.propertyType ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APARTMENT">Apartment</SelectItem>
                  <SelectItem value="VILLA">Villa</SelectItem>
                  <SelectItem value="PLOT">Plot</SelectItem>
                  <SelectItem value="OFFICE">Office</SelectItem>
                  <SelectItem value="RETAIL">Retail</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.propertyType && (
                <p className="text-sm text-red-600">{fieldErrors.propertyType}</p>
              )}
            </div>

            {(formData.propertyType === "APARTMENT" || formData.propertyType === "VILLA") && (
              <div className="space-y-2">
                <Label htmlFor="bhk">BHK *</Label>
                <Select value={formData.bhk} onValueChange={(value) => handleInputChange("bhk", value)}>
                  <SelectTrigger className={fieldErrors.bhk ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select BHK" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONE">1 BHK</SelectItem>
                    <SelectItem value="TWO">2 BHK</SelectItem>
                    <SelectItem value="THREE">3 BHK</SelectItem>
                    <SelectItem value="FOUR">4 BHK</SelectItem>
                    <SelectItem value="STUDIO">Studio</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.bhk && (
                  <p className="text-sm text-red-600">{fieldErrors.bhk}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose *</Label>
              <Select value={formData.purpose} onValueChange={(value) => handleInputChange("purpose", value)}>
                <SelectTrigger className={fieldErrors.purpose ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="RENT">Rent</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.purpose && (
                <p className="text-sm text-red-600">{fieldErrors.purpose}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetMin">Min Budget (₹)</Label>
              <Input
                id="budgetMin"
                type="number"
                value={formData.budgetMin}
                onChange={(e) => handleInputChange("budgetMin", e.target.value)}
                placeholder="Enter minimum budget"
                className={fieldErrors.budgetMin ? "border-red-500" : ""}
              />
              {fieldErrors.budgetMin && (
                <p className="text-sm text-red-600">{fieldErrors.budgetMin}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetMax">Max Budget (₹)</Label>
              <Input
                id="budgetMax"
                type="number"
                value={formData.budgetMax}
                onChange={(e) => handleInputChange("budgetMax", e.target.value)}
                placeholder="Enter maximum budget"
                className={fieldErrors.budgetMax ? "border-red-500" : ""}
              />
              {fieldErrors.budgetMax && (
                <p className="text-sm text-red-600">{fieldErrors.budgetMax}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline *</Label>
              <Select value={formData.timeline} onValueChange={(value) => handleInputChange("timeline", value)}>
                <SelectTrigger className={fieldErrors.timeline ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZERO_TO_THREE_MONTHS">0-3 Months</SelectItem>
                  <SelectItem value="THREE_TO_SIX_MONTHS">3-6 Months</SelectItem>
                  <SelectItem value="MORE_THAN_SIX_MONTHS">More than 6 Months</SelectItem>
                  <SelectItem value="EXPLORING">Exploring</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.timeline && (
                <p className="text-sm text-red-600">{fieldErrors.timeline}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source *</Label>
              <Select value={formData.source} onValueChange={(value) => handleInputChange("source", value)}>
                <SelectTrigger className={fieldErrors.source ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEBSITE">Website</SelectItem>
                  <SelectItem value="REFERRAL">Referral</SelectItem>
                  <SelectItem value="WALK_IN">Walk-in</SelectItem>
                  <SelectItem value="CALL">Call</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.source && (
                <p className="text-sm text-red-600">{fieldErrors.source}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className={fieldErrors.status ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="QUALIFIED">Qualified</SelectItem>
                  <SelectItem value="CONTACTED">Contacted</SelectItem>
                  <SelectItem value="VISITED">Visited</SelectItem>
                  <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                  <SelectItem value="CONVERTED">Converted</SelectItem>
                  <SelectItem value="DROPPED">Dropped</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.status && (
                <p className="text-sm text-red-600">{fieldErrors.status}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Enter any additional notes"
              rows={3}
              className={fieldErrors.notes ? "border-red-500" : ""}
            />
            {fieldErrors.notes && (
              <p className="text-sm text-red-600">{fieldErrors.notes}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : buyer ? "Update Buyer" : "Add Buyer"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
