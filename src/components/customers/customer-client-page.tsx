"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Customer, type Pet, type MedicalRecord } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, PawPrint, Users, Search } from 'lucide-react';
import { format } from 'date-fns';
import { CustomerForm } from './customer-form';
import { PetForm } from './pet-form';
import { RecordForm } from './record-form';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

function RecordList({ petId }: { petId: string }) {
    const records = useLiveQuery(() => db.records.where('thu_id').equals(petId).sortBy('ngay_kham'), [petId]);
    const [isRecordFormOpen, setIsRecordFormOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | undefined>(undefined);

    const openRecordForm = (record?: MedicalRecord) => {
        setSelectedRecord(record);
        setIsRecordFormOpen(true);
    };

    return (
        <div className="pl-4 mt-2">
             <RecordForm 
                isOpen={isRecordFormOpen} 
                setIsOpen={setIsRecordFormOpen}
                petId={petId}
                existingRecord={selectedRecord}
            />
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Lịch sử khám</h4>
                <Button variant="outline" size="sm" onClick={() => openRecordForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Thêm bệnh án
                </Button>
            </div>
            {records && records.length > 0 ? (
                <div className='border rounded-lg'>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ngày khám</TableHead>
                            <TableHead>Chẩn đoán</TableHead>
                            <TableHead>Lịch tái khám</TableHead>
                            <TableHead className='text-right'>Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records.map(record => (
                            <TableRow key={record.id}>
                                <TableCell>{format(new Date(record.ngay_kham), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>{record.chan_doan}</TableCell>
                                <TableCell>{record.nhac_hen ? format(new Date(record.nhac_hen), 'dd/MM/yyyy HH:mm') : 'Không'}</TableCell>
                                <TableCell className="text-right">
                                     <Button variant="ghost" size="icon" onClick={() => openRecordForm(record)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>
            ) : (
                <div className='text-center py-6 text-sm text-muted-foreground bg-secondary/30 rounded-lg'>Chưa có lịch sử khám.</div>
            )}
        </div>
    );
}

function PetList({ customerId }: { customerId: string }) {
    const pets = useLiveQuery(() => db.pets.where('khach_hang_id').equals(customerId).toArray(), [customerId]);
    const [isPetFormOpen, setIsPetFormOpen] = useState(false);
    const [selectedPet, setSelectedPet] = useState<Pet | undefined>(undefined);
    
    const openPetForm = (pet?: Pet) => {
        setSelectedPet(pet);
        setIsPetFormOpen(true);
    };

    return (
        <div className="space-y-4 py-4 px-2 bg-secondary/50 rounded-lg">
             <PetForm 
                isOpen={isPetFormOpen} 
                setIsOpen={setIsPetFormOpen}
                customerId={customerId}
                existingPet={selectedPet}
            />
            <div className="flex justify-between items-center px-2">
                <h3 className="text-lg font-semibold flex items-center gap-2"><PawPrint className="h-5 w-5 text-primary" /> Danh sách thú cưng</h3>
                <Button onClick={() => openPetForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Thêm thú cưng
                </Button>
            </div>
            {pets && pets.length > 0 ? (
                 <Accordion type="single" collapsible className="w-full">
                    {pets.map(pet => (
                        <Card key={pet.id} className="mb-2 bg-background">
                             <AccordionItem value={pet.id} className="border-b-0">
                                <AccordionTrigger className="p-4 hover:no-underline">
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={`https://i.pravatar.cc/150?u=${pet.id}`} alt={pet.ten} />
                                                <AvatarFallback>{pet.ten.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-base">{pet.ten}</p>
                                                <p className="text-sm text-muted-foreground">{pet.loai_thu} - {pet.giong}</p>
                                            </div>
                                        </div>
                                        <div className='pr-4'>
                                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openPetForm(pet); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <RecordList petId={pet.id} />
                                </AccordionContent>
                             </AccordionItem>
                        </Card>
                    ))}
                 </Accordion>
            ) : (
                <div className="text-sm text-muted-foreground text-center py-8">Chưa có thông tin thú cưng.</div>
            )}
        </div>
    );
}

export default function CustomerClientPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const customers = useLiveQuery(() => 
        searchTerm ? 
        db.customers
            .filter(c => 
                c.ten.toLowerCase().includes(searchTerm.toLowerCase()) || 
                c.so_dien_thoai.includes(searchTerm)
            )
            .toArray()
        : db.customers.toArray()
    , [searchTerm]);
    const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);

    const openCustomerForm = (customer?: Customer) => {
        setSelectedCustomer(customer);
        setIsCustomerFormOpen(true);
    }

    return (
        <div className="space-y-6">
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
                <Button onClick={() => openCustomerForm()} className="w-full md:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> Thêm khách hàng mới
                </Button>
            </div>
            
            <Card>
                <CardContent className="p-0">
                    {customers && customers.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {customers.map(customer => (
                                <AccordionItem value={customer.id} key={customer.id}>
                                    <AccordionTrigger className="px-6 py-4 hover:bg-accent/50 hover:no-underline">
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={`https://i.pravatar.cc/150?u=${customer.id}`} alt={customer.ten} />
                                                    <AvatarFallback>{customer.ten.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-base">{customer.ten}</p>
                                                    <p className="text-sm text-muted-foreground">{customer.so_dien_thoai}</p>
                                                </div>
                                            </div>
                                            <div className='pr-4'>
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openCustomerForm(customer); }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-0">
                                        <PetList customerId={customer.id} />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
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
