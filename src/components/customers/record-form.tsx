
"use client";

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { format, startOfDay, parse, isValid } from 'date-fns';
import { recordApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { type MedicalRecord } from '@/lib/db';
import { useEffect } from 'react';
import { Input } from '../ui/input';
import { useSettings } from '@/contexts/settings-context';

const appointmentSchema = z.object({
  ngay: z.string().refine((val) => {
    if (!val) return true; // Allow empty string
    const parsedDate = parse(val, 'dd/MM/yyyy', new Date());
    return isValid(parsedDate) && val.length === 10;
  }, { message: 'Ngày không hợp lệ. Dùng định dạng dd/MM/yyyy.'}),
  noi_dung: z.string(),
}).refine(data => !!data.ngay === !!data.noi_dung, {
    message: "Cả ngày và nội dung đều là bắt buộc nếu một trong hai có giá trị.",
    path: ["noi_dung"], // shows error under noi_dung field
});


const formSchema = z.object({
  ngay_kham: z.string().refine((val) => {
    if (!val) return false;
    const parsedDate = parse(val, 'dd/MM/yyyy', new Date());
    return isValid(parsedDate) && val.length === 10;
  }, { message: 'Ngày không hợp lệ. Dùng định dạng dd/MM/yyyy.' }),
  can_nang_kham: z.coerce.number().nonnegative({ message: "Cân nặng không được là số âm."}).optional(),
  trieu_chung: z.string().optional(),
  chan_doan: z.string().optional(),
  chi_phi_chan_doan: z.coerce.number().min(0).optional(),
  don_thuoc: z.string().optional(),
  chi_phi_don_thuoc: z.coerce.number().min(0).optional(),
  ban_kem: z.string().optional(),
  chi_phi_ban_kem: z.coerce.number().min(0).optional(),
  ghi_chu: z.string().optional(),
  nhac_hen: z.array(appointmentSchema).optional(),
  chi_phi: z.coerce.number().min(0, { message: "Chi phí không được là số âm." }).optional(),
});

interface RecordFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  petId: string;
  existingRecord?: MedicalRecord;
}

export function RecordForm({ isOpen, setIsOpen, petId, existingRecord }: RecordFormProps) {
  const { isReadOnly } = useSettings();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ngay_kham: format(new Date(), 'dd/MM/yyyy'),
      can_nang_kham: undefined,
      trieu_chung: "",
      chan_doan: "",
      chi_phi_chan_doan: undefined,
      don_thuoc: "",
      chi_phi_don_thuoc: undefined,
      ban_kem: "",
      chi_phi_ban_kem: undefined,
      ghi_chu: "",
      nhac_hen: [],
      chi_phi: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "nhac_hen",
  });

  const costDiagnosis = form.watch('chi_phi_chan_doan');
  const costPrescription = form.watch('chi_phi_don_thuoc');
  const costProducts = form.watch('chi_phi_ban_kem');

  useEffect(() => {
    const total = (Number(costDiagnosis) || 0) + (Number(costPrescription) || 0) + (Number(costProducts) || 0);
    form.setValue('chi_phi', total);
  }, [costDiagnosis, costPrescription, costProducts, form]);

  useEffect(() => {
    if (isOpen) {
      if (existingRecord) {
        form.reset({
          ...existingRecord,
          ngay_kham: format(new Date(existingRecord.ngay_kham), 'dd/MM/yyyy'),
          nhac_hen: (existingRecord.nhac_hen || []).map(h => ({
            ngay: h.ngay ? format(new Date(h.ngay), "dd/MM/yyyy") : "",
            noi_dung: h.noi_dung,
          })),
          can_nang_kham: existingRecord.can_nang_kham ?? undefined,
          trieu_chung: existingRecord.trieu_chung ?? "",
          chan_doan: existingRecord.chan_doan ?? "",
          don_thuoc: existingRecord.don_thuoc ?? "",
          ban_kem: existingRecord.ban_kem ?? "",
          ghi_chu: existingRecord.ghi_chu ?? "",
          chi_phi_chan_doan: existingRecord.chi_phi_chan_doan ?? undefined,
          chi_phi_don_thuoc: existingRecord.chi_phi_don_thuoc ?? undefined,
          chi_phi_ban_kem: existingRecord.chi_phi_ban_kem ?? undefined,
          chi_phi: existingRecord.chi_phi ?? undefined,
        });
      } else {
          form.reset({
              ngay_kham: format(new Date(), 'dd/MM/yyyy'),
              can_nang_kham: undefined,
              trieu_chung: "",
              chan_doan: "",
              chi_phi_chan_doan: undefined,
              don_thuoc: "",
              chi_phi_don_thuoc: undefined,
              ban_kem: "",
              chi_phi_ban_kem: undefined,
              ghi_chu: "",
              nhac_hen: [],
              chi_phi: undefined,
          });
      }
    }
  }, [existingRecord, form, isOpen]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const parsedDate = parse(values.ngay_kham, 'dd/MM/yyyy', new Date());

    const dataToSave = {
        ...values,
        ngay_kham: parsedDate.toISOString(),
        nhac_hen: (values.nhac_hen || []).filter(h => h.ngay && h.noi_dung).map(h => ({
          ...h,
          ngay: startOfDay(parse(h.ngay, 'dd/MM/yyyy', new Date())).toISOString()
        })),
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

  const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xl">
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
                    <FormItem>
                      <FormLabel>Ngày khám</FormLabel>
                      <FormControl>
                        <Input placeholder="dd/MM/yyyy" {...field} />
                      </FormControl>
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

            <div className="flex items-start gap-4">
                <FormField
                control={form.control}
                name="chan_doan"
                render={({ field }) => (
                    <FormItem className='flex-1'>
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
                    name="chi_phi_chan_doan"
                    render={({ field }) => (
                    <FormItem className='w-36'>
                        <FormLabel>Phí khám</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="150000" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
            <div className="flex items-start gap-4">
                <FormField
                control={form.control}
                name="don_thuoc"
                render={({ field }) => (
                    <FormItem className='flex-1'>
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
                    name="chi_phi_don_thuoc"
                    render={({ field }) => (
                    <FormItem className='w-36'>
                        <FormLabel>Tiền thuốc</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="200000" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

            <div className="flex items-start gap-4">
                <FormField
                control={form.control}
                name="ban_kem"
                render={({ field }) => (
                    <FormItem className='flex-1'>
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
                    name="chi_phi_ban_kem"
                    render={({ field }) => (
                    <FormItem className='w-36'>
                        <FormLabel>Phí bán kèm</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
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
            <div className="space-y-4">
              <FormLabel>Nhắc hẹn</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name={`nhac_hen.${index}.ngay`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input type="text" placeholder="dd/MM/yyyy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`nhac_hen.${index}.noi_dung`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Nội dung hẹn (tái khám, tiêm, ...)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {fields.length < 3 && !isReadOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ ngay: "", noi_dung: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm nhắc hẹn
                </Button>
              )}
              <FormDescription className="text-xs px-1">
                Bạn có thể thêm tối đa 3 lịch hẹn cho mỗi lần khám.
              </FormDescription>
            </div>

            <FormField
                control={form.control}
                name="chi_phi"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Tổng chi phí</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="number" {...field} readOnly className="pr-24 bg-muted/50 font-bold text-base"/>
                        <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>{currencyFormatter.format(field.value || 0)}</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isReadOnly}>Lưu bệnh án</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
