"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Users, Heart, Stethoscope, Loader2 } from "lucide-react";
import { db } from "@/lib/db";

export function StatsCard() {
    const totalCustomers = useLiveQuery(() => db.customers.count());
    const totalPets = useLiveQuery(() => db.pets.count());
    const totalRecords = useLiveQuery(() => db.records.count());

    const stats = [
        {
            name: "Tổng Khách Hàng",
            value: totalCustomers,
            icon: Users,
            change: "+20.1%",
            bgColor: "bg-blue-500/10",
            iconColor: "text-blue-500"
        },
        {
            name: "Tổng Thú Cưng",
            value: totalPets,
            icon: Heart,
            change: "+15.3%",
            bgColor: "bg-pink-500/10",
            iconColor: "text-pink-500"
        },
        {
            name: "Lượt Khám",
            value: totalRecords,
            icon: Stethoscope,
            change: "+8.2%",
            bgColor: "bg-green-500/10",
            iconColor: "text-green-500"
        },
    ]

    const isLoading = totalCustomers === undefined || totalPets === undefined || totalRecords === undefined;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tổng quan</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-24">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {stats.map((stat) => (
                            <div key={stat.name} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                                <div className={`flex items-center justify-center h-12 w-12 rounded-lg ${stat.bgColor} ${stat.iconColor}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.name}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
