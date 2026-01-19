
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { petApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { Pet } from '@/lib/db';
import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useSettings } from '@/contexts/settings-context';
import { format, isValid, parse } from 'date-fns';

const formSchema = z.object({
  ten: z.string().min(1, { message: "Tên không được để trống." }),
  loai_thu: z.string().min(2, { message: "Loài thú không được để trống." }),
  giong: z.string().min(2, { message: "Giống không được để trống." }),
  mau_long: z.string().optional(),
  ngay_sinh: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    const parsedDate = parse(val, 'dd/MM/yyyy', new Date());
    return isValid(parsedDate) && val.length === 10;
  }, { message: 'Ngày sinh không hợp lệ. Dùng định dạng dd/MM/yyyy.'}),
  can_nang: z.coerce.number().nonnegative({ message: "Cân nặng không được là số âm."}).optional(),
  gioi_tinh: z.enum(['Đực', 'Cái', 'Đực thiến', 'Cái thiến']).optional(),
});

interface PetFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  customerId: string;
  existingPet?: Pet;
}

export function PetForm({ isOpen, setIsOpen, customerId, existingPet }: PetFormProps) {
  const { isReadOnly } = useSettings();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ten: "",
      loai_thu: "",
      giong: "",
      mau_long: "",
      ngay_sinh: "",
      can_nang: undefined,
      gioi_tinh: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (existingPet) {
        form.reset({
          ...existingPet,
          ngay_sinh: existingPet.ngay_sinh ? format(new Date(existingPet.ngay_sinh), "dd/MM/yyyy") : "",
          mau_long: existingPet.mau_long ?? "",
        });
      } else {
        form.reset({ ten: "", loai_thu: "", giong: "", mau_long: "", ngay_sinh: "", can_nang: undefined, gioi_tinh: undefined });
      }
    }
  }, [existingPet, form, isOpen]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const dataToSave = {
        ...values,
        ngay_sinh: values.ngay_sinh ? parse(values.ngay_sinh, 'dd/MM/yyyy', new Date()).toISOString() : undefined,
    };
    try {
      if (existingPet) {
        await petApi.update(existingPet.id, dataToSave);
        toast({ title: "Thành công", description: "Đã cập nhật thông tin thú cưng." });
      } else {
        await petApi.create({ ...dataToSave, khach_hang_id: customerId });
        toast({ title: "Thành công", description: "Đã thêm thú cưng mới." });
      }
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Lỗi", description: "Không thể lưu thông tin. Vui lòng thử lại.", variant: 'destructive' });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existingPet ? 'Sửa thông tin thú cưng' : 'Thêm thú cưng mới'}</DialogTitle>
           <DialogDescription>
            {existingPet ? 'Cập nhật thông tin cho thú cưng này.' : 'Điền thông tin để thêm một thú cưng mới.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="ten"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên thú cưng</FormLabel>
                  <FormControl>
                    <Input placeholder="Mực" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="loai_thu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loài thú</FormLabel>
                    <FormControl>
                      <Input placeholder="Chó" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="giong"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giống</FormLabel>
                    <FormControl>
                      <Input placeholder="Cỏ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="mau_long"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Màu lông</FormLabel>
                        <FormControl>
                        <Input placeholder="Vàng" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="ngay_sinh"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ngày sinh</FormLabel>
                             <FormControl>
                                <Input placeholder="dd/MM/yyyy" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="can_nang"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cân nặng (kg)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="5.5" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="gioi_tinh"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Giới tính</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn giới tính" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Đực">Đực</SelectItem>
                                    <SelectItem value="Cái">Cái</SelectItem>
                                    <SelectItem value="Đực thiến">Đực thiến</SelectItem>
                                    <SelectItem value="Cái thiến">Cái thiến</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isReadOnly}>Lưu thông tin</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
