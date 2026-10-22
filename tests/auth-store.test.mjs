import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const runtimeRequire = createRequire(import.meta.url);
function loadStore(fetch) {
  const source = fs.readFileSync('src/stores/auth-store.ts', 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: runtimeRequire, fetch, BroadcastChannel: undefined });
  return exports.useAuthStore;
}
test('auth starts uninitialized and stores no access token', () => {
  const state = loadStore(() => {}).getState();
  assert.equal(state.user, null);
  assert.equal(state.isInitialized, false);
  assert.equal(state.isAuthenticated, false);
  assert(!('accessToken' in state));
});
test('concurrent initialization calls share a single /me request', async () => {
  let calls = 0, finish;
  const response = new Promise(resolve => { finish = resolve; });
  const store = loadStore(() => { calls++; return response; });
  const first = store.getState().fetchMe();
  const second = store.getState().fetchMe();
  assert.equal(calls, 1);
  finish({ ok: true, json: async () => ({ id: 'verified-user', roleName: 'User' }) });
  await Promise.all([first, second]);
  assert.equal(store.getState().user.id, 'verified-user');
  assert.equal(store.getState().isInitialized, true);
});
test('an in-flight /me response cannot restore state after logout', async () => {
  let finish;
  const store = loadStore((url) => url === '/api/auth/logout' ? Promise.resolve({ ok: true }) : new Promise(resolve => { finish = resolve; }));
  const loading = store.getState().fetchMe();
  await store.getState().logout();
  finish({ ok: true, json: async () => ({ id: 'stale-user', roleName: 'Admin' }) });
  await loading;
  assert.equal(store.getState().user, null);
  assert.equal(store.getState().isAuthenticated, false);
});
test('401 during initialization clears auth without throwing', async () => {
  const store = loadStore(async () => ({ ok: false, status: 401 }));
  await store.getState().fetchMe();
  assert.equal(store.getState().user, null);
  assert.equal(store.getState().isInitialized, true);
});
test('logout clears in-memory auth even when its request fails', async () => {
  const store = loadStore(async () => { throw new Error('offline'); });
  store.getState().setUser({ id: 'verified-user', roleName: 'Admin' });
  await assert.rejects(() => store.getState().logout());
  assert.equal(store.getState().user, null);
});

test('cookie settings enforce HttpOnly and production HTTPS without a shared domain', () => {
  const source = fs.readFileSync('src/lib/server-auth.ts', 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  for (const mode of ['development', 'production']) {
    const exports = {};
    vm.runInNewContext(code, { exports, require: runtimeRequire, process: { env: { NODE_ENV: mode } } });
    assert.equal(exports.cookieOptions.httpOnly, true);
    assert.equal(exports.cookieOptions.secure, mode === 'production');
    assert.equal(exports.cookieOptions.sameSite, 'lax');
    assert.equal(exports.cookieOptions.path, '/');
    assert(!('domain' in exports.cookieOptions));
  }
});
