"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, startOfDay } from 'date-fns';
import { db, type MedicalRecord, type Pet, type Customer } from '@/lib/db';
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
        // Add 1 day to include the end date fully
        const toDate = new Date(startOfDay(dateRange.to).getTime() + 24 * 60 * 60 * 1000).toISOString();
        recordsQuery = recordsQuery.filter(r => r.nhac_hen! < toDate);
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
              {appointments.map(({ record, pet, customer }) => (
                <TableRow key={record.id}>
                  <TableCell>
                      <Badge variant="secondary">{record.nhac_hen ? format(new Date(record.nhac_hen), 'dd/MM/yyyy') : ''}</Badge>
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
                  <TableCell className="text-muted-foreground">{record.noi_dung_hen}</TableCell>
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
