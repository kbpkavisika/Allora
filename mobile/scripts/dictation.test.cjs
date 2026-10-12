const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const mobileDir = path.dirname(require.resolve('../package.json'));

function runtime(platform = 'android', language = 'en') {
  const calls = { launches: [], changes: [], focus: 0, blur: 0, dismiss: 0, announcements: [] };
  let finish;
  let reject;
  let current;
  const react = {
    useState(initial) {
      const index = current.cursor++;
      const instance = current;
      if (!(index in instance.states)) instance.states[index] = initial;
      return [instance.states[index], (value) => { instance.states[index] = value; }];
    },
    useRef(initial) {
      const index = current.cursor++;
      return current.states[index] ??= { current: initial };
    },
    useEffect(effect, deps) {
      const index = current.cursor++;
      const previous = current.effects[index];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        current.pending.push(() => {
          previous?.cleanup?.();
          current.effects[index] = { deps, cleanup: effect() };
        });
      }
    },
  };
  const modules = {
    react,
    'react-i18next': { useTranslation: () => ({ t: (key) => key, i18n: { language, resolvedLanguage: language } }) },
    'react-native': {
      Platform: { OS: platform },
      Keyboard: { dismiss: () => calls.dismiss++ },
      AccessibilityInfo: { announceForAccessibility: (text) => calls.announcements.push(text) },
    },
    'expo-intent-launcher': {
      ResultCode: { Success: -1, Canceled: 0 },
      startActivityAsync(action, params) {
        calls.launches.push({ action, params });
        return new Promise((resolve, fail) => { finish = resolve; reject = fail; });
      },
    },
  };
  const jsx = (type, props) => ({ type, props });
  Object.assign(modules, {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@/constants/theme': { typographySpecs: { 'text-primary': { fontFamily: 'Test', fontSize: 16 } } },
    '@/hooks/useProfile': { useProfile: () => ({ profile: { dictation_enabled: true } }) },
    '@/hooks/useThemeColor': { useThemeColor: () => 'color' },
    '@/lib/chat': { MESSAGE_MAX_LENGTH: 2000 },
    '@/lib/CartProvider': { useCart: () => ({ isLoading: false }) },
    '@hookform/resolvers/zod': { zodResolver: () => ({}) },
    'react-hook-form': { Controller: 'Controller', useWatch: () => 'Buy', useForm: () => ({
      control: {}, watch: () => 'Buy', reset: () => {},
      setValue: (name, value) => { assert.equal(name, 'body'); calls.changes.push(value); },
      handleSubmit: () => () => { calls.submits = (calls.submits ?? 0) + 1; },
    }) },
  });
  for (const name of ['TextInput', 'View', 'Text', 'Pressable', 'ScrollView', 'KeyboardAvoidingView']) modules['react-native'][name] = name;
  const exports = {};
  const filename = path.join(mobileDir, 'hooks/useDictation.ts');
  assert.ok(fs.existsSync(filename), 'shared dictation handler must exist');
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, require: (name) => modules[name] });
  modules['@/hooks/useDictation'] = exports;
  function component(relative) {
    const componentExports = {};
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(mobileDir, relative), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, { exports: componentExports, require: (name) => modules[name] ?? new Proxy({}, { get: (_, key) => key }) });
    return componentExports;
  }
  function instance(overrides = {}) {
    const context = { states: [], effects: [], pending: [], cursor: 0 };
    const options = {
      inputRef: { current: { focus: () => calls.focus++, blur: () => calls.blur++ } },
      value: '', onChangeText: (text) => calls.changes.push(text), ...overrides,
    };
    return {
      options,
      render(render = () => exports.useDictation(options)) {
        current = context;
        current.cursor = 0;
        const result = render();
        for (const effect of current.pending.splice(0)) effect();
        return result;
      },
      unmount() { for (const effect of context.effects) effect?.cleanup?.(); },
    };
  }
  return { calls, instance, component, finish: (result) => finish(result), reject: () => reject(new Error('Unavailable')) };
}

const tick = async () => { for (let i = 0; i < 4; i++) await Promise.resolve(); };

const success = (text) => ({ resultCode: -1, extra: { 'android.speech.extra.RESULTS': [text] } });

test('Android opens speech input and appends its best result without focusing the keyboard', async () => {
  const app = runtime();
  const field = app.instance({ value: 'Buy' });
  const pending = field.render().dictate();
  await tick();
  assert.equal(app.calls.launches[0].action, 'android.speech.action.RECOGNIZE_SPEECH');
  assert.equal(app.calls.launches[0].params.extra['android.speech.extra.LANGUAGE_MODEL'], 'free_form');
  assert.equal(app.calls.blur, 1);
  assert.equal(app.calls.dismiss, 1);
  assert.equal(field.render().isDictating, true);
  app.finish(success('  rice  '));
  await pending;
  assert.deepEqual(app.calls.changes, ['Buy rice']);
  assert.equal(app.calls.focus, 0);
  assert.equal(field.render().isDictating, false);
});

