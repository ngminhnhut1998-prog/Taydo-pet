"use client";

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Customer, type Pet, type MedicalRecord } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, PawPrint, Users, Search, ArrowLeft, Bone, Heart, Calendar, FileText, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CustomerForm } from './customer-form';
import { PetForm } from './pet-form';
import { RecordForm } from './record-form';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useSettings } from '@/contexts/settings-context';

interface FullCustomerInfo extends Customer {
    pets: Pet[];
    petNames: string;
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });


// Level 3: Medical History
function MedicalHistoryView({ pet, onBack }: { pet: Pet; onBack: () => void }) {
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
                    Quay lại danh sách thú cưng
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
                                                            <Badge variant="secondary">{format(new Date(hen.ngay), 'dd/MM/yyyy')}</Badge>
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

// Level 2: Pet List
function PetListView({ customer, onBack, onSelectPet }: { customer: FullCustomerInfo; onBack: () => void; onSelectPet: (pet: Pet) => void }) {
    const { isReadOnly } = useSettings();
    const [isPetFormOpen, setIsPetFormOpen] = useState(false);
    const [selectedPet, setSelectedPet] = useState<Pet | undefined>(undefined);
    
    const openPetForm = (pet?: Pet) => {
        if (isReadOnly) return;
        setSelectedPet(pet);
        setIsPetFormOpen(true);
    };

    return (
        <div className="space-y-6">
            <PetForm 
                isOpen={isPetFormOpen} 
                setIsOpen={setIsPetFormOpen}
                customerId={customer.id}
                existingPet={selectedPet}
            />
            <div>
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại danh sách khách hàng
                </Button>
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">{customer.ten}</h1>
                        <p className="text-muted-foreground">{customer.so_dien_thoai} - {customer.dia_chi}</p>
                    </div>
                </div>
            </div>

             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2"><PawPrint className="h-6 w-6 text-primary" /> Danh sách thú cưng</h2>
                {!isReadOnly && (
                    <Button onClick={() => openPetForm()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Thêm thú cưng
                    </Button>
                )}
            </div>

            {customer.pets && customer.pets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {customer.pets.map(pet => (
                        <Card key={pet.id} className="cursor-pointer hover:border-primary transition-colors flex flex-col" >
                            <CardHeader className="flex-row gap-4 items-center" onClick={() => onSelectPet(pet)}>
                                <div>
                                    <CardTitle>{pet.ten}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{pet.giong}</p>
                                </div>
                                {!isReadOnly && (
                                    <Button variant="ghost" size="icon" className="ml-auto" onClick={(e) => { e.stopPropagation(); openPetForm(pet); }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-2 text-sm" onClick={() => onSelectPet(pet)}>
                                <div className="flex items-center gap-2">
                                    <Bone className="h-4 w-4 text-muted-foreground" />
                                    <span>{pet.can_nang ?? 'N/A'} kg</span>
                                </div>
                                 <div className="flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-muted-foreground" />
                                    <span>{pet.gioi_tinh ?? 'N/A'}</span>
                                </div>
                            </CardContent>
                             <div className="p-6 pt-0 mt-auto">
                                <Button className="w-full" onClick={() => onSelectPet(pet)}>Xem bệnh án</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground bg-secondary/30 rounded-lg">
                    <PawPrint className="mx-auto h-12 w-12" />
                    <p className="mt-4">Khách hàng này chưa có thú cưng nào.</p>
                </div>
            )}
        </div>
    );
}

// Level 1: Customer List
function CustomerListView({ onSelectCustomer }: { onSelectCustomer: (customer: FullCustomerInfo) => void }) {
    const { isReadOnly } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const allCustomers = useLiveQuery(() => db.customers.toArray(), []);
    const allPets = useLiveQuery(() => db.pets.toArray(), []);

    const customers = useMemo((): FullCustomerInfo[] => {
        if (!allCustomers || !allPets) return [];
        
        const petsByCustomerId = allPets.reduce((acc, pet) => {
            if (!acc[pet.khach_hang_id]) {
                acc[pet.khach_hang_id] = [];
            }
            acc[pet.khach_hang_id].push(pet);
            return acc;
        }, {} as Record<string, Pet[]>);

        return allCustomers
            .map(c => ({
                ...c,
                pets: petsByCustomerId[c.id] || [],
                petNames: (petsByCustomerId[c.id] || []).map(p => p.ten).join(', ')
            }))
            .filter(c => 
                c.ten.toLowerCase().includes(searchTerm.toLowerCase()) || 
                c.so_dien_thoai.includes(searchTerm)
            );

    }, [allCustomers, allPets, searchTerm]);

    const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);

    const openCustomerForm = (customer?: Customer) => {
        if (isReadOnly) return;
        setSelectedCustomer(customer);
        setIsCustomerFormOpen(true);
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Quản lý Khách hàng</h1>
                <p className="text-muted-foreground">Tìm kiếm, xem và quản lý thông tin khách hàng và thú cưng của họ.</p>
            </div>
            <CustomerForm 
                isOpen={isCustomerFormOpen} 
                setIsOpen={setIsCustomerFormOpen}
                existingCustomer={selectedCustomer}
            />
            <div className="flex flex-col gap-4 md:flex-row justify-between items-center">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Tìm theo tên hoặc số điện thoại..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {!isReadOnly && (
                    <Button onClick={() => openCustomerForm()} className="w-full md:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Thêm khách hàng mới
                    </Button>
                )}
            </div>
            
            <Card>
                <CardContent className="p-0">
                    {customers && customers.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên khách hàng</TableHead>
                                    <TableHead>Số điện thoại</TableHead>
                                    <TableHead>Địa chỉ</TableHead>
                                    <TableHead>Thú cưng</TableHead>
                                    {!isReadOnly && <TableHead className='text-right'>Thao tác</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map(customer => (
                                    <TableRow key={customer.id} onClick={() => onSelectCustomer(customer)} className="cursor-pointer">
                                        <TableCell>
                                            <div className="font-medium">{customer.ten}</div>
                                        </TableCell>
                                        <TableCell>{customer.so_dien_thoai}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-xs truncate">{customer.dia_chi}</TableCell>
                                        <TableCell className="text-muted-foreground">{customer.petNames}</TableCell>
                                        {!isReadOnly && (
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openCustomerForm(customer); }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                            <Users className="w-16 h-16 text-muted-foreground" />
                            <h3 className="text-xl font-semibold">Không tìm thấy khách hàng</h3>
                            <p className="text-muted-foreground">Thử một từ khóa khác hoặc thêm khách hàng mới.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


// Main Component to handle navigation state
export default function CustomerClientPage() {
    const [selectedCustomer, setSelectedCustomer] = useState<FullCustomerInfo | null>(null);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

    const handleSelectCustomer = (customer: FullCustomerInfo) => {
        setSelectedCustomer(customer);
        setSelectedPet(null);
    }

    const handleSelectPet = (pet: Pet) => {
        setSelectedPet(pet);
    }

    const handleBackToCustomerList = () => {
        setSelectedCustomer(null);
        setSelectedPet(null);
    }
    
    const handleBackToPetList = () => {
        setSelectedPet(null);
    }

    if (selectedCustomer && selectedPet) {
        return <MedicalHistoryView pet={selectedPet} onBack={handleBackToPetList} />;
    }

    if (selectedCustomer) {
        return <PetListView customer={selectedCustomer} onBack={handleBackToCustomerList} onSelectPet={handleSelectPet} />;
    }

    return <CustomerListView onSelectCustomer={handleSelectCustomer} />;
}
