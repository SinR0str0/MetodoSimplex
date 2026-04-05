import { useEffect } from 'react';

export function usePageMeta(title: string, iconPath?: string) {
  useEffect(() => {
    document.title = title;

    if (iconPath) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = iconPath;
    }
  }, [title, iconPath]);
}