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


test('provider configuration errors are diagnosable without leaking provider text or retrying', async () => {
  const logs = [];
  let calls = 0;
  const response = await loadEndpoint({ logs, transport: async () => {
    calls++;
    return new Response(JSON.stringify({ error: { code: 'invalid_api_key', message: 'secret and private prompt' } }), { status: 401 });
  } })(request(body));
  assert.equal(response.status, 503);
  const failure = await response.json();
  assert.equal(failure.code, 'provider_configuration');
  assert.equal(calls, 1);
  assert.equal(failure.requestId, response.headers.get('x-request-id'));
  assert.ok(logs.some(log => log.event === 'provider_failed' && log.providerStatus === 401));
  assert.ok(logs.some(log => log.event === 'request_completed' && log.status === 503));
  assert.doesNotMatch(JSON.stringify(logs), /secret and private prompt|Bearer token|Find milk/);
});

test('malformed provider output and timeouts have distinct stable errors', async () => {
  const malformed = await loadEndpoint({ transport: async () => new Response('{broken') })(request(body));
  assert.equal(malformed.status, 502);
  assert.equal((await malformed.json()).code, 'invalid_provider_response');
  const timedOut = await loadEndpoint({ transport: async () => { throw new DOMException('timeout', 'TimeoutError'); } })(request(body));
  assert.equal(timedOut.status, 504);
});

test('auth service outages are not reported as invalid credentials', async () => {
  const response = await loadEndpoint({ authError: { status: 503, name: 'AuthRetryableFetchError' } })(request(body));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'auth_unavailable');
});

test('rate limits preserve bounded retry guidance without invoking the provider again', async () => {
  const response = await loadEndpoint({ transport: async () => new Response('{}', { status: 429, headers: { 'Retry-After': '45' } }) })(request(body));
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '45');
  assert.equal((await response.json()).retryAfter, 45);
});

test('rejects duplicate product IDs and excessive total history before provider work', async () => {
  const endpoint = loadEndpoint({ transport: async () => { throw new Error('Must not call provider'); } });
  assert.equal((await endpoint(request({ ...body, productIds: ['milk', 'milk'] }))).status, 400);
  assert.equal((await endpoint(request({ ...body, messages: Array.from({ length: 12 }, () => ({ role: 'user', content: 'a'.repeat(4000) })) }))).status, 400);
});

test('database errors identify the failed stage in logs', async () => {
  const logs = [];
  const response = await loadEndpoint({ logs, dbError: { code: '08006', message: 'private database details' } })(request({ ...body, productIds: ['milk'] }));
  assert.equal(response.status, 503);
  assert.ok(logs.some(log => log.event === 'request_failed' && log.stage === 'catalog_context' && log.errorCode === '08006'));
  assert.doesNotMatch(JSON.stringify(logs), /private database details/);
});


test('client refreshes expiring sessions before exactly one invocation', async () => {
  let refreshes = 0;
  const calls = [];
  const client = {
    auth: {
      getSession: async () => ({ data: { session: { access_token: 'old', expires_at: 1 } }, error: null }),
      refreshSession: async () => { refreshes++; return { data: { session: { access_token: 'fresh', expires_at: Date.now() / 1000 + 3600 } }, error: null }; },
    },
    functions: { invoke: async (...args) => { calls.push(args); return { data: {}, error: null }; } },
  };
  await exportsUnderTest.invokeShoppingAssistant(client, body);
  assert.equal(refreshes, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].headers.Authorization, 'Bearer fresh');
  assert.equal(calls[0][1].timeout, 45000);
});

test('client skips the edge function when no valid session is available', async () => {
  let calls = 0;
  const client = {
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
    functions: { invoke: async () => { calls++; } },
  };
  await assert.rejects(() => exportsUnderTest.invokeShoppingAssistant(client, body), /sign in/i);
  assert.equal(calls, 0);
});

