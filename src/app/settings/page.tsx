import SettingsClientPage from "@/components/settings/settings-client-page";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
                <p className="text-muted-foreground">Quản lý các thiết lập cho ứng dụng của bạn.</p>
            </div>
            <SettingsClientPage />
        </div>
    )
}
