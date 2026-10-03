import { Timestamp } from 'firebase/firestore';

export type RecordData = Record<string, any>;
export interface LocalWrite {
  collection: string;
  id: string;
  data: RecordData | null;
  /** Local document snapshot when saved on the device; null means a new document. */
  expected: RecordData | null;
  stock?: { quantity: number; profit: number; cost: number; productId: string };
}
export interface PendingOperation {
  id: string;
  label: string;
  createdAt: number;
  state: 'pending' | 'failed';
  error?: string;
  writes: LocalWrite[];
}
export interface AccountStore {
  cache: Record<string, { records: RecordData[]; downloadedAt: number }>;
  queue: PendingOperation[];
}
export const emptyAccount = (): AccountStore => ({ cache: {}, queue: [] });

export function encode(value: any): any {
  if (value instanceof Timestamp) return { __timestamp: [value.seconds, value.nanoseconds] };
  if (value instanceof Date) return encode(Timestamp.fromDate(value));
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => [k, encode(v)]));
  }
  return value;
}
export function decode(value: any): any {
  if (value && typeof value === 'object' && '__timestamp' in value) {
    return Array.isArray(value.__timestamp) ? new Timestamp(value.__timestamp[0], value.__timestamp[1]) : Timestamp.fromMillis(value.__timestamp);
  }
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decode(v)]));
  return value;
}
export function documentData(record: RecordData): RecordData {
  const { id, _sync, ...data } = record;
  return data;
}
export function fingerprint(value: any): string {
  const sorted = (item: any): any => Array.isArray(item) ? item.map(sorted)
    : item && typeof item === 'object' ? Object.fromEntries(Object.keys(item).sort().map(key => [key, sorted(item[key])])) : item;
  return JSON.stringify(sorted(encode(value)));
}

let database: Promise<IDBDatabase> | undefined;
function openDatabase(): Promise<IDBDatabase> {
  return database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('mughal-auto-offline-v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('accounts');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Device storage is unavailable. Enable browser storage before saving offline.'));
  });
}

/** A single IndexedDB read/write transaction prevents lost updates across browser tabs. */
export async function mutateAccount(uid: string, change: (account: AccountStore) => void): Promise<AccountStore> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('accounts', 'readwrite');
    const store = tx.objectStore('accounts');
    const request = store.get(uid);
    let account: AccountStore;
    request.onsuccess = () => {
      account = decode(request.result) ?? emptyAccount();
      try { change(account); store.put(encode(account), uid); }
      catch (error) { tx.abort(); reject(error); }
    };
    tx.oncomplete = () => resolve(account);
    tx.onerror = () => reject(new Error('Could not save on this device. Storage may be full. Your form has not been saved.'));
    tx.onabort = () => reject(new Error('Device save was interrupted. Your form has not been saved.'));
  });
}
export async function readAccount(uid: string): Promise<AccountStore> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction('accounts').objectStore('accounts').get(uid);
    request.onsuccess = () => resolve(decode(request.result) ?? emptyAccount());
    request.onerror = () => reject(request.error);
  });
}
export async function clearAccount(uid: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('accounts', 'readwrite');
    tx.objectStore('accounts').delete(uid);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
