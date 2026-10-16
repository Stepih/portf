// Полупрозрачный фон под макетами в цвет акцента кейса
const TINTS: Record<string, string> = {
    '#77C7EA': 'rgba(119, 199, 234, 0.22)',
    '#00EA41': 'rgba(0, 234, 65, 0.16)',
    '#EA7777': 'rgba(234, 119, 119, 0.2)',
    '#C9A272': 'rgba(201, 162, 114, 0.2)'
}

export const slideTint = (accent: string): string => TINTS[accent] ?? 'rgba(57, 57, 57, 0.35)';
