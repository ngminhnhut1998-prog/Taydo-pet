
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, startOfDay, parse, isValid } from 'date-fns';
import { db, type Customer, type Pet, type MedicalRecord } from '@/lib/db';
import { customerApi, petApi, recordApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/settings-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UserPlus, PawPrint, Save, RotateCcw, AlertCircle, CalendarIcon, Search, ChevronsRight, Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const initialData = {
    newCustomerData: { ten: '', so_dien_thoai: '', so_dien_thoai_2: '', dia_chi: '' },
    newPetData: { ten: '', loai_thu: 'Chó' as 'Chó' | 'Mèo', giong: '', mau_long: '', ngay_sinh: '', gioi_tinh: undefined as 'Đực' | 'Cái' | 'Đực thiến' | 'Cái thiến' | undefined, can_nang: undefined as number | undefined },
    recordData: {
        can_nang_kham: undefined as number | undefined,
        trieu_chung: '',
        chan_doan: '',
        don_thuoc: '',
        ghi_chu: '',
        ngay_kham: format(new Date(), 'dd/MM/yyyy'),
        ban_kem: '',
        chi_phi_chan_doan: undefined as number | undefined,
        chi_phi_don_thuoc: undefined as number | undefined,
        chi_phi_ban_kem: undefined as number | undefined,
        chi_phi: undefined as number | undefined,
        nhac_hen: [] as { ngay: string; noi_dung: string }[],
    },
};

export default function TreatmentClientPage() {
    const { isReadOnly } = useSettings();
    const { toast } = useToast();
    const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

    // Step 1: Customer state
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [customerStatus, setCustomerStatus] = useState<'idle' | 'found' | 'new'>('idle');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [newCustomerData, setNewCustomerData] = useState(initialData.newCustomerData);

    // Step 2: Pet state
    const [petStatus, setPetStatus] = useState<'idle' | 'selecting' | 'new'>('idle');
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [newPetData, setNewPetData] = useState(initialData.newPetData);
    const petsOfCustomer = useLiveQuery(() => selectedCustomer ? db.pets.where('khach_hang_id').equals(selectedCustomer.id).toArray() : [], [selectedCustomer]);

    // Step 3: Record state
    const [recordData, setRecordData] = useState<(typeof initialData.recordData)>(initialData.recordData);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const autoFocusRef = useRef<HTMLInputElement>(null);
    const newCustomerButtonRef = useRef<HTMLButtonElement>(null);
    const breedInputRef = useRef<HTMLInputElement>(null);
    const birthdateInputRef = useRef<HTMLInputElement>(null);
    const genderInputRef = useRef<HTMLInputElement>(null);
    const speciesInputRef = useRef<HTMLInputElement>(null);


    const handleSpeciesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setNewPetData(prev => ({
                ...prev,
                loai_thu: prev.loai_thu === 'Chó' ? 'Mèo' : 'Chó'
            }));
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            breedInputRef.current?.focus();
        }
    };

    const genderOptions = ['Đực', 'Cái', 'Đực thiến', 'Cái thiến'] as const;
    type GenderOption = typeof genderOptions[number];

    const handleGenderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setNewPetData(prev => {
                const currentIndex = prev.gioi_tinh ? genderOptions.indexOf(prev.gioi_tinh) : -1;
                let nextIndex;
                if (e.key === 'ArrowDown') {
                    nextIndex = (currentIndex + 1) % genderOptions.length;
                } else { // ArrowUp
                    nextIndex = (currentIndex - 1 + genderOptions.length) % genderOptions.length;
                }
                return { ...prev, gioi_tinh: genderOptions[nextIndex] as GenderOption };
            });
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            birthdateInputRef.current?.focus();
        }
    };
    
    // Auto-calculate total cost
    useEffect(() => {
        const total = 
            (recordData.chi_phi_chan_doan || 0) + 
            (recordData.chi_phi_don_thuoc || 0) + 
            (recordData.chi_phi_ban_kem || 0);
        setRecordData(prev => ({ ...prev, chi_phi: total }));
    }, [recordData.chi_phi_chan_doan, recordData.chi_phi_don_thuoc, recordData.chi_phi_ban_kem]);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

     useEffect(() => {
        if (customerStatus === 'idle' && autoFocusRef.current) {
            autoFocusRef.current.focus();
        }
    }, [customerStatus]);
    
    const searchResults = useLiveQuery(async () => {
        if (!debouncedSearchTerm) return [];
        const lowercasedTerm = debouncedSearchTerm.toLowerCase();
        return db.customers
            .filter(customer => 
                customer.ten.toLowerCase().includes(lowercasedTerm) || 
                customer.so_dien_thoai.includes(debouncedSearchTerm) ||
                (!!customer.so_dien_thoai_2 && customer.so_dien_thoai_2.includes(debouncedSearchTerm))
            )
            .limit(10)
            .toArray();
    }, [debouncedSearchTerm]);

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setCustomerStatus('found');
        setPetStatus('selecting');
    }

    const handleStartNewCustomer = () => {
        setCustomerStatus('new');
        setPetStatus('new');
        setNewCustomerData({ ...initialData.newCustomerData, so_dien_thoai: searchTerm })
    }

    const resetForm = useCallback(() => {
        setSearchTerm('');
        setDebouncedSearchTerm('');
        setCustomerStatus('idle');
        setSelectedCustomer(null);
        setNewCustomerData(initialData.newCustomerData);
        setPetStatus('idle');
        setSelectedPet(null);
        setNewPetData(initialData.newPetData);
        setRecordData({
            ...initialData.recordData,
            ngay_kham: format(new Date(), 'dd/MM/yyyy'),
        });
        toast({ title: 'Biểu mẫu đã được làm mới', description: 'Sẵn sàng để tiếp nhận bệnh nhân tiếp theo.' });
    }, [toast]);

    const handleSaveAll = async () => {
        if (isReadOnly) return;
        setIsSubmitting(true);

        try {
            let customerId: string;
            // 1. Create or get customer
            if (customerStatus === 'new') {
                if (!newCustomerData.ten || !newCustomerData.so_dien_thoai) {
                    throw new Error("Vui lòng nhập đủ tên và số điện thoại cho khách hàng mới.");
                }
                const newCustomer = await customerApi.create({ ...newCustomerData });
                customerId = newCustomer.id;
            } else if (selectedCustomer) {
                customerId = selectedCustomer.id;
            } else {
                throw new Error("Không xác định được khách hàng.");
            }

            // 2. Create or get pet
            let petId: string;
            if (petStatus === 'new') {
                if (!newPetData.ten || !newPetData.giong) {
                    throw new Error("Vui lòng nhập đủ tên và giống cho thú cưng mới.");
                }
                
                const petDataForApi = {
                    ...newPetData,
                    ngay_sinh: undefined as string | undefined
                };
                
                if (newPetData.ngay_sinh) {
                    const parsedDate = parse(newPetData.ngay_sinh, 'dd/MM/yyyy', new Date());
                    if (!isValid(parsedDate) || newPetData.ngay_sinh.length !== 10) {
                        throw new Error("Ngày sinh của thú cưng mới không hợp lệ. Vui lòng dùng định dạng dd/MM/yyyy.");
                    }
                    petDataForApi.ngay_sinh = parsedDate.toISOString();
                }

                const newPet = await petApi.create({ ...petDataForApi, khach_hang_id: customerId });
                petId = newPet.id;
            } else if (selectedPet) {
                petId = selectedPet.id;
            } else {
                throw new Error("Vui lòng chọn hoặc tạo mới một thú cưng.");
            }

            // 3. Create medical record
            const parsedNgayKham = parse(recordData.ngay_kham, 'dd/MM/yyyy', new Date());
            if (!isValid(parsedNgayKham)) {
                throw new Error('Ngày khám không hợp lệ. Vui lòng dùng định dạng dd/MM/yyyy.');
            }

            await recordApi.create({
                ...recordData,
                thu_id: petId,
                ngay_kham: parsedNgayKham.toISOString(),
                nhac_hen: (recordData.nhac_hen || [])
                    .filter(h => h.ngay && h.noi_dung)
                    .map(h => ({
                        ...h,
                        ngay: startOfDay(new Date(h.ngay)).toISOString()
                })),
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
            {customerStatus !== 'found' && customerStatus !== 'new' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Bước 1: Thông tin Khách hàng</CardTitle>
                        <CardDescription>Nhập tên hoặc SĐT để tìm khách hàng cũ hoặc tạo mới.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-grow w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    id="customer-search" 
                                    placeholder="Tìm theo tên hoặc SĐT..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    ref={autoFocusRef}
                                    className="pl-10"
                                />
                            </div>
                            <Button ref={newCustomerButtonRef} onClick={handleStartNewCustomer} className="w-full md:w-auto flex-shrink-0">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Thêm khách hàng mới
                            </Button>
                        </div>
                        
                        {debouncedSearchTerm && searchResults === undefined && (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        )}

                        {debouncedSearchTerm && searchResults && searchResults.length > 0 && (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tên khách hàng</TableHead>
                                            <TableHead>Số điện thoại</TableHead>
                                            <TableHead>Địa chỉ</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {searchResults.map(customer => (
                                            <TableRow key={customer.id} className="cursor-pointer hover:bg-accent" onClick={() => handleSelectCustomer(customer)}>
                                                <TableCell className="font-medium">{customer.ten}</TableCell>
                                                <TableCell>
                                                    <div>{customer.so_dien_thoai}</div>
                                                    {customer.so_dien_thoai_2 && <div>{customer.so_dien_thoai_2}</div>}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{customer.dia_chi || ''}</TableCell>
                                                <TableCell><ChevronsRight className="h-5 w-5 text-primary"/></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {debouncedSearchTerm && searchResults && searchResults.length === 0 && (
                            <div className="text-center p-6 border rounded-lg bg-secondary/50">
                                <p className="text-muted-foreground">Không tìm thấy khách hàng khớp với `{searchTerm}`.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {customerStatus === 'found' && selectedCustomer && (
                 <Card>
                    <CardHeader>
                         <CardTitle>Bước 1: Thông tin Khách hàng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="font-semibold text-green-800">Khách hàng đã chọn:</p>
                            <p><strong>{selectedCustomer.ten}</strong> - {selectedCustomer.so_dien_thoai}{selectedCustomer.so_dien_thoai_2 && ` / ${selectedCustomer.so_dien_thoai_2}`}{selectedCustomer.dia_chi && ` - ${selectedCustomer.dia_chi}`}</p>
                            <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => { setSelectedCustomer(null); setCustomerStatus('idle'); setSearchTerm(''); setPetStatus('idle'); setSelectedPet(null); }}>
                                Chọn khách hàng khác
                            </Button>
                        </div>
                    </CardContent>
                 </Card>
            )}

            {customerStatus === 'new' && (
                 <Card>
                    <CardHeader>
                         <CardTitle>Bước 1: Thông tin Khách hàng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                             <p className="font-semibold text-blue-800 flex items-center gap-2"><UserPlus/> Tạo khách hàng mới:</p>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="new-customer-name">Tên khách hàng</Label>
                                    <Input id="new-customer-name" placeholder="Nguyễn Văn A" value={newCustomerData.ten} onChange={e => setNewCustomerData(p => ({...p, ten: e.target.value}))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-customer-phone">Số điện thoại</Label>
                                    <Input id="new-customer-phone" placeholder="Nhập SĐT" value={newCustomerData.so_dien_thoai} onChange={e => setNewCustomerData(p => ({...p, so_dien_thoai: e.target.value}))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-customer-phone-2">Số điện thoại 2 (tùy chọn)</Label>
                                    <Input id="new-customer-phone-2" placeholder="SĐT dự phòng" value={newCustomerData.so_dien_thoai_2} onChange={e => setNewCustomerData(p => ({...p, so_dien_thoai_2: e.target.value}))} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="new-customer-address">Địa chỉ (tùy chọn)</Label>
                                    <Input id="new-customer-address" placeholder="123 Đường ABC, Quận 1, TP. HCM" value={newCustomerData.dia_chi} onChange={e => setNewCustomerData(p => ({...p, dia_chi: e.target.value}))} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                 </Card>
            )}

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
                                                    <TableCell><Label htmlFor={`pet-${pet.id}`} className="font-medium cursor-pointer">{pet.ten}</Label></TableCell>
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
                                 <Button variant="link" className="p-0 h-auto text-primary" onClick={() => setPetStatus('new')}>
                                     <PawPrint className="mr-2 h-4 w-4" />
                                     Không tìm thấy? Thêm thú cưng mới
                                 </Button>
                            </RadioGroup>
                        )}
                         {petStatus === 'new' && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                                <p className="font-semibold text-blue-800 flex items-center gap-2"><PawPrint/> Thú cưng mới:</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="new-pet-name">Tên thú cưng</Label>
                                        <Input id="new-pet-name" placeholder="Mực" value={newPetData.ten} onChange={e => setNewPetData(p => ({...p, ten: e.target.value}))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-pet-weight">Cân nặng (kg)</Label>
                                        <Input id="new-pet-weight" type="number" placeholder="5.5" value={newPetData.can_nang || ''} onChange={e => setNewPetData(p => ({...p, can_nang: e.target.value ? Number(e.target.value) : undefined}))} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="new-pet-species">Loài thú</Label>
                                        <Input
                                            id="new-pet-species"
                                            ref={speciesInputRef}
                                            readOnly
                                            value={newPetData.loai_thu}
                                            onKeyDown={handleSpeciesKeyDown}
                                            className="cursor-pointer font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-pet-breed">Giống</Label>
                                        <Input ref={breedInputRef} id="new-pet-breed" placeholder="Cỏ" value={newPetData.giong} onChange={e => setNewPetData(p => ({...p, giong: e.target.value}))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-pet-gender">Giới tính</Label>
                                        <Input
                                            id="new-pet-gender"
                                            ref={genderInputRef}
                                            readOnly
                                            value={newPetData.gioi_tinh || 'Chọn giới tính'}
                                            onKeyDown={handleGenderKeyDown}
                                            className="cursor-pointer font-medium"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="new-pet-birthdate">Ngày sinh (tùy chọn)</Label>
                                        <Input ref={birthdateInputRef} id="new-pet-birthdate" placeholder="dd/MM/yyyy" value={newPetData.ngay_sinh} onChange={e => setNewPetData(p => ({...p, ngay_sinh: e.target.value}))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-pet-color">Màu lông (tùy chọn)</Label>
                                        <Input id="new-pet-color" placeholder="Vàng" value={newPetData.mau_long} onChange={e => setNewPetData(p => ({...p, mau_long: e.target.value}))} />
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
                                <Label htmlFor="weight">Cân nặng (kg)</Label>
                                <Input id="weight" type="number" step="0.1" placeholder="5.5" value={recordData.can_nang_kham || ''} onChange={e => setRecordData(p => ({...p, can_nang_kham: e.target.value ? Number(e.target.value) : undefined}))} />
                            </div>
                           <div className="space-y-2">
                                <Label htmlFor="ngay-kham">Ngày khám</Label>
                                <Input
                                    id="ngay-kham"
                                    placeholder="dd/MM/yyyy"
                                    value={recordData.ngay_kham}
                                    onChange={e => setRecordData(p => ({...p, ngay_kham: e.target.value}))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="symptoms">Triệu chứng (tùy chọn)</Label>
                            <Textarea id="symptoms" placeholder="Bỏ ăn, nôn, đi ngoài..." value={recordData.trieu_chung} onChange={e => setRecordData(p => ({...p, trieu_chung: e.target.value}))} />
                        </div>
                        
                        <div className="flex items-start gap-4">
                            <div className="space-y-2 flex-1">
                                <Label htmlFor="diagnosis">Chẩn đoán (tùy chọn)</Label>
                                <Textarea id="diagnosis" placeholder="Viêm da dị ứng..." value={recordData.chan_doan} onChange={e => setRecordData(p => ({...p, chan_doan: e.target.value}))} />
                            </div>
                            <div className="space-y-2 w-36">
                                <Label htmlFor="cost-diagnosis">Phí khám</Label>
                                <Input id="cost-diagnosis" type="number" placeholder="150000" value={recordData.chi_phi_chan_doan || ''} onChange={e => setRecordData(p => ({...p, chi_phi_chan_doan: e.target.value ? Number(e.target.value) : undefined}))} />
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="space-y-2 flex-1">
                                <Label htmlFor="prescription">Đơn thuốc (tùy chọn)</Label>
                                <Textarea id="prescription" placeholder="Thuốc A: 2 viên/ngày..." value={recordData.don_thuoc} onChange={e => setRecordData(p => ({...p, don_thuoc: e.target.value}))} />
                            </div>
                            <div className="space-y-2 w-36">
                                <Label htmlFor="cost-prescription">Tiền thuốc</Label>
                                <Input id="cost-prescription" type="number" placeholder="200000" value={recordData.chi_phi_don_thuoc || ''} onChange={e => setRecordData(p => ({...p, chi_phi_don_thuoc: e.target.value ? Number(e.target.value) : undefined}))} />
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="space-y-2 flex-1">
                                <Label htmlFor="products">Sản phẩm/dịch vụ bán kèm</Label>
                                <Textarea id="products" placeholder="Vòng cổ chống ve, Sữa tắm..." value={recordData.ban_kem} onChange={e => setRecordData(p => ({...p, ban_kem: e.target.value}))} />
                            </div>
                            <div className="space-y-2 w-36">
                                <Label htmlFor="cost-products">Phí bán kèm</Label>
                                <Input id="cost-products" type="number" placeholder="0" value={recordData.chi_phi_ban_kem || ''} onChange={e => setRecordData(p => ({...p, chi_phi_ban_kem: e.target.value ? Number(e.target.value) : undefined}))} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Ghi chú / Dặn dò</Label>
                            <Textarea id="notes" placeholder="Tái khám sau 1 tuần..." value={recordData.ghi_chu || ''} onChange={e => setRecordData(p => ({...p, ghi_chu: e.target.value}))} />
                        </div>

                        <div className="space-y-4">
                            <Label>Nhắc hẹn</Label>
                            {(recordData.nhac_hen || []).map((hen, index) => (
                                <div key={index} className="flex items-end gap-2">
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor={`hen-ngay-${index}`} className="sr-only">Ngày hẹn</Label>
                                        <Input
                                            id={`hen-ngay-${index}`}
                                            type="date"
                                            value={hen.ngay}
                                            onChange={e => {
                                                const newHen = [...(recordData.nhac_hen || [])];
                                                newHen[index] = { ...newHen[index], ngay: e.target.value };
                                                setRecordData(p => ({ ...p, nhac_hen: newHen }));
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor={`hen-noi-dung-${index}`} className="sr-only">Nội dung hẹn</Label>
                                        <Input
                                            id={`hen-noi-dung-${index}`}
                                            placeholder="Nội dung hẹn (tái khám, tiêm, ...)"
                                            value={hen.noi_dung}
                                            onChange={e => {
                                                const newHen = [...(recordData.nhac_hen || [])];
                                                newHen[index] = { ...newHen[index], noi_dung: e.target.value };
                                                setRecordData(p => ({ ...p, nhac_hen: newHen }));
                                            }}
                                        />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => {
                                        const newHen = (recordData.nhac_hen || []).filter((_, i) => i !== index);
                                        setRecordData(p => ({ ...p, nhac_hen: newHen }));
                                    }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {(recordData.nhac_hen || []).length < 3 && !isReadOnly && (
                                <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if ((recordData.nhac_hen || []).length < 3) {
                                        setRecordData(p => ({ ...p, nhac_hen: [...(p.nhac_hen || []), { ngay: "", noi_dung: "" }] }));
                                    }
                                }}
                                >
                                <Plus className="mr-2 h-4 w-4" />
                                Thêm nhắc hẹn
                                </Button>
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="cost">Tổng chi phí</Label>
                            <div className="relative">
                                <Input id="cost" type="number" value={recordData.chi_phi || ''} readOnly className="pr-24 bg-muted/50 font-bold text-base" />
                                <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>{currencyFormatter.format(recordData.chi_phi || 0)}</span>
                            </div>
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
