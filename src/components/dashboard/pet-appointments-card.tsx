"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db, type Pet } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PawPrint, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function PetAppointmentsCard() {
  const pets = useLiveQuery(() => db.pets.orderBy('created').reverse().limit(5).toArray(), []);

  if (pets === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thú cưng mới</CardTitle>
          <CardDescription>Đang tải danh sách...</CardDescription>
        </CardHeader>
        <CardContent className='flex justify-center items-center py-10'>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='flex-row items-center justify-between'>
         <div>
            <CardTitle>Thú cưng mới</CardTitle>
            <CardDescription>5 thú cưng được thêm gần đây.</CardDescription>
         </div>
         <Link href="/khach-hang" className='text-sm font-medium text-primary hover:underline'>Xem tất cả</Link>
      </CardHeader>
      <CardContent>
        {pets.length > 0 ? (
          <div className="space-y-4">
            {pets.map((pet) => (
              <div key={pet.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium">{pet.ten}</p>
                  <p className="text-sm text-muted-foreground">{pet.loai_thu} - {pet.giong}</p>
                </div>
                {pet.created && (
                    <p className="text-sm text-muted-foreground">
                        {format(new Date(pet.created), 'dd/MM/yyyy')}
                    </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <PawPrint className="w-16 h-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Chưa có thú cưng</h3>
            <p className="text-muted-foreground">Dữ liệu từ máy chủ sẽ được đồng bộ tại đây.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
