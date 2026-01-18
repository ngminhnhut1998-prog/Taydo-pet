import { subDays, addDays, setHours, formatISO, startOfDay, subYears } from 'date-fns';
import type { Customer, Pet, MedicalRecord } from './db';

const now = new Date();

// Valid 15-character IDs
const customer1Id = 'cust1nguyenvanan';
const customer2Id = 'cust2tranthibinh';
const customer3Id = 'cust3lehoangcuon';
const customer4Id = 'cust4phamthidun';

const pet1Id = 'pet1cust1muc1234';
const pet2Id = 'pet2cust1vang123';
const pet3Id = 'pet3cust2lu12345';
const pet4Id = 'pet4cust3mimi123';
const pet5Id = 'pet5cust4rex1234';
const pet6Id = 'pet6cust4bong123';

const record1Id = 'rec1pet1cust1aaaa';
const record1aId = 'rec1apet1cust1bbb';
const record2Id = 'rec2pet2cust1cccc';
const record3Id = 'rec3pet3cust2dddd';
const record4Id = 'rec4pet4cust3eeee';
const record5Id = 'rec5pet5cust4ffff';

export const mockCustomers: Customer[] = [
    { id: customer1Id, ten: 'Nguyễn Văn An', so_dien_thoai: '0901234567', so_dien_thoai_2: '0909888777', dia_chi: '123 Đường Lê Lợi, Quận 1, TP. HCM', created: subDays(now, 10).toISOString() },
    { id: customer2Id, ten: 'Trần Thị Bình', so_dien_thoai: '0912345678', dia_chi: '456 Đường Nguyễn Huệ, Quận 1, TP. HCM', created: subDays(now, 25).toISOString() },
    { id: customer3Id, ten: 'Lê Hoàng Cường', so_dien_thoai: '0987654321', so_dien_thoai_2: '', dia_chi: '789 Đường Pasteur, Quận 3, TP. HCM', created: subDays(now, 5).toISOString() },
    { id: customer4Id, ten: 'Phạm Thị Dung', so_dien_thoai: '0978123456', dia_chi: '101 Đường Hai Bà Trưng, Quận 1, TP. HCM', created: subDays(now, 40).toISOString() },
];

export const mockPets: Pet[] = [
    // Pets for Nguyễn Văn An
    { id: pet1Id, ten: 'Mực', loai_thu: 'Chó', giong: 'Cỏ', khach_hang_id: customer1Id, can_nang: 12.5, gioi_tinh: 'Đực thiến', mau_long: 'Đen', ngay_sinh: subYears(now, 3).toISOString(), created: subDays(now, 10).toISOString() },
    { id: pet2Id, ten: 'Vàng', loai_thu: 'Mèo', giong: 'Ta', khach_hang_id: customer1Id, can_nang: 4.2, gioi_tinh: 'Cái', mau_long: 'Vàng', ngay_sinh: subYears(now, 2).toISOString(), created: subDays(now, 10).toISOString() },
    // Pets for Trần Thị Bình
    { id: pet3Id, ten: 'Lu', loai_thu: 'Chó', giong: 'Poodle', khach_hang_id: customer2Id, can_nang: 6.8, gioi_tinh: 'Đực', mau_long: 'Trắng', ngay_sinh: subYears(now, 1).toISOString(), created: subDays(now, 25).toISOString() },
    // Pets for Lê Hoàng Cường
    { id: pet4Id, ten: 'MiMi', loai_thu: 'Mèo', giong: 'Anh lông ngắn', khach_hang_id: customer3Id, can_nang: 5.1, gioi_tinh: 'Cái thiến', mau_long: 'Xám', ngay_sinh: subYears(now, 4).toISOString(), created: subDays(now, 5).toISOString() },
    // Pets for Phạm Thị Dung
    { id: pet5Id, ten: 'Rex', loai_thu: 'Chó', giong: 'Husky', khach_hang_id: customer4Id, can_nang: 25, gioi_tinh: 'Đực', mau_long: 'Đen trắng', ngay_sinh: subYears(now, 5).toISOString(), created: subDays(now, 40).toISOString() },
    { id: pet6Id, ten: 'Bông', loai_thu: 'Mèo', giong: 'Ba Tư', khach_hang_id: customer4Id, can_nang: 4.8, gioi_tinh: 'Cái', mau_long: 'Trắng', ngay_sinh: subYears(now, 3).toISOString(), created: subDays(now, 40).toISOString() },
];

