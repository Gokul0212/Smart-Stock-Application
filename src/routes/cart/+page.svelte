<script>
  import { authUser } from '$lib/auth.js';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { dbGetCart, dbGetProducts, dbUpdateCartQuantity, dbRemoveFromCart } from '$lib/firebase.js';

  let currentUser = $state(null);
  let cartItems = $state([]);
  let products = $state([]);
  let loading = $state(true);

  const unsubscribe = authUser.subscribe(val => {
    currentUser = val;
    if (typeof window !== 'undefined' && !val) {
      goto('/login');
    }
  });

  onMount(async () => {
    await fetchCartAndProducts();
    loading = false;
  });

  onDestroy(() => {
    unsubscribe();
  });

  async function fetchCartAndProducts() {
    if (!currentUser) return;
    try {
      products = await dbGetProducts();
      const rawCart = await dbGetCart(currentUser.id);
      
      // Match cart items with product specifications
      cartItems = rawCart.map(c => {
        const prod = products.find(p => p.id === c.productId);
        return {
          ...c,
          product: prod || { name: "Unknown Hardware", price: 0, stock: 0, imageUrl: "" }
        };
      });
    } catch (e) {
      console.error("Error loading cart details:", e);
    }
  }

  async function adjustQuantity(productId, currentQty, delta, stockLimit) {
    const newQty = currentQty + delta;
    if (newQty < 1 || newQty > stockLimit) return;
    
    try {
      await dbUpdateCartQuantity(currentUser.id, productId, newQty);
      // Update local state reactively
      const item = cartItems.find(c => c.productId === productId);
      if (item) item.quantity = newQty;
    } catch (e) {
      alert("Failed to adjust quantity.");
    }
  }

  async function handleRemove(productId) {
    if (confirm("Remove this hardware component from your cart?")) {
      try {
        await dbRemoveFromCart(currentUser.id, productId);
        cartItems = cartItems.filter(c => c.productId !== productId);
      } catch (e) {
        alert("Failed to remove item.");
      }
    }
  }

  // Calculated properties (derived reactively)
  let subtotal = $derived(
    cartItems.reduce((acc, item) => acc + (Number(item.product.price) * item.quantity), 0)
  );

  let totalItemsCount = $derived(
    cartItems.reduce((acc, item) => acc + item.quantity, 0)
  );
</script>

