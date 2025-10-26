const CHECKOUT_ENDPOINT = "https://bbl-liart.vercel.app/api/create-checkout";
const CART_KEY = "ballardBreadLabCart";
const WINDOW_KEY = "ballardBreadLabPickupWindow";

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
}

function addToCart(name, price) {
  const cart = loadCart();
  cart.push({ name, price });
  saveCart(cart);
}

function removeFromCart(index) {
  const cart = loadCart();
  cart.splice(index, 1);
  saveCart(cart);
}

function calcTotal(cart) {
  return cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
}

function renderCart() {
  const cartItemsEl = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");
  if (!cartItemsEl || !cartTotalEl) return;

  const cart = loadCart();
  if (cart.length === 0) {
    cartItemsEl.classList.add("empty-msg");
    cartItemsEl.innerHTML = "Cart is empty.";
  } else {
    cartItemsEl.classList.remove("empty-msg");
    cartItemsEl.innerHTML = cart.map((item, idx) => `
      <div class="cart-line">
        <div>
          <div class="cart-line-title">${item.name}</div>
          <div class="cart-line-sub">$${item.price.toFixed(2)}</div>
        </div>
        <button class="remove-btn" onclick="removeFromCart(${idx})">remove</button>
      </div>
    `).join("");
  }
  cartTotalEl.textContent = calcTotal(cart).toFixed(2);
}

function setPickupWindow(windowName) {
  localStorage.setItem(WINDOW_KEY, windowName);
}

document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  const storedWindow = localStorage.getItem(WINDOW_KEY);
  if (storedWindow) {
    const radios = document.querySelectorAll('input[name="pickupWindow"]');
    radios.forEach(r => { if (r.value === storedWindow) r.checked = true; });
  }
});
