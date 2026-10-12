const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const mobileDir = path.dirname(require.resolve('../package.json'));
const jsx = (type, props) => ({ type, props });
const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

function runtime(relative, modules, initialState = []) {
  const states = [...initialState];
  let cursor = 0;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], (value) => {
        states[index] = typeof value === 'function' ? value(states[index]) : value;
      }];
    },
    useRef(initial) { const index = cursor++; return states[index] ??= { current: initial }; },
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
    useEffect: () => {},
    createContext: () => ({ Provider: 'Provider' }),
  };
  const exports = {};
  const source = fs.readFileSync(path.join(mobileDir, relative), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
      return modules[name] ?? new Proxy({}, { get: (_, key) => key });
    },
  });
  return { exports, render(fn) { cursor = 0; return fn(); } };
}

const initialProfile = { id: 'user', role: 'user', large_text: false, high_contrast: false };

function profileRuntime() {
  const reads = [];
  const writes = [];
  const supabase = {
    from(table) {
      return {
        select() { return this; },
        eq() { return this; },
        single() { return new Promise((resolve) => reads.push(resolve)); },
        order() { return Promise.resolve({ data: [] }); },
        update(patch) {
          assert.equal(table, 'profiles');
          return {
            eq() { return this; },
            select() { return this; },
            single() { return new Promise((resolve) => writes.push({ patch, resolve })); },
          };
        },
      };
    },
  };
  const app = runtime('lib/ProfileProvider.tsx', {
    '@/lib/AuthProvider': { useAuth: () => ({ session: { user: { id: 'user' } } }) },
    '@/lib/supabase': { supabase },
  }, [initialProfile, [], false]);
  return { reads, writes, render: () => app.render(() => app.exports.ProfileProvider({}).props.value) };
}

test('rapid preference changes persist in order and preserve both settings', async () => {
  const app = profileRuntime();
  const first = app.render().updateProfile({ large_text: true });
  const second = app.render().updateProfile({ high_contrast: true });
  await tick();
  assert.equal(app.writes.length, 1);
  app.writes[0].resolve({ data: { ...initialProfile, large_text: true }, error: null });
  await first;
  await tick();
  assert.equal(app.writes.length, 2);
  app.writes[1].resolve({ data: { ...initialProfile, large_text: true, high_contrast: true }, error: null });
  await second;
  assert.equal(app.render().profile.large_text, true);
  assert.equal(app.render().profile.high_contrast, true);
});

test('a refresh started before a save cannot overwrite the saved preference', async () => {
  const app = profileRuntime();
  const refresh = app.render().refresh();
  await tick();
  const save = app.render().updateProfile({ large_text: true });
  await tick();
  app.writes[0].resolve({ data: { ...initialProfile, large_text: true }, error: null });
  await save;
  app.reads[0]({ data: initialProfile, error: null });
  await refresh;
  assert.equal(app.render().profile.large_text, true);
});

test('returning to Account waits for an unfinished save before reloading preferences', async () => {
  const app = profileRuntime();
  const save = app.render().updateProfile({ large_text: true });
  const refresh = app.render().refresh();
  await tick();
  assert.equal(app.reads.length, 0);
  app.writes[0].resolve({ data: { ...initialProfile, large_text: true }, error: null });
  await save;
  await tick();
  app.reads[0]({ data: { ...initialProfile, large_text: true }, error: null });
  await refresh;
  assert.equal(app.render().profile.large_text, true);
});

test('a failed save retains confirmed settings and does not block the next save', async () => {
  const app = profileRuntime();
  const failed = app.render().updateProfile({ large_text: true });
  await tick();
  app.writes[0].resolve({ data: null, error: 'Save failed' });
  assert.equal((await failed).error, 'Save failed');
  assert.equal(app.render().profile.large_text, false);
  const retry = app.render().updateProfile({ large_text: true });
  await tick();
  app.writes[1].resolve({ data: { ...initialProfile, large_text: true }, error: null });
  await retry;
  assert.equal(app.render().profile.large_text, true);
});

test('screen reader support stays on for legacy profiles and cannot be saved off', async () => {
  const app = profileRuntime();
  const refresh = app.render().refresh();
  await tick();
  app.reads[0]({ data: { ...initialProfile, screen_reader_support: false }, error: null });
  await refresh;
  assert.equal(app.render().profile.screen_reader_support, true);

  const save = app.render().updateProfile({ screen_reader_support: false });
  await tick();
  assert.equal(app.writes[0].patch.screen_reader_support, true);
  app.writes[0].resolve({ data: { ...initialProfile, screen_reader_support: false }, error: null });
  await save;
  assert.equal(app.render().profile.screen_reader_support, true);
});

