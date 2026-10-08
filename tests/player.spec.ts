import { expect, test, type Page } from '@playwright/test';
import type { IAlbums } from '../src/interfaces/albums';

// Текущий трек — тот, что отмечен aria-current в списке треков. Текст строки: «имя - исполнительдлительность»
const currentTrack = async (page: Page) => {
    // Плеер выезжает по наведению и во время анимации может быть за краем экрана, поэтому клик — событием
    await page.getByRole('button', { name: 'Список треков' }).dispatchEvent('click');
    const current = page.locator('button[aria-current="true"]');
    const name = await current.textContent();
    await page.getByRole('button', { name: 'Свернуть' }).click();
    return name?.trim();
};

test('альбом открывает плеер, «следующий» переключает трек', async ({ page, request }) => {
    // Контент берётся из public/music, поэтому альбом для проверки выбираем по API
    const albums: IAlbums[] = await (await request.get('/api/albums')).json();
    const album = albums.find(a => a.tracks.length >= 2);
    test.skip(!album, 'нет альбома из двух и больше треков');
    const [first, second] = album!.tracks;

    await page.goto('/music');
    const cover = page.getByRole('heading', { level: 2, name: album!.name, exact: true });
    // Альбомы без обложки спрятаны под «Показать еще»
    if (!(await cover.isVisible())) await page.getByRole('button', { name: 'Показать еще' }).click();
    await cover.click();

    const next = page.getByRole('button', { name: 'Следующий трек' });
    await expect(next).toBeAttached();
    expect(await currentTrack(page)).toBe(`${first.name} - ${album!.artist}${first.duration}`);

    await next.dispatchEvent('click');
    expect(await currentTrack(page)).toBe(`${second.name} - ${album!.artist}${second.duration}`);
});
