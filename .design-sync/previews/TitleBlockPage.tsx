import { TitleBlockPage } from 'portfolio-ui';

// Home page hero: portrait + title block.
export const Home = () => (
  <TitleBlockPage
    props={{
      title: 'Fullstack developer',
      description: 'Привет! Я Картузов Степан, программист, дизайнер, музыкант, студент РЭУ им. Г.В. Плеханова',
      img: true,
    }}
  />
);

// Section page: no portrait, "На главную" back button cut into the corner.
export const SectionPage = () => (
  <div style={{ paddingTop: 8 }}>
    <TitleBlockPage
      props={{
        title: 'Media content',
        description: 'Создание видеороликов, улучшение качества видео и фото, склейка, цветокоррекция и другие услуги медиаконтента',
      }}
    />
  </div>
);

export const DarkTheme = () => (
  <div data-theme="dark" style={{ background: 'var(--color-bg)', padding: 24 }}>
    <TitleBlockPage
      props={{
        title: 'My musical creativity',
        description: 'Жизнь, как пианино. С чёрными и белыми полосами, но живя, нельзя забывать, что чёрные клавиши тоже создают музыку',
      }}
    />
  </div>
);