function find(node, type, predicate = () => true) {
  if (!node || typeof node !== 'object') return undefined;
  if ((node.type === type || node.type?.name === type) && predicate(node)) return node;
  const children = [].concat(node.props?.children ?? []);
  for (const child of children) { const found = find(child, type, predicate); if (found) return found; }
}

test('splash stays dismissed when profile or shop refreshes during navigation', () => {
  const profile = { profile: initialProfile, isLoading: false };
  const shop = { isLoading: false };
  const Stack = Object.assign(() => {}, { Screen: 'StackScreen', Protected: 'StackProtected' });
  const app = runtime('app/_layout.tsx', {
    'expo-font': { useFonts: () => [true] },
    'expo-router': { Stack, ThemeProvider: 'ThemeProvider' },
    'expo-splash-screen': { preventAutoHideAsync() {} },
    nativewind: { vars: (value) => value },
    'react-native': { View: 'View' },
    '@/constants/theme': { typographyVars: () => ({}), colorVars: () => ({}) },
    '@/hooks/useColorScheme': { useColorScheme: () => 'light' },
    '@/hooks/useReduceMotion': { useReduceMotion: () => false },
    '@/hooks/usePushNotifications': { usePushNotifications() {} },
    '@/lib/AuthProvider': { AuthProvider: 'AuthProvider', useAuth: () => ({ session: { user: { id: 'user' } }, isLoading: false }) },
    '@/lib/ProfileProvider': { ProfileProvider: 'ProfileProvider', useProfile: () => profile },
    '@/lib/ShopProvider': { ShopProvider: 'ShopProvider', useShop: () => shop },
    '@/components/BrandSplash': { BrandSplash: 'BrandSplash' },
  }, [true, false]);
  const Navigator = find(app.exports.default(), 'RootNavigator').type;
  app.render(Navigator);
  assert.equal(find(app.render(Navigator), 'BrandSplash'), undefined);
  profile.isLoading = true;
  shop.isLoading = true;
  assert.equal(find(app.render(Navigator), 'BrandSplash'), undefined);
  profile.isLoading = false;
  shop.isLoading = false;
  assert.equal(find(app.render(Navigator), 'BrandSplash'), undefined);
});


test('accessibility autosave writes only the changed preference and restores it on failure', async () => {
  const profile = { ...initialProfile, dictation_enabled: false, screen_reader_support: false, reduce_motion: false };
  const formValues = { ...profile };
  const patches = [];
  let restored;
  const app = runtime('app/account/accessibility.tsx', {
    '@hookform/resolvers/zod': { zodResolver: () => ({}) },
    'react-hook-form': {
      Controller: 'Controller',
      useForm: () => ({
        control: {},
        handleSubmit: (submit) => () => submit(formValues),
        reset: (values) => { restored = values; },
        formState: { isSubmitting: false },
      }),
    },
    'react-i18next': { useTranslation: () => ({ t: (key) => key }) },
    '@/lib/profile': { ACCESSIBILITY_FEATURES: ['large_text', 'high_contrast', 'dictation_enabled', 'reduce_motion', 'screen_reader_support'] },
    '@/hooks/useProfile': { useProfile: () => ({
      profile,
      updateProfile: async (patch) => { patches.push(patch); return { error: 'Save failed' }; },
    }) },
  });
  const screen = app.render(app.exports.default);
  const screenReader = find(screen, 'Controller', (node) => node.props.name === 'screen_reader_support');
  const lockedToggle = screenReader.props.render({ field: {
    value: false,
    onChange: () => assert.fail('Screen reader support must not change'),
  } });
  assert.equal(lockedToggle.props.value, true);
  assert.equal(lockedToggle.props.disabled, true);
  lockedToggle.props.onValueChange(false);
  assert.equal(patches.length, 0);
  const controller = find(screen, 'Controller');
  const toggle = controller.props.render({ field: {
    value: false,
    onChange: (value) => { formValues.large_text = value; },
  } });
  toggle.props.onValueChange(true);
  await tick();
  assert.deepEqual(JSON.parse(JSON.stringify(patches)), [{ large_text: true }]);
  assert.equal(restored.large_text, false);
  assert.equal(find(app.render(app.exports.default), 'FormError').props.message, 'accessibility.saveError');
});
