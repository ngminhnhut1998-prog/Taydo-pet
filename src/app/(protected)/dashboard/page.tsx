import { PetAppointmentsCard } from "@/components/dashboard/pet-appointments-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { FileText } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div className="lg:col-span-4">
        <WelcomeCard />
      </div>
      <div className="lg:col-span-2">
        <StatsCard />
      </div>
      <div className="lg:col-span-2">
        <PetAppointmentsCard />
      </div>
       <div className="lg:col-span-4">
        <div className="rounded-xl bg-card p-6 text-card-foreground shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Báo cáo gần đây</h3>
            <a href="/reports" className="text-sm font-medium text-primary hover:underline">
              Xem tất cả
            </a>
          </div>
          <div className="mt-4 flow-root">
            <div className="-my-2 divide-y divide-border">
              <div className="py-2 flex items-center gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5"/>
                </div>
                <div>
                  <p className="font-medium">Báo cáo doanh thu tháng 5</p>
                  <p className="text-sm text-muted-foreground">01/06/2024</p>
                </div>
              </div>
               <div className="py-2 flex items-center gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5"/>
                </div>
                <div>
                  <p className="font-medium">Báo cáo thuốc tồn kho</p>
                  <p className="text-sm text-muted-foreground">31/05/2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
