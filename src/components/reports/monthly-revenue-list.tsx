
"use client"

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { startOfYear, endOfYear, eachMonthOfInterval, getMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../ui/table";
import { Loader2 } from "lucide-react";

interface MonthlyRevenueListProps {
    year: number;
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export function MonthlyRevenueList({ year }: MonthlyRevenueListProps) {

    const monthlyData = useLiveQuery(async () => {
        const records = await db.records.toArray();
        const targetDate = new Date(year, 0);
        const interval = { start: startOfYear(targetDate), end: endOfYear(targetDate) };
        const monthsInYear = eachMonthOfInterval(interval);

        const dataWithRevenue = monthsInYear.map(monthStart => {
            const monthEnd = endOfMonth(monthStart);
            const monthlyRecords = records.filter(r => {
                const recordDate = new Date(r.ngay_kham);
                return recordDate >= monthStart && recordDate <= monthEnd;
            });

            const monthlyTotal = monthlyRecords.reduce((sum, r) => sum + (r.chi_phi || 0), 0);
            
            return { 
                month: `Tháng ${getMonth(monthStart) + 1}`,
                revenue: monthlyTotal,
                visitCount: monthlyRecords.length,
            };
        }).filter(item => item.revenue > 0);

        const yearlyTotal = dataWithRevenue.reduce((sum, item) => sum + item.revenue, 0);

        return { monthly: dataWithRevenue, total: yearlyTotal };

    }, [year]);


    if (!monthlyData) {
        return (
             <div className="flex items-center justify-center min-h-[150px] w-full rounded-xl border bg-card text-card-foreground shadow">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Chi tiết doanh thu trong năm</CardTitle>
                <CardDescription>Danh sách chi tiết doanh thu và lượt khám của từng tháng.</CardDescription>
            </CardHeader>
            <CardContent>
                {monthlyData.monthly.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">Tháng</TableHead>
                                <TableHead className="text-center">Số lượt khám</TableHead>
                                <TableHead className="text-right">Doanh thu</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {monthlyData.monthly.map(item => (
                                <TableRow key={item.month}>
                                    <TableCell className="font-medium">{item.month}</TableCell>
                                    <TableCell className="text-center">{item.visitCount}</TableCell>
                                    <TableCell className="text-right">{currencyFormatter.format(item.revenue)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                         <TableFooter>
                            <TableRow>
                                <TableCell colSpan={2} className="font-bold text-base">Tổng cộng</TableCell>
                                <TableCell className="text-right font-bold text-base">{currencyFormatter.format(monthlyData.total)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>Không có dữ liệu doanh thu cho năm này.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
