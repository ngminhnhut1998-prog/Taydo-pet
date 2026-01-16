import Dexie, { type Table } from 'dexie';
import { mockCustomers, mockPets, mockRecords } from './mock-data';

// Type Definitions
export interface Customer {
  id: string;
  ten: string;
  so_dien_thoai: string;
  so_dien_thoai_2?: string;
  dia_chi: string;
  created?: string;
  updated?: string;
}

export interface Pet {
  id: string;
  ten: string;
  loai_thu: string;
  giong: string;
  mau_long?: string;
  tuoi?: number;
  can_nang?: number;
  gioi_tinh?: 'Đực' | 'Cái' | 'Đực thiến' | 'Cái thiến';
  khach_hang_id: string;
  created?: string;
  updated?: string;
}

export interface Appointment {
  ngay: string;
  noi_dung: string;
}

export interface MedicalRecord {
  id: string;
  ngay_kham: string;
  can_nang_kham?: number; // Cân nặng tại thời điểm khám
  trieu_chung?: string;
  chan_doan: string;
  don_thuoc: string;
  ban_kem?: string;
  ghi_chu?: string;
  nhac_hen?: Appointment[];
  chi_phi?: number;
  chi_phi_chan_doan?: number;
  chi_phi_don_thuoc?: number;
  chi_phi_ban_kem?: number;
  thu_id: string;
  created?: string;
  updated?: string;
}

export interface SyncQueueItem {
  id?: number;
  collection: 'customers' | 'pets' | 'records';
  action: 'create' | 'update' | 'delete';
  payload: any;
  tempId?: string;
  timestamp: number;
}

class VetClinicDB extends Dexie {
  customers!: Table<Customer, string>;
  pets!: Table<Pet, string>;
  records!: Table<MedicalRecord, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('VetClinicDB');
    this.version(9).stores({
      customers: 'id, ten, so_dien_thoai, so_dien_thoai_2',
      pets: 'id, ten, khach_hang_id',
      records: 'id, thu_id, ngay_kham, *nhac_hen.ngay',
      syncQueue: '++id, timestamp',
    }).upgrade(tx => {
        console.log("Upgrading database to version 9");
        return tx.table('pets').toCollection().modify(pet => {
            if (pet.mau_long === undefined) {
                pet.mau_long = '';
            }
             if (pet.tuoi === undefined) {
                pet.tuoi = undefined;
            }
        });
    });

    this.version(8).stores({
      customers: 'id, ten, so_dien_thoai, so_dien_thoai_2',
      pets: 'id, ten, khach_hang_id',
      records: 'id, thu_id, ngay_kham, *nhac_hen.ngay',
      syncQueue: '++id, timestamp',
    }).upgrade(tx => {
        console.log("Upgrading database to version 8");
        return tx.table('customers').toCollection().modify(customer => {
            if (customer.so_dien_thoai_2 === undefined) {
                customer.so_dien_thoai_2 = "";
            }
        });
    });

    this.version(7).stores({
      customers: 'id, ten, so_dien_thoai',
      pets: 'id, ten, khach_hang_id',
      records: 'id, thu_id, ngay_kham, *nhac_hen.ngay',
      syncQueue: '++id, timestamp',
    }).upgrade(tx => {
        console.log("Upgrading database to version 7");
        // This is a complex migration. For mock data, it's easier to just re-seed.
        // In a real app, you would carefully transform the data.
        return tx.table('records').toCollection().modify(record => {
            if (record.nhac_hen && typeof record.nhac_hen === 'string') {
                record.nhac_hen = [{ ngay: record.nhac_hen, noi_dung: record.noi_dung_hen || 'Kiểm tra lại' }];
            } else if (!Array.isArray(record.nhac_hen)) {
                record.nhac_hen = [];
            }
            delete record.noi_dung_hen;
        });
    });
    
    this.version(6).stores({
      customers: 'id, ten, so_dien_thoai',
      pets: 'id, ten, khach_hang_id',
      records: 'id, thu_id, ngay_kham, nhac_hen',
      syncQueue: '++id, timestamp',
    }).upgrade(tx => {
        console.log("Upgrading database to version 6");
        return tx.table('records').toCollection().modify(record => {
            if (record.chi_phi_chan_doan === undefined) record.chi_phi_chan_doan = record.chi_phi;
            if (record.chi_phi_don_thuoc === undefined) record.chi_phi_don_thuoc = 0;
            if (record.chi_phi_ban_kem === undefined) record.chi_phi_ban_kem = 0;
        });
    });
      
    this.version(5).stores({
      customers: 'id, ten, so_dien_thoai',
      pets: 'id, ten, khach_hang_id',
      records: 'id, thu_id, ngay_kham, nhac_hen',
      syncQueue: '++id, timestamp',
    }).upgrade(tx => {
        console.log("Upgrading database to version 5");
        return tx.table('records').toCollection().modify(record => {
            if (record.noi_dung_hen === undefined) record.noi_dung_hen = record.chan_doan;
        });
    });

    this.version(4).stores({
      customers: 'id, ten, so_dien_thoai',
      pets: 'id, ten, khach_hang_id',
      records: 'id, thu_id, ngay_kham, nhac_hen',
      syncQueue: '++id, timestamp',
    }).upgrade(tx => {
        console.log("Upgrading database to version 4");
        return tx.table('records').toCollection().modify(record => {
            if (record.can_nang_kham === undefined) record.can_nang_kham = undefined;
            if (record.trieu_chung === undefined) record.trieu_chung = "";
            if (record.ghi_chu === undefined) record.ghi_chu = "";
            if (record.chi_phi === undefined) record.chi_phi = undefined;
        });
    });
    
    this.version(3).stores({
      customers: 'id, ten, so_dien_thoai',
      pets: 'id, ten, khach_hang_id',
      records: 'id, thu_id, nhac_hen',
      syncQueue: '++id, timestamp',
    }).upgrade(tx => {
      // Sample upgrade function. If we were migrating real data, we'd do it here.
      // For mock data, we just clear and re-seed, so this can be minimal.
      console.log("Upgrading database to version 3");
      return tx.table('pets').toCollection().modify(pet => {
        // This is a sample on how you would migrate.
        // On a fresh install, this won't run.
        if (!pet.can_nang) pet.can_nang = undefined;
        if (!pet.gioi_tinh) pet.gioi_tinh = undefined;
      });
    });

     this.version(2).stores({
      customers: 'id, ten, so_dien_thoai',
      pets: 'id, ten, khach_hang_id',
      records: 'id, thu_id, nhac_hen',
      syncQueue: '++id, timestamp',
    });
  }
}

export const db = new VetClinicDB();


export async function clearDatabase() {
    await Promise.all([
        db.customers.clear(),
        db.pets.clear(),
        db.records.clear(),
        db.syncQueue.clear(),
    ]);
}

export async function seedDatabase() {
    try {
        await db.transaction('rw', db.customers, db.pets, db.records, async () => {
            await clearDatabase();
            console.log("Seeding database with mock data...");
            await db.customers.bulkAdd(mockCustomers);
            await db.pets.bulkAdd(mockPets);
            await db.records.bulkAdd(mockRecords);
            console.log("Database seeded successfully!");
        });
    } catch (error) {
        console.error("Failed to seed database:", error);
    }
}
