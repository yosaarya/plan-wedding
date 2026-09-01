import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Aturan B2.2: service role melewati RLS, jadi aplikasi tidak memakainya
      // sama sekali. Kalau suatu saat dibutuhkan (mis. cron), pengecualiannya
      // ditulis eksplisit di sini supaya terlihat saat review.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/supabase/admin', '**/supabase/admin.ts'],
              message:
                'Service role melewati RLS. Semua akses aplikasi harus lewat JWT pengguna (aturan B2.2).',
            },
          ],
        },
      ],
    },
  },
  { ignores: ['.next/**', 'node_modules/**'] },
]

export default config
