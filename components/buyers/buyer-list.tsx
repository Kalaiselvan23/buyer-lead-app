"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Eye, Edit, Filter, Download, Upload } from "lucide-react"
import { formatCurrency, formatEnumValue } from "@/lib/utils"
import { LogoutButton } from "@/components/auth/logout-button"
import type { Buyer, User } from "@prisma/client"

interface BuyerWithOwner extends Buyer {
  owner: Pick<User, "name" | "email">
}

interface BuyerListResponse {
  buyers: BuyerWithOwner[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

const cityOptions = ["", "CHANDIGARH", "MOHALI", "ZIRAKPUR", "PANCHKULA", "OTHER"]
const propertyTypeOptions = ["", "APARTMENT", "VILLA", "PLOT", "OFFICE", "RETAIL"]
const statusOptions = ["", "NEW", "QUALIFIED", "CONTACTED", "VISITED", "NEGOTIATION", "CONVERTED", "DROPPED"]
const timelineOptions = ["", "ZERO_TO_THREE_MONTHS", "THREE_TO_SIX_MONTHS", "MORE_THAN_SIX_MONTHS", "EXPLORING"]

export function BuyerList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [buyers, setBuyers] = useState<BuyerWithOwner[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)
  const [filters, setFilters] = useState({
    city: searchParams.get("city") || "",
    propertyType: searchParams.get("propertyType") || "",
    status: searchParams.get("status") || "",
    timeline: searchParams.get("timeline") || "",
  })
  const [showFilters, setShowFilters] = useState(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const updateURL = useCallback(
    (newParams: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(newParams).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })

      // Reset to page 1 when filters change
      if (Object.keys(newParams).some((key) => key !== "page")) {
        params.set("page", "1")
      }

      router.push(`/buyers?${params.toString()}`)
    },
    [router, searchParams],
  )

  const fetchBuyers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: searchParams.get("page") || "1",
        ...(debouncedSearch && { search: debouncedSearch }),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value)),
      })

      const response = await fetch(`/api/buyers?${params}`)
      if (response.ok) {
        const data: BuyerListResponse = await response.json()
        setBuyers(data.buyers)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch buyers:", error)
    } finally {
      setIsLoading(false)
    }
  }, [searchParams, debouncedSearch, filters])

  useEffect(() => {
    fetchBuyers()
  }, [fetchBuyers])

  useEffect(() => {
    updateURL({ search: debouncedSearch })
  }, [debouncedSearch, updateURL])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateURL(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      city: "",
      propertyType: "",
      status: "",
      timeline: "",
    }
    setFilters(clearedFilters)
    setSearchTerm("")
    updateURL({ ...clearedFilters, search: "" })
  }

  const handlePageChange = (page: number) => {
    updateURL({ page: page.toString() })
  }

  const formatBudget = (min?: number | null, max?: number | null) => {
    if (!min && !max) return "Not specified"
    if (min && max) return `${formatCurrency(min)} - ${formatCurrency(max)}`
    if (min) return `From ${formatCurrency(min)}`
    if (max) return `Up to ${formatCurrency(max)}`
    return "Not specified"
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

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buyer Leads</h1>
          <p className="text-gray-600 mt-1">Manage and track your real estate buyer leads</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push("/buyers/import")} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => router.push("/buyers/export")} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => router.push("/buyers/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
          <LogoutButton />
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Select value={filters.city} onValueChange={(value) => handleFilterChange("city", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    {cityOptions.filter(city => city !== "").map((city) => (
                      <SelectItem key={city} value={city}>
                        {formatEnumValue(city)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={filters.propertyType}
                  onValueChange={(value) => handleFilterChange("propertyType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Property Types" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypeOptions.filter(type => type !== "").map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatEnumValue(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.filter(status => status !== "").map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatEnumValue(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={filters.timeline} onValueChange={(value) => handleFilterChange("timeline", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Timelines" />
                  </SelectTrigger>
                  <SelectContent>
                    {timelineOptions.filter(timeline => timeline !== "").map((timeline) => (
                      <SelectItem key={timeline} value={timeline}>
                        {formatEnumValue(timeline)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button variant="outline" onClick={clearFilters} size="sm">
              Clear All Filters
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>
              {pagination.total} Lead{pagination.total !== 1 ? "s" : ""} Found
            </span>
            <span className="text-sm font-normal text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : buyers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No buyer leads found.{" "}
              <Button variant="link" onClick={() => router.push("/buyers/new")}>
                Create your first lead
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Property Type</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Timeline</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buyers.map((buyer) => (
                      <TableRow key={buyer.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{buyer.fullName}</div>
                            {buyer.email && <div className="text-sm text-gray-500">{buyer.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{buyer.phone}</TableCell>
                        <TableCell>{formatEnumValue(buyer.city)}</TableCell>
                        <TableCell>
                          <div>
                            {formatEnumValue(buyer.propertyType)}
                            {buyer.bhk && <div className="text-sm text-gray-500">{formatEnumValue(buyer.bhk)}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatBudget(buyer.budgetMin, buyer.budgetMax)}</TableCell>
                        <TableCell>{formatEnumValue(buyer.timeline)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(buyer.status)}>{formatEnumValue(buyer.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(buyer.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/buyers/${buyer.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/buyers/${buyer.id}/edit`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>

                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      const current = pagination.page
                      return page === 1 || page === pagination.totalPages || Math.abs(page - current) <= 2
                    })
                    .map((page, index, array) => {
                      const prevPage = array[index - 1]
                      const showEllipsis = prevPage && page - prevPage > 1

                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsis && <span className="px-2">...</span>}
                          <Button
                            variant={page === pagination.page ? "default" : "outline"}
                            onClick={() => handlePageChange(page)}
                            size="sm"
                          >
                            {page}
                          </Button>
                        </div>
                      )
                    })}

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
