// [Unverified] Simple cart logic stored in localStorage so index.html and gift.html
// can see the same cart between pages. No backend, no payment logic.

const CART_KEY = "ballardBreadLabCart";
const WINDOW_KEY = "ballardBreadLabPickupWindow";

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
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
  let total = 0;
  for (const item of cart) {
    // price may be undefined; treat as 0
    total += item.price ? Number(item.price) : 0;
  }
  return total;
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
    cartItemsEl.innerHTML = cart
      .map((item, idx) => {
        return `
        <div class="cart-line">
          <div>
            <div class="cart-line-title">${item.name}</div>
            <div class="cart-line-sub">$${item.price} [Unverified]</div>
          </div>
          <button class="remove-btn" onclick="removeFromCart(${idx})">
            remove
          </button>
        </div>`;
      })
      .join("");
  }

  const total = calcTotal(cart).toFixed(2);
  cartTotalEl.textContent = total;
}

// pickup window selection
function setPickupWindow(windowName) {
  localStorage.setItem(WINDOW_KEY, windowName);
}

// on load, render cart and sync pickup window highlight
document.addEventListener("DOMContentLoaded", () => {
  renderCart();

  const storedWindow = localStorage.getItem(WINDOW_KEY);
  if (storedWindow) {
    const radios = document.querySelectorAll('input[name="pickupWindow"]');
    radios.forEach(r => {
      if (r.value === storedWindow) {
        r.checked = true;
      }
    });
  }
});
