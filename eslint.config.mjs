import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      '.kilo/**',
      '.kilocode/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Read configuration only through core/config/env.ts',
        },
      ],
    },
  },
  {
    files: [
      'src/core/config/**',
      'src/instrumentation.ts',
      '*.config.*',
      'scripts/**',
      'tests/**',
    ],
    rules: {
      'no-restricted-properties': 'off',
    },
  },
];

export default config;
