"use client";

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, startOfDay, isBefore, compareDesc, compareAsc } from 'date-fns';
import { db, type MedicalRecord, type Pet, type Customer, type Appointment } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, X, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FullAppointmentInfo {
  record: MedicalRecord;
  appointment: Appointment;
  pet: Pet | undefined;
  customer: Customer | undefined;
}

// Reusable Appointment Table Component
function AppointmentDisplayTable({ appointments }: { appointments: FullAppointmentInfo[] | undefined }) {
  if (appointments === undefined) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <Loader2 className="w-16 h-16 text-muted-foreground animate-spin" />
            <h3 className="text-xl font-semibold">Đang tải lịch hẹn...</h3>
        </div>
    )
  }

  if (appointments.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <CalendarIcon className="w-16 h-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Không có lịch hẹn</h3>
            <p className="text-muted-foreground">Không tìm thấy lịch hẹn nào phù hợp với bộ lọc của bạn.</p>
          </div>
      )
  }

  return (
    <Table>
        <TableHeader>
            <TableRow>
            <TableHead>Ngày hẹn</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Thú cưng</TableHead>
            <TableHead>Số điện thoại</TableHead>
            <TableHead>Lý do</TableHead>
            <TableHead>Trạng thái</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {appointments.map(({ record, appointment, pet, customer }, index) => {
            const appointmentDate = startOfDay(new Date(appointment.ngay));
            const today = startOfDay(new Date());
            const isPast = isBefore(appointmentDate, today);

            return (
                <TableRow key={`${record.id}-${index}`}>
                <TableCell>
                    <Badge variant={isPast ? "destructive" : "secondary"}>{format(appointmentDate, 'dd/MM/yyyy')}</Badge>
                </TableCell>
                <TableCell>
                    <div className="font-medium">{customer?.ten || 'Không rõ'}</div>
                </TableCell>
                <TableCell>{pet?.ten || 'Không rõ'}</TableCell>
                <TableCell className="text-muted-foreground">{customer?.so_dien_thoai || ''}</TableCell>
                <TableCell className="text-muted-foreground">{appointment.noi_dung}</TableCell>
                <TableCell>
                    {isPast ? (
                        <Badge variant="outline" className="text-destructive border-destructive">Đã trễ</Badge>
                    ) : (
                        <Badge variant="outline">Sắp tới</Badge>
                    )}
                </TableCell>
                </TableRow>
            )
            })}
        </TableBody>
    </Table>
  );
}


export default function AppointmentClientPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const allAppointments = useLiveQuery(async () => {
    const allRecords = await db.records.toArray();
    let flattenedAppointments: FullAppointmentInfo[] = [];

    for (const record of allRecords) {
      if (record.nhac_hen && Array.isArray(record.nhac_hen)) {
        for (const app of record.nhac_hen) {
          if (app && app.ngay) {
            const pet = await db.pets.get(record.thu_id);
            const customer = pet ? await db.customers.get(pet.khach_hang_id) : undefined;
            flattenedAppointments.push({ record, appointment: app, pet, customer });
          }
        }
      }
    }
    return flattenedAppointments;
  }, []);

  const { pastDue, upcoming } = useMemo(() => {
      if (!allAppointments) return { pastDue: [], upcoming: [] };
      const today = startOfDay(new Date());
      
      const past = allAppointments
          .filter(a => isBefore(startOfDay(new Date(a.appointment.ngay)), today))
          .sort((a, b) => compareDesc(new Date(a.appointment.ngay), new Date(b.appointment.ngay)));

      const future = allAppointments
          .filter(a => !isBefore(startOfDay(new Date(a.appointment.ngay)), today))
          .sort((a, b) => compareAsc(new Date(a.appointment.ngay), new Date(b.appointment.ngay)));

      return { pastDue: past, upcoming: future };
  }, [allAppointments]);

  const defaultAppointments = useMemo(() => {
    return {
      past: pastDue.slice(0, 15),
      upcoming: upcoming.slice(0, 15)
    }
  }, [pastDue, upcoming]);

  const allFilteredAppointments = useMemo(() => {
    if (!allAppointments) return undefined;
    return allAppointments.filter(a => {
        const appDate = startOfDay(new Date(a.appointment.ngay));
        const fromDate = dateRange?.from ? startOfDay(dateRange.from) : null;
        const toDate = dateRange?.to ? startOfDay(dateRange.to) : null;
        
        return (!fromDate || appDate >= fromDate) && (!toDate || appDate <= toDate);
    }).sort((a,b) => compareAsc(new Date(a.appointment.ngay), new Date(b.appointment.ngay)));
  }, [allAppointments, dateRange]);

  const twentyMostRecentPastDue = useMemo(() => pastDue.slice(0, 20), [pastDue]);

  return (
    <Tabs defaultValue="default" className="space-y-4">
        <TabsList>
            <TabsTrigger value="default">Mặc định</TabsTrigger>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="past_due">Đã trễ</TabsTrigger>
        </TabsList>
        
        <TabsContent value="default" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>15 Lịch hẹn sắp tới</CardTitle>
                    <CardDescription>Danh sách các lịch hẹn gần nhất chưa tới ngày.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AppointmentDisplayTable appointments={defaultAppointments.upcoming} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>15 Lịch hẹn đã trễ gần nhất</CardTitle>
                    <CardDescription>Danh sách các lịch hẹn đã quá ngày nhưng chưa được xử lý.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AppointmentDisplayTable appointments={defaultAppointments.past} />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
             <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Tất cả Lịch hẹn</CardTitle>
                            <CardDescription>Lọc và xem danh sách toàn bộ các lịch hẹn.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                    "w-full md:w-[300px] justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                        {format(dateRange.from, "dd/MM/y")} -{" "}
                                        {format(dateRange.to, "dd/MM/y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "dd/MM/y")
                                    )
                                    ) : (
                                    <span>Chọn khoảng thời gian</span>
                                    )}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                />
                                </PopoverContent>
                            </Popover>
                            {dateRange && <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)}><X className="h-4 w-4"/></Button>}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <AppointmentDisplayTable appointments={allFilteredAppointments} />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="past_due">
            <Card>
                <CardHeader>
                    <CardTitle>20 Lịch hẹn đã trễ gần nhất</CardTitle>
                    <CardDescription>Danh sách các lịch hẹn đã quá ngày nhưng chưa được xử lý.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AppointmentDisplayTable appointments={twentyMostRecentPastDue} />
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  );
}
