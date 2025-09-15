"use client"

import dynamic from "next/dynamic"

// Dynamically import BuyerForm to avoid chunk loading issues
const BuyerForm = dynamic(() => import("./buyer-form").then(mod => ({ default: mod.BuyerForm })), {
  ssr: false,
  loading: () => <div className="container mx-auto py-8 px-4">Loading...</div>
})

interface BuyerFormWrapperProps {
  buyer?: any
  onSuccess?: () => void
}

export function BuyerFormWrapper({ buyer, onSuccess }: BuyerFormWrapperProps) {
  return <BuyerForm buyer={buyer} onSuccess={onSuccess} />
}