test('client never automatically reinvokes a failed request', async () => {
  let calls = 0;
  const error = new Error('502');
  const client = {
    auth: { getSession: async () => ({ data: { session: { access_token: 'valid', expires_at: Date.now() / 1000 + 3600 } }, error: null }) },
    functions: { invoke: async () => { calls++; return { data: null, error }; } },
  };
  assert.equal((await exportsUnderTest.invokeShoppingAssistant(client, body)).error, error);
  assert.equal(calls, 1);
});


test('client bounds history before sending rather than spending an invocation on rejected history', async () => {
  let sent;
  const client = {
    auth: { getSession: async () => ({ data: { session: { access_token: 'valid', expires_at: Date.now() / 1000 + 3600 } }, error: null }) },
    functions: { invoke: async (_, options) => { sent = options.body; return { data: {}, error: null }; } },
  };
  const messages = Array.from({ length: 12 }, () => ({ role: 'user', content: 'x'.repeat(4000) }));
  await exportsUnderTest.invokeShoppingAssistant(client, { messages, productIds: [] });
  assert.ok(sent.messages.reduce((sum, m) => sum + m.content.length, 0) <= 16000);
  assert.equal(sent.messages.at(-1), messages.at(-1));
});

test('oversized body and malformed JSON are rejected without provider calls', async () => {
  let calls = 0;
  const endpoint = loadEndpoint({ transport: async () => { calls++; throw new Error('Must not call'); } });
  for (const [content, status] of [['x'.repeat(65537), 413], ['{broken', 400]]) {
    const response = await endpoint(new Request('http://localhost', { method: 'POST', headers: { Authorization: 'Bearer token' }, body: content }));
    assert.equal(response.status, status);
  }
  assert.equal(calls, 0);
});

test('invalid search budgets, empty replies, and exhausted stock cannot produce actions', async () => {
  const base = { type: 'reply', query: '', maxPrice: null, productId: '', quantity: 1, message: 'Hello' };
  for (const action of [{ ...base, message: '' }, { ...base, type: 'search', query: 'milk', maxPrice: -1 }]) {
    const response = await loadEndpoint({ action })(request(body));
    assert.equal(response.status, 502);
  }
  const response = await loadEndpoint({ products: [{ ...product, stock_quantity: 0 }], action: { ...base, type: 'add', productId: 'milk' } })(request({ ...body, productIds: ['milk'] }));
  assert.equal(response.status, 409);
});


test('budget-only alternatives browse in-stock products without an invented keyword', async () => {
  const queries = [];
  const action = { type: 'search', query: '', maxPrice: 2000, excludeCurrentResults: true, productId: '', quantity: 1, message: 'Other products within your budget' };
  const response = await loadEndpoint({ action, products: [product], queries })(request({ messages: [{ role: 'user', content: 'What else can I buy for 2000rs' }], productIds: ['milk'] }));
  assert.equal(response.status, 200);
  assert.ok(queries.some(q => q[0] === 'lte' && q[1] === 'price' && q[2] === 2000));
  assert.ok(queries.some(q => q[0] === 'not' && q[1] === 'id' && q[2] === 'in' && q[3] === '(milk)'));
  assert.equal(queries.some(q => q[0] === 'ilike'), false);
});

test('budget-free browsing is allowed but wildcard-only product keywords are rejected', async () => {
  const base = { type: 'search', query: '', maxPrice: null, productId: '', quantity: 1, message: 'Browse products' };
  assert.equal((await loadEndpoint({ action: base })(request(body))).status, 200);
  assert.equal((await loadEndpoint({ action: { ...base, query: '%_\\' } })(request(body))).status, 502);
});

test('legacy and gateway errors preserve a diagnostic code and request header', async () => {
  const response = new Response(JSON.stringify({ error: 'Legacy provider unavailable' }), { status: 502, headers: { 'x-request-id': 'gateway-request' } });
  const failure = await exportsUnderTest.readShoppingFailure(response);
  assert.equal(failure.requestId, 'gateway-request');
  assert.equal(failure.code, 'unclassified_http_error');
  assert.equal(failure.error, 'Legacy provider unavailable');
  const text = await exportsUnderTest.readShoppingFailure(new Response('Bad Gateway', { status: 502 }));
  assert.equal(text.code, 'non_json_http_error');
});
