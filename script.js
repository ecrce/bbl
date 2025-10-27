// script.js

const BACKEND_BASE = "https://bbl-liart.vercel.app"; // <-- change to your deployed Vercel backend origin

async function refreshBatchInfo() {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/orders`);
    const data = await res.json();

    // data.currentBatch = { startISO, readyISO, ovensUsed }
    if (data && data.currentBatch) {
      const start = new Date(data.currentBatch.startISO);
      const ready = new Date(data.currentBatch.readyISO);

      document.getElementById("batchStart").textContent =
        start.toLocaleTimeString("en-US", {hour:"numeric",minute:"2-digit"});
      document.getElementById("batchReady").textContent =
        ready.toLocaleTimeString("en-US", {hour:"numeric",minute:"2-digit"});

      document.getElementById("ovensUsed").textContent =
        data.currentBatch.ovensUsed ?? 0;
    }
  } catch (err) {
    console.error("batch info error", err);
  }
}

// run once + poll
refreshBatchInfo();
setInterval(refreshBatchInfo, 60000);

// handle order form
const form = document.getElementById("orderForm");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fd = new FormData(form);
  const customerName = fd.get("customerName");

  // loaf (radio)
  const loafType = fd.get("loafType");

  // dips (checkboxes)
  const extras = fd.getAll("extras"); // array of strings

  // POST to backend to create stripe checkout
  const payload = {
    customerName,
    loafType,
    extras,
  };

  try {
    const res = await fetch(`${BACKEND_BASE}/api/create-checkout-session`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      alert("error creating checkout");
      return;
    }

    const out = await res.json();
    if (out && out.url) {
      window.location.href = out.url;
    } else {
      alert("no checkout url");
    }
  } catch (err) {
    console.error(err);
    alert("checkout failed");
  }
});
