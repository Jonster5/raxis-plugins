import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
	plugins: [dts({ insertTypesEntry: true, exclude: 'src' })],
	build: {
		lib: {
			entry: './lib/main.ts',
			name: 'raxis',
			fileName: (f, n) => `raxis-plugins-${n}.${f === 'cjs' ? f : 'js'}`,
			formats: ['es', 'cjs'],
		},
		rollupOptions: {
			external: ['raxis'],
		},
		sourcemap: true,
	},
	server: {
		host: true,
		port: 7800,
	},
	resolve: {
		alias: {
			'raxis-plugins': path.resolve(__dirname, './lib/main'),
		},
	},
	esbuild: {
		keepNames: true,
	},
});
