import { subDays, addDays, setHours, formatISO } from 'date-fns';
import type { Customer, Pet, MedicalRecord } from './db';

const now = new Date();

export const mockCustomers: Customer[] = [
    { id: 'cust_1', ten: 'Nguyễn Văn An', so_dien_thoai: '0901234567', dia_chi: '123 Đường Lê Lợi, Quận 1, TP. HCM', created: subDays(now, 10).toISOString() },
    { id: 'cust_2', ten: 'Trần Thị Bình', so_dien_thoai: '0912345678', dia_chi: '456 Đường Nguyễn Huệ, Quận 1, TP. HCM', created: subDays(now, 25).toISOString() },
    { id: 'cust_3', ten: 'Lê Hoàng Cường', so_dien_thoai: '0987654321', dia_chi: '789 Đường Pasteur, Quận 3, TP. HCM', created: subDays(now, 5).toISOString() },
    { id: 'cust_4', ten: 'Phạm Thị Dung', so_dien_thoai: '0978123456', dia_chi: '101 Đường Hai Bà Trưng, Quận 1, TP. HCM', created: subDays(now, 40).toISOString() },
];

export const mockPets: Pet[] = [
    // Pets for Nguyễn Văn An
    { id: 'pet_1', ten: 'Mực', loai_thu: 'Chó', giong: 'Cỏ', khach_hang_id: 'cust_1', created: subDays(now, 10).toISOString() },
    { id: 'pet_2', ten: 'Vàng', loai_thu: 'Mèo', giong: 'Ta', khach_hang_id: 'cust_1', created: subDays(now, 10).toISOString() },
    // Pets for Trần Thị Bình
    { id: 'pet_3', ten: 'Lu', loai_thu: 'Chó', giong: 'Poodle', khach_hang_id: 'cust_2', created: subDays(now, 25).toISOString() },
    // Pets for Lê Hoàng Cường
    { id: 'pet_4', ten: 'MiMi', loai_thu: 'Mèo', giong: 'Anh lông ngắn', khach_hang_id: 'cust_3', created: subDays(now, 5).toISOString() },
    // Pets for Phạm Thị Dung
    { id: 'pet_5', ten: 'Rex', loai_thu: 'Chó', giong: 'Husky', khach_hang_id: 'cust_4', created: subDays(now, 40).toISOString() },
    { id: 'pet_6', ten: 'Bông', loai_thu: 'Mèo', giong: 'Ba Tư', khach_hang_id: 'cust_4', created: subDays(now, 40).toISOString() },
];

export const mockRecords: MedicalRecord[] = [
    // Records for Mực (Chó, cust_1)
    { 
        id: 'rec_1', 
        thu_id: 'pet_1', 
        ngay_kham: subDays(now, 8).toISOString(),
        chan_doan: 'Viêm da dị ứng', 
        don_thuoc: 'Cetirizine 10mg, Dầu cá Omega-3',
        nhac_hen: formatISO(setHours(now, 14)), // Hôm nay
    },
    // Records for Vàng (Mèo, cust_1)
    { 
        id: 'rec_2', 
        thu_id: 'pet_2', 
        ngay_kham: subDays(now, 9).toISOString(),
        chan_doan: 'Nhiễm trùng tai', 
        don_thuoc: 'Otomax Ear Drops',
        nhac_hen: null,
    },
    // Records for Lu (Chó, cust_2)
    { 
        id: 'rec_3', 
        thu_id: 'pet_3', 
        ngay_kham: subDays(now, 20).toISOString(),
        chan_doan: 'Kiểm tra sức khỏe định kỳ', 
        don_thuoc: 'Tẩy giun, tiêm phòng dại',
        nhac_hen: addDays(now, 30).toISOString(),
    },
     // Records for MiMi (Mèo, cust_3)
    { 
        id: 'rec_4', 
        thu_id: 'pet_4', 
        ngay_kham: subDays(now, 4).toISOString(),
        chan_doan: 'Cảm lạnh', 
        don_thuoc: 'Kháng sinh Amoxicillin, Vitamin C',
        nhac_hen: formatISO(setHours(now, 10)), // Hôm nay
    },
    // Records for Rex (Chó, cust_4)
     { 
        id: 'rec_5', 
        thu_id: 'pet_5', 
        ngay_kham: subDays(now, 1).toISOString(),
        chan_doan: 'Rối loạn tiêu hóa', 
        don_thuoc: 'Men tiêu hóa, thuốc chống nôn',
        nhac_hen: formatISO(setHours(addDays(now, 1), 9)), // Ngày mai
    },
];
