<script>
  import { authUser } from '$lib/auth.js';
  import { goto } from '$app/navigation';
  import { dbAddToCart } from '$lib/firebase.js';

  let { product, onProductDeleted } = $props();

  let currentUser = $state(null);
  let adding = $state(false);
  let addSuccess = $state(false);

  // Subscribe to authentication state
  const unsubscribe = authUser.subscribe(val => {
    currentUser = val;
  });

  async function handleAddToCart() {
    if (!currentUser) {
      goto('/login');
      return;
    }
    
    adding = true;
    try {
      await dbAddToCart(currentUser.id, product.id, 1);
      addSuccess = true;
      setTimeout(() => {
        addSuccess = false;
      }, 1500);
    } catch (e) {
      alert("Failed to add product to cart");
    } finally {
      adding = false;
    }
  }

  async function handleDelete() {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        const response = await fetch('/api/products', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: product.id })
        });
        
        if (response.ok) {
          if (onProductDeleted) {
            onProductDeleted(product.id);
          } else {
            window.location.reload();
          }
        } else {
          const errData = await response.json();
          alert(errData.message || "Failed to delete product.");
        }
      } catch (err) {
        alert("Error occurred deleting product.");
      }
    }
  }
</script>

<div class="card {product.stock < 5 ? 'low-stock-border' : ''}">
  <div class="img-container" onclick={() => goto(`/products/${product.id}`)}>
    <img src={product.imageUrl} alt={product.name} class="product-image" loading="lazy" />
    {#if product.stock === 0}
      <span class="sold-out-badge">SOLD OUT</span>
    {:else}
      {#if product.stock < 5}
        <span class="low-stock-badge">ONLY {product.stock} LEFT</span>
      {/if}
    {/if}
    <span class="category-badge">{product.category}</span>
  </div>

  <div class="card-content">
    <h3 class="product-name" onclick={() => goto(`/products/${product.id}`)}>{product.name}</h3>
    <div class="product-pricing">
      <span class="price">₹{Number(product.price).toLocaleString('en-IN')}</span>
      <span class="stock-label {product.stock < 5 ? 'low-stock-text' : ''}">
        Stock: {product.stock}
      </span>
    </div>

    <div class="card-actions">
      {#if currentUser?.role === 'admin'}
        <button class="action-btn edit-btn" onclick={() => goto(`/admin/products/edit/${product.id}`)}>
          Edit
        </button>
        <button class="action-btn delete-btn" onclick={handleDelete}>
          Delete
        </button>
      {:else}
        <button 
          class="action-btn cart-btn" 
          disabled={product.stock === 0 || adding} 
          onclick={handleAddToCart}
        >
          {#if adding}
            Adding...
          {:else if addSuccess}
            ✓ Added!
          {:else if product.stock === 0}
            Out of Stock
          {:else}
            Add to Cart
          {/if}
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .card {
    background-color: #181818;
    border: 1px solid #2d2d2d;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .card:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(229, 9, 20, 0.2);
    border-color: #e50914;
  }

  .low-stock-border {
    border-color: rgba(229, 9, 20, 0.5);
  }

  .img-container {
    width: 100%;
    height: 180px;
    background-color: #0b0b0b;
    position: relative;
    cursor: pointer;
    overflow: hidden;
  }

  .product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .card:hover .product-image {
    transform: scale(1.08);
  }

  .category-badge {
    position: absolute;
    bottom: 10px;
    left: 10px;
    background-color: rgba(0, 0, 0, 0.7);
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid #444;
  }

  .low-stock-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background-color: #e50914;
    color: #ffffff;
    font-size: 10px;
    font-weight: 800;
    padding: 4px 8px;
    border-radius: 3px;
    box-shadow: 0 0 10px rgba(229, 9, 20, 0.6);
    letter-spacing: 0.5px;
  }

  .sold-out-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background-color: #333333;
    color: #aaaaaa;
    font-size: 10px;
    font-weight: 800;
    padding: 4px 8px;
    border-radius: 3px;
  }

  .card-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .product-name {
    color: #ffffff;
    margin: 0 0 10px 0;
    font-size: 17px;
    font-weight: 700;
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.2s;
  }

  .product-name:hover {
    color: #e50914;
  }

  .product-pricing {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  .price {
    color: #e50914;
    font-weight: 800;
    font-size: 18px;
  }

  .stock-label {
    font-size: 12px;
    color: #888888;
  }

  .low-stock-text {
    color: #ff3333;
    font-weight: bold;
  }

  .card-actions {
    display: flex;
    gap: 8px;
    margin-top: auto;
  }

  .action-btn {
    flex: 1;
    border: none;
    padding: 10px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cart-btn {
    background-color: #e50914;
    color: #ffffff;
  }

  .cart-btn:hover:not(:disabled) {
    background-color: #b20710;
    box-shadow: 0 0 12px rgba(229, 9, 20, 0.4);
  }

  .cart-btn:disabled {
    background-color: #333;
    color: #666;
    cursor: not-allowed;
  }

  .edit-btn {
    background-color: #2a2a2a;
    color: #ffffff;
    border: 1px solid #444;
  }

  .edit-btn:hover {
    background-color: #3a3a3a;
    border-color: #666;
  }

  .delete-btn {
    background-color: transparent;
    color: #e50914;
    border: 1px solid #e50914;
  }

  .delete-btn:hover {
    background-color: #e50914;
    color: #ffffff;
    box-shadow: 0 0 10px rgba(229, 9, 20, 0.3);
  }
</style>
