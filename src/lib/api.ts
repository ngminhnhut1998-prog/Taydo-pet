import { db, type Customer, type Pet, type MedicalRecord } from './db';
import { pb } from './pocketbase';

const createApiOperations = <T extends { id: string, created?: string, updated?: string }>(collectionName: 'customers' | 'pets' | 'records') => {
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

export async function syncAllData() {
  console.log('Starting full data sync from PocketBase to local Dexie DB...');
  try {
    const [customers, pets, records] = await Promise.all([
      pb.collection('customers').getFullList<Customer>({ sort: '-created' }),
      pb.collection('pets').getFullList<Pet>({ sort: '-created' }),
      pb.collection('records').getFullList<MedicalRecord>({ sort: '-created' })
    ]);

    await db.transaction('rw', db.customers, db.pets, db.records, async () => {
        // Clear existing local data before syncing
        await db.records.clear();
        await db.pets.clear();
        await db.customers.clear();
        
        // Bulk add new data from PocketBase
        await db.customers.bulkAdd(customers);
        await db.pets.bulkAdd(pets);
        await db.records.bulkAdd(records);
    });

    console.log(`Sync complete: ${customers.length} customers, ${pets.length} pets, ${records.length} records synced.`);
  } catch (error) {
    console.error("Full data sync from PocketBase failed:", error);
    throw error; // Re-throw to be caught by the caller
  }
}

// This function is no longer needed as we perform direct API calls now.
export async function processSyncQueue() {
   console.log('Sync queue processing is disabled in favor of direct API calls with local DB sync.');
  return Promise.resolve();
}
