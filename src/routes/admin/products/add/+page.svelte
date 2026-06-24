<script>
  import { authUser } from '$lib/auth.js';
  import { goto } from '$app/navigation';
  import { onDestroy } from 'svelte';
  import { dbAddProduct } from '$lib/firebase.js';
  import Sidebar from '$lib/components/Sidebar.svelte';

  let name = $state('');
  let category = $state('CPU');
  let price = $state('');
  let stock = $state('');
  let imageUrl = $state('');

  let errorMsg = $state('');
  let successMsg = $state('');
  let loading = $state(false);
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

  // Helper presets for easy stock image selection
  const imagePresets = {
    'CPU': 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&auto=format&fit=crop&q=60',
    'GPU': 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&auto=format&fit=crop&q=60',
    'RAM': 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=500&auto=format&fit=crop&q=60',
    'SSD': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60',
    'Motherboard': 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=500&auto=format&fit=crop&q=60',
    'Processor': 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&auto=format&fit=crop&q=60',
    'Keyboard': 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=60',
    'Mouse': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60',
    'Monitor': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60',
    'Cabinet': 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=60'
  };

  // Set image automatically when category changes if field is empty
  $effect(() => {
    if (!imageUrl || Object.values(imagePresets).includes(imageUrl)) {
      imageUrl = imagePresets[category] || '';
    }
  });

  const unsubscribe = authUser.subscribe(val => {
    if (typeof window !== 'undefined' && (!val || val.role !== 'admin')) {
      goto('/admin/login');
    }
  });

  onDestroy(() => {
    unsubscribe();
  });

  async function handleAddProduct(e) {
    e.preventDefault();
    if (!name || !price || stock === undefined || !imageUrl) {
      errorMsg = "Please fill in all fields.";
      return;
    }

    loading = true;
    errorMsg = '';
    successMsg = '';

    try {
      const newProduct = {
        name,
        category,
        price: Number(price),
        stock: Number(stock),
        imageUrl
      };

      // 1. Write server-side if using API
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to create product on backend.");
      }

      // Removed redundant client-side dbAddProduct call because API now writes to Firebase.

      successMsg = "Product added successfully!";
      // Clear form
      name = '';
      price = '';
      stock = '';
      imageUrl = imagePresets[category];

      setTimeout(() => {
        goto('/admin/dashboard');
      }, 1500);

    } catch (err) {
      errorMsg = err.message || "An error occurred adding the product.";
    } finally {
      loading = false;
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
        <button type="button" class="back-link" onclick={() => goto('/admin/dashboard')}>← Back to Inventory</button>
        <h1>Add New Hardware Product</h1>
      </div>
    </div>

    <div class="form-container">
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

      <form onsubmit={handleAddProduct} class="product-form">
        <div class="form-row">
          <div class="form-group">
            <label for="name">Product Name</label>
            <input 
              type="text" 
              id="name" 
              bind:value={name} 
              placeholder="e.g. Intel Core i9-14900K" 
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
              placeholder="e.g. 52000" 
              min="1"
              required
            />
          </div>

          <div class="form-group">
            <label for="stock">Initial Stock Quantity</label>
            <input 
              type="number" 
              id="stock" 
              bind:value={stock} 
              placeholder="e.g. 10" 
              min="0"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="imageUrl">Product Image URL or Upload File</label>
          <div class="image-input-group">
            <input 
              type="url" 
              id="imageUrl" 
              bind:value={imageUrl} 
              placeholder="https://example.com/image.jpg" 
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
          <span class="input-note">A high-quality preset image is auto-selected based on category. Feel free to supply a custom URL or upload a file.</span>
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
          <button type="submit" disabled={loading} class="submit-btn">
            {#if loading}Saving Product...{:else}Add Product{/if}
          </button>
        </div>
      </form>
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

  .input-note {
    font-size: 11px;
    color: #666666;
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
