"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { recordApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { MedicalRecord } from '@/lib/db';
import { useEffect } from 'react';
import { Input } from '../ui/input';

const formSchema = z.object({
  ngay_kham: z.date({
    required_error: "Ngày khám là bắt buộc.",
  }),
  can_nang_kham: z.coerce.number().positive({ message: "Cân nặng phải là số dương."}).optional(),
  trieu_chung: z.string().optional(),
  chan_doan: z.string().min(2, { message: "Chẩn đoán không được để trống." }),
  don_thuoc: z.string().min(2, { message: "Đơn thuốc không được để trống." }),
  ban_kem: z.string().optional(),
  ghi_chu: z.string().optional(),
  nhac_hen: z.string().optional().nullable(),
  noi_dung_hen: z.string().optional(),
  chi_phi: z.coerce.number().min(0, { message: "Chi phí không được là số âm." }).optional(),
});

interface RecordFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  petId: string;
  existingRecord?: MedicalRecord;
}

export function RecordForm({ isOpen, setIsOpen, petId, existingRecord }: RecordFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ngay_kham: new Date(),
      can_nang_kham: undefined,
      trieu_chung: "",
      chan_doan: "",
      don_thuoc: "",
      ban_kem: "",
      ghi_chu: "",
      nhac_hen: "",
      noi_dung_hen: "",
      chi_phi: undefined,
    },
  });

  useEffect(() => {
    if (existingRecord) {
      form.reset({
        ...existingRecord,
        ngay_kham: new Date(existingRecord.ngay_kham),
        nhac_hen: existingRecord.nhac_hen ? format(new Date(existingRecord.nhac_hen), "yyyy-MM-dd'T'HH:mm") : "",
        noi_dung_hen: existingRecord.noi_dung_hen ?? "",
        can_nang_kham: existingRecord.can_nang_kham ?? undefined,
        trieu_chung: existingRecord.trieu_chung ?? "",
        ban_kem: existingRecord.ban_kem ?? "",
        ghi_chu: existingRecord.ghi_chu ?? "",
        chi_phi: existingRecord.chi_phi ?? undefined,
      });
    } else {
        form.reset({
            ngay_kham: new Date(),
            can_nang_kham: undefined,
            trieu_chung: "",
            chan_doan: "",
            don_thuoc: "",
            ban_kem: "",
            ghi_chu: "",
            nhac_hen: "",
            noi_dung_hen: "",
            chi_phi: undefined,
        });
    }
  }, [existingRecord, form, isOpen]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const dataToSave = {
        ...values,
        ngay_kham: values.ngay_kham.toISOString(),
        nhac_hen: values.nhac_hen ? new Date(values.nhac_hen).toISOString() : null,
    };

    try {
      if (existingRecord) {
        await recordApi.update(existingRecord.id, dataToSave);
        toast({ title: "Thành công", description: "Đã cập nhật bệnh án." });
      } else {
        await recordApi.create({ ...dataToSave, thu_id: petId });
        toast({ title: "Thành công", description: "Đã thêm bệnh án mới." });
      }
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Lỗi", description: "Không thể lưu thông tin. Vui lòng thử lại.", variant: 'destructive' });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existingRecord ? 'Sửa bệnh án' : 'Thêm bệnh án mới'}</DialogTitle>
           <DialogDescription>
            {existingRecord ? 'Cập nhật thông tin cho bệnh án này.' : 'Ghi lại thông tin khám bệnh cho thú cưng.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
             <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="ngay_kham"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Ngày khám</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                            ) : (
                                <span>Chọn một ngày</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="can_nang_kham"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cân nặng (kg)</FormLabel>
                        <FormControl>
                        <Input type="number" step="0.1" placeholder="5.5" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

            <FormField
              control={form.control}
              name="trieu_chung"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Triệu chứng</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Bỏ ăn, nôn, đi ngoài..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="chan_doan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chẩn đoán</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Viêm da dị ứng..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="don_thuoc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đơn thuốc</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Thuốc A: 2 viên/ngày..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ban_kem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sản phẩm/dịch vụ bán kèm</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Vòng cổ chống ve, Sữa tắm..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="ghi_chu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Dặn dò thêm, lưu ý đặc biệt..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="space-y-2">
                <FormLabel>Nhắc hẹn</FormLabel>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="nhac_hen"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input
                                    type="datetime-local"
                                    {...field}
                                    value={field.value || ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="noi_dung_hen"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                            <Input placeholder="Nội dung hẹn (tái khám, tiêm, ...)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <FormDescription className="text-xs px-1">Để trống nếu không có lịch hẹn.</FormDescription>
            </div>

            <FormField
                control={form.control}
                name="chi_phi"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Chi phí (VND)</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="350000" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
              <Button type="submit">Lưu bệnh án</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
