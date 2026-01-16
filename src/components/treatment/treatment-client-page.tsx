"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, startOfDay } from 'date-fns';
import { db, type Customer, type Pet, type MedicalRecord } from '@/lib/db';
import { customerApi, petApi, recordApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/settings-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UserPlus, PawPrint, Save, RotateCcw, AlertCircle, CalendarIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { cn } from '@/lib/utils';

const initialData = {
    newCustomerData: { ten: '', dia_chi: '' },
    newPetData: { ten: '', loai_thu: 'Chó', giong: '' },
    recordData: {
        can_nang_kham: undefined,
        trieu_chung: '',
        chan_doan: '',
        don_thuoc: '',
        ghi_chu: '',
        ngay_kham: new Date(),
        chi_phi: undefined,
    },
};

export default function TreatmentClientPage() {
    const { isReadOnly } = useSettings();
    const { toast } = useToast();

    // Step 1: Customer state
    const [phone, setPhone] = useState('');
    const [debouncedPhone, setDebouncedPhone] = useState('');
    const [customerStatus, setCustomerStatus] = useState<'idle' | 'loading' | 'found' | 'new'>('idle');
    const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
    const [newCustomerData, setNewCustomerData] = useState(initialData.newCustomerData);

    // Step 2: Pet state
    const [petStatus, setPetStatus] = useState<'idle' | 'selecting' | 'new'>('idle');
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [newPetData, setNewPetData] = useState(initialData.newPetData);
    const customerForPetList = customerStatus === 'found' ? foundCustomer : null;
    const petsOfCustomer = useLiveQuery(() => customerForPetList ? db.pets.where('khach_hang_id').equals(customerForPetList.id).toArray() : [], [customerForPetList]);

    // Step 3: Record state
    const [recordData, setRecordData] = useState(initialData.recordData);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Debounce phone input
    useEffect(() => {
        setCustomerStatus('loading');
        const handler = setTimeout(() => setDebouncedPhone(phone), 500);
        return () => clearTimeout(handler);
    }, [phone]);

    const customerQuery = useLiveQuery(() => debouncedPhone.length >= 9 ? db.customers.where('so_dien_thoai').equals(debouncedPhone).first() : undefined, [debouncedPhone]);

    useEffect(() => {
        if (debouncedPhone.length < 9) {
            setCustomerStatus('idle');
            setFoundCustomer(null);
            return;
        }
        if (customerQuery) {
            setFoundCustomer(customerQuery);
            setCustomerStatus('found');
            setPetStatus('selecting');
        } else {
            setFoundCustomer(null);
            setCustomerStatus('new');
            setPetStatus('new');
        }
    }, [customerQuery, debouncedPhone]);
    
    const resetForm = useCallback(() => {
        setPhone('');
        setDebouncedPhone('');
        setCustomerStatus('idle');
        setFoundCustomer(null);
        setNewCustomerData(initialData.newCustomerData);
        setPetStatus('idle');
        setSelectedPet(null);
        setNewPetData(initialData.newPetData);
        setRecordData(initialData.recordData);
        toast({ title: 'Biểu mẫu đã được làm mới', description: 'Sẵn sàng để tiếp nhận bệnh nhân tiếp theo.' });
    }, [toast]);

    const handleSaveAll = async () => {
        if (isReadOnly) return;
        setIsSubmitting(true);

        try {
            let customerId: string;
            // 1. Create or get customer
            if (customerStatus === 'new') {
                if (!newCustomerData.ten || !newCustomerData.dia_chi) {
                    throw new Error("Vui lòng nhập đủ tên và địa chỉ cho khách hàng mới.");
                }
                const newCustomer = await customerApi.create({ ...newCustomerData, so_dien_thoai: phone });
                customerId = newCustomer.id;
            } else if (foundCustomer) {
                customerId = foundCustomer.id;
            } else {
                throw new Error("Không xác định được khách hàng.");
            }

            // 2. Create or get pet
            let petId: string;
            if (petStatus === 'new') {
                if (!newPetData.ten || !newPetData.giong) {
                    throw new Error("Vui lòng nhập đủ tên và giống cho thú cưng mới.");
                }
                const newPet = await petApi.create({ ...newPetData, khach_hang_id: customerId });
                petId = newPet.id;
            } else if (selectedPet) {
                petId = selectedPet.id;
            } else {
                throw new Error("Vui lòng chọn hoặc tạo mới một thú cưng.");
            }

            // 3. Create medical record
            if (!recordData.chan_doan || !recordData.don_thuoc) {
                throw new Error("Vui lòng nhập chẩn đoán và đơn thuốc.");
            }
            await recordApi.create({
                ...recordData,
                thu_id: petId,
                ngay_kham: recordData.ngay_kham.toISOString(),
            });

            toast({ title: 'Thành công!', description: 'Đã lưu thông tin tiếp nhận bệnh nhân.' });
            resetForm();

        } catch (error: any) {
            console.error("Save all failed:", error);
            toast({ title: 'Lỗi', description: error.message || "Không thể lưu thông tin. Vui lòng thử lại.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const showStep2 = customerStatus === 'found' || customerStatus === 'new';
    const showStep3 = showStep2 && (petStatus === 'new' || (petStatus === 'selecting' && selectedPet));

    const isSaveDisabled = isReadOnly || isSubmitting || !showStep3;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Bước 1: Thông tin Khách hàng</CardTitle>
                    <CardDescription>Nhập số điện thoại để tìm khách hàng cũ hoặc tạo mới.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4 items-start">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="phone">Số điện thoại</Label>
                            <Input id="phone" placeholder="Nhập SĐT để bắt đầu..." value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus />
                        </div>
                         {customerStatus === 'loading' && phone.length >= 9 && <Loader2 className="mt-9 h-5 w-5 animate-spin text-muted-foreground" />}
                    </div>

                    {customerStatus === 'found' && foundCustomer && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="font-semibold text-green-800">Khách hàng cũ:</p>
                            <p><strong>{foundCustomer.ten}</strong> - {foundCustomer.dia_chi}</p>
                        </div>
                    )}
                    {customerStatus === 'new' && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                             <p className="font-semibold text-blue-800 flex items-center gap-2"><UserPlus/> Khách hàng mới:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-customer-name">Tên khách hàng</Label>
                                    <Input id="new-customer-name" placeholder="Nguyễn Văn A" value={newCustomerData.ten} onChange={e => setNewCustomerData(p => ({...p, ten: e.target.value}))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-customer-address">Địa chỉ</Label>
                                    <Input id="new-customer-address" placeholder="123 Đường ABC, Quận 1, TP. HCM" value={newCustomerData.dia_chi} onChange={e => setNewCustomerData(p => ({...p, dia_chi: e.target.value}))} />
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {showStep2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Bước 2: Thông tin Thú cưng</CardTitle>
                        <CardDescription>Chọn thú cưng có sẵn hoặc tạo mới.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {customerStatus === 'found' && petStatus === 'selecting' && (
                             <RadioGroup value={selectedPet?.id} onValueChange={(petId) => setSelectedPet(petsOfCustomer?.find(p => p.id === petId) || null)}>
                                 <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]"></TableHead>
                                                <TableHead>Tên thú cưng</TableHead>
                                                <TableHead>Loài</TableHead>
                                                <TableHead>Giống</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {petsOfCustomer && petsOfCustomer.length > 0 ? (
                                            petsOfCustomer.map(pet => (
                                                <TableRow key={pet.id} className="cursor-pointer" onClick={() => setSelectedPet(pet)}>
                                                    <TableCell><RadioGroupItem value={pet.id} id={`pet-${pet.id}`} /></TableCell>
                                                    <TableCell><Label htmlFor={`pet-${pet.id}`} className="font-medium">{pet.ten}</Label></TableCell>
                                                    <TableCell className="text-muted-foreground">{pet.loai_thu}</TableCell>
                                                    <TableCell className="text-muted-foreground">{pet.giong}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={4} className="h-24 text-center">Khách hàng này chưa có thú cưng.</TableCell></TableRow>
                                        )}
                                        </TableBody>
                                    </Table>
                                 </div>
                                 <Button variant="link" className="p-0 h-auto" onClick={() => setPetStatus('new')}>
                                     <UserPlus className="mr-2" />
                                     Không tìm thấy? Thêm thú cưng mới
                                 </Button>
                            </RadioGroup>
                        )}
                         {petStatus === 'new' && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                                <p className="font-semibold text-blue-800 flex items-center gap-2"><PawPrint/> Thú cưng mới:</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-pet-name">Tên thú cưng</Label>
                                        <Input id="new-pet-name" placeholder="Mực" value={newPetData.ten} onChange={e => setNewPetData(p => ({...p, ten: e.target.value}))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-pet-species">Loài thú</Label>
                                        <Input id="new-pet-species" placeholder="Chó" value={newPetData.loai_thu} onChange={e => setNewPetData(p => ({...p, loai_thu: e.target.value}))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-pet-breed">Giống</Label>
                                        <Input id="new-pet-breed" placeholder="Cỏ" value={newPetData.giong} onChange={e => setNewPetData(p => ({...p, giong: e.target.value}))} />
                                    </div>
                                </div>
                                 {customerStatus === 'found' && <Button variant="link" className="p-0 h-auto" onClick={() => setPetStatus('selecting')}>Quay lại chọn thú cưng</Button>}
                            </div>
                         )}
                    </CardContent>
                </Card>
            )}

            {showStep3 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Bước 3: Thông tin Bệnh án</CardTitle>
                        <CardDescription>Nhập thông tin khám và điều trị.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Ngày khám</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !recordData.ngay_kham && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {recordData.ngay_kham ? format(recordData.ngay_kham, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={recordData.ngay_kham} onSelect={date => date && setRecordData(p => ({...p, ngay_kham: date}))} initialFocus /></PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="weight">Cân nặng (kg)</Label>
                                <Input id="weight" type="number" step="0.1" placeholder="5.5" value={recordData.can_nang_kham || ''} onChange={e => setRecordData(p => ({...p, can_nang_kham: Number(e.target.value)}))} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="symptoms">Triệu chứng</Label>
                            <Textarea id="symptoms" placeholder="Bỏ ăn, nôn, đi ngoài..." value={recordData.trieu_chung} onChange={e => setRecordData(p => ({...p, trieu_chung: e.target.value}))} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="diagnosis">Chẩn đoán</Label>
                            <Textarea id="diagnosis" placeholder="Viêm da dị ứng..." value={recordData.chan_doan} onChange={e => setRecordData(p => ({...p, chan_doan: e.target.value}))} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="prescription">Đơn thuốc</Label>
                            <Textarea id="prescription" placeholder="Thuốc A: 2 viên/ngày..." value={recordData.don_thuoc} onChange={e => setRecordData(p => ({...p, don_thuoc: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Ghi chú / Dặn dò</Label>
                            <Textarea id="notes" placeholder="Tái khám sau 1 tuần..." value={recordData.ghi_chu} onChange={e => setRecordData(p => ({...p, ghi_chu: e.target.value}))} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="cost">Tổng chi phí</Label>
                            <Input id="cost" type="number" placeholder="350000" value={recordData.chi_phi || ''} onChange={e => setRecordData(p => ({...p, chi_phi: Number(e.target.value)}))} />
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-between items-center pt-4">
                 <Button variant="ghost" onClick={resetForm} disabled={isSubmitting}>
                    <RotateCcw className="mr-2" />
                    Làm mới Form
                </Button>
                <Button size="lg" onClick={handleSaveAll} disabled={isSaveDisabled}>
                    {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                    Lưu tất cả
                </Button>
            </div>
            {isSaveDisabled && !isReadOnly && (
                <div className="flex items-center justify-end text-sm text-muted-foreground gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Vui lòng hoàn thành tất cả các bước để có thể lưu.</span>
                </div>
            )}
        </div>
    );
}
