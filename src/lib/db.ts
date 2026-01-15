import Dexie, { type Table } from 'dexie';
import { mockCustomers, mockPets, mockRecords } from './mock-data';

// Type Definitions
export interface Customer {
  id: string;
  ten: string;
  so_dien_thoai: string;
  dia_chi: string;
  created?: string;
  updated?: string;
}

export interface Pet {
  id: string;
  ten: string;
  loai_thu: string;
  giong: string;
  can_nang?: number;
  gioi_tinh?: 'Đực' | 'Cái';
  khach_hang_id: string;
  created?: string;
  updated?: string;
}

export interface MedicalRecord {
  id: string;
  ngay_kham: string;
  chan_doan: string;
  don_thuoc: string;
  nhac_hen?: string | null;
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
            if (await db.customers.count() === 0) {
                console.log("Seeding database with mock data...");
                await db.customers.bulkAdd(mockCustomers);
                await db.pets.bulkAdd(mockPets);
                await db.records.bulkAdd(mockRecords);
                console.log("Database seeded successfully!");
            } else {
                console.log("Database already contains data, skipping seed.");
            }
        });
    } catch (error) {
        console.error("Failed to seed database:", error);
    }
}
