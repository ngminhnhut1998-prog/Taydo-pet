import TreatmentClientPage from "@/components/treatment/treatment-client-page";

export default function DieuTriPage() {
    return (
         <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Nhập liệu nhanh</h1>
                <p className="text-muted-foreground">Tìm kiếm khách hàng, chọn thú cưng và thêm bệnh án mới một cách nhanh chóng.</p>
            </div>
            <TreatmentClientPage />
        </div>
    )
}
