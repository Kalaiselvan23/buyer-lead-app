import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CSVImport } from "@/components/buyers/csv-import"

export default async function ImportPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return <CSVImport />
}
