const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const postcss = require('postcss');
const tailwind = require('tailwindcss');
const ts = require('typescript');
const { cssToReactNativeRuntime } = require('react-native-css-interop/css-to-rn');

const mobileDir = path.dirname(require.resolve('../package.json'));
const source = fs.readFileSync(path.join(mobileDir, 'components/ui/Button.tsx'), 'utf8');
const config = require('../tailwind.config.js');
const nativePreset = require(path.join(path.dirname(require.resolve('nativewind/preset')), 'native.js')).default;

test('button motion and loading changes never add a NativeWind provider after mount', async () => {
  const css = await postcss([tailwind({
    ...config,
    presets: [nativePreset],
    content: [{ raw: source, extension: 'tsx' }],
  })]).process('@tailwind utilities;', { from: undefined });
  const rules = cssToReactNativeRuntime(css.css).rules;
  const state = { reduceMotion: true };
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  const modules = {
    react: { useState: () => [false, () => {}] },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': { Pressable: 'Pressable', Text: 'Text', View: 'View', ActivityIndicator: 'ActivityIndicator' },
    '@/hooks/useReduceMotion': { useReduceMotion: () => state.reduceMotion },
  };
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: (name) => modules[name] });

  for (const variant of ['primary', 'secondary', 'social', 'link', 'destructive']) {
    for (const reduceMotion of [true, false]) {
      for (const inert of [true, false]) {
        state.reduceMotion = reduceMotion;
        for (const status of [{ loading: inert }, { disabled: inert }]) {
          const button = exports.Button({ label: 'Test', variant, ...status });
          const classes = button.props.className.split(/\s+/);
          assert.ok(classes.some((name) => rules[name]?.variables),
            variant + ' must initialize its variable provider even with motion disabled');
          const shouldScale = !reduceMotion && !inert && ['primary', 'destructive'].includes(variant);
          assert.ok(classes.includes(shouldScale ? 'active:scale-[0.97]' : 'active:scale-100'));
          assert.equal(button.props.disabled, inert);
        }
      }
    }
  }
});
