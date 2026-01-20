
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Customer, type Pet, type MedicalRecord } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, PawPrint, Users, Search, ArrowLeft, Bone, Heart, Trash2, Palette, Cake, Loader2 } from 'lucide-react';
import { CustomerForm } from './customer-form';
import { PetForm } from './pet-form';
import { useSettings } from '@/contexts/settings-context';
import { MedicalHistoryView } from './medical-history-view';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { customerApi, petApi, recordApi } from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { format } from 'date-fns';

interface FullCustomerInfo extends Customer {
    pets: Pet[];
}

// Level 2: Pet List
function PetListView({ customer, onBack, onSelectPet }: { customer: FullCustomerInfo; onBack: () => void; onSelectPet: (pet: Pet) => void }) {
    const { isReadOnly } = useSettings();
    const { toast } = useToast();
    const [isPetFormOpen, setIsPetFormOpen] = useState(false);
    const [selectedPet, setSelectedPet] = useState<Pet | undefined>(undefined);
    const [petToDelete, setPetToDelete] = useState<Pet | undefined>(undefined);
    
    const openPetForm = (pet?: Pet) => {
        if (isReadOnly) return;
        setSelectedPet(pet);
        setIsPetFormOpen(true);
    };

    const handleDeletePet = async () => {
        if (!petToDelete) return;
        try {
            const recordsToDelete = await db.records.where('thu_id').equals(petToDelete.id).toArray();
            await Promise.all(recordsToDelete.map(record => recordApi.delete(record.id)));
            await petApi.delete(petToDelete.id);
            toast({ title: "Thành công", description: `Đã xóa thú cưng ${petToDelete.ten}.` });
        } catch (error) {
            console.error("Failed to delete pet:", error);
            toast({ title: "Lỗi", description: "Không thể xóa thú cưng. Vui lòng thử lại.", variant: 'destructive' });
        } finally {
            setPetToDelete(undefined);
        }
    };


    return (
        <div className="space-y-6">
            <PetForm 
                isOpen={isPetFormOpen} 
                setIsOpen={setIsPetFormOpen}
                customerId={customer.id}
                existingPet={selectedPet}
            />
             <AlertDialog open={!!petToDelete} onOpenChange={(open) => !open && setPetToDelete(undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Hành động này sẽ xóa vĩnh viễn thú cưng "{petToDelete?.ten}" cùng với tất cả bệnh án liên quan. Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePet} className='bg-destructive hover:bg-destructive/90'>Xóa</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div>
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại danh sách khách hàng
                </Button>
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">{customer.ten}</h1>
                        <p className="text-muted-foreground">
                            {customer.so_dien_thoai}
                            {customer.so_dien_thoai_2 && ` / ${customer.so_dien_thoai_2}`}
                            {customer.dia_chi && ` - ${customer.dia_chi}`}
                        </p>
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
                        <Card key={pet.id} className="hover:border-primary transition-colors flex flex-col" >
                            <CardHeader className="flex-row gap-4 items-start">
                                <div className="flex-1 cursor-pointer" onClick={() => onSelectPet(pet)}>
                                    <CardTitle>{pet.ten}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{pet.giong}</p>
                                </div>
                                {!isReadOnly && (
                                    <div className="flex">
                                        <Button variant="ghost" size="icon" onClick={() => openPetForm(pet)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setPetToDelete(pet)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4 text-sm cursor-pointer" onClick={() => onSelectPet(pet)}>
                                <div className="flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-muted-foreground" />
                                    <span>{pet.gioi_tinh ?? 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Palette className="h-4 w-4 text-muted-foreground" />
                                    <span>{pet.mau_long || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Cake className="h-4 w-4 text-muted-foreground" />
                                    <span>{pet.ngay_sinh ? format(new Date(pet.ngay_sinh), 'dd/MM/yyyy') : 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Bone className="h-4 w-4 text-muted-foreground" />
                                    <span>{pet.can_nang || pet.can_nang === 0 ? `${pet.can_nang} kg` : 'N/A'}</span>
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
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const allCustomers = useLiveQuery(() => db.customers.orderBy('ten').toArray(), []);
    const allPets = useLiveQuery(() => db.pets.toArray(), []);
    const [visibleCount, setVisibleCount] = useState(30);

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
            }))
            .filter(c => {
                const lowerCaseSearchTerm = searchTerm.toLowerCase();
                const hasMatchingPet = c.pets.some(pet => pet.ten.toLowerCase().includes(lowerCaseSearchTerm));
                
                return c.ten.toLowerCase().includes(lowerCaseSearchTerm) || 
                       c.so_dien_thoai.includes(searchTerm) ||
                       (c.so_dien_thoai_2 && c.so_dien_thoai_2.includes(searchTerm)) ||
                       hasMatchingPet;
            });

    }, [allCustomers, allPets, searchTerm]);
    
    const visibleCustomers = useMemo(() => customers.slice(0, visibleCount), [customers, visibleCount]);
    const canLoadMore = visibleCount < customers.length;

    const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
    const [customerToDelete, setCustomerToDelete] = useState<FullCustomerInfo | undefined>(undefined);

    const openCustomerForm = (customer?: Customer) => {
        if (isReadOnly) return;
        setSelectedCustomer(customer);
        setIsCustomerFormOpen(true);
    }
    
    const handleDeleteCustomer = async () => {
        if (!customerToDelete) return;
        try {
            const petsToDelete = await db.pets.where('khach_hang_id').equals(customerToDelete.id).toArray();
            const petIds = petsToDelete.map(p => p.id);

            if (petIds.length > 0) {
                const recordsToDelete = await db.records.where('thu_id').anyOf(petIds).toArray();
                await Promise.all(recordsToDelete.map(record => recordApi.delete(record.id)));
            }

            await Promise.all(petsToDelete.map(pet => petApi.delete(pet.id)));
            await customerApi.delete(customerToDelete.id);

            toast({ title: "Thành công", description: `Đã xóa khách hàng ${customerToDelete.ten} và toàn bộ dữ liệu liên quan.` });
        } catch (error) {
            console.error("Failed to delete customer:", error);
            toast({ title: "Lỗi", description: "Không thể xóa khách hàng. Vui lòng thử lại.", variant: 'destructive' });
        } finally {
            setCustomerToDelete(undefined);
        }
    };
    
    const badgeVariants: ('default' | 'secondary' | 'outline')[] = ['secondary', 'default', 'outline'];

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Quản lý Khách hàng</h1>
                <p className="text-muted-foreground">Tìm kiếm, xem và quản lý thông tin khách hàng và thú cưng của họ.</p>
            </div>
             <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ xóa vĩnh viễn khách hàng "{customerToDelete?.ten}" cùng với tất cả thú cưng và bệnh án liên quan. Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCustomer} className='bg-destructive hover:bg-destructive/90'>Xóa</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <CustomerForm 
                isOpen={isCustomerFormOpen} 
                setIsOpen={setIsCustomerFormOpen}
                existingCustomer={selectedCustomer}
            />
            <div className="flex flex-col gap-4 md:flex-row justify-between items-center">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Tìm theo tên, SĐT hoặc tên thú cưng..." 
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
                       <div className="max-h-[65vh] overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
                                    <TableRow className="hover:bg-muted">
                                        <TableHead className="font-semibold text-foreground">Tên khách hàng</TableHead>
                                        <TableHead className="font-semibold text-foreground">Số điện thoại</TableHead>
                                        <TableHead className="font-semibold text-foreground">Địa chỉ</TableHead>
                                        <TableHead className="font-semibold text-foreground">Thú cưng</TableHead>
                                        {!isReadOnly && <TableHead className='text-right font-semibold text-foreground'>Thao tác</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visibleCustomers.map(customer => (
                                        <TableRow key={customer.id} onClick={() => onSelectCustomer(customer)} className="cursor-pointer hover:bg-accent">
                                            <TableCell>
                                                <div className="font-medium">{customer.ten}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div>{customer.so_dien_thoai}</div>
                                                {customer.so_dien_thoai_2 && <div>{customer.so_dien_thoai_2}</div>}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground max-w-xs truncate">{customer.dia_chi || ''}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                {customer.pets.map((pet, index) => (
                                                    <Badge key={pet.id} variant={badgeVariants[index % badgeVariants.length]}>{pet.ten}</Badge>
                                                ))}
                                                </div>
                                            </TableCell>
                                            {!isReadOnly && (
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openCustomerForm(customer); }}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setCustomerToDelete(customer); }}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                            <Users className="w-16 h-16 text-muted-foreground" />
                            <h3 className="text-xl font-semibold">Không tìm thấy khách hàng</h3>
                            <p className="text-muted-foreground">Thử một từ khóa khác hoặc thêm khách hàng mới.</p>
                        </div>
                    )}
                </CardContent>
                 {canLoadMore && (
                    <CardFooter className="py-4 justify-center border-t">
                        <Button variant="ghost" onClick={() => setVisibleCount(v => v + 30)}>
                            Tải thêm {Math.min(30, customers.length - visibleCount)} khách hàng
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}

function CustomerClientPageComponent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const customerIdFromQuery = searchParams.get('customerId');
    const petIdFromQuery = searchParams.get('petId');

    const allCustomers = useLiveQuery(() => db.customers.toArray());
    const allPets = useLiveQuery(() => db.pets.toArray());

    const [selectedCustomer, setSelectedCustomer] = useState<FullCustomerInfo | null>(null);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [isInitializingFromQuery, setIsInitializingFromQuery] = useState(!!customerIdFromQuery);

     useEffect(() => {
        // Only run this logic if we have a query param and the data is loaded
        if (customerIdFromQuery && allCustomers && allPets) {
            const customer = allCustomers.find(c => c.id === customerIdFromQuery);
            if (customer) {
                const customerPets = allPets.filter(p => p.khach_hang_id === customer.id);
                setSelectedCustomer({ ...customer, pets: customerPets });

                if (petIdFromQuery) {
                    const pet = customerPets.find(p => p.id === petIdFromQuery);
                    if (pet) {
                        setSelectedPet(pet);
                    }
                }
                
                // Replace URL to remove the query param, preventing issues with back/forward
                router.replace('/khach-hang', { scroll: false });
            }
            setIsInitializingFromQuery(false);
        } else if (!customerIdFromQuery) {
            setIsInitializingFromQuery(false);
        }
    }, [customerIdFromQuery, petIdFromQuery, allCustomers, allPets, router]);


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
    
    if (isInitializingFromQuery || (!!customerIdFromQuery && (!allCustomers || !allPets))) {
         return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (selectedCustomer && selectedPet) {
        return <MedicalHistoryView pet={selectedPet} onBack={handleBackToPetList} />;
    }

    if (selectedCustomer) {
        // When a pet is deleted, we need to refresh the customer object to reflect the change
        const refreshedCustomer = {
            ...selectedCustomer,
            pets: selectedCustomer.pets.filter(p => db.pets.get(p.id))
        }
        return <PetListView customer={selectedCustomer} onBack={handleBackToCustomerList} onSelectPet={handleSelectPet} />;
    }

    return <CustomerListView onSelectCustomer={handleSelectCustomer} />;
}

// Main Component to handle navigation state
export default function CustomerClientPage() {
    // We wrap the component in Suspense to handle the use of useSearchParams
    return (
        <Suspense fallback={
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <CustomerClientPageComponent />
        </Suspense>
    );
}
