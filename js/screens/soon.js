// «Скоро...» (Figma: frame «market») — для игр, которые ещё в разработке
import { t } from '../i18n.js';

export function render(root) {
  root.innerHTML = `<section class="soon-screen"><div class="soon">${t('common.soon')}</div></section>`;
}
