"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { customerApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/lib/db';
import { useEffect } from 'react';
import { useSettings } from '@/contexts/settings-context';

const formSchema = z.object({
  ten: z.string().min(2, { message: "Tên phải có ít nhất 2 ký tự." }),
  so_dien_thoai: z.string().regex(/^\d{10,11}$/, { message: "Số điện thoại không hợp lệ." }),
  dia_chi: z.string().min(5, { message: "Địa chỉ phải có ít nhất 5 ký tự." }),
});

interface CustomerFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  existingCustomer?: Customer;
  onSaveSuccess?: (customer: Customer) => void;
}

export function CustomerForm({ isOpen, setIsOpen, existingCustomer, onSaveSuccess }: CustomerFormProps) {
  const { isReadOnly } = useSettings();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ten: "",
      so_dien_thoai: "",
      dia_chi: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (existingCustomer) {
        form.reset(existingCustomer);
      } else {
        form.reset({ ten: "", so_dien_thoai: "", dia_chi: "" });
      }
    }
  }, [existingCustomer, form, isOpen]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      let savedCustomer: Customer;
      if (existingCustomer) {
        savedCustomer = await customerApi.update(existingCustomer.id, values);
        toast({ title: "Thành công", description: "Đã cập nhật thông tin khách hàng." });
      } else {
        savedCustomer = await customerApi.create(values);
        toast({ title: "Thành công", description: "Đã thêm khách hàng mới." });
      }
      setIsOpen(false);
      onSaveSuccess?.(savedCustomer);
    } catch (error) {
      console.error(error);
      toast({ title: "Lỗi", description: "Không thể lưu thông tin. Vui lòng thử lại.", variant: 'destructive' });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{existingCustomer ? 'Sửa thông tin khách hàng' : 'Thêm khách hàng mới'}</DialogTitle>
          <DialogDescription>
            {existingCustomer ? 'Cập nhật thông tin chi tiết cho khách hàng này.' : 'Điền thông tin để thêm một khách hàng mới vào hệ thống.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="ten"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên khách hàng</FormLabel>
                  <FormControl>
                    <Input placeholder="Nguyễn Văn A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="so_dien_thoai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input placeholder="0901234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dia_chi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Đường ABC, Quận 1, TP. HCM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
