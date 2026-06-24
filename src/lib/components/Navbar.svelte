<script>
  import { authUser, logout } from '$lib/auth.js';
  import { dbGetCart } from '$lib/firebase.js';
  import { goto } from '$app/navigation';
  import { onDestroy, onMount } from 'svelte';

  let currentUser = $state(null);
  let cartCount = $state(0);
  let cartInterval;

  // Subscribe to auth state (Svelte 5 runtime state sync)
  const unsubscribe = authUser.subscribe(value => {
    currentUser = value;
    updateCartCount();
  });

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

  onMount(() => {
    updateCartCount();
    // Poll cart counts every 2 seconds to keep it reactive across views
    cartInterval = setInterval(updateCartCount, 2000);
  });

  onDestroy(() => {
    unsubscribe();
    if (cartInterval) clearInterval(cartInterval);
  });

  function handleLogout() {
    logout();
    goto('/');
  }
</script>

<nav class="navbar">
  <div class="nav-container">
    <div class="brand" onclick={() => goto('/')}>
      <span class="brand-smart">SMART</span><span class="brand-stock">STOCK</span>
    </div>

    <div class="nav-links">
      {#if currentUser}
        {#if currentUser.role === 'admin'}
          <a href="/admin/dashboard" class="nav-link">Dashboard</a>
          <a href="/admin/analytics" class="nav-link">Analytics</a>
          <div class="user-profile">
            <span class="role-badge admin-badge">ADMIN</span>
            <span class="username">{currentUser.name}</span>
            <button class="logout-btn" onclick={handleLogout}>Sign Out</button>
          </div>
        {:else}
          <a href="/dashboard" class="nav-link">Browse Catalog</a>
          <a href="/orders" class="nav-link">Order History</a>
          <div class="cart-container" onclick={() => goto('/cart')}>
            <svg class="cart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <span class="cart-badge">{cartCount}</span>
          </div>
          <div class="user-profile">
            <span class="role-badge">USER</span>
            <span class="username">{currentUser.name}</span>
            <button class="logout-btn" onclick={handleLogout}>Sign Out</button>
          </div>
        {/if}
      {:else}
        <a href="/login" class="nav-link">Login</a>
        <a href="/register" class="nav-link">Register</a>
        <a href="/admin/login" class="admin-login-link">Admin Portal</a>
      {/if}
    </div>
  </div>
</nav>

<style>
  .navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: rgba(20, 20, 20, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid #222;
    padding: 15px 30px;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .brand {
    font-size: 24px;
    font-weight: 900;
    cursor: pointer;
    letter-spacing: 1px;
    user-select: none;
    transition: transform 0.2s ease;
  }

  .brand:hover {
    transform: scale(1.03);
  }

  .brand-smart {
    color: #ffffff;
  }

  .brand-stock {
    color: #e50914;
    text-shadow: 0 0 10px rgba(229, 9, 20, 0.4);
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .nav-link {
    color: #cccccc;
    text-decoration: none;
    font-size: 15px;
    font-weight: 500;
    transition: color 0.2s, text-shadow 0.2s;
  }

  .nav-link:hover {
    color: #ffffff;
    text-shadow: 0 0 5px rgba(255,255,255,0.3);
  }

  .admin-login-link {
    background-color: transparent;
    color: #e50914;
    border: 1px solid #e50914;
    padding: 6px 14px;
    border-radius: 4px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    transition: background-color 0.2s, color 0.2s;
  }

  .admin-login-link:hover {
    background-color: #e50914;
    color: #ffffff;
    box-shadow: 0 0 15px rgba(229, 9, 20, 0.4);
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
    border: 2px solid #141414;
    padding: 2px;
  }

  .user-profile {
    display: flex;
    align-items: center;
    gap: 12px;
    border-left: 1px solid #333;
    padding-left: 15px;
  }

  .username {
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
</style>
