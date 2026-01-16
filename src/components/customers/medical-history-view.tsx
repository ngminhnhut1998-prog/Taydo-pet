"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Pet, type MedicalRecord } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, ArrowLeft, FileText, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { RecordForm } from './record-form';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSettings } from '@/contexts/settings-context';

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export function MedicalHistoryView({ pet, onBack }: { pet: Pet; onBack: () => void }) {
    const { isReadOnly } = useSettings();
    const records = useLiveQuery(
        () => db.records.where('thu_id').equals(pet.id).sortBy('ngay_kham').then(r => r.reverse()),
        [pet.id]
    );
    const [isRecordFormOpen, setIsRecordFormOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | undefined>(undefined);

    const openRecordForm = (record?: MedicalRecord) => {
        if (isReadOnly) return;
        setSelectedRecord(record);
        setIsRecordFormOpen(true);
    };

    return (
        <div className="space-y-6">
             <RecordForm 
                isOpen={isRecordFormOpen} 
                setIsOpen={setIsRecordFormOpen}
                petId={pet.id}
                existingRecord={selectedRecord}
            />
            <div>
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại
                </Button>
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">{pet.ten}</h1>
                        <p className="text-muted-foreground">{pet.loai_thu} - {pet.giong}</p>
                    </div>
                </div>
            </div>
            
            <Card>
                <CardHeader className='flex-row justify-between items-center'>
                    <div>
                        <CardTitle>Bệnh án điện tử</CardTitle>
                        <CardDescription>Toàn bộ lịch sử khám và điều trị của {pet.ten}.</CardDescription>
                    </div>
                    {!isReadOnly && (
                        <Button variant="outline" size="sm" onClick={() => openRecordForm()}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Thêm bệnh án
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    {records && records.length > 0 ? (
                       <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ngày khám</TableHead>
                                    <TableHead>Cân nặng (kg)</TableHead>
                                    <TableHead>Triệu chứng</TableHead>
                                    <TableHead>Chẩn đoán</TableHead>
                                    <TableHead>Đơn thuốc</TableHead>
                                    <TableHead>Bán kèm</TableHead>
                                    <TableHead>Ghi chú</TableHead>
                                    <TableHead>Nhắc hẹn</TableHead>
                                    <TableHead>Chi phí</TableHead>
                                    {!isReadOnly && <TableHead><span className="sr-only">Actions</span></TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.map(record => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">{format(new Date(record.ngay_kham), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>{record.can_nang_kham ?? 'N/A'}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-xs">{record.trieu_chung}</TableCell>
                                        <TableCell>{record.chan_doan}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-xs whitespace-pre-wrap">{record.don_thuoc}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-xs">{record.ban_kem}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-xs">{record.ghi_chu}</TableCell>
                                        <TableCell>
                                            {record.nhac_hen && record.nhac_hen.length > 0 ? (
                                                <div className='flex flex-col gap-2'>
                                                    {record.nhac_hen.map((hen, index) => (
                                                        <div key={index}>
                                                            <Badge variant="secondary">{hen.ngay ? format(new Date(hen.ngay), 'dd/MM/yyyy') : 'N/A'}</Badge>
                                                            <p className='text-xs text-muted-foreground mt-1'>{hen.noi_dung}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="font-semibold">{record.chi_phi ? currencyFormatter.format(record.chi_phi) : '-'}</TableCell>
                                        {!isReadOnly && (
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Mở menu</span>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openRecordForm(record)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Sửa bệnh án
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="mx-auto h-12 w-12" />
                            <p className="mt-4 font-semibold">Chưa có bệnh án nào</p>
                            {!isReadOnly && <p className="mt-1 text-sm">Hãy bắt đầu bằng cách thêm bệnh án đầu tiên cho {pet.ten}.</p>}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
