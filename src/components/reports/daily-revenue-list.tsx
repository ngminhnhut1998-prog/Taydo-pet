
"use client"

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type MedicalRecord, type Pet, type Customer } from "@/lib/db";
import { startOfMonth, endOfMonth, startOfDay, format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../ui/table";
import { Loader2 } from "lucide-react";

interface DailyRevenueListProps {
    year: number;
    month: number; // 0-11
}

interface DayData {
    date: string;
    dateTotal: number;
    records: {
        record: MedicalRecord;
        pet?: Pet;
        customer?: Customer;
    }[];
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export function DailyRevenueList({ year, month }: DailyRevenueListProps) {

    const dailyData = useLiveQuery(async () => {
        const records = await db.records.toArray();
        const pets = await db.pets.toArray();
        const customers = await db.customers.toArray();
        
        const petMap = new Map(pets.map(p => [p.id, p]));
        const customerMap = new Map(customers.map(c => [c.id, c]));

        const targetDate = new Date(year, month);
        const interval = { start: startOfMonth(targetDate), end: endOfMonth(targetDate) };
        
        const monthRecords = records.filter(r => {
            const recordDate = new Date(r.ngay_kham);
            return recordDate >= interval.start && recordDate <= interval.end;
        });

        const recordsByDay = monthRecords.reduce((acc, record) => {
            const day = format(startOfDay(new Date(record.ngay_kham)), 'dd/MM/yyyy');
            if (!acc[day]) {
                acc[day] = [];
            }
            const pet = petMap.get(record.thu_id);
            const customer = pet ? customerMap.get(pet.khach_hang_id) : undefined;
            
            acc[day].push({ record, pet, customer });
            return acc;
        }, {} as Record<string, { record: MedicalRecord, pet?: Pet, customer?: Customer }[]>);

        const formattedData: DayData[] = Object.entries(recordsByDay).map(([date, dayRecords]) => {
            const dateTotal = dayRecords.reduce((sum, { record }) => sum + (record.chi_phi || 0), 0);
            return {
                date,
                dateTotal,
                records: dayRecords,
            };
        }).sort((a, b) => {
            const dateA = a.date.split('/').reverse().join('-');
            const dateB = b.date.split('/').reverse().join('-');
            return dateA.localeCompare(dateB);
        });

        const monthlyTotal = formattedData.reduce((sum, day) => sum + day.dateTotal, 0);

        return { daily: formattedData, total: monthlyTotal };

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
                <CardDescription>Danh sách chi tiết doanh thu theo từng ca khám trong ngày.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/4">Khách hàng</TableHead>
                            <TableHead className="w-1/4">Thú cưng</TableHead>
                            <TableHead className="w-2/4">Chẩn đoán</TableHead>
                            <TableHead className="text-right">Doanh thu</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dailyData.daily.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Không có dữ liệu doanh thu cho tháng này.
                                </TableCell>
                            </TableRow>
                        ) : (
                            dailyData.daily.map(day => (
                                <React.Fragment key={day.date}>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50 font-semibold">
                                        <TableCell colSpan={3}>Ngày: {day.date}</TableCell>
                                        <TableCell className="text-right">Tổng ngày: {currencyFormatter.format(day.dateTotal)}</TableCell>
                                    </TableRow>
                                    {day.records.map(({ record, pet, customer }) => (
                                        <TableRow key={record.id}>
                                            <TableCell>{customer?.ten || 'N/A'}</TableCell>
                                            <TableCell>{pet?.ten || 'N/A'}</TableCell>
                                            <TableCell className="text-muted-foreground">{record.chan_doan || '-'}</TableCell>
                                            <TableCell className="text-right">{currencyFormatter.format(record.chi_phi || 0)}</TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                     <TableFooter>
                        <TableRow>
                            <TableCell colSpan={3} className="font-bold text-base">Tổng cộng tháng</TableCell>
                            <TableCell className="text-right font-bold text-base">{currencyFormatter.format(dailyData.total)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
        </Card>
    );
}
