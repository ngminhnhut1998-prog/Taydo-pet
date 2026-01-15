import AppointmentsTodayCard from "@/components/dashboard/appointments-today-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, HeartPulse } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tổng Khách Hàng
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,234</div>
          <p className="text-xs text-muted-foreground">
            +20.1% so với tháng trước
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng Thú Cưng</CardTitle>
          <HeartPulse className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2,345</div>
          <p className="text-xs text-muted-foreground">
            +180.1% so với tháng trước
          </p>
        </CardContent>
      </Card>
      <div className="md:col-span-2 lg:col-span-4">
        <AppointmentsTodayCard />
      </div>
    </div>
  );
}
