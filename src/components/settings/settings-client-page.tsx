
"use client";

import { useState, useRef, useEffect } from 'react';
import { useSettings } from '@/contexts/settings-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Download, Upload, ShieldCheck, ShieldOff, FileSpreadsheet, Loader2, Lock, Unlock } from 'lucide-react';
import { db, type Customer, type Pet, type MedicalRecord } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { exportDataToExcel } from '@/lib/excel-export';
import { DatePicker } from '../ui/date-picker';
import { format } from 'date-fns';

interface BackupData {
    customers: Customer[];
    pets: Pet[];
    records: MedicalRecord[];
}

export default function SettingsClientPage() {
    const { isReadOnly, toggleReadOnly, lockdownDate, setLockdownDate } = useSettings();
    const { toast } = useToast();
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [restorableData, setRestorableData] = useState<BackupData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    
    const [lockDate, setLockDate] = useState<Date | undefined>(undefined);
    const [isLockConfirmOpen, setIsLockConfirmOpen] = useState(false);

    useEffect(() => {
        setLockDate(lockdownDate ? new Date(lockdownDate) : undefined);
    }, [lockdownDate]);


    const handleSaveLockdown = () => {
        if (lockDate) {
            setLockdownDate(lockDate.toISOString());
            toast({
                title: "Đã chốt dữ liệu",
                description: `Các bản ghi từ ngày ${format(lockDate, 'dd/MM/yyyy')} trở về trước sẽ bị khóa.`,
            });
        }
    };

    const handleRemoveLockdown = () => {
        setLockdownDate(null);
        setLockDate(undefined);
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

            const backupData = JSON.stringify({ customers, pets, records }, null, 2);
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
            await db.transaction('rw', db.customers, db.pets, db.records, async () => {
                await db.records.clear();
                await db.pets.clear();
                await db.customers.clear();
                await db.customers.bulkAdd(restorableData.customers);
                await db.pets.bulkAdd(restorableData.pets);
                await db.records.bulkAdd(restorableData.records);
            });
            toast({
                title: "Phục hồi thành công!",
                description: "Dữ liệu của bạn đã được khôi phục. Trang sẽ được tải lại.",
            });
            setTimeout(() => window.location.reload(), 2000);
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Lỗi phục hồi dữ liệu",
                description: error.message || "Không thể ghi dữ liệu từ tệp sao lưu.",
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
                        <CardDescription>Chọn một mốc thời gian. Các bản ghi có ngày bằng hoặc trước mốc này sẽ bị khóa, không thể sửa hoặc xóa.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <DatePicker date={lockDate} setDate={setLockDate} className="w-full" />
                        <div className="flex flex-col sm:flex-row gap-2">
                             <Button onClick={() => setIsLockConfirmOpen(true)} className="w-full" disabled={isReadOnly || !lockDate}>
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
                            <span className='font-bold text-foreground'> {lockDate ? format(lockDate, 'dd/MM/yyyy') : ''}</span>. 
                            Bạn sẽ không thể tạo, sửa hoặc xóa các bản ghi này. Bạn có chắc chắn muốn tiếp tục?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { handleSaveLockdown(); setIsLockConfirmOpen(false); }}>
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
