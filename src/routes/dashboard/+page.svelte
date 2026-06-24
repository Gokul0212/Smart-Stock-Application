<script>
  import { authUser, logout } from '$lib/auth.js';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { dbGetProducts, dbGetCart } from '$lib/firebase.js';
  import ProductFilter from '$lib/components/ProductFilter.svelte';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';

  let currentUser = $state(null);
  let products = $state([]);
  let activeCategory = $state('All');
  let searchQuery = $state('');
  let loading = $state(true);
  let sidebarOpen = $state(true);
  let cartCount = $state(0);
  let cartInterval;

  async function updateCartCount() {
    if (currentUser && currentUser.role === 'user') {
      try {
        const cartItems = await dbGetCart(currentUser.id);
        cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
      } catch (e) {
        cartCount = 0;
      }
    } else {
      cartCount = 0;
    }
  }

  const unsubscribe = authUser.subscribe(val => {
    currentUser = val;
    updateCartCount();
    if (typeof window !== 'undefined') {
      if (!val) {
        goto('/login');
      } else if (val.role === 'admin') {
        goto('/admin/dashboard');
      }
    }
  });

  onMount(async () => {
    updateCartCount();
    cartInterval = setInterval(updateCartCount, 2000);
    try {
      products = await dbGetProducts();
    } catch (e) {
      console.error("Failed to load products", e);
    } finally {
      loading = false;
    }
  });

  onDestroy(() => {
    unsubscribe();
    if (cartInterval) clearInterval(cartInterval);
  });

  function handleLogout() {
    logout();
    goto('/');
  }

  // Filter products by category and search term
  let filteredProducts = $derived(
    products.filter(p => {
      const matchCategory = activeCategory === 'All' || p.category.toLowerCase() === activeCategory.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    })
  );
</script>

<div class="catalog-layout">
  <Sidebar isOpen={sidebarOpen} />

  <div class="catalog-content">
    <div class="catalog-header">
      <div class="header-left">
        <button class="toggle-sidebar-btn" onclick={() => sidebarOpen = !sidebarOpen}>
          {sidebarOpen ? '← Hide Categories' : '→ Show Categories'}
        </button>
        <h1>Hardware Components Catalog</h1>
      </div>
      <div class="header-right">
        <div class="cart-container" onclick={() => goto('/cart')}>
          <svg class="cart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <span class="cart-badge">{cartCount}</span>
        </div>
        <div class="user-profile">
          <span class="user-welcome">Welcome back, <strong>{currentUser?.name || 'Customer'}</strong></span>
          <button class="logout-btn" onclick={handleLogout}>Sign Out</button>
        </div>
      </div>
    </div>

    <!-- Filter Component -->
    <ProductFilter bind:activeCategory bind:searchQuery />

    <!-- Product Grid -->
    {#if loading}
      <div class="status-msg">
        <div class="spinner"></div>
        <p>Loading high-performance components...</p>
      </div>
    {:else if filteredProducts.length === 0}
      <div class="status-msg">
        <p class="empty-text">No components found matching your search criteria.</p>
        <button class="reset-filter-btn" onclick={() => { activeCategory = 'All'; searchQuery = ''; }}>Reset Filters</button>
      </div>
    {:else}
      <div class="products-grid">
        {#each filteredProducts as product (product.id)}
          <ProductCard {product} />
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .catalog-layout {
    display: flex;
    min-height: calc(100vh - 65px);
    background-color: #0b0b0b;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .catalog-content {
    flex: 1;
    padding: 30px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  .catalog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .toggle-sidebar-btn {
    background-color: #141414;
    border: 1px solid #333;
    color: #ccc;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
  }

  .toggle-sidebar-btn:hover {
    background-color: #222;
    color: #fff;
  }

  .catalog-header h1 {
    margin: 0;
    font-size: 26px;
    font-weight: 800;
    color: #ffffff;
  }

  .user-welcome {
    font-size: 14px;
    color: #aaaaaa;
  }

  .user-welcome strong {
    color: #ffffff;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .cart-container {
    position: relative;
    cursor: pointer;
    padding: 5px;
    color: #cccccc;
    transition: color 0.2s, transform 0.2s;
  }

  .cart-container:hover {
    color: #e50914;
    transform: scale(1.1);
  }

  .cart-icon {
    width: 26px;
    height: 26px;
  }

  .cart-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    background-color: #e50914;
    color: #ffffff;
    font-size: 11px;
    font-weight: bold;
    border-radius: 50%;
    min-width: 18px;
    height: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid #0b0b0b;
    padding: 2px;
  }

  .user-profile {
    display: flex;
    align-items: center;
    gap: 15px;
    border-left: 1px solid #333;
    padding-left: 15px;
  }

  .logout-btn {
    background-color: transparent;
    color: #e50914;
    border: 1px solid #e50914;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .logout-btn:hover {
    background-color: #e50914;
    color: #ffffff;
    box-shadow: 0 0 10px rgba(229, 9, 20, 0.4);
  }

  /* Products Grid */
  .products-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    margin-top: 10px;
  }

  /* Status message displays */
  .status-msg {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
    color: #888888;
    flex-grow: 1;
  }

  .spinner {
    border: 3px solid rgba(229, 9, 20, 0.1);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border-left-color: #e50914;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-text {
    font-size: 16px;
    margin-bottom: 15px;
  }

  .reset-filter-btn {
    background-color: transparent;
    color: #e50914;
    border: 1px solid #e50914;
    padding: 8px 20px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .reset-filter-btn:hover {
    background-color: #e50914;
    color: white;
  }

  @media (max-width: 1200px) {
    .products-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 900px) {
    .products-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 600px) {
    .products-grid {
      grid-template-columns: 1fr;
    }
    .catalog-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
  }
</style>