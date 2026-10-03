import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, runTransaction, Timestamp } from 'firebase/firestore';
import { BehaviorSubject, Observable, filter, firstValueFrom, map, timeout } from 'rxjs';
import {
  AccountStore, LocalWrite, PendingOperation, RecordData, clearAccount, decode, documentData,
  emptyAccount, encode, fingerprint, mutateAccount, readAccount,
} from './offline-store';

@Injectable({ providedIn: 'root' })
export class OfflineDataService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private uid: string | null = null;
  private generation = 0;
  private account = emptyAccount();
  private subjects = new Map<string, BehaviorSubject<RecordData[] | null>>();
  private listeners = new Map<string, () => void>();
  private channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('mughal-auto-data');
  private flushing = false;
  private stopping = false;
  private resolveInitial!: () => void;
  private ready = new Promise<void>(resolve => { this.resolveInitial = resolve; });
  private retryDelay = 2000;
  private retryTimer?: ReturnType<typeof setTimeout>;

  online = signal(navigator.onLine);
  syncing = signal(false);
  operations = signal<PendingOperation[]>([]);
  pending = computed(() => this.operations().filter(op => op.state === 'pending').length);
  failed = computed(() => this.operations().filter(op => op.state === 'failed').length);
  notices = signal<Record<string, string>>({});
  message = signal('');
  revision = signal(0);
  downloading = signal<string[]>([]);
  downloads = signal<{ collection: string; downloadedAt: number }[]>([]);

  constructor() {
    onAuthStateChanged(this.auth, user => {
      this.ready = this.switchAccount(user?.uid ?? null);
      void this.ready.then(() => this.resolveInitial(), error => { this.message.set(error.message); this.resolveInitial(); });
    });
    window.addEventListener('online', () => { this.online.set(true); this.retryDelay = 2000; void this.flush(); });
    window.addEventListener('offline', () => { this.online.set(false); this.publish(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) void this.flush(); });
    this.channel?.addEventListener('message', event => {
      if (event.data?.uid !== this.uid) return;
      if (event.data.type === 'clear') {
        this.resetMemory();
        this.stopping = true;
        window.dispatchEvent(new Event('mughal-account-cleared'));
        location.replace('/login');
      } else {
        void this.reload().then(() => this.flush()).catch(error => this.message.set(error.message));
      }
    });
  }

  private resetMemory() {
    this.generation++;
    this.listeners.forEach(stop => stop());
    this.listeners.clear();
    this.account = emptyAccount();
    this.operations.set([]);
    this.subjects.forEach(subject => { subject.next([]); subject.next(null); });
    this.notices.set({});
    this.downloading.set([]);
    this.downloads.set([]);
    this.message.set('');
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  private async switchAccount(uid: string | null) {
    const oldUid = this.uid;
    this.resetMemory();
    this.uid = uid;
    this.stopping = false;
    const generation = this.generation;
    if (oldUid && oldUid !== uid) {
      await clearAccount(oldUid);
      this.channel?.postMessage({ uid: oldUid, type: 'clear' });
      window.dispatchEvent(new Event('mughal-account-cleared'));
      location.replace(uid ? '/dashboard' : '/login');
      return;
    }
    if (!uid) { this.subjects.forEach((_, name) => this.listen(name)); return; }
    try {
      const account = await readAccount(uid);
      if (generation !== this.generation) return;
      this.account = account;
    } catch {
      this.message.set('Device storage is unavailable. Online viewing is available; offline saves are disabled.');
    }
    if (generation !== this.generation) return;
    this.publish();
    this.subjects.forEach((_, name) => this.listen(name));
    // Wait until the auth callback's ready promise has resolved.
    queueMicrotask(() => { void this.flush(); });
  }

  watch<T>(name: string): Observable<T[]> {
    if (!this.subjects.has(name)) this.subjects.set(name, new BehaviorSubject<RecordData[] | null>(null));
    void this.ready.then(() => { this.publishCollection(name); this.listen(name); }).catch(error => this.message.set(error.message));
    return this.subjects.get(name)!.pipe(filter((rows): rows is RecordData[] => rows !== null), map(rows => rows as T[]));
  }

  async read<T>(name: string): Promise<T[]> {
    await this.ready;
    if (!this.uid) throw new Error('Sign in to access saved data.');
    if (this.notices()[name]?.startsWith('Cannot access')) throw new Error(this.notices()[name]);
    if (!this.online() && !this.account.cache[name]) {
      throw new Error(`${name}: data is unavailable offline. Open this page online to download it first.`);
    }
    return firstValueFrom(this.watch<T>(name).pipe(timeout(15000)));
  }

  private listen(name: string) {
    if (this.listeners.has(name) || this.stopping) return;
    if (!this.uid && !['products', 'categories', 'models', 'types', 'vehicles', 'gallery'].includes(name)) return;
    const uid = this.uid;
    const generation = this.generation;
    const stop = onSnapshot(collection(this.firestore, name), { includeMetadataChanges: true }, snapshot => {
      if (generation !== this.generation || snapshot.metadata.fromCache) return;
      const entry = { records: snapshot.docs.map(item => ({ ...item.data(), id: item.id })), downloadedAt: Date.now() };
      this.downloading.update(names => names.filter(item => item !== name));
      // Public portfolio data follows server permissions and never shares an account cache.
      if (!uid) { this.subjects.get(name)?.next(entry.records); return; }
      void this.persist(account => { account.cache[name] = entry; }, uid, generation).catch(() => {
        if (generation !== this.generation) return;
        this.account.cache[name] = entry;
        this.publish();
        this.message.set('Data loaded online, but could not be saved for offline use. Check available device storage.');
      });
      this.notices.update(value => { const next = { ...value }; delete next[name]; return next; });
    }, error => {
      if (generation !== this.generation) return;
      this.downloading.update(names => names.filter(item => item !== name));
      this.notices.update(value => ({ ...value, [name]: `Cannot access ${name}: ${error.code}.` }));
      if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
        delete this.account.cache[name];
        this.subjects.get(name)?.next([]);
        if (uid) void this.persist(account => { delete account.cache[name]; }, uid, generation).catch(() => {});
      }
    });
    this.listeners.set(name, stop);
    if (this.online() && !this.account.cache[name]) this.downloading.update(names => [...new Set([...names, name])]);
  }

  private projected(name: string): RecordData[] {
    const records = new Map((this.account.cache[name]?.records ?? []).map(record => [record['id'], { ...record }]));
    for (const operation of this.account.queue) {
      // Later operations may depend on a failed operation. Keep them unapplied until resolved.
      if (operation.state === 'failed') break;
      for (const write of operation.writes.filter(write => write.collection === name)) {
        if (write.data === null) records.delete(write.id);
        else records.set(write.id, { ...write.data, id: write.id, _sync: 'pending' });
      }
    }
    return [...records.values()];
  }

  private publishCollection(name: string) {
    if (this.notices()[name]?.startsWith('Cannot access')) { this.subjects.get(name)?.next([]); return; }
    if (this.account.cache[name] || this.account.queue.some(op => op.writes.some(write => write.collection === name))) {
      this.subjects.get(name)?.next(this.projected(name));
    } else if (!this.online()) {
      this.notices.update(value => ({ ...value, [name]: `${name} is unavailable offline. Download it while online first.` }));
      this.subjects.get(name)?.next([]);
    }
  }
  private publish() {
    this.operations.set([...this.account.queue]);
    this.downloads.set(Object.entries(this.account.cache).map(([collection, entry]) => ({ collection, downloadedAt: entry.downloadedAt })));
    this.subjects.forEach((_, name) => this.publishCollection(name));
    this.revision.update(value => value + 1);
  }
  private async reload() {
    const uid = this.uid;
    const generation = this.generation;
    if (!uid || this.stopping) return;
    const account = await readAccount(uid);
    if (generation !== this.generation) return;
    this.account = account;
    this.publish();
  }
  private async persist(change: (account: AccountStore) => void, uid = this.uid, generation = this.generation) {
    if (!uid || this.stopping || uid !== this.uid) throw new Error('Sign in before saving.');
    const account = await mutateAccount(uid, value => {
      if (generation !== this.generation || this.stopping) throw new Error('Account changed. Save cancelled.');
      change(value);
    });
    if (generation !== this.generation) return;
    this.account = account;
    this.publish();
    this.channel?.postMessage({ uid, type: 'changed' });
  }

  newId() { return crypto.randomUUID(); }

  async write(name: string, id: string, data: RecordData | null, create = false): Promise<void> {
    await this.ready;
    const existing = create ? undefined : (await this.read<RecordData>(name)).find(record => record['id'] === id);
    if (!create && !existing) throw new Error('This record is not available. Download it before editing.');
    const expected = existing ? documentData(existing) : null;
    await this.enqueue(`${create ? 'Add' : data ? 'Update' : 'Delete'} ${name}`, [{
      collection: name, id, expected, data: data ? { ...expected, ...documentData(data) } : null,
    }]);
  }

  async enqueue(label: string, writes: LocalWrite[]): Promise<void> {
    await this.ready;
    if (!this.uid || this.auth.currentUser?.uid !== this.uid) throw new Error('Sign in before saving.');
    if (!writes.length || writes.length > 450) throw new Error('Use between 1 and 450 records per save.');
    const operation: PendingOperation = decode(encode({ id: this.newId(), label, createdAt: Date.now(), state: 'pending', writes }));
    try {
      await this.persist(account => { account.queue.push(operation); });
    } catch (error: any) {
      this.message.set(error.message ?? 'Could not save on this device. Keep your form open and try again.');
      throw error;
    }
    this.message.set('Saved on this device. Pending server sync.');
    void navigator.storage?.persist?.().catch(() => false);
    void this.flush();
  }

  async retry(id: string) {
    await this.persist(account => {
      const operation = account.queue.find(op => op.id === id);
      if (operation) { operation.state = 'pending'; delete operation.error; }
    });
    void this.flush();
  }
  async discard(id: string) {
    await this.persist(account => { account.queue = account.queue.filter(op => op.id !== id); });
    void this.flush();
  }

  refreshConnection() {
    this.listeners.forEach(stop => stop());
    this.listeners.clear();
    this.notices.set({});
    this.subjects.forEach((_, name) => this.listen(name));
    void this.flush();
  }

  async flush(): Promise<void> {
    await this.ready;
    if (this.flushing || !this.online() || !this.uid || this.stopping) return;
    this.flushing = true;
    this.syncing.set(true);
    const uid = this.uid;
    const generation = this.generation;
    try {
      await this.reload();
      while (this.account.queue.length && this.online() && generation === this.generation && !this.stopping) {
        const operation = this.account.queue[0];
        if (operation.state === 'failed') break;
        try {
          const applied = await this.commit(uid, operation);
          if (generation !== this.generation || this.stopping) break;
          await this.persist(account => {
            for (const write of applied) {
              const cached = account.cache[write.collection];
              // Do not mark a partial collection as fully downloaded.
              if (!cached) continue;
              cached.records = cached.records.filter(record => record['id'] !== write.id);
              if (write.data) cached.records.push({ ...write.data, id: write.id });
            }
            account.queue = account.queue.filter(op => op.id !== operation.id);
          });
          this.retryDelay = 2000;
          this.message.set('Changes synced to server.');
        } catch (error: any) {
          if (generation !== this.generation || this.stopping) break;
          const code = String(error.code ?? '');
          if (['unavailable', 'deadline-exceeded', 'aborted', 'resource-exhausted', 'internal'].some(value => code.includes(value)) || !this.online()) {
            this.message.set('Saved on this device. Waiting for a server connection to sync.');
            this.retryTimer = setTimeout(() => { void this.flush(); }, this.retryDelay);
            this.retryDelay = Math.min(this.retryDelay * 2, 60000);
            break;
          }
          await this.persist(account => {
            const op = account.queue.find(item => item.id === operation.id);
            if (op) { op.state = 'failed'; op.error = error.message ?? 'Sync failed. Review this change.'; }
          });
          this.message.set('Sync needs attention. Later changes are paused to protect dependent records.');
          break;
        }
      }
    } catch (error: any) {
      this.message.set(error.message ?? 'Unable to access device storage.');
    } finally {
      this.flushing = false;
      this.syncing.set(false);
    }
  }

  private commit(uid: string, operation: PendingOperation): Promise<LocalWrite[]> {
    return runTransaction(this.firestore, async tx => {
      if (this.auth.currentUser?.uid !== uid || this.stopping) throw new Error('Account changed. Sync stopped.');
      const receiptRef = doc(this.firestore, 'offlineOperations', uid, 'receipts', operation.id);
      const receipt = await tx.get(receiptRef);
      const snapshots = await Promise.all(operation.writes.map(write => tx.get(doc(this.firestore, write.collection, write.id))));
      if (receipt.exists()) {
        return operation.writes.map((write, index) => ({ ...write, data: snapshots[index].exists() ? snapshots[index].data()! : null }));
      }
      const applied = operation.writes.map((write, index) => {
        const snapshot = snapshots[index];
        const current = snapshot.exists() ? snapshot.data()! : null;
        if (write.stock) {
          const stock = write.stock;
          if (!current || current['purchasePrice'] !== stock.cost || current['productId'] !== stock.productId) {
            throw new Error('Stock conflict: the lot or its cost changed. Discard this sale and create it again using current stock.');
          }
          if (current['quantityRemaining'] < stock.quantity) throw new Error('Insufficient stock at sync time. Discard this sale and reduce its quantity.');
          return { ...write, data: { ...current,
            quantityRemaining: current['quantityRemaining'] - stock.quantity,
            quantitySold: (current['quantitySold'] ?? 0) + stock.quantity,
            totalProfit: (current['totalProfit'] ?? 0) + stock.profit,
          } };
        }
        if (fingerprint(current) !== fingerprint(write.expected)) {
          throw new Error(`Conflict in ${write.collection}: the server record changed. Review the saved details, discard this change, and edit the latest record.`);
        }
        return write;
      });
      for (const write of applied) {
        const ref = doc(this.firestore, write.collection, write.id);
        if (write.data === null) tx.delete(ref); else tx.set(ref, write.data);
      }
      tx.set(receiptRef, { uid, operationId: operation.id, createdAt: Timestamp.now() });
      return applied;
    });
  }

  /** Called before Firebase sign-out; never leave a sensitive account cache behind. */
  async clearForSignOut() {
    const uid = this.uid;
    this.stopping = true;
    this.resetMemory();
    if (uid) {
      await clearAccount(uid);
      this.channel?.postMessage({ uid, type: 'clear' });
    }
  }
}
