import TreatmentClientPage from "@/components/treatment/treatment-client-page";

export default function DieuTriPage() {
    return (
         <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Tiếp nhận Bệnh nhân</h1>
                <p className="text-muted-foreground">Quy trình nhập liệu liền mạch để tiếp nhận bệnh nhân mới hoặc tái khám.</p>
            </div>
            <TreatmentClientPage />
        </div>
    )
}
