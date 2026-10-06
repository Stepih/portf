import { Background, TitleBlockPage } from 'portfolio-ui';

// Fixed page backdrop: theme background colour plus two blurred, slowly
// colour-cycling circles (top-left red, bottom-right blue) with parallax on
// scroll. Hidden circles on touch devices. Render once at the root, behind <main>.
// In a page it fills the viewport; here a sized stage stands in for it.
const Stage = ({ children, dark }: { children: React.ReactNode; dark?: boolean }) => (
  <div data-theme={dark ? 'dark' : undefined} style={{ position: 'relative', height: 652, overflow: 'hidden' }}>
    {children}
  </div>
);

export const PageBackdrop = () => (
  <Stage>
    <Background />
    <div style={{ position: 'relative', zIndex: 3, padding: '60px 40px' }}>
      <TitleBlockPage props={{ title: 'Media content', description: 'Создание видеороликов, улучшение качества видео и фото, склейка, цветокоррекция и другие услуги медиаконтента' }} />
    </div>
  </Stage>
);

export const DarkTheme = () => (
  <Stage dark>
    <Background />
    <div style={{ position: 'relative', zIndex: 3, padding: '60px 40px' }}>
      <TitleBlockPage props={{ title: 'FeedBack', description: 'Заполни и отправь форму, чтобы я смог связаться с тобой' }} />
    </div>
  </Stage>
);
