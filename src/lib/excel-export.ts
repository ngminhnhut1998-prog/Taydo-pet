import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { db, type Customer, type Pet, type MedicalRecord } from './db';
import { format } from 'date-fns';

interface FlatRecord {
    [key: string]: any;
}

export async function exportDataToExcel() {
    const customers = await db.customers.toArray();
    const pets = await db.pets.toArray();
    const records = await db.records.toArray();

    const customerMap = new Map(customers.map(c => [c.id, c]));
    const petMap = new Map(pets.map(p => [p.id, p]));

    // 1. Gộp dữ liệu thành bảng phẳng
    let flatData: FlatRecord[] = records.map(record => {
        const pet = petMap.get(record.thu_id);
        const customer = pet ? customerMap.get(pet.khach_hang_id) : undefined;
        return {
            customerName: customer?.ten || 'N/A',
            customerPhone: customer?.so_dien_thoai || 'N/A',
            customerAddress: customer?.dia_chi || 'N/A',
            petName: pet?.ten || 'N/A',
            petSpecies: pet?.loai_thu || 'N/A',
            petBreed: pet?.giong || 'N/A',
            recordDate: record.ngay_kham ? format(new Date(record.ngay_kham), 'dd/MM/yyyy') : '',
            recordWeight: record.can_nang_kham,
            symptoms: record.trieu_chung,
            diagnosis: record.chan_doan,
            prescription: record.don_thuoc,
            products: record.ban_kem,
            notes: record.ghi_chu,
            appointments: (record.nhac_hen || []).map(h => h.ngay ? `${format(new Date(h.ngay), 'dd/MM/yyyy')}: ${h.noi_dung}`: '').join('\n'),
            costDiagnosis: record.chi_phi_chan_doan,
            costPrescription: record.chi_phi_don_thuoc,
            costProducts: record.chi_phi_ban_kem,
            totalCost: record.chi_phi,
        };
    });

    // Sắp xếp dữ liệu để chuẩn bị cho việc gộp ô
    flatData.sort((a, b) => {
        if (a.customerName < b.customerName) return -1;
        if (a.customerName > b.customerName) return 1;
        if (a.petName < b.petName) return -1;
        if (a.petName > b.petName) return 1;
        // Chuyển đổi ngày tháng từ dd/MM/yyyy sang yyyy-MM-dd để so sánh
        const dateA = a.recordDate.split('/').reverse().join('-');
        const dateB = b.recordDate.split('/').reverse().join('-');
        return dateA.localeCompare(dateB);
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo khám bệnh');

    const headers = [
        { header: 'Tên Khách Hàng', key: 'customerName', width: 25 },
        { header: 'SĐT Khách Hàng', key: 'customerPhone', width: 15 },
        { header: 'Địa Chỉ', key: 'customerAddress', width: 35 },
        { header: 'Tên Thú Cưng', key: 'petName', width: 20 },
        { header: 'Loài', key: 'petSpecies', width: 15 },
        { header: 'Giống', key: 'petBreed', width: 15 },
        { header: 'Ngày Khám', key: 'recordDate', width: 15 },
        { header: 'Cân Nặng (Khám)', key: 'recordWeight', width: 15 },
        { header: 'Triệu Chứng', key: 'symptoms', width: 30 },
        { header: 'Chẩn Đoán', key: 'diagnosis', width: 30 },
        { header: 'Đơn Thuốc', key: 'prescription', width: 30 },
        { header: 'Bán Kèm', key: 'products', width: 30 },
        { header: 'Ghi Chú', key: 'notes', width: 30 },
        { header: 'Lịch Hẹn', key: 'appointments', width: 30 },
        { header: 'Phí Khám', key: 'costDiagnosis', width: 15, style: { numFmt: '#,##0 "₫"' } },
        { header: 'Tiền Thuốc', key: 'costPrescription', width: 15, style: { numFmt: '#,##0 "₫"' } },
        { header: 'Phí Bán Kèm', key: 'costProducts', width: 15, style: { numFmt: '#,##0 "₫"' } },
        { header: 'Tổng Chi Phí', key: 'totalCost', width: 15, style: { numFmt: '#,##0 "₫"' } },
    ];
    worksheet.columns = headers;

    // 2. Cố định hàng tiêu đề
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Định dạng tiêu đề
    worksheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
    });

    // Thêm dữ liệu vào bảng
    worksheet.addRows(flatData);
    
    // 3. Gộp ô và bôi màu xen kẽ
    let lastCustomerName = '';
    let isOddGroup = true;

    for (let i = 0; i < flatData.length; i++) {
        const rowIdx = i + 2; // Dữ liệu bắt đầu từ dòng 2
        const row = worksheet.getRow(rowIdx);
        
        // Căn lề và wrap text cho tất cả các ô trong dòng
        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        });

        // Xác định nhóm khách hàng để bôi màu xen kẽ
        if (flatData[i].customerName !== lastCustomerName) {
            isOddGroup = !isOddGroup;
            lastCustomerName = flatData[i].customerName;
        }

        if (isOddGroup) {
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFEEF2FF' } // Màu nền sáng
                };
            });
        }
    }

    // Logic gộp ô sau khi đã thêm tất cả các dòng
    let customerMergeStart = 2;
    for (let i = 0; i < flatData.length; i++) {
        const isLastRow = i === flatData.length - 1;
        if (isLastRow || flatData[i].customerName !== flatData[i+1].customerName) {
            if (customerMergeStart < i + 2) {
                worksheet.mergeCells(`A${customerMergeStart}:A${i + 2}`);
                worksheet.mergeCells(`B${customerMergeStart}:B${i + 2}`);
                worksheet.mergeCells(`C${customerMergeStart}:C${i + 2}`);
            }
            let petMergeStart = customerMergeStart;
            for (let j = customerMergeStart - 2; j <= i; j++) {
                 const isLastPetRow = j === i;
                 if (isLastPetRow || flatData[j].petName !== flatData[j+1].petName || flatData[j].customerName !== flatData[j+1].customerName) {
                     if (petMergeStart < j + 2) {
                        worksheet.mergeCells(`D${petMergeStart}:D${j + 2}`);
                        worksheet.mergeCells(`E${petMergeStart}:E${j + 2}`);
                        worksheet.mergeCells(`F${petMergeStart}:F${j + 2}`);
                     }
                     petMergeStart = j + 3;
                 }
            }
            customerMergeStart = i + 3;
        }
    }

    // Lưu file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `PetCare_BaoCaoToanDien_${new Date().toISOString().split('T')[0]}.xlsx`);
}
