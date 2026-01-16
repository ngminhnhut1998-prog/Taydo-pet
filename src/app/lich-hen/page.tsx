import AppointmentClientPage from "@/components/appointments/appointment-client-page";

export default function LichHenPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Quản lý Lịch hẹn</h1>
                <p className="text-muted-foreground">Xem, lọc và quản lý các lịch hẹn tái khám của phòng khám.</p>
            </div>
            <AppointmentClientPage />
        </div>
    )
}
