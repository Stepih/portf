"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Хук для получения текущего пути в Next.js 13+
import styles from './BreadCrumbs.module.scss'; 
import { breadCrumbLabels } from '@/data/breadCrumbs';

// Подпись крошки: своя из breadCrumbLabels, иначе – сам сегмент адреса
const label = (segment: string): string => breadCrumbLabels[segment] ?? decodeURIComponent(segment);

const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();

  // Разделяем текущий путь на части и создаем массив для хлебных крошек
  const pathSegments = pathname.split('/').filter((segment) => segment);

  return (
    // На десктопе крошки скрыты медиазапросом в .nav
    <nav aria-label="Breadcrumb" className={styles.nav}>
      <ul className={styles.breadcrumbs}>
        {/* Первая крошка - Главная */}
        <li className={styles.breadcrumbItem}>
          <Link href="/">Главная</Link>
          {pathSegments.length > 0 && <span className={styles.separator}>/</span>}
        </li>

        {/* Оставшиеся крошки */}
        {pathSegments.map((segment, index) => {
          // Составляем путь для каждой крошки
          const href = '/' + pathSegments.slice(0, index + 1).join('/');
          const isLast = index === pathSegments.length - 1;

          return (
            <li key={href} className={styles.breadcrumbItem}>
              {!isLast ? (
                <>
                  <Link href={href}>{label(segment)}</Link>
                  <span className={styles.separator}>/</span>
                </>
              ) : (
                <span className={styles.current}>{label(segment)}</span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Breadcrumbs;
