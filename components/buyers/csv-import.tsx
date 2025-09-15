"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, ArrowLeft, CheckCircle, XCircle } from "lucide-react"

interface ImportError {
  row: number
  field: string
  message: string
  value: string
}

interface ImportResult {
  success: boolean
  imported: number
  errors: ImportError[]
  message?: string
}

export function CSVImport() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setResult(null)
    } else {
      alert("Please select a valid CSV file")
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/buyers/import", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      
      // Handle both success and error responses
      if (response.ok) {
        setResult({
          success: data.success || false,
          imported: data.imported || 0,
          errors: data.errors || [],
          message: data.message,
        })
      } else {
        // Handle API errors
        setResult({
          success: false,
          imported: 0,
          errors: [],
          message: data.error || "Import failed. Please try again.",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        errors: [],
        message: "Network error. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    // Define headers in the correct order
    const headers = [
      "fullName",
      "email", 
      "phone",
      "city",
      "propertyType",
      "bhk",
      "purpose",
      "budgetMin",
      "budgetMax",
      "timeline",
      "source",
      "notes",
      "tags",
      "status"
    ]

    // Sample data that matches the headers exactly
    const sampleData = [
      [
        "John Doe",
        "john@example.com",
        "9876543210",
        "CHANDIGARH",
        "APARTMENT",
        "THREE",
        "BUY",
        "5000000",
        "8000000",
        "THREE_TO_SIX_MONTHS",
        "WEBSITE",
        "Interested in 3BHK apartment",
        "premium,urgent",
        "NEW"
      ],
      [
        "Jane Smith",
        "jane@example.com",
        "9876543211",
        "MOHALI",
        "VILLA",
        "FOUR",
        "BUY",
        "10000000",
        "15000000",
        "MORE_THAN_SIX_MONTHS",
        "REFERRAL",
        "Looking for luxury villa",
        "luxury,vip",
        "QUALIFIED"
      ]
    ]

    // Create CSV content with proper escaping
    const escapeCsvField = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`
      }
      return field
    }

    const csvRows = [
      headers.map(escapeCsvField).join(','),
      ...sampleData.map(row => row.map(escapeCsvField).join(','))
    ]

    const csvContent = csvRows.join('\n')
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'buyer_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (result) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setResult(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Import Another File
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Import Results</h1>
              <p className="text-gray-600">CSV import completed</p>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">{result.imported}</div>
              <div className="text-sm text-gray-600">Successfully Imported</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-600 mb-2">{result.errors?.length || 0}</div>
              <div className="text-sm text-gray-600">Errors Found</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full">
                <div className="w-6 h-6 text-blue-600 font-bold text-lg">#</div>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {(result.imported || 0) + (result.errors?.length || 0)}
              </div>
              <div className="text-sm text-gray-600">Total Rows Processed</div>
            </CardContent>
          </Card>
        </div>

        {/* Message Alert */}
        {result.message && (
          <Alert className={`mb-6 ${result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <AlertDescription className={result.success ? "text-green-700" : "text-red-700"}>
              {result.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Errors Table */}
        {result.errors && result.errors.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Import Errors
              </CardTitle>
              <CardDescription>Please fix these errors and try importing again</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Error Message</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errors.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <Badge variant="destructive">{error.row}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{error.field}</Badge>
                        </TableCell>
                        <TableCell className="text-red-600 max-w-xs">{error.message}</TableCell>
                        <TableCell className="text-gray-500 max-w-xs truncate">{error.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => setResult(null)} variant="outline" size="lg">
            <Upload className="w-4 h-4 mr-2" />
            Import Another File
          </Button>
          <Button onClick={() => router.push("/buyers")} size="lg">
            <CheckCircle className="w-4 h-4 mr-2" />
            View All Buyers
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Import Buyers</h1>
            <p className="text-gray-600">Upload a CSV file to import multiple buyer leads</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>Select a CSV file to import buyer data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file" className="text-sm font-medium">
                Choose File
              </Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                Only CSV files are supported. Maximum 200 rows allowed.
              </p>
            </div>

            {file && (
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading} 
              className="w-full" 
              size="lg"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Buyers
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Template Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Download Template
            </CardTitle>
            <CardDescription>Use this template to format your CSV file correctly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2 text-gray-900">Required Fields:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• <span className="font-mono">fullName</span> - Buyer's full name</li>
                  <li>• <span className="font-mono">phone</span> - Contact number</li>
                  <li>• <span className="font-mono">city</span> - CHANDIGARH, MOHALI, ZIRAKPUR, PANCHKULA, OTHER</li>
                  <li>• <span className="font-mono">propertyType</span> - APARTMENT, VILLA, PLOT, OFFICE, RETAIL</li>
                  <li>• <span className="font-mono">purpose</span> - BUY, RENT</li>
                  <li>• <span className="font-mono">timeline</span> - ZERO_TO_THREE_MONTHS, THREE_TO_SIX_MONTHS, MORE_THAN_SIX_MONTHS, EXPLORING</li>
                  <li>• <span className="font-mono">source</span> - WEBSITE, REFERRAL, WALK_IN, CALL, OTHER</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2 text-gray-900">Optional Fields:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• <span className="font-mono">email</span> - Email address</li>
                  <li>• <span className="font-mono">bhk</span> - ONE, TWO, THREE, FOUR, STUDIO</li>
                  <li>• <span className="font-mono">budgetMin</span> - Minimum budget (number)</li>
                  <li>• <span className="font-mono">budgetMax</span> - Maximum budget (number)</li>
                  <li>• <span className="font-mono">notes</span> - Additional notes</li>
                  <li>• <span className="font-mono">tags</span> - Comma-separated tags</li>
                  <li>• <span className="font-mono">status</span> - NEW, QUALIFIED, CONTACTED, VISITED, NEGOTIATION, CONVERTED, DROPPED</li>
                </ul>
              </div>
            </div>

            <Button variant="outline" onClick={downloadTemplate} className="w-full" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
          <CardDescription>Follow these guidelines for successful import</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-gray-900">File Requirements</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  CSV format only (.csv extension)
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  Maximum 200 rows per import
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  UTF-8 encoding recommended
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  First row must contain headers
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-gray-900">Data Format</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  Use exact enum values (case-sensitive)
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  Phone numbers: 10-15 digits only
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  Budget values: numbers only (no currency symbols)
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  Tags: comma-separated values
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
