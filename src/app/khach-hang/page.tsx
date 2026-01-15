import CustomerClientPage from "@/components/customers/customer-client-page";

export default function KhachHangPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Quản lý Khách hàng</h1>
                <p className="text-muted-foreground">Tìm kiếm, xem và quản lý thông tin khách hàng và thú cưng của họ.</p>
            </div>
            <CustomerClientPage />
        </div>
    )
}
