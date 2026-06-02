/**
 * hub/main.js — управление тремя окнами хаба.
 *
 * Использует атрибут `hidden` вместо CSS-класса `.active`,
 * чтобы окна были недоступны для assistive technology пока закрыты.
 * Поддерживает keyboard navigation (Enter / Space для открытия, Escape для закрытия).
 */

(function hubInit() {
  'use strict';

  /** @param {string} selector @returns {Element[]} */
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  // ── Открыть окно ─────────────────────────────────────────────
  function openWindow(name) {
    const layer = document.querySelector(`.hub-window-layer[data-window="${name}"]`);
    if (!layer) return;
    layer.removeAttribute('hidden');
    layer.setAttribute('aria-hidden', 'false');
    // Фокус на кнопку закрытия для keyboard users
    const closeBtn = layer.querySelector('[data-window-close]');
    if (closeBtn) closeBtn.focus();
  }

  // ── Закрыть все окна ─────────────────────────────────────────
  function closeAll() {
    $$('.hub-window-layer:not([hidden])').forEach((layer) => {
      layer.setAttribute('hidden', '');
      layer.setAttribute('aria-hidden', 'true');
    });
  }

  // ── Клик / Enter / Space на колонке ──────────────────────────
  $$('[data-window-open]').forEach((col) => {
    const name = col.getAttribute('data-window-open');

    col.addEventListener('click', () => openWindow(name));
    col.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openWindow(name);
      }
    });
  });

  // ── Кнопка закрытия ──────────────────────────────────────────
  $$('[data-window-close]').forEach((btn) => {
    btn.addEventListener('click', closeAll);
  });

  // ── Клик по backdrop (вне shell) ─────────────────────────────
  $$('.hub-window-layer').forEach((layer) => {
    layer.addEventListener('click', (e) => {
      if (e.target === layer) closeAll();
    });
  });

  // ── Escape глобально ─────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });

  // ── Динамический marquee из последнего доната ─────────────────
  const marqueeEl = document.getElementById('marquee-text');
  if (marqueeEl) {
    fetch('/api/donations/latest')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.name && d?.amount) {
          marqueeEl.textContent = `${d.name} задонатил ${d.amount} ₽ через ${d.bank ?? d.method ?? '?'}`;
        }
      })
      .catch(() => { /* тихо игнорируем — marquee не критичен */ });
  }
}());
