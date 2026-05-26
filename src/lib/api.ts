import { db, type Customer, type Pet, type MedicalRecord, type PetshopSale } from './db';
import { pb } from './pocketbase';

const createApiOperations = <T extends { id: string, created?: string, updated?: string }>(collectionName: 'customers' | 'pets' | 'records' | 'petshopSales') => {
  const table = db[collectionName];
  
  return {
    async create(data: Omit<T, 'id' | 'created' | 'updated'>): Promise<T> {
      console.log(`[API] Creating record in PocketBase collection: ${collectionName}`);
      const newRecord = await pb.collection(collectionName).create(data);
      console.log(`[API] Record ${newRecord.id} created in PocketBase. Syncing to local DB.`);
      await table.add(newRecord as any);
      return newRecord as T;
    },

    async update(id: string, data: Partial<Omit<T, 'id' | 'created'>>): Promise<T> {
      console.log(`[API] Updating record ${id} in PocketBase collection: ${collectionName}`);
      const updatedRecord = await pb.collection(collectionName).update(id, data);
      console.log(`[API] Record ${id} updated in PocketBase. Syncing to local DB.`);
      await table.update(id, data);
      return updatedRecord as T;
    },
    
    async delete(id: string): Promise<void> {
      console.log(`[API] Deleting record ${id} from PocketBase collection: ${collectionName}`);
      await pb.collection(collectionName).delete(id);
      console.log(`[API] Record ${id} deleted from PocketBase. Syncing to local DB.`);
      await table.delete(id);
    },
  };
};

export const customerApi = createApiOperations<Customer>('customers');
export const petApi = createApiOperations<Pet>('pets');
export const recordApi = createApiOperations<MedicalRecord>('records');
export const petshopSaleApi = createApiOperations<PetshopSale>('petshopSales');

// --- ĐOẠN TAO THÊM MỚI VÀO ĐÂY ---
async function pushLocalToCloud() {
  console.log("⚡ Đang đẩy dữ liệu từ máy lên Cloud để giữ bản Restore...");
  const collections = ['customers', 'pets', 'records', 'petshopSales'] as const;

  for (const col of collections) {
    const localData = await db[col].toArray();
    // Đẩy từng bản ghi lên PocketBase
    await Promise.all(localData.map(async (item: any) => {
      try {
        await pb.collection(col).update(item.id, item);
      } catch (err: any) {
        if (err.status === 404) {
          await pb.collection(col).create(item);
        }
      }
    }));
  }
}
// --------------------------------

export async function syncAllData() {
  // --- ĐOẠN SỬA LOGIC Ở ĐÂY ---
  const isJustRestored = typeof window !== 'undefined' && localStorage.getItem('JUST_RESTORED');

  if (isJustRestored) {
    try {
      await pushLocalToCloud();
      localStorage.removeItem('JUST_RESTORED');
      console.log("✅ Restore & Sync thành công!");
      return; // Dừng lại ở đây, không chạy xuống phần clear DB bên dưới nữa
    } catch (error) {
      console.error("Lỗi khi đẩy data sau restore:", error);
    }
  }
  // ----------------------------

  console.log('Starting full data sync from PocketBase to local Dexie DB...');
  try {
    const [customers, pets, records, petshopSales] = await Promise.all([
      pb.collection('customers').getFullList<Customer>({ sort: '-created' }),
      pb.collection('pets').getFullList<Pet>({ sort: '-created' }),
      pb.collection('records').getFullList<MedicalRecord>({ sort: '-created' }),
      pb.collection('petshopSales').getFullList<PetshopSale>({ sort: '-created' })
    ]);

    await db.transaction('rw', db.customers, db.pets, db.records, db.petshopSales, async () => {
        await db.records.clear();
        await db.pets.clear();
        await db.customers.clear();
        await db.petshopSales.clear();
        
        await db.customers.bulkAdd(customers);
        await db.pets.bulkAdd(pets);
        await db.records.bulkAdd(records);
        await db.petshopSales.bulkAdd(petshopSales);
    });

    console.log(`Sync complete: ${customers.length} customers, ${pets.length} pets, ${records.length} records, ${petshopSales.length} petshop sales synced.`);
  } catch (error) {
    console.error("Full data sync from PocketBase failed:", error);
    throw error;
  }
}

export async function processSyncQueue() {
   console.log('Sync queue processing is disabled in favor of direct API calls with local DB sync.');
  return Promise.resolve();
}
