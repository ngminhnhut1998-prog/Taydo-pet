import PocketBase from 'pocketbase';
import { db, type Customer, type Pet, type MedicalRecord, type SyncQueueItem } from './db';

const POCKETBASE_URL = 'http://127.0.0.1:8090';
export const pb = new PocketBase(POCKETBASE_URL);

// --- SYNC FUNCTIONS ---
export async function syncAllData() {
  console.log('Syncing all data from PocketBase...');
  await Promise.all([syncCustomers(), syncPets(), syncRecords()]);
  console.log('Sync complete.');
}

async function syncCustomers() {
  const records = await pb.collection('customers').getFullList<Customer>({ sort: '-created' });
  await db.customers.bulkPut(records);
}

async function syncPets() {
  const records = await pb.collection('pets').getFullList<Pet>({ sort: '-created' });
  await db.pets.bulkPut(records);
}

async function syncRecords() {
  const records = await pb.collection('records').getFullList<MedicalRecord>({ sort: '-created' });
  await db.records.bulkPut(records);
}

// --- OFFLINE QUEUE ---
async function queueOperation(
  collection: SyncQueueItem['collection'],
  action: SyncQueueItem['action'],
  payload: any,
  tempId?: string
) {
  await db.syncQueue.add({
    collection,
    action,
    payload,
    tempId,
    timestamp: Date.now(),
  });
}

export async function processSyncQueue() {
  const queueItems = await db.syncQueue.orderBy('timestamp').toArray();
  if (queueItems.length === 0) {
    return;
  }
  
  console.log(`Processing ${queueItems.length} items from sync queue...`);
  
  for (const item of queueItems) {
    try {
      if (item.action === 'create') {
        const createdRecord = await pb.collection(item.collection).create(item.payload);
        // If there was a temporary ID, we need to update our local database
        if (item.tempId) {
          if (item.collection === 'customers') {
            const oldRecord = await db.customers.get(item.tempId);
            if (oldRecord) {
              await db.customers.delete(item.tempId);
              await db.customers.add({ ...createdRecord } as Customer);
            }
          }
           // Similar logic for pets and records
        }
      } else if (item.action === 'update') {
        await pb.collection(item.collection).update(item.payload.id, item.payload.data);
      } else if (item.action === 'delete') {
        await pb.collection(item.collection).delete(item.payload.id);
      }
      
      // If successful, remove from queue
      await db.syncQueue.delete(item.id!);
    } catch (error) {
      console.error(`Failed to process queue item ${item.id}:`, error);
      // Stop processing on failure to maintain order
      return; 
    }
  }
  
  console.log('Sync queue processed.');
  // Re-sync all data to ensure consistency
  await syncAllData();
}

// --- CRUD OPERATIONS ---
// Each function follows a pattern:
// 1. Try to perform the operation on PocketBase if online.
// 2. On success, update the local Dexie DB.
// 3. If offline or PB fails, queue the operation and perform an optimistic update on Dexie.

const createCrudOperations = <T extends { id: string }>(collectionName: SyncQueueItem['collection'], table: any) => {
  return {
    async create(data: Omit<T, 'id' | 'created' | 'updated'>): Promise<T> {
      if (navigator.onLine) {
        try {
          const newRecord = await pb.collection(collectionName).create(data);
          await table.put(newRecord);
          return newRecord as T;
        } catch (e) {
          console.error("PB create failed, queuing...", e);
        }
      }
      const tempId = `offline_${Date.now()}`;
      const optimisticRecord = { ...data, id: tempId } as T;
      await table.put(optimisticRecord);
      await queueOperation(collectionName, 'create', data, tempId);
      return optimisticRecord;
    },

    async update(id: string, data: Partial<T>): Promise<T> {
      if (navigator.onLine) {
        try {
          const updatedRecord = await pb.collection(collectionName).update(id, data);
          await table.put(updatedRecord);
          return updatedRecord as T;
        } catch (e) {
           console.error("PB update failed, queuing...", e);
        }
      }
      const updatedOptimistic = await table.update(id, data);
      if(updatedOptimistic) {
        await queueOperation(collectionName, 'update', { id, data });
        return await table.get(id);
      }
      throw new Error("Record not found for optimistic update");
    },
    
    async delete(id: string): Promise<void> {
        if (navigator.onLine) {
            try {
              await pb.collection(collectionName).delete(id);
              await table.delete(id);
              return;
            } catch (e) {
                console.error("PB delete failed, queuing...", e);
            }
        }
        await table.delete(id);
        await queueOperation(collectionName, 'delete', { id });
    }
  };
};

export const customerApi = createCrudOperations<Customer>('customers', db.customers);
export const petApi = createCrudOperations<Pet>('pets', db.pets);
export const recordApi = createCrudOperations<MedicalRecord>('records', db.records);
