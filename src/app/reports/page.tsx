
"use client"

import { useState } from "react";
import { RevenueChart } from "@/components/reports/revenue-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportFilters } from "@/components/reports/report-filters";
import { DailyRevenueList } from "@/components/reports/daily-revenue-list";

export default function ReportsPage() {
    const today = new Date();
    const [dailyFilter, setDailyFilter] = useState({ month: today.getMonth(), year: today.getFullYear() });
    const [monthlyFilter, setMonthlyFilter] = useState({ year: today.getFullYear() });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Báo cáo & Thống kê</h1>
                    <p className="text-muted-foreground">Phân tích hoạt động của phòng khám theo từng khoảng thời gian.</p>
                </div>
                 <div className="flex items-center gap-2">
                     <Button>
                        <FileDown className="mr-2 h-4 w-4" />
                        Xuất báo cáo
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="month" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="day">Theo ngày</TabsTrigger>
                    <TabsTrigger value="month">Theo tháng</TabsTrigger>
                    <TabsTrigger value="year">Theo năm</TabsTrigger>
                </TabsList>
                
                <TabsContent value="day" className="space-y-4">
                    <div className="flex items-center justify-start">
                        <ReportFilters 
                            mode="month"
                            year={dailyFilter.year}
                            month={dailyFilter.month}
                            onYearChange={(year) => setDailyFilter(prev => ({ ...prev, year }))}
                            onMonthChange={(month) => setDailyFilter(prev => ({ ...prev, month }))}
                        />
                    </div>
                     <Card>
                        <CardHeader>
                            <CardTitle>Doanh thu theo ngày</CardTitle>
                            <CardDescription>Biểu đồ doanh thu các ngày trong tháng đã chọn.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RevenueChart mode="daily" year={dailyFilter.year} month={dailyFilter.month} />
                        </CardContent>
                    </Card>
                    <DailyRevenueList year={dailyFilter.year} month={dailyFilter.month} />
                </TabsContent>

                 <TabsContent value="month" className="space-y-4">
                     <div className="flex items-center justify-start">
                        <ReportFilters 
                            mode="year"
                            year={monthlyFilter.year}
                            onYearChange={(year) => setMonthlyFilter({ year })}
                        />
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Doanh thu theo tháng</CardTitle>
                            <CardDescription>Biểu đồ doanh thu các tháng trong năm đã chọn.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RevenueChart mode="monthly" year={monthlyFilter.year} />
                        </CardContent>
                    </Card>
                </TabsContent>

                 <TabsContent value="year" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Doanh thu theo năm</CardTitle>
                            <CardDescription>Biểu đồ doanh thu của tất cả các năm có dữ liệu.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RevenueChart mode="yearly" />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
