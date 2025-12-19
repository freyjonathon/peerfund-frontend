// .eslintrc.cjs
module.exports = {
  env: { browser: true, es2021: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: { react: { version: 'detect' } },
  rules: {
    // React 17+ JSX transform: you don't need `import React` anymore
    'react/react-in-jsx-scope': 'off',

    // Don’t block the build for missing PropTypes right now
    'react/prop-types': 'off',

    // Don't fail build on unused vars; warn instead
    // and ignore the `React` symbol specifically
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^React$' }],
  },
};
