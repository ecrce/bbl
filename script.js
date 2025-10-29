/* cart + checkout logic for ballard bread lab */

/* PUBLIC ENDPOINT for your Vercel backend API */
const CHECKOUT_ENDPOINT = "/api/checkout";

/* ---------------- CART STATE ---------------- */

function loadCart() {
  try {
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(name, price) {
  const cart = loadCart();
  cart.push({ name, price });
  saveCart(cart);
  renderCart();
  openCart();
}

function removeFromCart(index) {
  const cart = loadCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

/* ---------------- PICKUP WINDOW ---------------- */

let selectedPickupWindow = {
  code: "midnight",
  label: "Midnight Batch",
  time: "12 AM – 1 AM",
  hint: "usually Ballard / Magnolia waterfront hand-off"
};

function setPickupWindow(code) {
  const map = {
    midnight: {
      label: "Midnight Batch",
      time: "12 AM – 1 AM",
      hint: "usually Ballard / Magnolia waterfront hand-off"
    },
    dawn: {
      label: "Dawn Batch",
      time: "5 AM – 6 AM",
      hint: "early hand-off, fewer people around"
    },
    noon: {
      label: "Noon Batch",
      time: "12 PM – 1 PM",
      hint: "casual hand-off, more public"
    }
  };

  if (!map[code]) return;

  selectedPickupWindow = {
    code,
    label: map[code].label,
    time: map[code].time,
    hint: map[code].hint
  };

  // reflect in UI if you have elements to show current choice
  const winLabel = document.getElementById("pickupChoiceLabel");
  const winHint = document.getElementById("pickupChoiceHint");
  if (winLabel) {
    winLabel.textContent =
      selectedPickupWindow.label + " | " + selectedPickupWindow.time;
  }
  if (winHint) {
    winHint.textContent = selectedPickupWindow.hint;
  }
}

function pickupWindowSummary() {
  return `${selectedPickupWindow.label} | ${selectedPickupWindow.time}`;
}

/* ---------------- RENDER CART ---------------- */

function renderCart() {
  const cart = loadCart();
  const cartItemsEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!cartItemsEl || !totalEl) return;

  if (!cart.length) {
    cartItemsEl.classList.add("empty-msg");
    cartItemsEl.innerHTML = "Cart is empty.";
    totalEl.textContent = "0.00";
    return;
  }

  cartItemsEl.classList.remove("empty-msg");

  const lines = cart.map((item, idx) => {
    return `
      <div class="cart-line">
        <div class="cart-line-main">
          <div class="cart-line-name">${item.name}</div>
          <div class="cart-line-price">$${Number(item.price).toFixed(2)}</div>
        </div>
        <button
          class="cart-remove-btn"
          onclick="removeFromCart(${idx})"
        >
          remove
        </button>
      </div>
    `;
  });

  cartItemsEl.innerHTML = lines.join("");

  const total = cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
  totalEl.textContent = total.toFixed(2);
}

/* ---------------- CART SIDEBAR TOGGLE ---------------- */

function openCart() {
  const aside = document.querySelector(".cart-col");
  if (aside) aside.classList.add("open");
}

function closeCart() {
  const aside = document.querySelector(".cart-col");
  if (aside) aside.classList.remove("open");
}

/* ---------------- PAYMENT MODAL ---------------- */

function openPayModal() {
  const modal = document.getElementById("payModal");
  if (modal) modal.classList.remove("hidden");
}

function closePayModal() {
  const modal = document.getElementById("payModal");
  if (modal) modal.classList.add("hidden");
}

/* ---------------- CHECKOUT (STRIPE) ---------------- */

async function checkoutStripe() {
  const cart = loadCart();
  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  const buyerName = document.getElementById("buyerName")?.value.trim() || "";
  const buyerPhone = document.getElementById("buyerPhone")?.value.trim() || "";
  const buyerEmail = document.getElementById("buyerEmail")?.value.trim() || "";

  if (!buyerName || !buyerPhone || !buyerEmail) {
    alert("Please fill name / phone / email.");
    return;
  }

  const payload = {
    items: cart.map(i => ({
      name: i.name,
      price: i.price // server will ignore/override price, but keep name
    })),
    pickupWindow: pickupWindowSummary(),
    name: buyerName,
    phone: buyerPhone,
    email: buyerEmail
  };

  try {
    const res = await fetch(CHECKOUT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      alert("Checkout unavailable.");
      return;
    }

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Checkout error.");
    }
  } catch (err) {
    alert("Network error.");
  }
}

/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  renderCart();
});

// expose functions used inline in HTML onclick=""
window.addToCart = addToCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.openPayModal = openPayModal;
window.closePayModal = closePayModal;
window.setPickupWindow = setPickupWindow;
window.checkoutStripe = checkoutStripe;
