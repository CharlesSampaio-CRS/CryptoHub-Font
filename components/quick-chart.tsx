"use client"

import { cn } from "@/lib/utils"

import { Card } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer } from "recharts"

const data = [
  { value: 138500 },
  { value: 139200 },
  { value: 138800 },
  { value: 140100 },
  { value: 139500 },
  { value: 141200 },
  { value: 140800 },
  { value: 142100 },
  { value: 141500 },
  { value: 142800 },
  { value: 142300 },
  { value: 142580 },
]

export function QuickChart() {
  return (
    <Card className="p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Desempenho (7 dias)</h3>
        <div className="flex gap-2">
          {["1D", "7D", "1M", "3M", "1A"].map((period, i) => (
            <button
              key={period}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-md transition-colors",
                i === 1 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke="oklch(0.55 0.15 145)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
