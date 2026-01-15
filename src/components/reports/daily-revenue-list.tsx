
"use client"

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, eachDayOfInterval, startOfDay, endOfDay, format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../ui/table";
import { Loader2 } from "lucide-react";

interface DailyRevenueListProps {
    year: number;
    month: number; // 0-11
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export function DailyRevenueList({ year, month }: DailyRevenueListProps) {

    const dailyData = useLiveQuery(async () => {
        const records = await db.records.toArray();
        const targetDate = new Date(year, month);
        const interval = { start: startOfMonth(targetDate), end: endOfMonth(targetDate) };
        const daysInMonth = eachDayOfInterval(interval);

        const dataWithRevenue = daysInMonth.map(day => {
            const dailyRecords = records.filter(r => {
                const recordDate = new Date(r.ngay_kham);
                return recordDate >= startOfDay(day) && recordDate <= endOfDay(day);
            });

            const dailyTotal = dailyRecords.reduce((sum, r) => sum + (r.chi_phi || 0), 0);
            
            return { 
                date: format(day, 'dd/MM/yyyy'),
                revenue: dailyTotal,
                visitCount: dailyRecords.length,
            };
        }).filter(item => item.revenue > 0); // Only show days with revenue

        const monthlyTotal = dataWithRevenue.reduce((sum, item) => sum + item.revenue, 0);

        return { daily: dataWithRevenue, total: monthlyTotal };

    }, [year, month]);


    if (!dailyData) {
        return (
             <div className="flex items-center justify-center min-h-[150px] w-full rounded-xl border bg-card text-card-foreground shadow">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Chi tiết doanh thu trong tháng</CardTitle>
                <CardDescription>Danh sách chi tiết doanh thu và lượt khám của từng ngày.</CardDescription>
            </CardHeader>
            <CardContent>
                {dailyData.daily.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">Ngày</TableHead>
                                <TableHead className="text-center">Số lượt khám</TableHead>
                                <TableHead className="text-right">Doanh thu</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dailyData.daily.map(item => (
                                <TableRow key={item.date}>
                                    <TableCell className="font-medium">{item.date}</TableCell>
                                    <TableCell className="text-center">{item.visitCount}</TableCell>
                                    <TableCell className="text-right">{currencyFormatter.format(item.revenue)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                         <TableFooter>
                            <TableRow>
                                <TableCell colSpan={2} className="font-bold text-base">Tổng cộng</TableCell>
                                <TableCell className="text-right font-bold text-base">{currencyFormatter.format(dailyData.total)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>Không có dữ liệu doanh thu cho tháng này.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

