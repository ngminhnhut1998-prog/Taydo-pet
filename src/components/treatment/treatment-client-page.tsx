"use client";

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Customer, type Pet } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PawPrint, Search, User } from 'lucide-react';
import { MedicalHistoryView } from '@/components/customers/medical-history-view';

interface SearchablePet {
    pet: Pet;
    customer: Customer;
}

export default function TreatmentClientPage() {
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const allCustomers = useLiveQuery(() => db.customers.toArray(), []);
    const allPets = useLiveQuery(() => db.pets.toArray(), []);

    const searchablePets = useMemo((): SearchablePet[] => {
        const lowercasedTerm = searchTerm.toLowerCase();
        if (!allCustomers || !allPets || !lowercasedTerm) return [];
        
        const customerMap = new Map(allCustomers.map(c => [c.id, c]));
        
        return allPets
            .map(pet => ({
                pet,
                customer: customerMap.get(pet.khach_hang_id)!
            }))
            .filter(item => 
                item.customer && (
                    item.pet.ten.toLowerCase().includes(lowercasedTerm) || 
                    item.customer.ten.toLowerCase().includes(lowercasedTerm) ||
                    item.customer.so_dien_thoai.includes(searchTerm)
                )
            );

    }, [allCustomers, allPets, searchTerm]);

    const handleSelectPet = (pet: Pet) => {
        setSelectedPet(pet);
    }
    
    const handleBackToSearch = () => {
        setSelectedPet(null);
    }

    if (selectedPet) {
        return <MedicalHistoryView pet={selectedPet} onBack={handleBackToSearch} />;
    }

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Hồ sơ điều trị</h1>
                <p className="text-muted-foreground">Tìm kiếm nhanh thú cưng và thêm bệnh án mới.</p>
            </div>
            <div className="relative w-full md:max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Tìm theo tên thú cưng, tên hoặc SĐT khách hàng..." 
                    className="pl-10 h-12 text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
            </div>
            
            <Card>
                <CardContent className="p-0">
                    {searchablePets && searchablePets.length > 0 ? (
                       <ul className="divide-y divide-border">
                           {searchablePets.map(({ pet, customer }) => (
                               <li key={pet.id} onClick={() => handleSelectPet(pet)} className="cursor-pointer hover:bg-muted/50">
                                   <div className="flex items-center gap-4 p-4">
                                       <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <PawPrint className="h-5 w-5" />
                                        </div>
                                       <div>
                                           <p className="font-semibold text-lg">{pet.ten} <span className="text-sm font-normal text-muted-foreground">({pet.loai_thu} - {pet.giong})</span></p>
                                           <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                <User className="h-3 w-3" />
                                                <span>{customer.ten} - {customer.so_dien_thoai}</span>
                                           </div>
                                       </div>
                                   </div>
                               </li>
                           ))}
                       </ul>
                    ) : (
                         <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                            <Search className="w-16 h-16 text-muted-foreground" />
                            <h3 className="text-xl font-semibold">Bắt đầu tìm kiếm</h3>
                            <p className="text-muted-foreground">Nhập tên thú cưng, tên hoặc SĐT chủ để tìm bệnh án.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
