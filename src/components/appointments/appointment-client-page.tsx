"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, startOfDay } from 'date-fns';
import { db, type MedicalRecord, type Pet, type Customer, type Appointment } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface FullAppointmentInfo {
  record: MedicalRecord;
  appointment: Appointment;
  pet: Pet | undefined;
  customer: Customer | undefined;
}

export default function AppointmentClientPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const appointments = useLiveQuery(async () => {
    let query = db.records.where('nhac_hen.ngay').above('');

    if (dateRange?.from) {
      const fromDate = startOfDay(dateRange.from).toISOString();
      query = query.and(r => (r.nhac_hen || []).some(h => h.ngay >= fromDate));
    }
    if (dateRange?.to) {
      const toDate = new Date(startOfDay(dateRange.to).getTime() + 24 * 60 * 60 * 1000).toISOString();
      query = query.and(r => (r.nhac_hen || []).some(h => h.ngay < toDate));
    }
    
    const records = await query.toArray();

    let allAppointments: FullAppointmentInfo[] = [];

    for (const record of records) {
        if (record.nhac_hen) {
            for (const app of record.nhac_hen) {
                 // Filter appointments within the date range again, as the query is on record level
                const appDate = new Date(app.ngay);
                if (
                    (!dateRange?.from || appDate >= startOfDay(dateRange.from)) &&
                    (!dateRange?.to || appDate < startOfDay(dateRange.to).getTime() + 24 * 60 * 60 * 1000)
                ) {
                    const pet = await db.pets.get(record.thu_id);
                    const customer = pet ? await db.customers.get(pet.khach_hang_id) : undefined;
                    allAppointments.push({ record, appointment: app, pet, customer });
                }
            }
        }
    }
    
    // Sort by date
    allAppointments.sort((a, b) => new Date(a.appointment.ngay).getTime() - new Date(b.appointment.ngay).getTime());

    return allAppointments;
  }, [dateRange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <CardTitle>Tất cả Lịch hẹn</CardTitle>
                <CardDescription>Danh sách toàn bộ các lịch hẹn đã được ghi nhận.</CardDescription>
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
        {appointments && appointments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày hẹn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Thú cưng</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Lý do</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map(({ record, appointment, pet, customer }, index) => (
                <TableRow key={`${record.id}-${index}`}>
                  <TableCell>
                      <Badge variant="secondary">{format(new Date(appointment.ngay), 'dd/MM/yyyy')}</Badge>
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 hidden sm:flex">
                              <AvatarImage src={`https://i.pravatar.cc/150?u=${customer?.id}`} alt={customer?.ten} />
                              <AvatarFallback>{customer?.ten.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{customer?.ten || 'Không rõ'}</span>
                      </div>
                  </TableCell>
                  <TableCell>{pet?.ten || 'Không rõ'}</TableCell>
                  <TableCell className="text-muted-foreground">{customer?.so_dien_thoai || ''}</TableCell>
                  <TableCell className="text-muted-foreground">{appointment.noi_dung}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <CalendarIcon className="w-16 h-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Không có lịch hẹn</h3>
            <p className="text-muted-foreground">Không tìm thấy lịch hẹn nào phù hợp với bộ lọc của bạn.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
