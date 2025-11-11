// RightDestiny - Carrinho de compras usando localStorage
// Chave de armazenamento
(function(){
  const STORAGE_KEY = 'rd_cart_v1';

  function safeParse(json, fallback){
    try { return JSON.parse(json); } catch(_) { return fallback; }
  }

  function currencyToNumber(text){
    if (typeof text === 'number') return text;
    if (!text) return 0;
    // Remove qualquer coisa que não seja dígito, vírgula ou ponto
    let t = String(text).trim();
    // Troca vírgula por ponto e remove símbolos
    t = t.replace(/[R$€£¥\s]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(t.replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  function numberToBRL(n){
    try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n); }
    catch(_) { return 'R$ ' + (Math.round((n||0)*100)/100).toFixed(2).replace('.', ','); }
  }

  const Cart = {
    load(){
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = safeParse(raw, []);
      if (!Array.isArray(arr)) return [];
      return arr.map(i => ({
        id: i.id,
        name: i.name,
        price: Number(i.price) || 0,
        qty: Number(i.qty) || 1,
        image: i.image || null,
        url: i.url || null,
        type: i.type || null,
      }));
    },
    save(items){
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items || []));
      this.updateNavbarCount();
    },
    clear(){ this.save([]); },
    getItems(){ return this.load(); },
    getCount(){ return this.getItems().reduce((a, i) => a + (Number(i.qty)||0), 0); },
    getTotal(){ return this.getItems().reduce((a, i) => a + (Number(i.qty)||0) * (Number(i.price)||0), 0); },
    add(item){
      if (!item || !item.id) return;
      const items = this.load();
      const idx = items.findIndex(i => i.id === item.id);
      if (idx >= 0){
        items[idx].qty = (Number(items[idx].qty)||0) + (Number(item.qty)||1);
      } else {
        items.push({
          id: item.id,
          name: item.name || 'Item',
          price: Number(item.price)||0,
          qty: Number(item.qty)||1,
          image: item.image || null,
          url: item.url || null,
          type: item.type || null,
        });
      }
      this.save(items);
    },
    remove(id){
      const items = this.load().filter(i => i.id !== id);
      this.save(items);
    },
    updateQuantity(id, qty){
      let q = Number(qty)||0;
      const items = this.load();
      const idx = items.findIndex(i => i.id === id);
      if (idx < 0) return;
      if (q <= 0){
        items.splice(idx, 1);
      } else {
        items[idx].qty = q;
      }
      this.save(items);
    },
    // Navbar
    updateNavbarCount(){
      const el = document.getElementById('menu-carrinho');
      if (!el) return;
      const count = this.getCount();
      const badge = el.querySelector('.cart-count');
      if (badge) badge.textContent = String(count);
    },
    ensureNavbar(){
      const navList = document.querySelector('#ftco-nav .navbar-nav');
      if (!navList) return;
      if (document.getElementById('menu-carrinho')) return;
      const li = document.createElement('li');
      li.className = 'nav-item';
      li.id = 'menu-carrinho';
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.justifyContent = 'center';
      li.innerHTML = `
        <a href="8carrinho.html" class="nav-link" title="Carrinho">
          <i class="ion-android-cart" style="font-size:20px;"></i>
          <span class="cart-count" style="margin-left:6px; background:#ff4b5c; color:#fff; border-radius:10px; padding:2px 6px; font-size:12px;">0</span>
        </a>`;
      navList.appendChild(li);
    },
    // Botões nos cards
    attachAddButtons(){
      const cards = document.querySelectorAll('.destination');
      cards.forEach(card => {
        if (card.querySelector('.btn-add-cart')) return;
        const name = (card.querySelector('.text h3 a')?.textContent || card.querySelector('.nomes-card')?.textContent || 'Item').trim();
        const priceText = card.querySelector('.two .price')?.textContent || '';
        const price = currencyToNumber(priceText);
        const link = card.querySelector('a.img');
        const url = link?.getAttribute('href') || location.pathname + '#' + name;
        const style = link?.getAttribute('style') || '';
        const m = style.match(/url\(([^)]+)\)/i);
        const image = m ? m[1].replace(/['"]/g,'') : null;
        const id = url || name;

        const bottom = card.querySelector('.text .bottom-area');
        const target = bottom || card.querySelector('.text');
        if (!target) return;

        const btnWrap = document.createElement('span');
        btnWrap.className = bottom ? 'ml-auto' : '';
        btnWrap.innerHTML = `<button class="btn btn-primary btn-add-cart" type="button">Adicionar ao carrinho</button>`;
        target.appendChild(btnWrap);

        const btn = btnWrap.querySelector('.btn-add-cart');
        btn.addEventListener('click', () => {
          Cart.add({ id, name, price, qty: 1, image, url });
          Cart.updateNavbarCount();
          try { btn.textContent = 'Adicionado!'; setTimeout(()=> btn.textContent = 'Adicionar ao carrinho', 1200);} catch(_){ }
        });
      });
    },
    // Render simples para a página do carrinho
    renderCartPage(){
      const list = document.getElementById('cart-items');
      if (!list) return;
      const items = this.getItems();
      list.innerHTML = '';
      if (!items.length){
        list.innerHTML = '<p>Seu carrinho está vazio.</p>';
      } else {
        items.forEach(it => {
          const row = document.createElement('div');
          row.className = 'cart-row d-flex align-items-center mb-3';
          row.innerHTML = `
            <div style="width:70px; height:70px; background-size:cover; background-position:center; border-radius:6px; background-image:url('${(it.image||'images/bg_1.jpg')}')"></div>
            <div style="flex:1; margin-left:12px;">
              <div style="font-weight:600;">${it.name}</div>
              <div style="color:#777; font-size:14px;">${numberToBRL(it.price)}</div>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <input type="number" min="1" value="${it.qty}" data-id="${it.id}" class="cart-qty form-control" style="width:70px;">
              <button class="btn btn-outline-danger btn-sm cart-remove" data-id="${it.id}">Remover</button>
            </div>`;
          list.appendChild(row);
        });
      }
      const totalEl = document.getElementById('cart-total');
      if (totalEl) totalEl.textContent = numberToBRL(this.getTotal());

      // Bind events
      list.querySelectorAll('.cart-qty').forEach(inp => {
        inp.addEventListener('change', (e) => {
          const id = e.target.getAttribute('data-id');
          const v = Math.max(1, Number(e.target.value)||1);
          e.target.value = String(v);
          Cart.updateQuantity(id, v);
          const totalEl2 = document.getElementById('cart-total');
          if (totalEl2) totalEl2.textContent = numberToBRL(Cart.getTotal());
        });
      });
      list.querySelectorAll('.cart-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          Cart.remove(id);
          Cart.renderCartPage();
        });
      });
      const clearBtn = document.getElementById('cart-clear');
      if (clearBtn){
        clearBtn.onclick = () => { Cart.clear(); Cart.renderCartPage(); };
      }
    },
  };

  // Exponha globalmente
  window.RightDestinyCart = Cart;

  // Inicialização
  document.addEventListener('DOMContentLoaded', function(){
    Cart.ensureNavbar();
    Cart.updateNavbarCount();
    Cart.attachAddButtons();
    Cart.renderCartPage();
  });
})();
