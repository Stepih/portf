import { defineConfig } from '@playwright/test';

// Smoke-тесты гоняются в установленном Edge, браузеры Playwright не скачиваются.
// Сервер — прод-сборка на :3003. `next build` пишет в .next, поэтому при запущенном
// `npm run dev` сначала останови его или подними сборку на :3003 сам: тогда она будет переиспользована
const PORT = 3003;

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    reporter: 'list',
    use: {
        baseURL: `http://localhost:${PORT}`,
        channel: 'msedge',
    },
    webServer: {
        // npx next build, а не npm run build: postbuild переписал бы sitemap в public/
        command: `npx next build && npx next start -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: true,
        timeout: 5 * 60 * 1000,
    },
});
