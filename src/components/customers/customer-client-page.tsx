"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Customer, type Pet, type MedicalRecord } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, PawPrint, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { CustomerForm } from './customer-form';
import { PetForm } from './pet-form';
import { RecordForm } from './record-form';

function RecordList({ petId }: { petId: string }) {
    const records = useLiveQuery(() => db.records.where('thu_id').equals(petId).toArray(), [petId]);
    const [isRecordFormOpen, setIsRecordFormOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | undefined>(undefined);

    const openRecordForm = (record?: MedicalRecord) => {
        setSelectedRecord(record);
        setIsRecordFormOpen(true);
    };

    return (
        <div className="pl-4">
             <RecordForm 
                isOpen={isRecordFormOpen} 
                setIsOpen={setIsRecordFormOpen}
                petId={petId}
                existingRecord={selectedRecord}
            />
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Lịch sử khám</h4>
                <Button variant="ghost" size="sm" onClick={() => openRecordForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Thêm bệnh án
                </Button>
            </div>
            {records && records.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ngày khám</TableHead>
                            <TableHead>Chẩn đoán</TableHead>
                            <TableHead>Lịch tái khám</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records.map(record => (
                            <TableRow key={record.id}>
                                <TableCell>{format(new Date(record.ngay_kham), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>{record.chan_doan}</TableCell>
                                <TableCell>{record.nhac_hen ? format(new Date(record.nhac_hen), 'dd/MM/yyyy HH:mm') : 'Không có'}</TableCell>
                                <TableCell className="text-right">
                                     <Button variant="ghost" size="icon" onClick={() => openRecordForm(record)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Chưa có lịch sử khám.</p>
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
        <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
             <PetForm 
                isOpen={isPetFormOpen} 
                setIsOpen={setIsPetFormOpen}
                customerId={customerId}
                existingPet={selectedPet}
            />
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2"><PawPrint className="h-5 w-5" /> Danh sách thú cưng</h3>
                <Button onClick={() => openPetForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Thêm thú cưng
                </Button>
            </div>
            {pets && pets.length > 0 ? (
                 <Accordion type="single" collapsible className="w-full">
                    {pets.map(pet => (
                        <Card key={pet.id} className="mb-2">
                             <AccordionItem value={pet.id} className="border-b-0">
                                <AccordionTrigger className="p-4 hover:no-underline">
                                    <div className="flex justify-between items-center w-full">
                                        <div>
                                            <p className="font-bold">{pet.ten}</p>
                                            <p className="text-sm text-muted-foreground">{pet.loai_thu} - {pet.giong}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openPetForm(pet); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
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
                <p className="text-sm text-muted-foreground text-center py-4">Chưa có thông tin thú cưng.</p>
            )}
        </div>
    );
}

export default function CustomerClientPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const customers = useLiveQuery(() => 
        db.customers
            .filter(c => 
                c.ten.toLowerCase().includes(searchTerm.toLowerCase()) || 
                c.so_dien_thoai.includes(searchTerm)
            )
            .toArray()
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
            <div className="flex justify-between items-center">
                <Input 
                    placeholder="Tìm kiếm theo tên hoặc số điện thoại..." 
                    className="max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button onClick={() => openCustomerForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Thêm khách hàng mới
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách khách hàng</CardTitle>
                    <CardDescription>Nhấn vào một khách hàng để xem chi tiết.</CardDescription>
                </CardHeader>
                <CardContent>
                    {customers && customers.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {customers.map(customer => (
                                <AccordionItem value={customer.id} key={customer.id}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between items-center w-full pr-4">
                                            <div>
                                                <p className="font-bold">{customer.ten}</p>
                                                <p className="text-sm text-muted-foreground">{customer.so_dien_thoai}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openCustomerForm(customer); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <PetList customerId={customer.id} />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                         <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
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
