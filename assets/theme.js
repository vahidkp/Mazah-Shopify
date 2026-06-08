/* ==========================================================================
   Mazah — theme.js
   Vanilla JS progressive enhancement. Cart uses Shopify's Ajax Cart API.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const money = (cents) => {
    if (window.Shopify && window.Shopify.formatMoney) {
      return window.Shopify.formatMoney(cents, window.themeMoneyFormat);
    }
    return '$' + (cents / 100).toFixed(2).replace(/\.00$/, '');
  };

  /* ---------------------------------------------------------------- Cart API */
  const Cart = {
    async get() {
      const res = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
      return res.json();
    },
    async add(id, quantity = 1, properties) {
      const body = { id, quantity };
      if (properties) body.properties = properties;
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    async change(line, quantity) {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ line, quantity }),
      });
      return res.json();
    },
  };

  /* --------------------------------------------------------- Cart drawer UI */
  const Drawer = {
    open() {
      document.body.classList.add('cart-open');
      const close = $('.cart-drawer__close');
      if (close) close.focus();
    },
    close() {
      document.body.classList.remove('cart-open');
    },
    render(cart) {
      const root = $('.cart-drawer');
      if (!root) return;
      const threshold = (window.mazahFreeShip || 100) * 100;
      const itemsEl = $('.cart-drawer__items', root);
      const headCount = $('.cart-drawer__count', root);
      const footEl = $('.cart-drawer__foot', root);
      const shipEl = $('.cart-drawer__ship', root);

      // badge counts everywhere
      $$('.js-cart-count').forEach((b) => {
        b.textContent = cart.item_count;
        b.style.display = cart.item_count > 0 ? '' : 'none';
      });

      if (headCount) {
        headCount.textContent = cart.item_count
          ? '(' + cart.item_count + (cart.item_count === 1 ? ' item)' : ' items)')
          : '';
      }

      if (cart.item_count === 0) {
        itemsEl.innerHTML =
          '<div class="cart-empty">' +
          '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#E9E5DF" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' +
          '<p class="t">Your cart is empty</p>' +
          '<p class="s">Explore our perfumes to find your signature scent.</p>' +
          '<a href="/collections/all" class="btn-solid">Shop All</a>' +
          '</div>';
        if (footEl) footEl.style.display = 'none';
        if (shipEl) shipEl.style.display = 'none';
        return;
      }

      if (footEl) footEl.style.display = '';
      if (shipEl) {
        shipEl.style.display = '';
        const free = cart.total_price >= threshold;
        shipEl.innerHTML = free
          ? '<span class="ok">🎉 You’ve unlocked FREE shipping!</span>'
          : 'You’re <span class="ink">' + money(threshold - cart.total_price) +
            '</span> away from <span class="ink">FREE shipping</span>.';
      }

      itemsEl.innerHTML = cart.items
        .map((item, i) => {
          const img = item.image
            ? item.image.replace(/(\.[a-z]+)(\?|$)/i, '_160x$1$2')
            : '';
          return (
            '<div class="cart-line" data-line="' + (i + 1) + '">' +
            '<div class="cart-line__media">' + (img ? '<img src="' + img + '" alt="" loading="lazy">' : '') + '</div>' +
            '<div class="cart-line__body">' +
            '<p class="cart-line__name">' + item.product_title + '</p>' +
            '<p class="cart-line__variant">' + (item.variant_title || '') + '</p>' +
            '<div class="cart-line__row">' +
            '<div class="cart-line__qty">' +
            '<button class="js-qty" data-line="' + (i + 1) + '" data-qty="' + (item.quantity - 1) + '" aria-label="Decrease">−</button>' +
            '<span>' + item.quantity + '</span>' +
            '<button class="js-qty" data-line="' + (i + 1) + '" data-qty="' + (item.quantity + 1) + '" aria-label="Increase">+</button>' +
            '</div>' +
            '<p class="cart-line__price">' + money(item.final_line_price) + '</p>' +
            '</div></div>' +
            '<button class="cart-line__remove js-qty" data-line="' + (i + 1) + '" data-qty="0" aria-label="Remove">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            '</button></div>'
          );
        })
        .join('');

      // totals
      const free = cart.total_price >= threshold;
      const shipCost = free ? 0 : 999;
      const sub = $('.js-cart-subtotal', root);
      const ship = $('.js-cart-shipping', root);
      const tot = $('.js-cart-total', root);
      if (sub) sub.textContent = money(cart.total_price);
      if (ship) ship.innerHTML = free ? '<span class="ok">Free</span>' : money(shipCost);
      if (tot) tot.textContent = money(cart.total_price + shipCost);
    },
    async refresh() {
      try {
        const cart = await Cart.get();
        this.render(cart);
      } catch (e) { /* noop */ }
    },
  };

  /* ----------------------------------------------------- Add-to-cart buttons */
  async function handleAdd(btn) {
    const id = btn.getAttribute('data-variant-id');
    if (!id) return;
    const qtyInput = btn.closest('[data-product-form]')
      ? $('.js-qty-input', btn.closest('[data-product-form]'))
      : null;
    const quantity = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.dataset.loading = 'true';
    try {
      await Cart.add(id, quantity);
      await Drawer.refresh();
      Drawer.open();
    } catch (err) {
      btn.innerHTML = (err && err.description) || 'Unavailable';
      setTimeout(() => { btn.innerHTML = original; }, 1800);
    } finally {
      btn.disabled = false;
      delete btn.dataset.loading;
    }
  }

  /* ------------------------------------------------------------- Wishlist */
  const Wishlist = {
    key: 'mazah-wishlist',
    ids() {
      try { return JSON.parse(localStorage.getItem(this.key) || '[]'); }
      catch (e) { return []; }
    },
    has(id) { return this.ids().includes(String(id)); },
    toggle(id) {
      id = String(id);
      let ids = this.ids();
      ids = ids.includes(id) ? ids.filter((x) => x !== id) : ids.concat(id);
      localStorage.setItem(this.key, JSON.stringify(ids));
      return ids.includes(id);
    },
    sync() {
      $$('.pc__heart, .js-wishlist').forEach((b) => {
        const id = b.getAttribute('data-product-id');
        b.classList.toggle('is-active', this.has(id));
      });
    },
  };

  /* --------------------------------------------------------------- Delegation */
  document.addEventListener('click', function (e) {
    // add to cart
    const add = e.target.closest('[data-add-to-cart]');
    if (add) { e.preventDefault(); handleAdd(add); return; }

    // open / close cart
    if (e.target.closest('[data-cart-toggle]')) { e.preventDefault(); Drawer.open(); return; }
    if (e.target.closest('[data-cart-close]') || e.target.classList.contains('cart-drawer-overlay')) {
      Drawer.close(); return;
    }

    // cart qty change
    const qtyBtn = e.target.closest('.js-qty');
    if (qtyBtn) {
      e.preventDefault();
      const line = parseInt(qtyBtn.getAttribute('data-line'), 10);
      const qty = parseInt(qtyBtn.getAttribute('data-qty'), 10);
      Cart.change(line, qty).then((cart) => Drawer.render(cart));
      return;
    }

    // wishlist
    const wish = e.target.closest('.pc__heart, .js-wishlist');
    if (wish) {
      e.preventDefault();
      const active = Wishlist.toggle(wish.getAttribute('data-product-id'));
      wish.classList.toggle('is-active', active);
      const lbl = wish.querySelector('.js-wish-label');
      if (lbl) lbl.textContent = active ? 'Saved to Wishlist' : 'Save for Later';
      return;
    }

    // mobile menu
    if (e.target.closest('[data-menu-open]')) { document.body.classList.add('menu-open'); $('.mobile-menu').classList.add('is-open'); $('.drawer-overlay').style.display = 'block'; return; }
    if (e.target.closest('[data-menu-close]') || e.target.classList.contains('drawer-overlay')) {
      document.body.classList.remove('menu-open'); const mm = $('.mobile-menu'); if (mm) mm.classList.remove('is-open'); const ov = $('.drawer-overlay'); if (ov) ov.style.display = 'none'; return;
    }

    // carousel nav
    const navBtn = e.target.closest('.carousel__btn');
    if (navBtn) {
      const track = navBtn.closest('.carousel').querySelector('.carousel__track');
      const dir = navBtn.getAttribute('data-dir') === 'prev' ? -1 : 1;
      track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' });
      return;
    }

    // promo tab dismiss
    if (e.target.closest('[data-promo-dismiss]')) {
      const t = e.target.closest('.promo-tab'); if (t) t.classList.add('is-hidden'); return;
    }

    // accordion
    const accBtn = e.target.closest('.accordion__btn');
    if (accBtn) {
      accBtn.closest('.accordion__item').classList.toggle('is-open');
      return;
    }

    // close open dropdowns/facets when clicking elsewhere
    if (!e.target.closest('.facet')) $$('.facet.is-open').forEach((f) => f.classList.remove('is-open'));
  });

  // Esc closes cart + menu
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      Drawer.close();
      document.body.classList.remove('menu-open');
      const mm = $('.mobile-menu'); if (mm) mm.classList.remove('is-open');
      const ov = $('.drawer-overlay'); if (ov) ov.style.display = 'none';
    }
  });

  /* ----------------------------------------------------- Facet dropdowns (PLP) */
  document.addEventListener('click', function (e) {
    const fbtn = e.target.closest('.facet__btn');
    if (fbtn) {
      e.preventDefault();
      const facet = fbtn.closest('.facet');
      const wasOpen = facet.classList.contains('is-open');
      $$('.facet.is-open').forEach((f) => f.classList.remove('is-open'));
      if (!wasOpen) facet.classList.add('is-open');
    }
  });

  /* --------------------------------------------- Mobile filter panel toggle */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-mobile-filters]')) {
      const p = $('.plp-mobile-filters');
      if (p) p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
    }
  });

  /* ------------------------------------------------------------ PDP behaviour */
  function initProductForm(form) {
    const variants = JSON.parse(form.getAttribute('data-variants') || '[]');
    const addBtn = $('[data-add-to-cart]', form);
    const priceNow = $('.js-price-now', form);
    const priceMember = $('.js-price-member', form);
    const qtyInput = $('.js-qty-input', form);
    const discount = (window.mazahMemberDiscount || 10) / 100;

    function selectVariant(variantId) {
      const v = variants.find((x) => String(x.id) === String(variantId));
      if (!v) return;
      if (addBtn) {
        addBtn.setAttribute('data-variant-id', v.id);
        addBtn.disabled = !v.available;
      }
      const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
      if (priceNow) priceNow.textContent = money(v.price * qty);
      if (priceMember) priceMember.textContent = money(Math.round(v.price * (1 - discount)));
    }

    $$('.size-btn', form).forEach((btn) => {
      btn.addEventListener('click', function () {
        $$('.size-btn', form).forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        selectVariant(btn.getAttribute('data-variant-id'));
      });
    });

    // quantity stepper
    $$('[data-qty-step]', form).forEach((b) => {
      b.addEventListener('click', function () {
        if (!qtyInput) return;
        const step = parseInt(b.getAttribute('data-qty-step'), 10);
        let v = (parseInt(qtyInput.value, 10) || 1) + step;
        v = Math.max(1, Math.min(10, v));
        qtyInput.value = v;
        const active = $('.size-btn.is-active', form) || $('.size-btn', form);
        if (active) selectVariant(active.getAttribute('data-variant-id'));
      });
    });

    const initial = $('.size-btn.is-active', form) || $('.size-btn', form);
    if (initial) selectVariant(initial.getAttribute('data-variant-id'));
  }

  /* ----------------------------------------------------------- Image gallery */
  function initGallery(gallery) {
    const main = $('.gallery__main img', gallery);
    $$('.gallery__thumb', gallery).forEach((thumb) => {
      thumb.addEventListener('click', function () {
        $$('.gallery__thumb', gallery).forEach((t) => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
        const src = thumb.getAttribute('data-full');
        if (main && src) main.src = src;
      });
    });
  }

  /* -------------------------------------------------------------- Reveal obs */
  function initReveals() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '-80px' });
    $$('.reveal').forEach((el) => io.observe(el));
  }

  /* -------------------------------------------------------------- Boot */
  function boot() {
    Wishlist.sync();
    Drawer.refresh();
    $$('[data-product-form]').forEach(initProductForm);
    $$('.gallery').forEach(initGallery);
    initReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