export const mockRecords: MedicalRecord[] = [
    // Records for Mực (Chó, cust_1)
    { 
        id: record1Id, 
        thu_id: pet1Id, 
        ngay_kham: subDays(now, 8).toISOString(),
        can_nang_kham: 12.4,
        trieu_chung: 'Ngứa, gãi nhiều, da mẩn đỏ',
        chan_doan: 'Viêm da dị ứng', 
        don_thuoc: 'Cetirizine 10mg (1 viên/ngày)\nDầu cá Omega-3 (1 viên/ngày)',
        ban_kem: 'Vòng cổ chống ve',
        ghi_chu: 'Tái khám nếu triệu chứng không giảm',
        nhac_hen: [
            { ngay: startOfDay(now).toISOString(), noi_dung: 'Tái khám da' },
            { ngay: startOfDay(addDays(now, 7)).toISOString(), noi_dung: 'Kiểm tra lại' }
        ],
        chi_phi_chan_doan: 150000,
        chi_phi_don_thuoc: 150000,
        chi_phi_ban_kem: 50000,
        chi_phi: 350000,
    },
    { 
        id: record1aId, 
        thu_id: pet1Id, 
        ngay_kham: subDays(now, 90).toISOString(),
        can_nang_kham: 11.8,
        trieu_chung: 'Khỏe mạnh',
        chan_doan: 'Tiêm phòng dại', 
        don_thuoc: 'Vắc-xin Rabisin',
        ban_kem: 'Sữa tắm',
        ghi_chu: 'Theo dõi phản ứng sau tiêm',
        nhac_hen: [],
        chi_phi_chan_doan: 100000,
        chi_phi_don_thuoc: 50000,
        chi_phi_ban_kem: 50000,
        chi_phi: 200000
    },
    // Records for Vàng (Mèo, cust_1)
    { 
        id: record2Id, 
        thu_id: pet2Id, 
        ngay_kham: subDays(now, 9).toISOString(),
        can_nang_kham: 4.2,
        trieu_chung: 'Lắc đầu, tai có mùi hôi',
        chan_doan: 'Nhiễm trùng tai', 
        don_thuoc: 'Otomax Ear Drops (nhỏ 2 lần/ngày)',
        ban_kem: '',
        ghi_chu: 'Vệ sinh tai hàng ngày',
        nhac_hen: [],
        chi_phi_chan_doan: 150000,
        chi_phi_don_thuoc: 150000,
        chi_phi_ban_kem: 0,
        chi_phi: 300000,
    },
    // Records for Lu (Chó, cust_2)
    { 
        id: record3Id, 
        thu_id: pet3Id, 
        ngay_kham: subDays(now, 20).toISOString(),
        can_nang_kham: 6.8,
        trieu_chung: 'Sức khỏe tốt',
        chan_doan: 'Kiểm tra sức khỏe định kỳ', 
        don_thuoc: 'Tẩy giun Drontal, tiêm phòng 7 bệnh',
        ban_kem: 'Thức ăn hạt Royal Canin',
        ghi_chu: 'Hẹn tái khám tiêm nhắc lại sau 1 năm',
        nhac_hen: [{ ngay: startOfDay(addDays(now, 30)).toISOString(), noi_dung: 'Tiêm nhắc lại vắc-xin' }],
        chi_phi_chan_doan: 150000,
        chi_phi_don_thuoc: 300000,
        chi_phi_ban_kem: 300000,
        chi_phi: 750000,
    },
     // Records for MiMi (Mèo, cust_3)
    { 
        id: record4Id, 
        thu_id: pet4Id, 
        ngay_kham: subDays(now, 4).toISOString(),
        can_nang_kham: 5.1,
        trieu_chung: 'Hắt hơi, chảy nước mũi',
        chan_doan: 'Cảm lạnh', 
        don_thuoc: 'Kháng sinh Amoxicillin, Vitamin C',
        ban_kem: '',
        ghi_chu: 'Giữ ấm, cho ăn thức ăn mềm',
        nhac_hen: [{ ngay: startOfDay(now).toISOString(), noi_dung: 'Tái khám hô hấp' }],
        chi_phi_chan_doan: 100000,
        chi_phi_don_thuoc: 150000,
        chi_phi_ban_kem: 0,
        chi_phi: 250000,
    },
    // Records for Rex (Chó, cust_4)
     { 
        id: record5Id, 
        thu_id: pet5Id, 
        ngay_kham: subDays(now, 1).toISOString(),
        can_nang_kham: 25,
        trieu_chung: 'Nôn, bỏ ăn, tiêu chảy',
        chan_doan: 'Rối loạn tiêu hóa', 
        don_thuoc: 'Men tiêu hóa, thuốc chống nôn',
        ban_kem: 'Pate lon cho chó',
        ghi_chu: 'Theo dõi tình trạng, cho uống nhiều nước',
        nhac_hen: [{ ngay: startOfDay(addDays(now, 1)).toISOString(), noi_dung: 'Tái khám tiêu hóa' }],
        chi_phi_chan_doan: 200000,
        chi_phi_don_thuoc: 150000,
        chi_phi_ban_kem: 100000,
        chi_phi: 450000,
    },
];
