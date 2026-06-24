<script>
  import { authUser } from '$lib/auth.js';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { dbGetProducts, dbAddToCart } from '$lib/firebase.js';

  const productId = $page.params.id;

  let currentUser = $state(null);
  let product = $state(null);
  let quantity = $state(1);
  let loading = $state(true);
  let errorMsg = $state('');
  let adding = $state(false);
  let addSuccess = $state(false);

  const unsubscribe = authUser.subscribe(val => {
    currentUser = val;
    if (typeof window !== 'undefined' && !val) {
      goto('/login');
    }
  });

  onMount(async () => {
    try {
      const products = await dbGetProducts();
      product = products.find(p => p.id === productId);
      
      if (!product) {
        errorMsg = "Product not found.";
      }
    } catch (e) {
      errorMsg = "Error loading details: " + e.message;
    } finally {
      loading = false;
    }
  });

  onDestroy(() => {
    unsubscribe();
  });

  async function handleAddToCart() {
    if (!product || product.stock === 0) return;
    
    adding = true;
    try {
      await dbAddToCart(currentUser.id, product.id, quantity);
      addSuccess = true;
      setTimeout(() => {
        addSuccess = false;
      }, 2000);
    } catch (e) {
      alert("Failed to add items to cart.");
    } finally {
      adding = false;
    }
  }

  function adjustQuantity(delta) {
    if (!product) return;
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= product.stock) {
      quantity = newQty;
    }
  }
</script>

