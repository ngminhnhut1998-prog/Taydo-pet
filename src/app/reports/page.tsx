import { RevenueChart } from "@/components/reports/revenue-chart";
import { ServicesChart } from "@/components/reports/services-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Báo cáo & Thống kê</h1>
                    <p className="text-muted-foreground">Phân tích hoạt động của phòng khám.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Lọc theo ngày
                    </Button>
                     <Button>
                        <FileDown className="mr-2 h-4 w-4" />
                        Xuất báo cáo
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Doanh thu</CardTitle>
                        <CardDescription>Biểu đồ doanh thu trong 6 tháng gần nhất.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RevenueChart />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Dịch vụ sử dụng</CardTitle>
                        <CardDescription>Tỷ lệ các loại dịch vụ được khách hàng sử dụng.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ServicesChart />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
