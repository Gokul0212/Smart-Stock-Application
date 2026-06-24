<script>
  import { authUser } from '$lib/auth.js';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { dbGetUserOrders, dbGetProducts } from '$lib/firebase.js';

  let currentUser = $state(null);
  let orders = $state([]);
  let products = $state([]);
  let loading = $state(true);

  const unsubscribe = authUser.subscribe(val => {
    currentUser = val;
    if (typeof window !== 'undefined' && !val) {
      goto('/login');
    }
  });

  onMount(async () => {
    if (currentUser) {
      try {
        products = await dbGetProducts();
        const rawOrders = await dbGetUserOrders(currentUser.id);
        
        // Match order details with product images and descriptors
        orders = rawOrders.map(o => {
          const prod = products.find(p => p.id === o.productId);
          return {
            ...o,
            product: prod || { name: o.productName || "Hardware Component", imageUrl: "" }
          };
        }).sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));

      } catch (e) {
        console.error("Failed to load orders:", e);
      } finally {
        loading = false;
      }
    }
  });

  onDestroy(() => {
    unsubscribe();
  });

  function formatDate(dateStr) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  }
</script>

<div class="orders-page">
  <div class="orders-container">
    <div class="header-row">
      <h1>Your Order History</h1>
      <button class="shop-btn" onclick={() => goto('/dashboard')}>Shop More</button>
    </div>

    {#if loading}
      <p class="status-msg">Compiling transaction history...</p>
    {:else if orders.length === 0}
      <div class="empty-orders-box">
        <span class="empty-icon">📦</span>
        <h2>No Orders Found</h2>
        <p>You haven't purchased any hardware components yet.</p>
        <button class="shop-btn-large" onclick={() => goto('/dashboard')}>Explore Catalog</button>
      </div>
    {:else}
      <div class="orders-list">
        {#each orders as order (order.orderId)}
          <div class="order-card">
            <!-- Header section of order -->
            <div class="order-header">
              <div class="header-group">
                <span class="header-label">ORDER PLACED</span>
                <span class="header-val">{formatDate(order.purchaseDate)}</span>
              </div>
              <div class="header-group">
                <span class="header-label">TOTAL AMOUNT</span>
                <span class="header-val total-amt">₹{Number(order.totalPrice).toLocaleString('en-IN')}</span>
              </div>
              <div class="header-group">
                <span class="header-label">ORDER ID</span>
                <span class="header-val id-val">{order.orderId}</span>
              </div>
              <div class="header-group align-right">
                <span class="status-badge confirmed">{order.orderStatus || 'Confirmed'}</span>
              </div>
            </div>

            <!-- Body section of order -->
            <div class="order-body">
              <div class="product-item">
                <img 
                  src={order.product.imageUrl} 
                  alt={order.product.name} 
                  onerror={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&auto=format&fit=crop&q=60'; }}
                />
                <div class="product-info">
                  <button type="button" class="order-product-link" onclick={() => goto(`/products/${order.productId}`)}>{order.product.name}</button>
                  <span class="details">Quantity: <strong>{order.quantity}</strong> unit(s)</span>
                  <span class="details">Price per unit: <strong>₹{Math.round(order.totalPrice / order.quantity).toLocaleString('en-IN')}</strong></span>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .orders-page {
    background-color: #0b0b0b;
    min-height: calc(100vh - 65px);
    padding: 40px 20px;
    box-sizing: border-box;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .orders-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }

  .header-row h1 {
    font-size: 28px;
    font-weight: 800;
    margin: 0;
  }

  .shop-btn {
    background-color: transparent;
    color: #e50914;
    border: 1px solid #e50914;
    padding: 8px 18px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .shop-btn:hover {
    background-color: #e50914;
    color: white;
  }

  .status-msg {
    color: #888;
    text-align: center;
    padding: 50px;
  }

  /* Empty State */
  .empty-orders-box {
    background-color: #141414;
    border: 1px solid #222;
    border-radius: 8px;
    padding: 60px 20px;
    text-align: center;
    max-width: 500px;
    margin: 40px auto 0 auto;
  }

  .empty-icon {
    font-size: 50px;
    display: block;
    margin-bottom: 20px;
    color: #555;
  }

  .empty-orders-box h2 {
    font-size: 22px;
    font-weight: 750;
    margin: 0 0 10px 0;
  }

  .empty-orders-box p {
    color: #888;
    margin: 0 0 25px 0;
    font-size: 14px;
  }

  .shop-btn-large {
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

  .shop-btn-large:hover {
    background-color: #b20710;
  }

  /* Orders List */
  .orders-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .order-card {
    background-color: #141414;
    border: 1px solid #222;
    border-radius: 6px;
    overflow: hidden;
  }

  .order-card:hover {
    border-color: #333;
  }

  .order-header {
    background-color: #1a1a1a;
    border-bottom: 1px solid #222;
    padding: 15px 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
    font-size: 11px;
  }

  .header-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .header-label {
    color: #777777;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .header-val {
    color: #cccccc;
    font-weight: 500;
  }

  .total-amt {
    color: #ffffff;
    font-weight: 700;
  }

  .id-val {
    font-family: monospace;
    font-size: 12px;
  }

  .align-right {
    margin-left: auto;
    align-self: center;
  }

  .status-badge {
    font-size: 10px;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .confirmed {
    background-color: rgba(46, 125, 50, 0.15);
    color: #4caf50;
    border: 1px solid rgba(46, 125, 50, 0.3);
  }

  /* Order Body */
  .order-body {
    padding: 20px;
  }

  .product-item {
    display: flex;
    gap: 20px;
    align-items: center;
  }

  .product-item img {
    width: 70px;
    height: 70px;
    object-fit: cover;
    border-radius: 4px;
    background-color: #0b0b0b;
    border: 1px solid #222;
  }

  .product-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .product-info h3 {
    margin: 0 0 4px 0;
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
    transition: color 0.2s;
  }

  .product-info h3:hover {
    color: #e50914;
  }

  .product-info .details {
    font-size: 12px;
    color: #aaaaaa;
  }

  .product-info strong {
    color: #ffffff;
  }

  @media (max-width: 600px) {
    .order-header {
      gap: 15px;
    }
    .align-right {
      margin-left: 0;
      width: 100%;
    }
    .product-item {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