<div class="details-page">
  <div class="container">
    <button class="back-btn" onclick={() => goto('/dashboard')}>← Back to Catalog</button>

    {#if loading}
      <p class="status-text">Loading product details...</p>
    {:else}
      {#if errorMsg}
        <div class="error-box">
          <p>{errorMsg}</p>
          <button onclick={() => goto('/dashboard')}>Return to Catalog</button>
        </div>
      {:else if product}
        <div class="product-grid">
          <!-- Column 1: Image -->
          <div class="image-column">
            <div class="image-frame">
              <img src={product.imageUrl} alt={product.name} />
              {#if product.stock === 0}
                <div class="sold-out-overlay">SOLD OUT</div>
              {/if}
            </div>
          </div>

          <!-- Column 2: Specs & Cart controls -->
          <div class="specs-column">
            <span class="category-tag">{product.category}</span>
            <h1 class="product-title">{product.name}</h1>
            
            <div class="price-row">
              <span class="price-value">₹{Number(product.price).toLocaleString('en-IN')}</span>
              
              {#if product.stock === 0}
                <span class="status-badge sold-out">Out of Stock</span>
              {:else if product.stock < 5}
                <span class="status-badge low-stock">Low Stock (Only {product.stock} units left!)</span>
              {:else}
                <span class="status-badge in-stock">In Stock</span>
              {/if}
            </div>

            <div class="specs-box">
              <h3>Technical Specifications</h3>
              <ul>
                <li><strong>Type:</strong> High-performance hardware</li>
                <li><strong>Component Category:</strong> {product.category}</li>
                <li><strong>Warranty:</strong> 3-Year manufacturer warranty</li>
                <li><strong>Compatibility:</strong> Industry standard interfaces</li>
              </ul>
            </div>

            {#if product.stock > 0}
              <div class="purchase-box">
                <div class="qty-selector">
                  <span class="qty-label">Quantity:</span>
                  <div class="qty-controls">
                    <button onclick={() => adjustQuantity(-1)} disabled={quantity <= 1}>-</button>
                    <span class="qty-num">{quantity}</span>
                    <button onclick={() => adjustQuantity(1)} disabled={quantity >= product.stock}>+</button>
                  </div>
                </div>

                <div class="cart-action-row">
                  <button 
                    class="add-to-cart-btn" 
                    onclick={handleAddToCart} 
                    disabled={adding}
                  >
                    {#if adding}
                      Adding to Cart...
                    {:else if addSuccess}
                      ✓ Added Successfully!
                    {:else}
                      Add to Shopping Cart
                    {/if}
                  </button>
                </div>
              </div>
            {:else}
              <div class="out-of-stock-box">
                <p>This item is currently out of stock. We are working on restocking it as soon as possible.</p>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .details-page {
    background-color: #0b0b0b;
    min-height: calc(100vh - 65px);
    padding: 40px 20px;
    box-sizing: border-box;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .container {
    max-width: 1000px;
    margin: 0 auto;
  }

  .back-btn {
    background: transparent;
    border: none;
    color: #888888;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 30px;
    transition: color 0.2s;
  }

  .back-btn:hover {
    color: #e50914;
  }

  .status-text {
    color: #888;
    text-align: center;
    padding: 50px;
  }

  .error-box {
    background-color: rgba(229, 9, 20, 0.08);
    border: 1px solid #e50914;
    border-radius: 6px;
    padding: 30px;
    text-align: center;
  }

  .error-box p {
    color: #ff4d4d;
    margin-bottom: 20px;
  }

  .error-box button {
    background-color: #e50914;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 20px;
    cursor: pointer;
  }

  /* Two column layout grid */
  .product-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 40px;
    background-color: #141414;
    border: 1px solid #222;
    border-radius: 8px;
    padding: 40px;
  }

  /* Image Column */
  .image-column {
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .image-frame {
    width: 100%;
    aspect-ratio: 1;
    max-width: 450px;
    border-radius: 8px;
    overflow: hidden;
    background-color: #0b0b0b;
    border: 1px solid #333;
    position: relative;
  }

  .image-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .sold-out-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    color: #ffffff;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: 2px;
  }

  /* Specs Column */
  .specs-column {
    display: flex;
    flex-direction: column;
  }

  .category-tag {
    background-color: #222;
    color: #ccc;
    font-size: 11px;
    font-weight: 800;
    padding: 4px 8px;
    border-radius: 4px;
    align-self: flex-start;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
    border: 1px solid #333;
  }

  .product-title {
    font-size: 32px;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 15px 0;
    line-height: 1.2;
  }

  .price-row {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 25px;
  }

  .price-value {
    font-size: 28px;
    font-weight: 900;
    color: #e50914;
    text-shadow: 0 0 10px rgba(229, 9, 20, 0.2);
  }

  .status-badge {
    font-size: 12px;
    font-weight: 750;
    padding: 4px 10px;
    border-radius: 4px;
  }

  .in-stock {
    background-color: rgba(46, 125, 50, 0.15);
    color: #4caf50;
    border: 1px solid rgba(46, 125, 50, 0.3);
  }

  .low-stock {
    background-color: rgba(229, 9, 20, 0.15);
    color: #ff4d4d;
    border: 1px solid rgba(229, 9, 20, 0.3);
  }

  .sold-out {
    background-color: rgba(68, 68, 68, 0.15);
    color: #aaaaaa;
    border: 1px solid rgba(68, 68, 68, 0.3);
  }

  .specs-box {
    border-top: 1px solid #222;
    border-bottom: 1px solid #222;
    padding: 20px 0;
    margin-bottom: 25px;
  }

  .specs-box h3 {
    margin: 0 0 10px 0;
    font-size: 15px;
    color: #fff;
  }

  .specs-box ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    color: #ccc;
  }

  .specs-box strong {
    color: #ffffff;
  }

  /* Purchase controls */
  .purchase-box {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .qty-selector {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .qty-label {
    font-size: 14px;
    color: #aaa;
    font-weight: 600;
  }

  .qty-controls {
    display: flex;
    align-items: center;
    border: 1px solid #333;
    border-radius: 4px;
    background-color: #1a1a1a;
  }

  .qty-controls button {
    background: transparent;
    border: none;
    color: #ffffff;
    width: 35px;
    height: 35px;
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .qty-controls button:hover:not(:disabled) {
    background-color: #222;
    color: #e50914;
  }

  .qty-controls button:disabled {
    color: #444;
    cursor: not-allowed;
  }

  .qty-num {
    padding: 0 15px;
    color: #fff;
    font-weight: bold;
    font-size: 15px;
  }

  .add-to-cart-btn {
    width: 100%;
    background-color: #e50914;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    padding: 15px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.2s, box-shadow 0.2s;
  }

  .add-to-cart-btn:hover:not(:disabled) {
    background-color: #b20710;
    box-shadow: 0 0 15px rgba(229, 9, 20, 0.4);
  }

  .add-to-cart-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .out-of-stock-box {
    background-color: #1a1a1a;
    border-radius: 4px;
    padding: 15px;
    border-left: 3px solid #e50914;
  }

  .out-of-stock-box p {
    margin: 0;
    color: #888;
    font-size: 13px;
    line-height: 1.5;
  }

  @media (max-width: 850px) {
    .product-grid {
      grid-template-columns: 1fr;
      padding: 20px;
    }
  }
</style>
