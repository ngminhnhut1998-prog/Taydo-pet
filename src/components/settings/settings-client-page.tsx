
"use client";

import { useState, useRef, useEffect } from 'react';
import { useSettings } from '@/contexts/settings-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Download, Upload, ShieldCheck, ShieldOff, FileSpreadsheet, Loader2, Lock, Unlock } from 'lucide-react';
import { db, type Customer, type Pet, type MedicalRecord, type PetshopSale } from '@/lib/db';
import { pb } from '@/lib/pocketbase';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { exportDataToExcel } from '@/lib/excel-export';
import { format, isValid, parse } from 'date-fns';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface BackupData {
    customers: Customer[];
    pets: Pet[];
    records: MedicalRecord[];
    petshopSales: PetshopSale[];
}

export default function SettingsClientPage() {
    const { isReadOnly, toggleReadOnly, lockdownDate, setLockdownDate } = useSettings();
    const { toast } = useToast();
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [restorableData, setRestorableData] = useState<BackupData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    
    const [lockDateInput, setLockDateInput] = useState('');
    const [isLockConfirmOpen, setIsLockConfirmOpen] = useState(false);

    useEffect(() => {
        setLockDateInput(lockdownDate ? format(new Date(lockdownDate), 'dd/MM/yyyy') : '');
    }, [lockdownDate]);


    const handleAttemptLockdown = () => {
        const parsedDate = parse(lockDateInput, 'dd/MM/yyyy', new Date());
        if (!isValid(parsedDate) || lockDateInput.length !== 10) {
            toast({
                variant: 'destructive',
                title: 'Ngày không hợp lệ',
                description: 'Vui lòng nhập ngày theo định dạng dd/MM/yyyy.',
            });
            return;
        }
        setIsLockConfirmOpen(true);
    };

    const handleConfirmLockdown = () => {
        const parsedDate = parse(lockDateInput, 'dd/MM/yyyy', new Date());
        setLockdownDate(parsedDate.toISOString());
        toast({
            title: "Đã chốt dữ liệu",
            description: `Các bản ghi từ ngày ${lockDateInput} trở về trước sẽ bị khóa.`,
        });
        setIsLockConfirmOpen(false);
    };

    const handleRemoveLockdown = () => {
        setLockdownDate(null);
        setLockDateInput('');
        toast({
            title: "Đã mở khóa dữ liệu",
            description: "Tất cả các bản ghi đã được mở khóa.",
        });
    };

    const handleBackup = async () => {
        try {
            const customers = await db.customers.toArray();
            const pets = await db.pets.toArray();
            const records = await db.records.toArray();
            const petshopSales = await db.petshopSales.toArray();

            const backupData = JSON.stringify({ customers, pets, records, petshopSales }, null, 2);
            const blob = new Blob([backupData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `th-vet-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({
                title: "Sao lưu thành công",
                description: "Tệp sao lưu đã được tải về máy của bạn.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Lỗi sao lưu",
                description: "Không thể thực hiện sao lưu. Vui lòng thử lại.",
                variant: "destructive"
            });
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("Nội dung tệp không hợp lệ.");
                const data = JSON.parse(text);

                if (!Array.isArray(data.customers) || !Array.isArray(data.pets) || !Array.isArray(data.records)) {
                    throw new Error("Tệp sao lưu không đúng định dạng.");
                }
                // Tương thích ngược với file backup cũ chưa có petshopSales
                if (!Array.isArray(data.petshopSales)) {
                    data.petshopSales = [];
                }
                setRestorableData(data);
                setIsRestoreConfirmOpen(true);
            } catch (err: any) {
                toast({
                    title: "Lỗi đọc tệp",
                    description: err.message || "Tệp bạn chọn không hợp lệ hoặc đã bị hỏng.",
                    variant: "destructive"
                });
            }
        };
        reader.readAsText(file);
        if (event.target) {
            event.target.value = "";
        }
    };

    const handleRestoreConfirm = async () => {
        if (!restorableData) return;
        try {
            // Bước 1: Ghi vào IndexedDB (kho dưới máy)
            await db.transaction('rw', db.customers, db.pets, db.records, db.petshopSales, async () => {
                await db.records.clear();
                await db.pets.clear();
                await db.customers.clear();
                await db.petshopSales.clear();
                await db.customers.bulkPut(restorableData.customers);
                await db.pets.bulkPut(restorableData.pets);
                await db.records.bulkPut(restorableData.records);
                await db.petshopSales.bulkPut(restorableData.petshopSales ?? []);
            });

            toast({
                title: "Đang phục hồi lên máy chủ...",
                description: "Vui lòng chờ, đang ghi dữ liệu lên PocketBase.",
            });

            // Bước 2: Xóa toàn bộ dữ liệu cũ trên PocketBase
            const [oldCustomers, oldPets, oldRecords, oldSales] = await Promise.all([
                pb.collection('customers').getFullList(),
                pb.collection('pets').getFullList(),
                pb.collection('records').getFullList(),
                pb.collection('petshopSales').getFullList(),
            ]);
            await Promise.all([
                ...oldCustomers.map((r: any) => pb.collection('customers').delete(r.id)),
                ...oldPets.map((r: any) => pb.collection('pets').delete(r.id)),
                ...oldRecords.map((r: any) => pb.collection('records').delete(r.id)),
                ...oldSales.map((r: any) => pb.collection('petshopSales').delete(r.id)),
            ]);

            // Bước 3: Tạo lại toàn bộ dữ liệu từ backup lên PocketBase
            for (const c of restorableData.customers) {
                await pb.collection('customers').create(c);
            }
            for (const p of restorableData.pets) {
                await pb.collection('pets').create(p);
            }
            for (const r of restorableData.records) {
                await pb.collection('records').create(r);
            }
            for (const s of (restorableData.petshopSales ?? [])) {
                await pb.collection('petshopSales').create(s);
            }

            toast({
                title: "Phục hồi thành công!",
                description: "Dữ liệu đã được khôi phục hoàn toàn. Trang sẽ được tải lại.",
            });
            setTimeout(() => window.location.reload(), 2000);
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Lỗi phục hồi dữ liệu",
                description: error.message || "Không thể ghi dữ liệu từ tệp sao lưu. Vui lòng kiểm tra kết nối và thử lại.",
                variant: 'destructive'
            });
        } finally {
            setIsRestoreConfirmOpen(false);
            setRestorableData(null);
        }
    }

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            await exportDataToExcel();
            toast({
                title: "Xuất Excel thành công",
                description: "Tệp Excel đã được tải về máy của bạn.",
            });
        } catch (error) {
            console.error("Lỗi xuất Excel:", error);
            toast({
                title: "Lỗi xuất Excel",
                description: "Không thể xuất dữ liệu ra file Excel. Vui lòng thử lại.",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };


    return (
        <>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Chế độ Xem</CardTitle>
                        <CardDescription>Bật chế độ chỉ xem để ẩn các chức năng thêm, sửa, xóa khỏi giao diện. Hữu ích khi bạn muốn trình diễn ứng dụng mà không sợ thay đổi dữ liệu.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4 rounded-md border p-4">
                            <div className='flex-shrink-0'>
                                {isReadOnly ? <ShieldCheck className="h-6 w-6 text-green-600" /> : <ShieldOff className="h-6 w-6 text-destructive" />}
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {isReadOnly ? 'Chế độ chỉ xem đang BẬT' : 'Chế độ chỉ xem đang TẮT'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {isReadOnly ? 'Các nút thao tác đã bị ẩn.' : 'Bạn có thể thêm, sửa, xóa dữ liệu.'}
                                </p>
                            </div>
                            <Switch
                                checked={isReadOnly}
                                onCheckedChange={toggleReadOnly}
                                aria-label="Toggle read-only mode"
                            />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Chốt dữ liệu</CardTitle>
                        <CardDescription>Nhập một mốc thời gian. Các bản ghi có ngày bằng hoặc trước mốc này sẽ bị khóa, không thể sửa hoặc xóa.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                             <Label htmlFor="lockdown-date">Ngày chốt dữ liệu</Label>
                             <Input 
                                id="lockdown-date"
                                placeholder="dd/MM/yyyy"
                                value={lockDateInput}
                                onChange={(e) => setLockDateInput(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                             <Button onClick={handleAttemptLockdown} className="w-full" disabled={isReadOnly || !lockDateInput}>
                                <Lock className="mr-2 h-4 w-4" />
                                Chốt dữ liệu
                            </Button>
                            <Button variant="outline" className="w-full" onClick={handleRemoveLockdown} disabled={isReadOnly || !lockdownDate}>
                                <Unlock className="mr-2 h-4 w-4" />
                                Mở khóa
                            </Button>
                        </div>
                         {lockdownDate && (
                            <p className="text-sm text-center text-muted-foreground pt-2">
                                Dữ liệu đang bị khóa từ ngày <strong>{format(new Date(lockdownDate), 'dd/MM/yyyy')}</strong> trở về trước.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sao lưu & Phục hồi</CardTitle>
                        <CardDescription>Tạo bản sao lưu dữ liệu hoặc phục hồi từ tệp. Có 2 định dạng: JSON (toàn bộ) và Excel (chỉ bệnh án).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <Button onClick={handleBackup} className="w-full" disabled={isReadOnly}>
                            <Download className="mr-2 h-4 w-4" />
                            Sao lưu dữ liệu (JSON)
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isReadOnly}>
                            <Upload className="mr-2 h-4 w-4" />
                            Phục hồi từ tệp (JSON)
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            className="hidden"
                        />
                         <hr/>
                         <Button onClick={handleExportExcel} className="w-full" variant="secondary" disabled={isReadOnly || isExporting}>
                            {isExporting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xuất...
                                </>
                            ) : (
                                <>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Xuất ra file Excel
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
            
            <AlertDialog open={isLockConfirmOpen} onOpenChange={setIsLockConfirmOpen}>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận chốt dữ liệu?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ khóa tất cả các bản ghi có ngày bằng hoặc trước 
                            <span className='font-bold text-foreground'> {lockDateInput}</span>. 
                            Bạn sẽ không thể tạo, sửa hoặc xóa các bản ghi này. Bạn có chắc chắn muốn tiếp tục?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmLockdown}>
                            Đồng ý, chốt dữ liệu
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isRestoreConfirmOpen} onOpenChange={setIsRestoreConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận phục hồi dữ liệu?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ <span className='font-bold text-destructive'>xóa toàn bộ dữ liệu hiện tại</span> và thay thế bằng dữ liệu từ tệp sao lưu. Bạn có chắc chắn muốn tiếp tục không?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRestorableData(null)}>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestoreConfirm} className='bg-destructive hover:bg-destructive/90'>
                            Đồng ý, Phục hồi
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
