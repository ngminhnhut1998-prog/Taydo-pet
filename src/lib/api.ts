import { db, type Customer, type Pet, type MedicalRecord } from './db';

// --- MOCK API FUNCTIONS ---
// These functions simulate API calls by interacting directly with Dexie.
// In a real application, you would replace these with actual API calls to a backend (like PocketBase).

const createMockApiOperations = <T extends { id: string }>(table: Dexie.Table<T, string>) => {
  return {
    async create(data: Omit<T, 'id' | 'created' | 'updated'>): Promise<T> {
      console.log(`[Mock API] Creating record in ${table.name}`);
      const newId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newRecord = {
        ...data,
        id: newId,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      } as T;
      await db.transaction('rw', table, async () => {
        await table.add(newRecord);
      });
      console.log(`[Mock API] Record created with id: ${newId}`);
      return newRecord;
    },

    async update(id: string, data: Partial<Omit<T, 'id' | 'created'>>): Promise<T> {
      console.log(`[Mock API] Updating record ${id} in ${table.name}`);
      const dataWithUpdated = {
        ...data,
        updated: new Date().toISOString(),
      };
      await table.update(id, dataWithUpdated);
      const updatedRecord = await table.get(id);
      if (!updatedRecord) {
        throw new Error("Record not found after optimistic update");
      }
       console.log(`[Mock API] Record ${id} updated`);
      return updatedRecord;
    },
    
    async delete(id: string): Promise<void> {
      console.log(`[Mock API] Deleting record ${id} from ${table.name}`);
      await table.delete(id);
      console.log(`[Mock API] Record ${id} deleted`);
    },
  };
};

export const customerApi = createMockApiOperations<Customer>(db.customers);
export const petApi = createMockApiOperations<Pet>(db.pets);
export const recordApi = createMockApiOperations<MedicalRecord>(db.records);

// --- SYNC FUNCTIONS (Placeholder) ---
// These functions are no longer needed with mock data but are kept for future re-integration.
export async function syncAllData() {
  console.log('Syncing is disabled in mock mode.');
  return Promise.resolve();
}

export async function processSyncQueue() {
   console.log('Sync queue processing is disabled in mock mode.');
  return Promise.resolve();
}
