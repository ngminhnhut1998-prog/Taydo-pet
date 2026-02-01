"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { db } from "@/lib/db"
import { getMonth, getYear, startOfMonth, endOfMonth, startOfDay, endOfDay, eachDayOfInterval, format, eachMonthOfInterval, startOfYear, endOfYear } from "date-fns"
import { Loader2 } from "lucide-react"

const chartConfig = {
  recordRevenue: {
    label: "Doanh thu Khám",
    color: "hsl(var(--chart-1))",
  },
  petshopRevenue: {
    label: "Doanh thu Petshop",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface RevenueChartProps {
    mode: 'daily' | 'monthly' | 'yearly';
    year?: number;
    month?: number; // 0-11 for Date object
}

export function RevenueChart({ mode, year, month }: RevenueChartProps) {
    const data = useLiveQuery(async () => {
        const records = await db.records.toArray();
        const petshopSales = await db.petshopSales.toArray();
        
        if (mode === 'daily') {
            if (year === undefined || month === undefined) return [];
            const targetDate = new Date(year, month);
            const interval = { start: startOfMonth(targetDate), end: endOfMonth(targetDate) };
            const daysInMonth = eachDayOfInterval(interval);

            return daysInMonth.map(day => {
                const dailyRecordTotal = records
                    .filter(r => {
                        const recordDate = new Date(r.ngay_kham);
                        return recordDate >= startOfDay(day) && recordDate <= endOfDay(day);
                    })
                    .reduce((sum, r) => sum + (r.chi_phi || 0), 0);
                
                return { name: format(day, 'dd'), recordRevenue: dailyRecordTotal, petshopRevenue: 0 };
            });
        }
        
        if (mode === 'monthly') {
            if (year === undefined) return [];
            const targetDate = new Date(year, 0);
            const interval = { start: startOfYear(targetDate), end: endOfYear(targetDate) };
            const monthsInYear = eachMonthOfInterval(interval);

            return monthsInYear.map(monthStart => {
                const monthEnd = endOfMonth(monthStart);
                const monthlyRecordTotal = records
                    .filter(r => {
                        const recordDate = new Date(r.ngay_kham);
                        return recordDate >= monthStart && recordDate <= monthEnd;
                    })
                    .reduce((sum, r) => sum + (r.chi_phi || 0), 0);
                
                const monthlyPetshopSale = petshopSales.find(s => {
                    const saleDate = new Date(s.date);
                    return getYear(saleDate) === year && getMonth(saleDate) === getMonth(monthStart);
                });

                const petshopRevenue = monthlyPetshopSale?.amount || 0;

                return { 
                    name: `T${getMonth(monthStart) + 1}`, 
                    recordRevenue: monthlyRecordTotal,
                    petshopRevenue: petshopRevenue,
                 };
            });
        }

        if (mode === 'yearly') {
             const allRecordYears = records.map(r => getYear(new Date(r.ngay_kham)));
             const allPetshopYears = petshopSales.map(s => getYear(new Date(s.date)));
             const allYears = [...new Set([...allRecordYears, ...allPetshopYears])].sort();

            if (allYears.length === 0) {
                return [];
            }
            
            return allYears.map(y => {
                const yearStart = startOfYear(new Date(y, 0));
                const yearEnd = endOfYear(new Date(y, 0));
                const yearlyRecordTotal = records
                    .filter(r => {
                        const recordDate = new Date(r.ngay_kham);
                        return recordDate >= yearStart && recordDate <= yearEnd;
                    })
                    .reduce((sum, r) => sum + (r.chi_phi || 0), 0);
                
                const yearlyPetshopTotal = petshopSales
                    .filter(s => getYear(new Date(s.date)) === y)
                    .reduce((sum, s) => sum + s.amount, 0);

                return { 
                    name: y.toString(), 
                    recordRevenue: yearlyRecordTotal, 
                    petshopRevenue: yearlyPetshopTotal 
                };
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
            <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20}}>
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
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="recordRevenue" fill="var(--color-recordRevenue)" stackId="a" radius={0} />
            <Bar dataKey="petshopRevenue" fill="var(--color-petshopRevenue)" stackId="a" radius={[8, 8, 0, 0]}/>
            </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
  )
}
