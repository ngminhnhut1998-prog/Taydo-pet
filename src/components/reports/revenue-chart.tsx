"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "Tháng 1", revenue: 18600000 },
  { month: "Tháng 2", revenue: 30500000 },
  { month: "Tháng 3", revenue: 23700000 },
  { month: "Tháng 4", revenue: 27300000 },
  { month: "Tháng 5", revenue: 20900000 },
  { month: "Tháng 6", revenue: 21400000 },
]

const chartConfig = {
  revenue: {
    label: "Doanh thu",
    color: "hsl(var(--primary))",
  },
}

export function RevenueChart() {
  return (
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, bottom: 0, left: 20}}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 6)}
          />
           <YAxis
            tickFormatter={(value) => `${Number(value) / 1000000}M`}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent 
                formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))}
            />}
          />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} />
        </BarChart>
      </ChartContainer>
  )
}
