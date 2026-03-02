import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
		seed: 'tsx prisma/seed.ts',
	},
	datasource: {
		// Use session-mode pooler (port 5432) for CLI operations (migrate, db push).
		// The transaction pooler (port 6543 with pgbouncer=true) doesn't support
		// prepared statements needed by Prisma's schema engine.
		url: env('DATABASE_URL')
			?.replace(':6543', ':5432')
			?.replace('?pgbouncer=true', ''),
	},
});
