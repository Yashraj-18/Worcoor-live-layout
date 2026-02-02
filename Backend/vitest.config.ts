import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    reporters: process.env.CI ? ['junit', 'default'] : ['default'],
    outputFile: process.env.CI ? 'reports/vitest-junit.xml' : undefined,
  },
});
