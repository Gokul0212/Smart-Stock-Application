<script>
  import { authUser } from '$lib/auth.js';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { dbGetProducts, dbUpdateProduct } from '$lib/firebase.js';
  import Sidebar from '$lib/components/Sidebar.svelte';

  const productId = $page.params.id;

  let name = $state('');
  let category = $state('CPU');
  let price = $state('');
  let stock = $state('');
  let imageUrl = $state('');

  let errorMsg = $state('');
  let successMsg = $state('');
  let loading = $state(true);
  let saving = $state(false);
  let sidebarOpen = $state(true);

  const categories = [
    'CPU',
    'GPU',
    'RAM',
    'SSD',
    'Motherboard',
    'Processor',
    'Keyboard',
    'Mouse',
    'Monitor',
    'Cabinet'
  ];

  const unsubscribe = authUser.subscribe(val => {
    if (typeof window !== 'undefined' && (!val || val.role !== 'admin')) {
      goto('/admin/login');
    }
  });

  onMount(async () => {
    try {
      const products = await dbGetProducts();
      const product = products.find(p => p.id === productId);
      
      if (!product) {
        errorMsg = `Product with ID "${productId}" not found.`;
        loading = false;
        return;
      }

      name = product.name;
      category = product.category;
      price = product.price;
      stock = product.stock;
      imageUrl = product.imageUrl;
    } catch (e) {
      errorMsg = "Failed to load product details: " + e.message;
    } finally {
      loading = false;
    }
  });

  onDestroy(() => {
    unsubscribe();
  });

  async function handleUpdateProduct(e) {
    e.preventDefault();
    if (!name || !price || stock === undefined || !imageUrl) {
      errorMsg = "Please fill in all fields.";
      return;
    }

    saving = true;
    errorMsg = '';
    successMsg = '';

    try {
      const updatedProduct = {
        name,
        category,
        price: Number(price),
        stock: Number(stock),
        imageUrl
      };

      // 1. Submit PUT update to server API endpoint
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, ...updatedProduct })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to update product on server.");
      }

      // 2. Sync to client database
      await dbUpdateProduct(productId, updatedProduct);

      successMsg = "Product updated successfully!";
      setTimeout(() => {
        goto('/admin/dashboard');
      }, 1500);

    } catch (err) {
      errorMsg = err.message || "An error occurred updating the product.";
    } finally {
      saving = false;
    }
  }
</script>

