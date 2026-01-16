"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Customer, type Pet } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Search, User, PawPrint, ArrowLeft, Bone, Heart, Edit } from 'lucide-react';
import { CustomerForm } from '@/components/customers/customer-form';
import { PetForm } from '@/components/customers/pet-form';
import { MedicalHistoryView } from '@/components/customers/medical-history-view';
import { useSettings } from '@/contexts/settings-context';


export default function TreatmentClientPage() {
    const { isReadOnly } = useSettings();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    
    // For forms
    const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer|undefined>(undefined);
    const [isPetFormOpen, setIsPetFormOpen] = useState(false);
    const [editingPet, setEditingPet] = useState<Pet|undefined>(undefined);

    // Search term for customer
    const [searchTerm, setSearchTerm] = useState('');
    const customers = useLiveQuery(() => {
        if (!searchTerm.trim()) return [];
        const lowerTerm = searchTerm.toLowerCase();
        return db.customers.filter(c => 
            c.ten.toLowerCase().includes(lowerTerm) || 
            c.so_dien_thoai.includes(searchTerm)
        ).limit(10).toArray();
    }, [searchTerm]);

    const petsOfSelectedCustomer = useLiveQuery(
        () => selectedCustomer ? db.pets.where('khach_hang_id').equals(selectedCustomer.id).toArray() : [],
        [selectedCustomer]
    );

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setSelectedPet(null);
        setSearchTerm(''); // Clear search term after selection
    }
    
    const handleSelectPet = (pet: Pet) => {
        setSelectedPet(pet);
    }

    const handleBackToCustomerSearch = () => {
        setSelectedCustomer(null);
        setSelectedPet(null);
        setSearchTerm('');
    }
    
    const handleBackToPetSelection = () => {
        setSelectedPet(null);
    }

    const handleOpenNewCustomerForm = () => {
        setEditingCustomer(undefined);
        setIsCustomerFormOpen(true);
    }

    const handleOpenNewPetForm = () => {
        if (!selectedCustomer) return;
        setEditingPet(undefined);
        setIsPetFormOpen(true);
    }

    const handleOpenEditPetForm = (pet: Pet) => {
        setEditingPet(pet);
        setIsPetFormOpen(true);
    }
    
    // View 3: Medical History
    if (selectedCustomer && selectedPet) {
        return <MedicalHistoryView pet={selectedPet} onBack={handleBackToPetSelection} />;
    }

    // View 2: Pet Selection
    if (selectedCustomer) {
        return (
            <div className="space-y-6">
                <PetForm isOpen={isPetFormOpen} setIsOpen={setIsPetFormOpen} customerId={selectedCustomer.id} existingPet={editingPet} />
                <div>
                    <Button variant="ghost" onClick={handleBackToCustomerSearch} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Tìm khách hàng khác
                    </Button>
                    <Card>
                        <CardHeader>
                            <CardTitle>Khách hàng: {selectedCustomer.ten}</CardTitle>
                            <CardDescription>{selectedCustomer.so_dien_thoai} - {selectedCustomer.dia_chi}</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
                 <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><PawPrint className="h-6 w-6 text-primary" /> Chọn hoặc thêm thú cưng</h2>
                    {!isReadOnly && (
                        <Button onClick={handleOpenNewPetForm}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Thêm thú cưng
                        </Button>
                    )}
                </div>
                 {petsOfSelectedCustomer && petsOfSelectedCustomer.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {petsOfSelectedCustomer.map(pet => (
                            <Card key={pet.id} className="flex flex-col">
                                <CardHeader className="flex-row gap-4 items-center">
                                    <div className="flex-1">
                                        <CardTitle>{pet.ten}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{pet.giong}</p>
                                    </div>
                                    {!isReadOnly && (
                                        <Button variant="ghost" size="icon" className="ml-auto flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleOpenEditPetForm(pet); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-2 text-sm">
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
                                    <Button className="w-full" onClick={() => handleSelectPet(pet)}>Chọn và xem bệnh án</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-12 text-muted-foreground bg-secondary/30 rounded-lg">
                        <PawPrint className="mx-auto h-12 w-12" />
                        <p className="mt-4 font-semibold">Khách hàng này chưa có thú cưng nào.</p>
                        {!isReadOnly && (
                            <Button variant="secondary" className="mt-4" onClick={handleOpenNewPetForm}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Thêm thú cưng đầu tiên
                            </Button>
                        )}
                    </div>
                )}
            </div>
        );
    }
    
    // View 1: Customer Search
    return (
        <div className="space-y-6">
            <CustomerForm 
                isOpen={isCustomerFormOpen} 
                setIsOpen={setIsCustomerFormOpen} 
                existingCustomer={editingCustomer}
                onSaveSuccess={handleSelectCustomer}
            />
            <div className="flex flex-col gap-4 md:flex-row justify-between items-center">
                <div className="relative w-full md:max-w-lg">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Tìm khách hàng theo tên hoặc số điện thoại..." 
                        className="pl-10 h-12 text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>
                {!isReadOnly && (
                    <Button onClick={handleOpenNewCustomerForm} className="w-full md:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Thêm khách hàng mới
                    </Button>
                )}
            </div>
            
            <Card>
                 <CardHeader>
                    <CardTitle>Kết quả tìm kiếm</CardTitle>
                    <CardDescription>Chọn một khách hàng để tiếp tục.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {searchTerm && customers && customers.length > 0 ? (
                       <ul className="divide-y divide-border">
                           {customers.map((customer) => (
                               <li key={customer.id}>
                                   <button onClick={() => handleSelectCustomer(customer)} className="w-full text-left p-4 hover:bg-muted/50 focus:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md transition-colors">
                                       <div className="flex items-center gap-4">
                                           <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                <User className="h-5 w-5" />
                                            </div>
                                           <div>
                                               <p className="font-semibold text-lg">{customer.ten}</p>
                                               <p className="text-muted-foreground">{customer.so_dien_thoai}</p>
                                           </div>
                                       </div>
                                   </button>
                               </li>
                           ))}
                       </ul>
                    ) : (
                         <div className="flex flex-col items-center justify-center gap-4 py-20 text-center text-muted-foreground">
                            {searchTerm ? <User className="w-16 h-16" /> : <Search className="w-16 h-16" />}
                            <h3 className="text-xl font-semibold">
                                {searchTerm ? "Không tìm thấy khách hàng" : "Bắt đầu nhập liệu"}
                            </h3>
                            <p className="max-w-md">
                               {searchTerm ? "Thử lại với từ khóa khác hoặc bấm 'Thêm khách hàng mới'." : "Nhập tên hoặc SĐT của khách hàng vào ô tìm kiếm để tìm và thêm bệnh án."}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
