<script>
  import { authUser } from '$lib/auth.js';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { dbGetCart, dbGetProducts, dbClearCart } from '$lib/firebase.js';

  let currentUser = $state(null);
  let cartItems = $state([]);
  let products = $state([]);
  
  let loading = $state(true);
  let purchasing = $state(false);
  let success = $state(false);
  let errorMsg = $state('');

  // Shipping details inputs
  let address = $state('');
  let city = $state('');
  let zip = $state('');
  let cardName = $state('');
  let cardNumber = $state('');

  const unsubscribe = authUser.subscribe(val => {
    currentUser = val;
    if (typeof window !== 'undefined' && !val) {
      goto('/login');
    }
  });

  onMount(async () => {
    try {
      products = await dbGetProducts();
      const rawCart = await dbGetCart(currentUser.id);
      
      if (rawCart.length === 0) {
        goto('/cart');
        return;
      }

      cartItems = rawCart.map(c => {
        const prod = products.find(p => p.id === c.productId);
        return {
          ...c,
          product: prod || { name: "Unknown Component", price: 0, stock: 0, imageUrl: "" }
        };
      });
    } catch (e) {
      errorMsg = "Error loading checkout items: " + e.message;
    } finally {
      loading = false;
    }
  });

  onDestroy(() => {
    unsubscribe();
  });

  async function handleConfirmPurchase(e) {
    e.preventDefault();
    if (!address || !city || !zip || !cardName || !cardNumber) {
      errorMsg = "Please fill in all shipping and payment fields.";
      return;
    }

    purchasing = true;
    errorMsg = '';

    try {
      const purchasePayload = {
        userId: currentUser.id,
        username: currentUser.name || currentUser.username,
        email: currentUser.email,
        items: cartItems.map(c => ({
          productId: c.productId,
          quantity: c.quantity
        }))
      };

      // 1. Submit transaction to backend server route
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchasePayload)
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || "Failed to process transaction.");
      }

      // 2. Clear client-side cart
      await dbClearCart(currentUser.id);

      success = true;
      
      // Redirect to Order History after 3 seconds
      setTimeout(() => {
        goto('/orders');
      }, 3000);

    } catch (err) {
      errorMsg = err.message || "Checkout failed. Please try again.";
      purchasing = false;
    }
  }

  // Calculate pricing aggregates
  let totalAmount = $derived(
    cartItems.reduce((acc, item) => acc + (Number(item.product.price) * item.quantity), 0)
  );

  let totalItemsCount = $derived(
    cartItems.reduce((acc, item) => acc + item.quantity, 0)
  );
</script>

