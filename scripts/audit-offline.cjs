// Isolated regression audit. Runs the real service methods with in-memory I/O,
// never authenticates or writes to a live Firebase project.
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { Timestamp } = require('firebase/firestore');
const records = new Map();
const auth = { currentUser: { uid: 'audit-user' } };
const core = {
  Injectable: () => value => value,
  inject: token => token === 'Auth' ? auth : {},
  signal: initial => {
    let value = initial;
    const read = () => value;
    read.set = next => { value = next; };
    read.update = update => { value = update(value); };
    return read;
  },
  computed: fn => fn,
};
const firestore = {
  Timestamp,
  doc: (_db, ...parts) => parts.join('/'),
  collection: (_db, name) => name,
  onSnapshot: () => () => {},
  runTransaction: async (_db, callback) => {
    const writes = [];
    const result = await callback({
      get: async path => ({ exists: () => records.has(path), data: () => records.get(path) }),
      set: (path, data) => writes.push(() => records.set(path, data)),
      delete: path => writes.push(() => records.delete(path)),
    });
    writes.forEach(write => write());
    return result;
  },
};
let store;
const context = vm.createContext({
  console, setTimeout, clearTimeout, queueMicrotask,
  navigator: { onLine: true },
  window: { addEventListener() {}, dispatchEvent() {} },
  document: { addEventListener() {} },
  indexedDB: { open() { throw new Error('IndexedDB unavailable'); } },
  location: { replace() {} },
  require: name => ({
    '@angular/core': core, '@angular/fire/auth': { Auth: 'Auth' },
    '@angular/fire/firestore': { Firestore: 'Firestore' },
    'firebase/auth': { onAuthStateChanged: () => () => {} },
    'firebase/firestore': firestore, './offline-store': store,
  }[name] ?? require(name)),
});
function load(file) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true },
  }).outputText;
  context.module = { exports: {} }; context.exports = context.module.exports;
  vm.runInContext('(function(exports, require, module) {\n' + output + '\n})(exports, require, module);', context, { filename: file });
  return context.module.exports;
}
store = load('src/app/core/services/offline-store.ts');
const { OfflineDataService } = load('src/app/core/services/offline-data.service.ts');
function service() {
  const value = new OfflineDataService();
  value.ready = Promise.resolve(); value.uid = 'audit-user';
  return value;
}
const cases = [
  ['Pending sales should be subtracted from current server stock', async () => {
    const value = service();
    value.account = {
      cache: { lots: { records: [{ id: 'lot-1', quantityRemaining: 6 }], downloadedAt: Date.now() } },
      queue: [{ id: 'sale-1', state: 'pending', writes: [{ collection: 'lots', id: 'lot-1',
        expected: { quantityRemaining: 10 }, data: { quantityRemaining: 7 },
        stock: { quantity: 3, profit: 30, cost: 10, productId: 'part-1' },
      }] }],
    };
    const actual = value.projected('lots')[0].quantityRemaining;
    assert.equal(actual, 3, 'Expected 6 server units minus 3 pending; got ' + actual);
  }],
  ['An old edit form should not silently overwrite a newer price', async () => {
    const value = service();
    const current = { name: 'Bumper', currentSalePrice: 150 };
    records.set('products/part-1', current);
    value.read = async () => [{ id: 'part-1', ...current }];
    let writes;
    value.enqueue = async (_label, payload) => { writes = payload; };
    await value.write('products', 'part-1', { name: 'Front bumper', currentSalePrice: 100 });
    try { await value.commit('audit-user', { id: 'edit-1', writes }); } catch {}
    assert.equal(records.get('products/part-1').currentSalePrice, 150, 'A stale form reverted the server price from 150 to 100 without a conflict.');
  }],
  ['Unavailable device storage should not prevent Firebase sign-out', async () => {
    // AuthService awaits this prerequisite before invoking Firebase signOut.
    await service().clearForSignOut();
  }],
  ['Retrying the same successful operation does not duplicate a record', async () => {
    const value = service();
    const operation = { id: 'create-1', writes: [{ collection: 'products', id: 'part-1', expected: null, data: { name: 'Bumper' } }] };
    await value.commit('audit-user', operation);
    await value.commit('audit-user', operation);
    assert.equal(records.size, 2);
    assert.equal(records.get('products/part-1').name, 'Bumper');
  }],
];
(async () => {
  let failed = 0;
  for (const [name, run] of cases) {
    records.clear();
    try { await run(); console.log('PASS: ' + name); }
    catch (error) { failed++; console.log('FAIL: ' + name + '\n  ' + error.message); }
  }
  console.log('\n' + (cases.length - failed) + ' passed; ' + failed + ' failed. Backend and browser I/O are mocked.');
  process.exitCode = failed ? 1 : 0;
})();
