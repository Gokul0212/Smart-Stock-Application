<script>
  import { authUser, logout } from '$lib/auth.js';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { dbGetProducts } from '$lib/firebase.js';
  import ProductFilter from '$lib/components/ProductFilter.svelte';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';

  let currentUser = $state(null);
  let products = $state([]);
  let activeCategory = $state('All');
  let searchQuery = $state('');
  let loading = $state(true);
  let sidebarOpen = $state(true);

  // Subscribe to auth state
  const unsubscribe = authUser.subscribe(val => {
    currentUser = val;
    // Route protection check (only runs in browser)
    if (typeof window !== 'undefined' && (!val || val.role !== 'admin')) {
      goto('/admin/login');
    }
  });

  onMount(async () => {
    await fetchProducts();
    loading = false;
  });

  onDestroy(() => {
    unsubscribe();
  });

  async function fetchProducts() {
    try {
      products = await dbGetProducts();
    } catch (e) {
      console.error("Failed to load products", e);
    }
  }

  function handleProductDeleted(deletedId) {
    products = products.filter(p => p.id !== deletedId);
  }

  function handleLogout() {
    logout();
    goto('/');
  }

  // Dashboard Stats (derived reactively)
  let totalProducts = $derived(products.length);
  
  let availableStock = $derived(
    products.reduce((acc, p) => acc + Number(p.stock), 0)
  );
  
  let lowStockProducts = $derived(
    products.filter(p => Number(p.stock) < 5)
  );

  let lowStockCount = $derived(lowStockProducts.length);

  // Recently added products (last 3 items)
  let recentlyAdded = $derived(
    [...products].reverse().slice(0, 3)
  );

  // Filtered products list
  let filteredProducts = $derived(
    products.filter(p => {
      const matchCat = activeCategory === 'All' || p.category.toLowerCase() === activeCategory.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    })
  );
</script>

