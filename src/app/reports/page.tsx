
"use client"

import { RevenueChart } from "@/components/reports/revenue-chart";
import { ServicesChart } from "@/components/reports/services-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/reports/date-range-picker";

export default function ReportsPage() {
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
                        <DateRangePicker />
                    </div>
                     <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Doanh thu theo ngày</CardTitle>
                                <CardDescription>Biểu đồ doanh thu trong khoảng thời gian đã chọn.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RevenueChart />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Dịch vụ sử dụng</CardTitle>
                                <CardDescription>Tỷ lệ dịch vụ trong khoảng thời gian đã chọn.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ServicesChart />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                 <TabsContent value="month" className="space-y-4">
                     <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Doanh thu theo tháng</CardTitle>
                                <CardDescription>Biểu đồ doanh thu trong 6 tháng gần nhất.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RevenueChart />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Dịch vụ sử dụng</CardTitle>
                                <CardDescription>Tỷ lệ dịch vụ được sử dụng trong tháng.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ServicesChart />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                 <TabsContent value="year" className="space-y-4">
                     <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Doanh thu theo năm</CardTitle>
                                <CardDescription>Biểu đồ doanh thu trong 3 năm gần nhất.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RevenueChart />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Dịch vụ sử dụng</CardTitle>
                                <CardDescription>Tỷ lệ dịch vụ được sử dụng trong năm.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ServicesChart />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