<div class="checkout-page">
  <div class="checkout-container">
    {#if success}
      <!-- Success View -->
      <div class="success-card">
        <span class="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color: #4caf50; width: 80px; height: 80px; display: inline-block;">
            <path d="M20 6L9 17l-5-5"></path>
          </svg>
        </span>
        <h2>Purchase Successful!</h2>
        <p class="success-desc">Thank you for your order! Your payment was processed successfully.</p>
        <div class="email-notice">
          <p>📧 A confirmation email has been sent to <strong>{currentUser?.email}</strong> detailing your order specifications.</p>
        </div>
        <p class="redirect-notice">Redirecting you to your Order History in a few seconds...</p>
        <button class="manual-btn" onclick={() => goto('/orders')}>Go to Orders Now</button>
      </div>
    {:else}
      <h1>Confirm Your Checkout</h1>
      
      {#if errorMsg}
        <div class="error-banner">
          <span class="error-icon">⚠️</span>
          <span class="error-text">{errorMsg}</span>
        </div>
      {/if}

      <div class="checkout-grid">
        <!-- Form Details (Shipping + Payment) -->
        <div class="details-section">
          <form onsubmit={handleConfirmPurchase} class="checkout-form">
            <!-- Shipping Info -->
            <div class="form-block">
              <h2>1. Delivery Address</h2>
              <div class="form-group full-width">
                <label for="address">Street Address</label>
                <input type="text" id="address" bind:value={address} placeholder="e.g. 104 Hardware Lane" required />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="city">City</label>
                  <input type="text" id="city" bind:value={city} placeholder="e.g. Bangalore" required />
                </div>
                <div class="form-group">
                  <label for="zip">Zip / Postal Code</label>
                  <input type="text" id="zip" bind:value={zip} placeholder="e.g. 560001" required />
                </div>
              </div>
            </div>

            <!-- Payment Info -->
            <div class="form-block border-top">
              <h2>2. Payment Information</h2>
              <div class="form-group full-width">
                <label for="cardName">Cardholder Name</label>
                <input type="text" id="cardName" bind:value={cardName} placeholder="e.g. John Doe" required />
              </div>
              <div class="form-group full-width">
                <label for="cardNumber">Card Number (Mock Payment)</label>
                <input type="text" id="cardNumber" bind:value={cardNumber} placeholder="xxxx-xxxx-xxxx-xxxx" required />
              </div>
            </div>

            <button type="submit" class="submit-order-btn" disabled={purchasing || loading}>
              {#if purchasing}Processing Checkout...{:else}Confirm Secure Purchase (₹{totalAmount.toLocaleString('en-IN')}){/if}
            </button>
          </form>
        </div>

        <!-- Order Summary panel (Right side) -->
        <div class="summary-section">
          <div class="summary-box">
            <h2>Order Summary</h2>
            
            <div class="checkout-items">
              {#each cartItems as item}
                <div class="checkout-item-row">
                  <img src={item.product.imageUrl} alt={item.product.name} />
                  <div class="item-meta">
                    <h4>{item.product.name}</h4>
                    <span class="qty">Qty: {item.quantity}</span>
                  </div>
                  <span class="price">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              {/each}
            </div>

            <div class="pricing-summary">
              <div class="row">
                <span>Shipping</span>
                <span class="green-text">FREE</span>
              </div>
              <div class="row divider"></div>
              <div class="row grand-total-row">
                <span>Grand Total</span>
                <span class="grand-total-price">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .checkout-page {
    background-color: #0b0b0b;
    min-height: calc(100vh - 65px);
    padding: 40px 20px;
    box-sizing: border-box;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .checkout-container {
    max-width: 1100px;
    margin: 0 auto;
  }

  .checkout-container h1 {
    font-size: 28px;
    font-weight: 800;
    margin: 0 0 30px 0;
  }

  /* Success Card Layout */
  .success-card {
    background-color: #141414;
    border: 1px solid #2e7d32;
    border-radius: 8px;
    padding: 60px 40px;
    text-align: center;
    max-width: 600px;
    margin: 40px auto 0 auto;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  }

  .success-icon {
    font-size: 60px;
    display: block;
    margin-bottom: 20px;
  }

  .success-card h2 {
    font-size: 26px;
    font-weight: 800;
    color: #4caf50;
    margin: 0 0 10px 0;
  }

  .success-desc {
    color: #cccccc;
    font-size: 15px;
    margin-bottom: 25px;
  }

  .email-notice {
    background-color: rgba(46, 125, 50, 0.1);
    border: 1px solid rgba(46, 125, 50, 0.2);
    border-radius: 6px;
    padding: 15px;
    max-width: 450px;
    margin: 0 auto 25px auto;
  }

  .email-notice p {
    margin: 0;
    color: #a5d6a7;
    font-size: 13px;
    line-height: 1.5;
  }

  .redirect-notice {
    font-size: 12px;
    color: #666;
    margin-bottom: 20px;
  }

  .manual-btn {
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .manual-btn:hover {
    background-color: #388e3c;
  }

  /* Grid Layout split */
  .checkout-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 40px;
    align-items: flex-start;
  }

  .details-section {
    background-color: #141414;
    border: 1px solid #222;
    border-radius: 8px;
    padding: 30px;
  }

  .form-block h2 {
    font-size: 16px;
    font-weight: 750;
    color: #ffffff;
    margin: 0 0 20px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .border-top {
    border-top: 1px solid #222;
    padding-top: 25px;
    margin-top: 25px;
  }

  .checkout-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 15px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group.full-width {
    width: 100%;
  }

  .form-group label {
    font-size: 12px;
    color: #888888;
    font-weight: 600;
  }

  .form-group input {
    background-color: #222222;
    border: 1px solid #333;
    border-radius: 4px;
    padding: 12px;
    color: #fff;
    font-size: 14px;
    box-sizing: border-box;
  }

  .submit-order-btn {
    background-color: #e50914;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 15px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.2s, box-shadow 0.2s;
    margin-top: 10px;
  }

  .submit-order-btn:hover:not(:disabled) {
    background-color: #b20710;
    box-shadow: 0 0 15px rgba(229, 9, 20, 0.4);
  }

  .submit-order-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Order Summary column (Right) */
  .summary-section {
    position: sticky;
    top: 90px;
  }

  .summary-box {
    background-color: #141414;
    border: 1px solid #222;
    border-radius: 8px;
    padding: 24px;
  }

  .summary-box h2 {
    font-size: 16px;
    font-weight: 750;
    margin: 0 0 20px 0;
    border-bottom: 1px solid #222;
    padding-bottom: 12px;
  }

  .checkout-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 250px;
    overflow-y: auto;
    margin-bottom: 20px;
    padding-right: 5px;
  }

  .checkout-item-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .checkout-item-row img {
    width: 45px;
    height: 45px;
    object-fit: cover;
    border-radius: 4px;
    background-color: #0b0b0b;
    border: 1px solid #222;
  }

  .item-meta {
    flex-grow: 1;
  }

  .item-meta h4 {
    margin: 0 0 3px 0;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    max-width: 170px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-meta .qty {
    font-size: 10px;
    color: #888;
  }

  .checkout-item-row .price {
    font-size: 13px;
    font-weight: 700;
    color: #eee;
  }

  .pricing-summary {
    border-top: 1px solid #222;
    padding-top: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .pricing-summary .row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #888;
  }

  .pricing-summary .row.divider {
    border-top: 1px solid #222;
    margin: 3px 0;
  }

  .green-text {
    color: #4caf50;
    font-weight: 700;
  }

  .grand-total-row {
    color: #ffffff !important;
    font-weight: 700;
    font-size: 14px !important;
  }

  .grand-total-price {
    font-size: 18px;
    font-weight: 900;
    color: #e50914;
  }

  /* Errors */
  .error-banner {
    background-color: rgba(229, 9, 20, 0.15);
    border: 1px solid #e50914;
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 25px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .error-icon {
    font-size: 16px;
  }

  .error-text {
    color: #ff8888;
    font-size: 13px;
    font-weight: 500;
  }

  @media (max-width: 900px) {
    .checkout-grid {
      grid-template-columns: 1fr;
    }
    .summary-section {
      position: static;
    }
  }
</style>
