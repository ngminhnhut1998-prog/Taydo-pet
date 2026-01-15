"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { format, isToday } from 'date-fns';
import { db, type MedicalRecord, type Pet, type Customer } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarClock } from 'lucide-react';

interface FullAppointmentInfo {
  record: MedicalRecord;
  pet: Pet | undefined;
  customer: Customer | undefined;
}

export default function AppointmentsTodayCard() {
  const appointments = useLiveQuery(async () => {
    const allRecords = await db.records.filter(r => !!r.nhac_hen).toArray();
    const todayRecords = allRecords.filter(r => r.nhac_hen && isToday(new Date(r.nhac_hen)));

    const fullInfo: FullAppointmentInfo[] = await Promise.all(
      todayRecords.map(async (record) => {
        const pet = await db.pets.get(record.thu_id);
        const customer = pet ? await db.customers.get(pet.khach_hang_id) : undefined;
        return { record, pet, customer };
      })
    );
    return fullInfo;
  }, []);

  if (!appointments) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lịch hẹn hôm nay</CardTitle>
          <CardDescription>Đang tải danh sách lịch hẹn...</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch hẹn hôm nay</CardTitle>
        <CardDescription>Danh sách các lịch tái khám và hẹn trước trong ngày.</CardDescription>
      </CardHeader>
      <CardContent>
        {appointments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Giờ hẹn</TableHead>
                <TableHead>Thú cưng</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Lý do</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map(({ record, pet, customer }) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Badge variant="outline">
                      {record.nhac_hen ? format(new Date(record.nhac_hen), 'HH:mm') : 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{pet?.ten || 'Không rõ'}</TableCell>
                  <TableCell>{customer?.ten || 'Không rõ'}</TableCell>
                  <TableCell className="text-muted-foreground">{record.chan_doan}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <CalendarClock className="w-16 h-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Không có lịch hẹn nào hôm nay</h3>
            <p className="text-muted-foreground">Mọi thứ đều ổn! Tận hưởng một ngày làm việc hiệu quả.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