<div class="dashboard-layout">
  <Sidebar isOpen={sidebarOpen} />

  <div class="dashboard-content">
    <div class="content-header">
      <div class="header-left">
        <button class="toggle-sidebar" onclick={() => sidebarOpen = !sidebarOpen}>
          {sidebarOpen ? '← Hide Menu' : '→ Show Menu'}
        </button>
        <span class="back-link" onclick={() => goto('/admin/dashboard')}>← Back to Inventory</span>
        <h1>Edit Hardware Product</h1>
      </div>
    </div>

    <div class="form-container">
      {#if loading}
        <p class="loading-text">Loading product specifications...</p>
      {:else}
        {#if errorMsg && !name}
          <div class="banner error-banner">
            <span class="banner-icon">⚠️</span>
            <span class="banner-text">{errorMsg}</span>
          </div>
          <button class="cancel-btn" onclick={() => goto('/admin/dashboard')}>Return to Dashboard</button>
        {:else}
          {#if errorMsg}
            <div class="banner error-banner">
              <span class="banner-icon">⚠️</span>
              <span class="banner-text">{errorMsg}</span>
            </div>
          {/if}

          {#if successMsg}
            <div class="banner success-banner">
              <span class="banner-icon">✓</span>
              <span class="banner-text">{successMsg}</span>
            </div>
          {/if}

          <form onsubmit={handleUpdateProduct} class="product-form">
            <div class="form-row">
              <div class="form-group">
                <label for="name">Product Name</label>
                <input 
                  type="text" 
                  id="name" 
                  bind:value={name} 
                  required
                />
              </div>

              <div class="form-group">
                <label for="category">Category</label>
                <select id="category" bind:value={category}>
                  {#each categories as cat}
                    <option value={cat}>{cat}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="price">Price (₹ INR)</label>
                <input 
                  type="number" 
                  id="price" 
                  bind:value={price} 
                  min="1"
                  required
                />
              </div>

              <div class="form-group">
                <label for="stock">Current Stock Quantity</label>
                <input 
                  type="number" 
                  id="stock" 
                  bind:value={stock} 
                  min="0"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label for="imageUrl">Product Image URL</label>
              <input 
                type="url" 
                id="imageUrl" 
                bind:value={imageUrl} 
                required
              />
            <div class="form-group">
              <label for="imageUrl">Product Image URL or Upload File</label>
              <div class="image-input-group">
                <input 
                  type="url" 
                  id="imageUrl" 
                  bind:value={imageUrl} 
                  required
                />
                <label class="file-upload-btn">
                  📁 Upload Image
                  <input 
                    type="file" 
                    accept="image/*" 
                    class="hidden-file-input" 
                    onchange={(e) => {
                      const file = e.currentTarget.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          imageUrl = ev.target.result;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <!-- Preview Image -->
            {#if imageUrl}
              <div class="image-preview">
                <span class="preview-label">Image Preview:</span>
                <div class="preview-frame">
                  <img src={imageUrl} alt="Hardware Preview" onerror={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&auto=format&fit=crop&q=60'; }} />
                </div>
              </div>
            {/if}

            <div class="form-actions">
              <button type="button" class="cancel-btn" onclick={() => goto('/admin/dashboard')}>Cancel</button>
              <button type="submit" disabled={saving} class="submit-btn">
                {#if saving}Saving Changes...{:else}Save Changes{/if}
              </button>
            </div>
          </form>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .dashboard-layout {
    display: flex;
    min-height: calc(100vh - 65px);
    background-color: #0b0b0b;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .dashboard-content {
    flex: 1;
    padding: 30px;
    box-sizing: border-box;
  }

  .content-header {
    margin-bottom: 30px;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .toggle-sidebar {
    align-self: flex-start;
    background-color: #1a1a1a;
    border: 1px solid #333;
    color: #ccc;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
  }

  .toggle-sidebar:hover {
    background-color: #222;
    color: #fff;
  }

  .back-link {
    color: #888;
    font-size: 13px;
    cursor: pointer;
    font-weight: 500;
    transition: color 0.2s;
  }

  .back-link:hover {
    color: #e50914;
  }

  .content-header h1 {
    margin: 5px 0 0 0;
    font-size: 28px;
    font-weight: 800;
  }

  .form-container {
    background-color: #141414;
    border: 1px solid #222;
    border-radius: 8px;
    padding: 40px;
    max-width: 800px;
  }

  .loading-text {
    color: #888;
    text-align: center;
    padding: 20px;
  }

  .product-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    color: #aaaaaa;
    font-size: 14px;
    font-weight: 600;
  }

  .form-group input, .form-group select {
    background-color: #222222;
    border: 1px solid #333333;
    border-radius: 4px;
    padding: 12px;
    color: #ffffff;
    font-size: 15px;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }

  /* Image Preview */
  .image-preview {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
  }

  .preview-label {
    font-size: 13px;
    color: #888;
    font-weight: 600;
  }

  .preview-frame {
    width: 150px;
    height: 150px;
    border-radius: 6px;
    overflow: hidden;
    background-color: #0b0b0b;
    border: 1px solid #333;
  }

  .preview-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Banner Alerts */
  .banner {
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .error-banner {
    background-color: rgba(229, 9, 20, 0.15);
    border: 1px solid #e50914;
  }

  .success-banner {
    background-color: rgba(46, 125, 50, 0.15);
    border: 1px solid #2e7d32;
  }

  .banner-icon {
    font-size: 16px;
  }

  .banner-text {
    font-size: 13px;
    font-weight: 500;
  }

  .error-banner .banner-text {
    color: #ff8888;
  }

  .success-banner .banner-text {
    color: #a5d6a7;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    margin-top: 20px;
    border-top: 1px solid #222;
    padding-top: 20px;
  }

  .cancel-btn {
    background-color: transparent;
    color: #aaaaaa;
    border: 1px solid #444;
    border-radius: 4px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-btn:hover {
    background-color: #222;
    color: white;
    border-color: #666;
  }

  .submit-btn {
    background-color: #e50914;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 12px 30px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.2s, box-shadow 0.2s;
  }

  .submit-btn:hover:not(:disabled) {
    background-color: #b20710;
    box-shadow: 0 0 15px rgba(229, 9, 20, 0.4);
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 600px) {
    .form-row {
      grid-template-columns: 1fr;
      gap: 15px;
    }

    .form-container {
      padding: 20px;
    }
  }
</style>
