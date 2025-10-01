module.exports = {
  arrowParens: 'avoid',
  bracketSameLine: false,
  bracketSpacing: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  endOfLine: 'auto',
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      options: {
        parser: 'typescript',
      },
    },
  ],
};
