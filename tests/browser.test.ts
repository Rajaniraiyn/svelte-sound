import { soundSources } from '../examples/vite.js';
import { afterAll, beforeAll, expect, test } from 'bun:test';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { createServer, type ViteDevServer } from 'vite';

let server: ViteDevServer;
let base: string;
let kitProcess: ReturnType<typeof Bun.spawn>;
let kitBase: string;
const browser = () =>
  new Bun.WebView({
    backend:
      process.platform === 'darwin' ? 'webkit' : { type: 'chrome', url: false },
  });
async function wait(view: Bun.WebView, expression: string) {
  return view.evaluate(
    `(async () => { for (let i = 0; i < 300; i++) { if (${expression}) return true; await new Promise(r => setTimeout(r, 10)); } throw new Error('Browser condition timed out'); })()`,
  );
}
beforeAll(async () => {
  server = await createServer({
    configFile: false,
    resolve: { alias: soundSources },
    root: `${import.meta.dir}/fixtures`,
    plugins: [svelte()],
    server: { port: 0, host: '127.0.0.1', fs: { allow: [process.cwd()] } },
  });
  await server.listen();
  base = server.resolvedUrls!.local[0];
});
afterAll(async () => {
  await server?.close();
  kitProcess?.kill();
  if (kitProcess) await kitProcess.exited;
});

async function open() {
  const view = browser();
  await view.navigate(base);
  await view.evaluate(
    'new Promise(resolve => { const wait = () => window.harness ? resolve(true) : setTimeout(wait, 10); wait(); })',
  );
  return view;
}

const sample =
  '(async () => { for(let i = 0; i < 200; i++) { if (window.harness.audio.starts) return window.harness.audio; await new Promise(r => setTimeout(r, 10)); } throw new Error("No audio source started"); })()';

test('reactive player loads lazily, shares buffers, and releases on unmount', async () => {
  await using view = await open();
  expect(await view.evaluate('window.harness.audio.requests')).toBe(0);
  await view.click('#managed');
  await view.evaluate(sample);
  expect(await view.evaluate('window.harness.audio.duration')).toBeGreaterThan(
    0,
  );
  await view.evaluate('window.harness.change({ volume: 0 })');
  expect(await view.evaluate('window.harness.audio.contexts.length')).toBe(1);
  await view.click('#attached');
  expect(await view.evaluate('window.harness.audio.requests')).toBe(1);
  await view.evaluate('window.harness.unmount()');
  await wait(view, 'window.harness.audio.contexts[0].state === "closed"');
  expect(await view.evaluate('window.harness.audio.contexts[0].state')).toBe(
    'closed',
  );
}, 15000);

test('state updates on load and natural end; disabled blocks playback', async () => {
  await using view = await open();
  await view.evaluate('window.harness.load()');
  expect(await view.evaluate('window.harness.getState().status')).toBe('ready');
  expect(
    await view.evaluate('window.harness.getState().duration'),
  ).toBeGreaterThan(0);
  await view.click('#managed');
  await view.evaluate(sample);
  expect(
    await view.evaluate(
      '(async () => { for (let i=0;i<200;i++) { if(!window.harness.getState().playing) return true; await new Promise(r=>setTimeout(r,10)); } return false; })()',
    ),
  ).toBe(true);
  await view.evaluate('window.harness.change({ disabled: true })');
  const count = await view.evaluate('window.harness.audio.starts');
  await view.click('#managed');
  expect(await view.evaluate('window.harness.audio.starts')).toBe(count);
}, 15000);

test('event changes remove old listeners; borrowed players retain their settings', async () => {
  await using view = await open();
  await view.evaluate('window.harness.change({ event: "dblclick" })');
  await view.click('#attached');
  expect(await view.evaluate('window.harness.audio.requests')).toBe(0);
  await view.evaluate(
    'document.querySelector("#attached").dispatchEvent(new MouseEvent("dblclick"))',
  );
  await view.evaluate(sample);
  await view.click('#borrowed');
  expect(
    await view.evaluate('window.harness.audio.gains.at(-1).gain.value'),
  ).toBe(0.25);
  await view.evaluate('window.harness.change({ visible: false })');
  expect(await view.evaluate('window.harness.externalState().status')).toBe(
    'ready',
  );
}, 15000);

