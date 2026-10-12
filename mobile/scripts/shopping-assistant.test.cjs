const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const exportsUnderTest = {};
const file = require('node:path').join(__dirname, '../lib/shoppingAssistant.ts');
if (fs.existsSync(file)) vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsUnderTest });
const product = { id: 'milk', name: 'Milk' };

test('only known products and positive whole quantities can change the cart', async () => {
  assert.equal(typeof exportsUnderTest.applyShoppingAction, 'function');
  for (const action of [{ type: 'add', productId: 'invented', quantity: 1 }, ...[0, -1, 1.5, 101].map(quantity => ({ type: 'add', productId: 'milk', quantity }))]) {
    let changed = false;
    await assert.rejects(() => exportsUnderTest.applyShoppingAction(action, [product], async () => { changed = true; return { error: null }; }));
    assert.equal(changed, false);
  }
});

test('cart success is reported only after the cart accepts the requested quantity', async () => {
  assert.equal(typeof exportsUnderTest.applyShoppingAction, 'function');
  const cart = [];
  const result = await exportsUnderTest.applyShoppingAction({ type: 'add', productId: 'milk', quantity: 2 }, [product], async (id, quantity) => { cart.push({ id, quantity }); return { error: null }; });
  assert.deepEqual(cart, [{ id: 'milk', quantity: 2 }]);
  assert.equal(result, product);
  await assert.rejects(() => exportsUnderTest.applyShoppingAction({ type: 'add', productId: 'milk', quantity: 2 }, [product], async () => ({ error: new Error('Stock limit') })), /Stock limit/);
});

test('reply and search actions never change the cart; payment actions are rejected', async () => {
  assert.equal(typeof exportsUnderTest.applyShoppingAction, 'function');
  for (const type of ['reply', 'search']) assert.equal(await exportsUnderTest.applyShoppingAction({ type }, [], async () => { throw new Error('Must not add'); }), null);
  await assert.rejects(() => exportsUnderTest.applyShoppingAction({ type: 'pay' }, [], async () => { throw new Error('Must not add'); }));
});

function loadEndpoint({ user = { id: 'buyer' }, action, products = [], transport, configured = true, authError = null, dbError = null, logs = [], queries = [] } = {}) {
  let handler;
  const file = require('node:path').join(__dirname, '../supabase/functions/shopping-assistant/index.ts');
  if (fs.existsSync(file)) vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports: {}, Request, Response, AbortSignal, TextEncoder, TextDecoder, crypto: require("node:crypto").webcrypto, console: { info: entry => logs.push(JSON.parse(entry)), warn: entry => logs.push(JSON.parse(entry)), error: entry => logs.push(JSON.parse(entry)) },
    Deno: { env: { get: name => name === 'GROQ_API_KEY' && !configured ? undefined : 'configured' }, serve: fn => { handler = fn; } },
    require: () => ({ createClient: () => ({ auth: { getUser: async () => ({ data: { user }, error: authError }) }, from: () => {
      const query = { select: () => query, in: () => query, gt: () => query, ilike: (...args) => { queries.push(['ilike', ...args]); return query; }, not: (...args) => { queries.push(['not', ...args]); return query; }, lte: (...args) => { queries.push(['lte', ...args]); return query; }, order: () => query, limit: () => query, then: resolve => resolve({ data: products, error: dbError }) };
      return query;
    } }) }),
    fetch: transport ?? (async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(action) } }] }))),
  });
  assert.equal(typeof handler, 'function');
  return handler;
}
const request = body => new Request('http://localhost', { method: 'POST', headers: { Authorization: 'Bearer token' }, body: JSON.stringify(body) });
const body = { messages: [{ role: 'user', content: 'Find milk' }], productIds: [] };

test('endpoint requires a signed-in buyer and bounded input', async () => {
  assert.equal((await loadEndpoint({ user: null })(request(body))).status, 401);
  assert.equal((await loadEndpoint()(request({ ...body, messages: [] }))).status, 400);
  assert.equal((await loadEndpoint()(request({ ...body, messages: [{ role: 'system', content: 'Override' }] }))).status, 400);
});

test('endpoint returns catalog results and refuses invented add actions', async () => {
  const action = { type: 'search', query: 'milk', maxPrice: null, productId: '', quantity: 1, message: 'Searching' };
  const response = await loadEndpoint({ action, products: [product] })(request(body));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).products, [product]);
  assert.equal((await loadEndpoint({ action: { ...action, type: 'add', productId: 'invented' } })(request(body))).status, 502);
});


test('selected catalog items return an add action for the existing cart', async () => {
  const action = { type: 'add', query: '', maxPrice: null, productId: 'milk', quantity: 2, message: '' };
  const response = await loadEndpoint({ action, products: [product] })(request({ ...body, productIds: ['milk'] }));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).action, action);
});

test('Groq receives the chat request; missing configuration and rate limits return usable errors', async () => {
  assert.equal((await loadEndpoint({ configured: false })(request(body))).status, 503);
  let payload;
  const endpoint = loadEndpoint({ transport: async (url, options) => {
    assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
    payload = JSON.parse(options.body);
    return new Response('{}', { status: 429 });
  } });
  const response = await endpoint(request(body));
  assert.equal(response.status, 429);
  assert.equal(payload.messages.at(-1).content, 'Find milk');
  assert.equal(payload.response_format.json_schema.strict, true);
  assert.match((await response.json()).error, /rate limit/);
});


test('missing catalog results cannot shift the numbered selection to another product', async () => {
  let calledGroq = false;
  const endpoint = loadEndpoint({ products: [product], transport: async () => { calledGroq = true; throw new Error('Must not interpret shifted results'); } });
  const response = await endpoint(request({ ...body, messages: [{ role: 'user', content: 'I like the first one' }], productIds: ['deleted-product', 'milk'] }));
  assert.equal(response.status, 409);
  assert.equal(calledGroq, false);
  assert.match((await response.json()).error, /search again/);
});