for (const [language, locale] of [['en', 'en-US'], ['si', 'si-LK'], ['ta', 'ta-LK']]) {
  test(language + ' requests recognition in the selected language', async () => {
    const app = runtime('android', language);
    const pending = app.instance().render().dictate();
  await tick();
    assert.equal(app.calls.launches[0].params.extra['android.speech.extra.LANGUAGE'], locale);
    app.finish(success('text'));
    await pending;
  });
}

for (const platform of ['ios', 'web']) {
  test(platform + ' opens the keyboard without launching an Android intent', async () => {
    const app = runtime(platform);
    await app.instance().render().dictate();
    assert.equal(app.calls.focus, 1);
    assert.equal(app.calls.launches.length, 0);
    assert.deepEqual(app.calls.changes, []);
    assert.deepEqual(app.calls.announcements, ['input.dictationHint']);
  });
}

test('canceling speech leaves text untouched and allows another attempt', async () => {
  const app = runtime();
  const field = app.instance({ value: 'Keep this' });
  let pending = field.render().dictate();
  await tick();
  app.finish({ resultCode: 0 });
  await pending;
  assert.deepEqual(app.calls.changes, []);
  assert.equal(app.calls.focus, 0);
  pending = field.render().dictate();
  await tick();
  app.finish(success('please'));
  await pending;
  assert.deepEqual(app.calls.changes, ['Keep this please']);
});

test('repeated taps and other fields cannot launch a second dialog', async () => {
  const app = runtime();
  const field = app.instance();
  const pending = field.render().dictate();
  await tick();
  await field.render().dictate();
  await app.instance().render().dictate();
  assert.equal(app.calls.launches.length, 1);
  app.finish(success('hello'));
  await pending;
  assert.deepEqual(app.calls.changes, ['hello']);
});

test('unavailable speech falls back to the keyboard and announces the reason', async () => {
  const app = runtime();
  const field = app.instance();
  const pending = field.render().dictate();
  await tick();
  app.reject();
  await pending;
  assert.equal(app.calls.focus, 1);
  assert.equal(field.render().feedback, 'input.dictationUnavailable');
  assert.deepEqual(app.calls.announcements, ['input.dictationUnavailable']);
  assert.equal(field.render().isDictating, false);
});

for (const extra of [undefined, {}, { 'android.speech.extra.RESULTS': [] }, { 'android.speech.extra.RESULTS': [42] }, { 'android.speech.extra.RESULTS': ['  '] }]) {
  test('empty or malformed speech results preserve the current input: ' + JSON.stringify(extra), async () => {
    const app = runtime();
    const pending = app.instance({ value: 'Keep' }).render().dictate();
  await tick();
    app.finish({ resultCode: -1, extra });
    await pending;
    assert.deepEqual(app.calls.changes, []);
    assert.equal(app.calls.focus, 1);
  });
}

test('dictated input respects maxLength and existing whitespace', async () => {
  const app = runtime();
  const pending = app.instance({ value: 'Buy ', maxLength: 8 }).render().dictate();
  await tick();
  app.finish(success('rice today'));
  await pending;
  assert.deepEqual(app.calls.changes, ['Buy rice']);
});

test('disabled inputs cannot start dictation', async () => {
  const app = runtime();
  await app.instance({ isDisabled: true }).render().dictate();
  assert.equal(app.calls.launches.length, 0);
  assert.equal(app.calls.focus, 0);
});

for (const change of ['unmount', 'disabled', 'value']) {
  test('late results are ignored after ' + change, async () => {
    const app = runtime();
    const field = app.instance({ value: 'Original' });
    const pending = field.render().dictate();
  await tick();
    if (change === 'unmount') field.unmount();
    else { field.options[change === 'disabled' ? 'isDisabled' : 'value'] = change === 'disabled' ? true : 'Changed'; field.render(); }
    app.finish(success('late'));
    await pending;
    assert.deepEqual(app.calls.changes, []);
    assert.equal(app.calls.focus, 0);
  });
}

test('dictation never truncates pre-existing text already beyond maxLength', async () => {
  const app = runtime();
  const pending = app.instance({ value: 'Existing content', maxLength: 8 }).render().dictate();
  await tick();
  app.finish(success('new'));
  await pending;
  assert.deepEqual(app.calls.changes, []);
});
