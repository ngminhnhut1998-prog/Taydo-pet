import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Hand } from "lucide-react";

export function WelcomeCard() {
    return (
        <Card className="bg-primary text-primary-foreground border-0">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Hand className="h-6 w-6" />
                    <span>Chào mừng trở lại, Bác sĩ Trường!</span>
                </CardTitle>
                <CardDescription className="text-primary-foreground/80">
                    Đây là tổng quan nhanh về phòng khám của bạn hôm nay.
                </CardDescription>
            </CardHeader>
        </Card>
    );
}
