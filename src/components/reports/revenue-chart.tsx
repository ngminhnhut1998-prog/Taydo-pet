
"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { db } from "@/lib/db"
import { getDaysInMonth, getMonth, getYear, startOfMonth, endOfMonth, startOfDay, endOfDay, eachDayOfInterval, format, eachMonthOfInterval, startOfYear, endOfYear, subYears } from "date-fns"
import { Loader2 } from "lucide-react"

const chartConfig = {
  revenue: {
    label: "Doanh thu",
    color: "hsl(var(--primary))",
  },
}

interface RevenueChartProps {
    mode: 'daily' | 'monthly' | 'yearly';
    year?: number;
    month?: number; // 0-11 for Date object
}

export function RevenueChart({ mode, year, month }: RevenueChartProps) {
    const data = useLiveQuery(async () => {
        const records = await db.records.toArray();
        
        if (mode === 'daily') {
            if (year === undefined || month === undefined) return [];
            const targetDate = new Date(year, month);
            const interval = { start: startOfMonth(targetDate), end: endOfMonth(targetDate) };
            const daysInMonth = eachDayOfInterval(interval);

            return daysInMonth.map(day => {
                const dailyTotal = records
                    .filter(r => {
                        const recordDate = new Date(r.ngay_kham);
                        return recordDate >= startOfDay(day) && recordDate <= endOfDay(day);
                    })
                    .reduce((sum, r) => sum + (r.chi_phi || 0), 0);
                
                return { name: format(day, 'dd'), revenue: dailyTotal };
            });
        }
        
        if (mode === 'monthly') {
            if (year === undefined) return [];
            const targetDate = new Date(year, 0);
            const interval = { start: startOfYear(targetDate), end: endOfYear(targetDate) };
            const monthsInYear = eachMonthOfInterval(interval);

            return monthsInYear.map(monthStart => {
                const monthEnd = endOfMonth(monthStart);
                const monthlyTotal = records
                    .filter(r => {
                        const recordDate = new Date(r.ngay_kham);
                        return recordDate >= monthStart && recordDate <= monthEnd;
                    })
                    .reduce((sum, r) => sum + (r.chi_phi || 0), 0);

                return { name: `T${getMonth(monthStart) + 1}`, revenue: monthlyTotal };
            });
        }

        if (mode === 'yearly') {
            const allYears = [...new Set(records.map(r => getYear(new Date(r.ngay_kham))))].sort();

            if (allYears.length === 0) {
                return [];
            }
            
            return allYears.map(y => {
                const yearStart = startOfYear(new Date(y, 0));
                const yearEnd = endOfYear(new Date(y, 0));
                 const yearlyTotal = records
                    .filter(r => {
                        const recordDate = new Date(r.ngay_kham);
                        return recordDate >= yearStart && recordDate <= yearEnd;
                    })
                    .reduce((sum, r) => sum + (r.chi_phi || 0), 0);

                return { name: y.toString(), revenue: yearlyTotal };
            });
        }

        return [];
    }, [mode, year, month]);

    if (!data) {
        return (
            <div className="flex items-center justify-center h-[300px] w-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

  return (
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <ResponsiveContainer>
            <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 20, bottom: 0, left: 20}}>
            <CartesianGrid vertical={false} />
            <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
            />
            <YAxis
                tickFormatter={(value) => new Intl.NumberFormat('vi-VN', {
                    notation: 'compact',
                    compactDisplay: 'short'
                }).format(Number(value))}
                tickLine={false}
                axisLine={false}
                width={80}
            />
            <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                    formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))}
                />}
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} />
            </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
  )
}
