<script>
  import { goto } from '$app/navigation';
  import { authUser } from '$lib/auth.js';
  import { onDestroy } from 'svelte';

  let currentUser = $state(null);
  const unsubscribe = authUser.subscribe(value => {
    currentUser = value;
  });

  onDestroy(() => {
    unsubscribe();
  });

  function enterCustomerPortal() {
    if (currentUser) {
      goto('/dashboard');
    } else {
      goto('/login');
    }
  }

  function enterAdminPortal() {
    if (currentUser && currentUser.role === 'admin') {
      goto('/admin/dashboard');
    } else {
      goto('/admin/login');
    }
  }
</script>

<div class="landing-page auth-bg-overlay">
  <div class="landing-content">
    <header class="landing-header">
      <h1 class="main-title"><span class="smart">SMART</span><span class="stock">STOCK</span></h1>
      <p class="subtitle text-glow">High-Performance Computer Hardware Inventory & Purchase System</p>
    </header>

    <div class="portal-grid">
      <!-- Customer Card -->
      <div class="portal-card customer-card">
        <div class="card-bg-glow"></div>
        <div class="card-inner">
          <div class="icon-wrap">🛍️</div>
          <h2>Customer Portal</h2>
          <p>Create an account, browse high-end components (CPUs, GPUs, Motherboards, SSDs), customize your shopping cart, and confirm orders with instant notifications.</p>
          <button class="portal-btn customer-btn" onclick={enterCustomerPortal}>
            {#if currentUser && currentUser.role !== 'admin'}
              Enter Catalog
            {:else}
              Shop Components
            {/if}
          </button>
        </div>
      </div>

      <!-- Admin Card -->
      <div class="portal-card admin-card">
        <div class="card-bg-glow"></div>
        <div class="card-inner">
          <div class="icon-wrap">⚙️</div>
          <h2>Admin Control</h2>
          <p>Access the inventory management dashboard. Supervise stock levels, add products, adjust pricing, view analytics, and check low stock warnings.</p>
          <button class="portal-btn admin-btn" onclick={enterAdminPortal}>
            {#if currentUser && currentUser.role === 'admin'}
              Enter Dashboard
            {:else}
              Admin Sign In
            {/if}
          </button>
        </div>
      </div>
    </div>

    <footer class="landing-footer">
      <p>© 2026 Smart Stock Management System. Designed for performance hardware distributors.</p>
    </footer>
  </div>
</div>

<style>
  .landing-page {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px 20px;
    box-sizing: border-box;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .landing-content {
    max-width: 1000px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 50px;
  }

  .landing-header {
    text-align: center;
  }

  .main-title {
    font-size: 64px;
    font-weight: 900;
    letter-spacing: 2px;
    margin: 0;
    line-height: 1.1;
  }

  .smart {
    color: #ffffff;
  }

  .stock {
    color: #e50914;
    text-shadow: 0 0 20px rgba(229, 9, 20, 0.6);
  }

  .subtitle {
    color: #cccccc;
    font-size: 18px;
    font-weight: 500;
    margin: 15px 0 0 0;
    letter-spacing: 0.5px;
  }

  .portal-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
    width: 100%;
  }

  .portal-card {
    background-color: rgba(20, 20, 20, 0.85);
    border: 1px solid #2d2d2d;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .portal-card:hover {
    transform: translateY(-8px);
    border-color: #e50914;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(229, 9, 20, 0.15);
  }

  .card-bg-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background-color: #333;
    transition: background-color 0.3s;
  }

  .portal-card:hover .card-bg-glow {
    background-color: #e50914;
    box-shadow: 0 0 10px #e50914;
  }

  .card-inner {
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
  }

  .icon-wrap {
    font-size: 50px;
    background-color: #1a1a1a;
    width: 90px;
    height: 90px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    border: 2px solid #333;
    transition: all 0.3s;
  }

  .portal-card:hover .icon-wrap {
    border-color: #e50914;
    background-color: #222;
    transform: rotate(5deg) scale(1.05);
  }

  .card-inner h2 {
    color: #ffffff;
    font-size: 24px;
    margin: 0;
    font-weight: 800;
  }

  .card-inner p {
    color: #aaaaaa;
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
    min-height: 80px;
  }

  .portal-btn {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 6px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .customer-btn {
    background-color: #e50914;
    color: #ffffff;
  }

  .customer-btn:hover {
    background-color: #b20710;
    box-shadow: 0 0 15px rgba(229, 9, 20, 0.4);
  }

  .admin-btn {
    background-color: #2a2a2a;
    color: #ffffff;
    border: 1px solid #444;
  }

  .admin-btn:hover {
    background-color: #3a3a3a;
    border-color: #666;
  }

  .landing-footer {
    text-align: center;
    margin-top: 20px;
  }

  .landing-footer p {
    color: #666666;
    font-size: 12px;
  }

  @media (max-width: 768px) {
    .portal-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }
    
    .main-title {
      font-size: 44px;
    }
    
    .subtitle {
      font-size: 15px;
    }
    
    .card-inner {
      padding: 30px 20px;
    }
  }
</style>
