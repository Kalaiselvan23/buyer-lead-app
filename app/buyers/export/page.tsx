import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CSVExport } from "@/components/buyers/csv-export"

export default async function ExportPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return <CSVExport />
}
