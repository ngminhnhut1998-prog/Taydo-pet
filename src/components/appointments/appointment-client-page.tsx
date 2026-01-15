"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, startOfDay } from 'date-fns';
import { db, type MedicalRecord, type Pet, type Customer } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface FullAppointmentInfo {
  record: MedicalRecord;
  pet: Pet | undefined;
  customer: Customer | undefined;
}

export default function AppointmentClientPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const appointments = useLiveQuery(async () => {
    let recordsQuery = db.records.filter(r => !!r.nhac_hen);

    if(dateRange?.from){
        const fromDate = startOfDay(dateRange.from).toISOString();
        recordsQuery = recordsQuery.filter(r => r.nhac_hen! >= fromDate);
    }
    if(dateRange?.to){
        const toDate = startOfDay(dateRange.to).toISOString();
        recordsQuery = recordsQuery.filter(r => r.nhac_hen! <= toDate);
    }

    const records = await recordsQuery.sortBy('nhac_hen');

    const fullInfo: FullAppointmentInfo[] = await Promise.all(
      records.map(async (record) => {
        const pet = await db.pets.get(record.thu_id);
        const customer = pet ? await db.customers.get(pet.khach_hang_id) : undefined;
        return { record, pet, customer };
      })
    );
    return fullInfo;
  }, [dateRange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tất cả Lịch hẹn</CardTitle>
        <CardDescription>Danh sách toàn bộ các lịch hẹn đã được ghi nhận.</CardDescription>
        <div className="flex items-center gap-4 pt-4">
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                    dateRange.to ? (
                        <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                        </>
                    ) : (
                        format(dateRange.from, "LLL dd, y")
                    )
                    ) : (
                    <span>Chọn khoảng thời gian</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
            <Button variant="outline" onClick={() => setDateRange(undefined)}>Xóa bộ lọc</Button>
        </div>
      </CardHeader>
      <CardContent>
        {appointments && appointments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày hẹn</TableHead>
                <TableHead>Thú cưng</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Lý do</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map(({ record, pet, customer }) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.nhac_hen ? format(new Date(record.nhac_hen), 'dd/MM/yyyy HH:mm') : ''}</TableCell>
                  <TableCell>{pet?.ten || 'Không rõ'}</TableCell>
                  <TableCell>{customer?.ten || 'Không rõ'}</TableCell>
                  <TableCell className="text-muted-foreground">{customer?.so_dien_thoai || ''}</TableCell>
                  <TableCell className="text-muted-foreground">{record.chan_doan}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <CalendarIcon className="w-16 h-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Không có lịch hẹn</h3>
            <p className="text-muted-foreground">Không tìm thấy lịch hẹn nào phù hợp với bộ lọc của bạn.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