<div class="cart-page">
  <div class="cart-container">
    <h1>Your Shopping Cart</h1>

    {#if loading}
      <p class="status-msg">Retrieving cart contents...</p>
    {:else if cartItems.length === 0}
      <div class="empty-cart-box">
        <span class="empty-icon">🛒</span>
        <h2>Your Cart is Empty</h2>
        <p>Browse our catalog of elite hardware components to get started.</p>
        <button class="shop-btn" onclick={() => goto('/dashboard')}>Explore Catalog</button>
      </div>
    {:else}
      <div class="cart-layout">
        <!-- Cart Items List -->
        <div class="cart-items-list">
          {#each cartItems as item (item.cartId)}
            <div class="cart-item">
              <button type="button" class="item-img" onclick={() => goto(`/products/${item.productId}`)}>
                <img src={item.product.imageUrl} alt={item.product.name} />
              </button>

              <div class="item-details">
                <button type="button" class="item-link" onclick={() => goto(`/products/${item.productId}`)}>{item.product.name}</button>
                <span class="category">{item.product.category}</span>
                <span class="stock-info {item.product.stock < 5 ? 'critical' : ''}">
                  {#if item.product.stock === 0}
                    Out of Stock
                  {:else if item.product.stock < 5}
                    Only {item.product.stock} units left
                  {:else}
                    In Stock
                  {/if}
                </span>
              </div>

              <div class="item-quantity">
                <div class="qty-widget">
                  <button 
                    onclick={() => adjustQuantity(item.productId, item.quantity, -1, item.product.stock)} 
                    disabled={item.quantity <= 1}
                  >-</button>
                  <span class="qty-val">{item.quantity}</span>
                  <button 
                    onclick={() => adjustQuantity(item.productId, item.quantity, 1, item.product.stock)} 
                    disabled={item.quantity >= item.product.stock}
                  >+</button>
                </div>
              </div>

              <div class="item-pricing">
                <span class="item-total">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                <span class="unit-price">₹{Number(item.product.price).toLocaleString('en-IN')} each</span>
              </div>

              <button class="remove-btn" onclick={() => handleRemove(item.productId)} title="Remove item">
                ×
              </button>
            </div>
          {/each}
        </div>

        <!-- Order Summary Card -->
        <div class="summary-card">
          <h2>Order Summary</h2>
          
          <div class="summary-rows">
            <div class="summary-row">
              <span>Total Items</span>
              <span>{totalItemsCount} units</span>
            </div>
            <div class="summary-row">
              <span>Shipping</span>
              <span class="free-badge">FREE</span>
            </div>
            <div class="summary-row divider"></div>
            <div class="summary-row total-row">
              <span>Est. Total</span>
              <span class="total-price text-glow">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button class="checkout-btn" onclick={() => goto('/checkout')}>
            Proceed to Checkout
          </button>
          
          <button class="continue-btn" onclick={() => goto('/dashboard')}>
            ← Continue Shopping
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .cart-page {
    background-color: #0b0b0b;
    min-height: calc(100vh - 65px);
    padding: 40px 20px;
    box-sizing: border-box;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .cart-container {
    max-width: 1100px;
    margin: 0 auto;
  }

  .cart-container h1 {
    font-size: 28px;
    font-weight: 800;
    margin: 0 0 30px 0;
  }

  .status-msg {
    color: #888;
    text-align: center;
    padding: 50px;
  }

  /* Empty Cart style */
  .empty-cart-box {
    background-color: #141414;
    border: 1px solid #222;
    border-radius: 8px;
    padding: 60px 20px;
    text-align: center;
    max-width: 600px;
    margin: 40px auto 0 auto;
  }

  .empty-icon {
    font-size: 50px;
    display: block;
    margin-bottom: 20px;
    color: #555;
  }

  .empty-cart-box h2 {
    font-size: 22px;
    font-weight: 750;
    margin: 0 0 10px 0;
  }

  .empty-cart-box p {
    color: #888;
    margin: 0 0 25px 0;
    font-size: 14px;
  }

  .shop-btn {
    background-color: #e50914;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 12px 30px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .shop-btn:hover {
    background-color: #b20710;
  }

  /* Split layout */
  .cart-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 30px;
    align-items: flex-start;
  }

  /* Cart Items List */
  .cart-items-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .cart-item {
    background-color: #141414;
    border: 1px solid #222;
    border-radius: 6px;
    padding: 16px;
    display: flex;
    align-items: center;
    position: relative;
    gap: 20px;
  }

  .cart-item:hover {
    border-color: #333;
  }

  .item-img {
    width: 80px;
    height: 80px;
    border-radius: 4px;
    overflow: hidden;
    background-color: #0b0b0b;
    border: 1px solid #222;
    cursor: pointer;
    flex-shrink: 0;
  }

  .item-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .item-details {
    flex-grow: 1;
    min-width: 180px;
  }

  .item-details h3 {
    margin: 0 0 5px 0;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    transition: color 0.2s;
  }

  .item-details h3:hover {
    color: #e50914;
  }

  .item-details .category {
    font-size: 11px;
    color: #888;
    display: block;
    margin-bottom: 5px;
  }

  .stock-info {
    font-size: 11px;
    color: #4caf50;
    font-weight: 600;
  }

  .stock-info.critical {
    color: #ff4d4d;
  }

  /* Quantity Controls Widget */
  .qty-widget {
    display: flex;
    align-items: center;
    border: 1px solid #333;
    border-radius: 4px;
    background-color: #1a1a1a;
  }

  .qty-widget button {
    background: transparent;
    border: none;
    color: #fff;
    width: 30px;
    height: 30px;
    cursor: pointer;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .qty-widget button:hover:not(:disabled) {
    color: #e50914;
    background-color: #222;
  }

  .qty-widget button:disabled {
    color: #444;
    cursor: not-allowed;
  }

  .qty-val {
    padding: 0 10px;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
  }

  /* Pricing details */
  .item-pricing {
    text-align: right;
    width: 120px;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .item-total {
    font-size: 16px;
    font-weight: 800;
    color: #fff;
  }

  .unit-price {
    font-size: 11px;
    color: #666;
  }

  /* Remove Button */
  .remove-btn {
    background: transparent;
    border: none;
    color: #555;
    font-size: 22px;
    cursor: pointer;
    padding: 5px;
    line-height: 1;
    position: absolute;
    top: 10px;
    right: 12px;
    transition: color 0.2s;
  }

  .remove-btn:hover {
    color: #e50914;
  }

  /* Order Summary Card */
  .summary-card {
    background-color: #141414;
    border: 1px solid #222;
    border-radius: 8px;
    padding: 24px;
  }

  .summary-card h2 {
    font-size: 18px;
    font-weight: 750;
    margin: 0 0 20px 0;
    border-bottom: 1px solid #222;
    padding-bottom: 12px;
  }

  .summary-rows {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: #aaaaaa;
  }

  .summary-row.divider {
    border-top: 1px solid #222;
    margin: 5px 0;
  }

  .free-badge {
    color: #4caf50;
    font-weight: 700;
  }

  .total-row {
    color: #ffffff;
    font-weight: 700;
    font-size: 15px;
  }

  .total-price {
    font-size: 20px;
    font-weight: 900;
    color: #e50914;
  }

  .checkout-btn {
    width: 100%;
    background-color: #e50914;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 14px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.2s, box-shadow 0.2s;
    margin-bottom: 10px;
  }

  .checkout-btn:hover {
    background-color: #b20710;
    box-shadow: 0 0 15px rgba(229, 9, 20, 0.4);
  }

  .continue-btn {
    width: 100%;
    background-color: transparent;
    color: #888;
    border: 1px solid #333;
    border-radius: 4px;
    padding: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .continue-btn:hover {
    color: #fff;
    border-color: #555;
    background-color: #1a1a1a;
  }

  @media (max-width: 900px) {
    .cart-layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .cart-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding-top: 30px;
    }
    
    .item-pricing {
      text-align: left;
    }
    
    .qty-widget {
      align-self: flex-start;
    }
  }
</style>
