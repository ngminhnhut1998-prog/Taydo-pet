
"use client";

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PetshopSale } from '@/lib/db';
import { petshopSaleApi } from '@/lib/api';
import { startOfMonth, getYear, getMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReportFilters } from '@/components/reports/report-filters';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { useSettings } from '@/contexts/settings-context';
import { isDateLocked } from '@/lib/utils';

export default function PetshopPage() {
    const { toast } = useToast();
    const { isReadOnly, lockdownDate } = useSettings();
    const today = new Date();
    const [filter, setFilter] = useState({ month: today.getMonth(), year: today.getFullYear() });
    const [amount, setAmount] = useState<number | string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

    // Find the existing sale record for the selected month
    const existingSale = useLiveQuery(async () => {
        const sales = await db.petshopSales.toArray();
        // This filtering has to be done in JS because the date format might vary.
        // A safer way is to store dates consistently. Assuming ISO strings.
        return sales.find(s => {
            const saleDate = new Date(s.date);
            return getYear(saleDate) === filter.year && getMonth(saleDate) === filter.month;
        });
    }, [filter]);

    // When the existing sale data loads or changes, update the input field
    useEffect(() => {
        if (existingSale) {
            setAmount(existingSale.amount);
        } else {
            setAmount('');
        }
    }, [existingSale]);
    
    const handleSave = async () => {
        setIsSubmitting(true);
        const saleAmount = Number(amount);
        if (isNaN(saleAmount) || saleAmount < 0) {
            toast({
                title: "Dữ liệu không hợp lệ",
                description: "Vui lòng nhập một số tiền hợp lệ.",
                variant: "destructive",
            });
            setIsSubmitting(false);
            return;
        }

        const saleDate = startOfMonth(new Date(filter.year, filter.month));

        if (isDateLocked(saleDate, lockdownDate)) {
            toast({
                variant: "destructive",
                title: "Giai đoạn đã bị khóa",
                description: "Không thể tạo hoặc cập nhật doanh thu trong giai đoạn đã chốt dữ liệu.",
            });
            setIsSubmitting(false);
            return;
        }

        const saleDateISO = saleDate.toISOString();

        try {
            if (existingSale) {
                // Update existing record
                if (existingSale.amount !== saleAmount) {
                     await petshopSaleApi.update(existingSale.id, { amount: saleAmount, date: saleDateISO });
                     toast({ title: "Thành công", description: "Đã cập nhật doanh thu Petshop." });
                } else {
                     toast({ title: "Không có thay đổi", description: "Doanh thu không thay đổi." });
                }
            } else {
                // Create new record
                 if (saleAmount > 0) {
                    await petshopSaleApi.create({ date: saleDateISO, amount: saleAmount });
                    toast({ title: "Thành công", description: "Đã lưu doanh thu Petshop." });
                 } else {
                    toast({ title: "Không có gì để lưu", description: "Vui lòng nhập doanh thu lớn hơn 0." });
                 }
            }
        } catch (error) {
            console.error("Failed to save Petshop sale:", error);
            toast({
                title: "Lỗi",
                description: "Không thể lưu doanh thu. Vui lòng thử lại.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Doanh thu Petshop</h1>
                <p className="text-muted-foreground">Nhập và quản lý doanh thu từ các sản phẩm bán lẻ tại cửa hàng.</p>
            </div>

            <Card className="max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle>Nhập doanh thu tháng</CardTitle>
                    <CardDescription>Chọn tháng và năm, sau đó nhập tổng doanh thu của Petshop trong tháng đó.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-center">
                        <ReportFilters 
                            mode="month"
                            year={filter.year}
                            month={filter.month}
                            onYearChange={(year) => setFilter({ ...filter, year })}
                            onMonthChange={(month) => setFilter({ ...filter, month })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="revenue-amount" className="text-base">Doanh thu</Label>
                        <div className="relative">
                            <Input
                                id="revenue-amount"
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="text-2xl h-14 pr-24 font-bold"
                                disabled={isReadOnly}
                            />
                             <span className='absolute right-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground'>{currencyFormatter.format(Number(amount) || 0)}</span>
                        </div>
                         <p className="text-sm text-muted-foreground">
                            Nhập tổng doanh thu bán lẻ (không bao gồm dịch vụ khám chữa bệnh).
                        </p>
                    </div>

                    <Button onClick={handleSave} disabled={isSubmitting || isReadOnly} className="w-full" size="lg">
                        {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                        Lưu doanh thu
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
