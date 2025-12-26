"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

export function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className="group mb-6 flex items-center gap-2 text-zinc-400 hover:text-zinc-900 transition-colors"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-sm group-hover:border-zinc-300 group-hover:shadow-md transition-all">
        <ChevronLeft className="h-4 w-4" />
      </div>
      <span className="text-xs font-bold uppercase tracking-widest">Back</span>
    </button>
  )
}