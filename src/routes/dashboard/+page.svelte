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
  let showProfileModal = $state(false);

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
        <button type="button" class="cart-container" onclick={() => goto('/cart')}>
          <svg class="cart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <span class="cart-badge">{cartCount}</span>
        </button>
        <div class="user-greeting">
          <span class="user-welcome">Welcome, <strong>{currentUser?.name || 'Customer'}</strong></span>
        </div>
        <div class="dropdown">
          <button class="dropbtn">User Space <span class="arrow">▼</span></button>
          <div class="dropdown-content">
            <a href="#help">Help & Settings</a>
            <button class="dropdown-item-btn" onclick={() => showProfileModal = true}>Your Account</button>
            <a href="#customer-service">Customer Service</a>
            <hr class="dropdown-divider">
            <button class="dropdown-auth-btn" onclick={handleLogout}>Sign Out</button>
          </div>
        </div>
      </div>
    </div>

    {#if showProfileModal}
      <div class="modal-backdrop" onclick={() => showProfileModal = false}>
        <div class="modal-content" onclick={(e) => e.stopPropagation()}>
          <h2>Your Account</h2>
          <div class="profile-details">
            <div class="info-group">
              <span class="info-label">Name</span>
              <span class="info-value">{currentUser?.name || 'Customer'}</span>
            </div>
            <div class="info-group">
              <span class="info-label">Email</span>
              <span class="info-value">{currentUser?.email || 'N/A'}</span>
            </div>
            <div class="info-group">
              <span class="info-label">Address</span>
              <span class="info-value">{currentUser?.address || '123 Smart Stock Way, Tech City, ST 12345'}</span>
            </div>
          </div>
          <button class="close-modal-btn" onclick={() => showProfileModal = false}>Close</button>
        </div>
      </div>
    {/if}

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

  .dropdown {
    position: relative;
    display: inline-block;
  }

  .dropbtn {
    background-color: #1a1a1a;
    color: #ffffff;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 600;
    border: 1px solid #333;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .arrow {
    font-size: 10px;
  }

  .dropbtn:hover {
    border-color: #e50914;
    color: #e50914;
  }

  .dropdown-content {
    display: none;
    position: absolute;
    right: 0;
    background-color: #1a1a1a;
    min-width: 180px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.5);
    border: 1px solid #333;
    border-radius: 8px;
    z-index: 10;
    overflow: hidden;
    margin-top: 5px;
  }

  .dropdown-content a, .dropdown-item-btn {
    color: #cccccc;
    padding: 12px 16px;
    text-decoration: none;
    display: block;
    font-size: 14px;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    transition: background-color 0.2s, color 0.2s;
  }

  .dropdown-content a:hover, .dropdown-item-btn:hover {
    background-color: #2a2a2a;
    color: #ffffff;
  }

  .dropdown-divider {
    border: 0;
    border-top: 1px solid #333;
    margin: 0;
  }

  .dropdown-auth-btn {
    width: 100%;
    background-color: transparent;
    color: #e50914;
    border: none;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.2s, color 0.2s;
  }

  .dropdown-auth-btn:hover {
    background-color: #e50914;
    color: #ffffff;
  }

  .dropdown:hover .dropdown-content {
    display: block;
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

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background-color: #141414;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 30px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
  }

  .modal-content h2 {
    color: #ffffff;
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 22px;
    border-bottom: 1px solid #333;
    padding-bottom: 15px;
  }

  .profile-details {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 25px;
  }

  .info-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .info-label {
    color: #888888;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .info-value {
    color: #ffffff;
    font-size: 15px;
  }

  .close-modal-btn {
    width: 100%;
    background-color: #e50914;
    color: #ffffff;
    border: none;
    padding: 12px;
    border-radius: 6px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .close-modal-btn:hover {
    background-color: #b20710;
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