<div class="dashboard-layout">
  <Sidebar isOpen={sidebarOpen} />

  <div class="dashboard-content">
    <div class="content-header">
      <div class="header-left">
        <button class="toggle-sidebar" onclick={() => sidebarOpen = !sidebarOpen}>
          {sidebarOpen ? '← Hide Menu' : '→ Show Menu'}
        </button>
        <h1>Admin Control Dashboard</h1>
      </div>
      <div class="header-right">
        {#if currentUser}
          <div class="admin-profile">
            <span class="role-badge admin-badge">ADMIN</span>
            <span class="admin-name">{currentUser.name}</span>
          </div>
        {/if}
        <button class="add-btn-top" onclick={() => goto('/admin/products/add')}>
          ➕ Add New Product
        </button>
        <button class="sign-out-btn" onclick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="stats-grid">
      <div class="stats-card">
        <h3>Total Products</h3>
        <p class="stat-value">{totalProducts}</p>
        <span class="stat-sub">Unique hardware listings</span>
      </div>

      <div class="stats-card">
        <h3>Available Stock</h3>
        <p class="stat-value">{availableStock}</p>
        <span class="stat-sub">Total inventory units</span>
      </div>

      <div class="stats-card {lowStockCount > 0 ? 'low-stock-alert' : ''}">
        <h3>Low Stock Items</h3>
        <p class="stat-value">{lowStockCount}</p>
        <span class="stat-sub">Units with stock &lt; 5</span>
      </div>
    </div>

    <!-- Low Stock Warning Banner -->
    {#if lowStockCount > 0}
      <div class="alert-banner">
        <h4>🚨 Low Stock Warning!</h4>
        <p>The following hardware components are running critical stock levels (under 5 units):</p>
        <ul class="warning-list">
          {#each lowStockProducts as item}
            <li>
              <strong>{item.name}</strong> ({item.category}) - 
              <span class="critical-text">{item.stock} left</span>
              <button onclick={() => goto(`/admin/products/edit/${item.id}`)} class="refill-btn">Refill Stock</button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- Main Section Split -->
    <div class="main-sections">
      <!-- Catalog Management -->
      <div class="catalog-section">
        <h2>Inventory Management</h2>
        
        <ProductFilter bind:activeCategory bind:searchQuery />

        {#if loading}
          <p class="status-msg">Loading inventory...</p>
        {:else if filteredProducts.length === 0}
          <p class="status-msg">No products found matching filters.</p>
        {:else}
          <div class="products-grid">
            {#each filteredProducts as product (product.id)}
              <ProductCard {product} onProductDeleted={handleProductDeleted} />
            {/each}
          </div>
        {/if}
      </div>

      <!-- Sidebar Area: Recently Added -->
      <div class="recent-sidebar">
        <h2>Recently Added</h2>
        {#if recentlyAdded.length === 0}
          <p class="empty-recents">No products added yet.</p>
        {:else}
          <div class="recents-list">
            {#each recentlyAdded as item}
              <div class="recent-item" onclick={() => goto(`/admin/products/edit/${item.id}`)}>
                <img src={item.imageUrl} alt={item.name} />
                <div class="recent-details">
                  <h4>{item.name}</h4>
                  <span class="category">{item.category}</span>
                  <span class="price">₹{Number(item.price).toLocaleString('en-IN')}</span>
                  <span class="stock">Stock: {item.stock}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
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
    overflow-x: hidden;
  }

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .toggle-sidebar {
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

  .content-header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    color: #ffffff;
  }

  .add-btn-top {
    background-color: #e50914;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 20px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s, box-shadow 0.2s;
  }

  .add-btn-top:hover {
    background-color: #b20710;
    box-shadow: 0 0 15px rgba(229, 9, 20, 0.4);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .admin-profile {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-right: 15px;
    border-right: 1px solid #333;
  }

  .admin-name {
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
  }

  .role-badge {
    font-size: 10px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    background-color: #333;
    color: #ccc;
  }

  .admin-badge {
    background-color: #e50914;
    color: #ffffff;
    box-shadow: 0 0 8px rgba(229, 9, 20, 0.4);
  }

  .sign-out-btn {
    background-color: transparent;
    color: #e50914;
    border: 1px solid #e50914;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .sign-out-btn:hover {
    background-color: #e50914;
    color: #ffffff;
    box-shadow: 0 0 15px rgba(229, 9, 20, 0.4);
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 30px;
  }

  .stats-card {
    background-color: #141414;
    border: 1px solid #222;
    border-radius: 6px;
    padding: 20px;
  }

  .stats-card h3 {
    margin: 0 0 10px 0;
    color: #888888;
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-size: 36px;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 5px 0;
  }

  .stat-sub {
    font-size: 12px;
    color: #666666;
  }

  .low-stock-alert {
    border-color: rgba(229, 9, 20, 0.4);
  }

  .low-stock-alert .stat-value {
    color: #e50914;
    text-shadow: 0 0 10px rgba(229, 9, 20, 0.2);
  }

  /* Alert Warning Banner */
  .alert-banner {
    background-color: rgba(229, 9, 20, 0.08);
    border: 1px solid #e50914;
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 35px;
  }

  .alert-banner h4 {
    margin: 0 0 10px 0;
    color: #ff4d4d;
    font-size: 16px;
    font-weight: 700;
  }

  .alert-banner p {
    color: #cccccc;
    font-size: 14px;
    margin: 0 0 12px 0;
  }

  .warning-list {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: #ffffff;
    font-size: 14px;
  }

  .critical-text {
    color: #ff4d4d;
    font-weight: 700;
  }

  .refill-btn {
    background-color: transparent;
    color: #e50914;
    border: 1px solid #e50914;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 700;
    border-radius: 3px;
    margin-left: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .refill-btn:hover {
    background-color: #e50914;
    color: #ffffff;
  }

  /* Layout Sections split */
  .main-sections {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 30px;
  }

  .catalog-section h2, .recent-sidebar h2 {
    font-size: 20px;
    font-weight: 750;
    margin: 0 0 20px 0;
    border-left: 3px solid #e50914;
    padding-left: 10px;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .status-msg {
    color: #888888;
    text-align: center;
    padding: 40px;
  }

  /* Recent Sidebar */
  .recents-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .recent-item {
    background-color: #141414;
    border: 1px solid #222;
    border-radius: 6px;
    padding: 10px;
    display: flex;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .recent-item:hover {
    border-color: #444;
    background-color: #1a1a1a;
    transform: translateX(3px);
  }

  .recent-item img {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
    background-color: #0b0b0b;
  }

  .recent-details {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .recent-details h4 {
    margin: 0 0 3px 0;
    font-size: 13px;
    font-weight: 700;
    color: #ffffff;
    max-width: 180px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .recent-details .category {
    font-size: 10px;
    color: #888;
    font-weight: 600;
  }

  .recent-details .price {
    font-size: 12px;
    color: #e50914;
    font-weight: 700;
  }

  .recent-details .stock {
    font-size: 10px;
    color: #666;
  }

  .empty-recents {
    color: #666;
    font-size: 13px;
    text-align: center;
    padding: 20px;
  }

  @media (max-width: 1024px) {
    .main-sections {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
    .products-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
