import Dexie, { type Table } from 'dexie';

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
    this.version(1).stores({
      customers: 'id, ten, so_dien_thoai',
      pets: 'id, ten, khach_hang_id',
      records: 'id, thu_id, nhac_hen',
      syncQueue: '++id, timestamp',
    });
  }
}

export const db = new VetClinicDB();
