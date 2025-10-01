module.exports = {
  root: true,
  extends: [
    'react-app',
    'plugin:testing-library/react',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: [
    '**/__mocks__/**/*',
    'babel.config.js',
    'react-native.config.js',
    'bump_version.js',
  ],
  env: {
    'jest/globals': true,
  },
  plugins: ['jest', 'jest-dom'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'react/no-unstable-nested-components': 'off',
    'react-native/no-unused-styles': 'error',
    'react/jsx-curly-brace-presence': 'error',
    'testing-library/prefer-screen-queries': 'warn',
    'testing-library/no-unnecessary-act': 'warn',
    'testing-library/prefer-presence-queries': 'warn',
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      rules: {
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error',
      },
    },
  ],
};
