import { defineConfig } from 'orval';

export default defineConfig({
  checkedApi: {
    input: '../checked-backend/docs/openapi.yaml',
    output: {
      mode: 'split',
      target: './src/lib/api/generated/endpoints.ts',
      schemas: './src/types/api.generated.ts',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/lib/api/custom-fetcher.ts',
          name: 'customFetcher',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
      },
    },
  },
});
