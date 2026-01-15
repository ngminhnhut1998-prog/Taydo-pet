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
    // 1. Get all records first, as querying multi-entry indexes with complex criteria is tricky.
    const allRecords = await db.records.toArray();

    let allAppointments: FullAppointmentInfo[] = [];

    // 2. Manually filter and flatten the appointments in TypeScript.
    for (const record of allRecords) {
      if (record.nhac_hen && Array.isArray(record.nhac_hen)) {
        for (const app of record.nhac_hen) {
          // Ensure appointment and its date are valid
          if (app && app.ngay) {
            const appDate = new Date(app.ngay);
            
            // Check if the appointment falls within the selected date range
            const fromDate = dateRange?.from ? startOfDay(dateRange.from) : null;
            const toDate = dateRange?.to ? startOfDay(dateRange.to) : null;
            
            const isInRange = 
              (!fromDate || appDate >= fromDate) &&
              (!toDate || appDate <= toDate);

            if (isInRange) {
              const pet = await db.pets.get(record.thu_id);
              const customer = pet ? await db.customers.get(pet.khach_hang_id) : undefined;
              allAppointments.push({ record, appointment: app, pet, customer });
            }
          }
        }
      }
    }
    
    // 3. Sort the flattened list by date.
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
                      <div className="font-medium">{customer?.ten || 'Không rõ'}</div>
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