test('load errors reach reactive state and source replacement recovers', async () => {
  await using view = await open();
  await view.evaluate('window.harness.change({ missing: true })');
  await view.click('#managed');
  expect(
    await view.evaluate(
      '(async () => { for(let i=0;i<200;i++) { if(window.harness.getState().error) return true; await new Promise(r=>setTimeout(r,10)); } return false; })()',
    ),
  ).toBe(true);
  await view.evaluate('window.harness.change({ missing: false })');
  expect(await view.evaluate('window.harness.getState().status')).toBe('idle');
  await view.click('#managed');
  await view.evaluate(sample);
  expect(await view.evaluate('window.harness.getState().status')).toBe('ready');
}, 15000);

test('SSR renders idle state without creating or loading audio', async () => {
  const { default: Component } = await server.ssrLoadModule('/SSR.svelte');
  const { render } = await server.ssrLoadModule('svelte/server');
  const html = await render(Component);
  expect(html.body).toContain('idle:0');
});

test('effect ownership and reactive state work inside a custom renderer', async () => {
  await using view = await open();
  await view.evaluate('window.harness.mountCustom()');
  await view.evaluate('window.custom.play()');
  expect(await view.evaluate('window.custom.getState().playing')).toBe(1);
  expect(await view.evaluate('window.custom.snapshot()[0].status')).toBe(
    'ready',
  );
  await view.evaluate('window.custom.replace("second")');
  expect(await view.evaluate('window.custom.calls.created')).toBe(2);
  expect(await view.evaluate('window.custom.calls.destroyed')).toBe(1);
  await view.evaluate('window.custom.unmount()');
  expect(await view.evaluate('window.custom.calls.destroyed')).toBe(2);
  expect(await view.evaluate('window.harness.audio.contexts.length')).toBe(0);
}, 15000);

test('async component setup preserves the managed sound scope', async () => {
  await using view = await open();
  await view.evaluate('window.harness.mountAsync()');
  expect(
    await view.evaluate(
      '(async () => { for(let i=0;i<200;i++) { const el=document.querySelector("#async-status"); if(el) return el.textContent; await new Promise(r=>setTimeout(r,10)); } throw new Error("Async component did not settle"); })()',
    ),
  ).toBe('resolved:idle');
}, 15000);

test('SvelteKit renders on the server, hydrates, and navigates to the client route', async () => {
  const reservation = Bun.serve({ port: 0, fetch: () => new Response() });
  const port = reservation.port;
  reservation.stop(true);
  kitBase = `http://127.0.0.1:${port}/`;
  kitProcess = Bun.spawn(
    [
      'bun',
      `${process.cwd()}/node_modules/vite/bin/vite.js`,
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    {
      cwd: `${process.cwd()}/examples/sveltekit`,
      stdout: 'inherit',
      stderr: 'inherit',
    },
  );
  let ready = false;
  for (let attempt = 0; attempt < 200; attempt++) {
    try {
      if ((await fetch(kitBase)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await Bun.sleep(25);
  }
  expect(ready).toBe(true);
  const html = await (await fetch(kitBase)).text();
  expect(html).toContain('Server-rendered');
  expect(html).toContain('idle:0');
  await using view = browser();
  await view.navigate(kitBase);
  await wait(
    view,
    'document.querySelector("#mode")?.textContent === "Hydrated"',
  );
  expect(
    await view.evaluate('document.querySelector("#status").textContent'),
  ).toBe('idle:0');
  await view.click('#play');
  await wait(
    view,
    'document.querySelector("#status")?.textContent.startsWith("ready:")',
  );
  await view.click('a[href="/client"]');
  await wait(
    view,
    'location.pathname === "/client" && document.querySelector("#mode")?.textContent === "Hydrated"',
  );
  expect(
    await view.evaluate('document.querySelector("#status").textContent'),
  ).toBe('idle:0');
}, 30000);

test('focus intent preloads without playing or fetching twice', async () => {
  await using view = await open();
  await view.evaluate('window.harness.change({ preload: "intent" })');
  await view.evaluate('document.querySelector("#attached").focus()');
  await wait(view, 'window.harness.audio.requests === 1');
  expect(await view.evaluate('window.harness.audio.starts')).toBe(0);
  await view.click('#attached');
  await view.evaluate(sample);
  expect(await view.evaluate('window.harness.audio.requests')).toBe(1);
}, 15000);

test('source replacement cancels pending preload without an obsolete error', async () => {
  await using view = await open();
  const result = await view.evaluate(`(async () => {
    const original = window.fetch;
    let release;
    window.fetch = (...args) => new Promise(resolve => { release = () => resolve(original(...args)); });
    const pending = window.harness.load().then(() => 'cancelled', () => 'error');
    await window.harness.change({ missing: true });
    release();
    return pending;
  })()`);
  expect(result).toBe('cancelled');
  expect(await view.evaluate('window.harness.getState().status')).toBe('idle');
}, 15000);
