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
  <nav class="top-bar">
    <div class="top-bar-links">
      <a href="#help">Help & Settings</a>
      <a href="#account">Your Account</a>
      <a href="#customer-service">Customer Service</a>
    </div>
    <div class="top-bar-auth">
      {#if currentUser}
        <button class="login-btn" onclick={() => goto('/dashboard')}>Go to Dashboard</button>
      {:else}
        <button class="login-btn" onclick={() => goto('/login')}>User Login</button>
      {/if}
    </div>
  </nav>

  <div class="landing-content">
    <header class="landing-header">
      <div class="title-wrapper">
        <div class="logo-container">
          <svg class="logo cpu-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="60" height="60" rx="10" fill="#202020" stroke="#e50914" stroke-width="4"/>
            <rect x="35" y="35" width="30" height="30" rx="4" fill="#e50914"/>
            <path d="M40 20 V10 M50 20 V10 M60 20 V10" stroke="#e50914" stroke-width="4" stroke-linecap="round"/>
            <path d="M40 80 V90 M50 80 V90 M60 80 V90" stroke="#e50914" stroke-width="4" stroke-linecap="round"/>
            <path d="M20 40 H10 M20 50 H10 M20 60 H10" stroke="#e50914" stroke-width="4" stroke-linecap="round"/>
            <path d="M80 40 H90 M80 50 H90 M80 60 H90" stroke="#e50914" stroke-width="4" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="main-title"><span class="smart">SMART</span><span class="stock">STOCK</span></h1>
      </div>
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

    <div class="about-section">
      <h3>About Smart Stock</h3>
      <p>Smart Stock is the premier destination for high-performance computer hardware inventory management and retail. We provide a seamless experience for both customers seeking top-tier components and administrators managing robust inventory systems.</p>
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
    flex-direction: column;
    align-items: center;
    padding: 0 20px 40px;
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
    margin-top: 60px;
  }

  .top-bar {
    width: 100%;
    max-width: 1200px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
    margin-bottom: 20px;
  }

  .top-bar-links {
    display: flex;
    gap: 20px;
  }

  .top-bar-links a {
    color: #cccccc;
    text-decoration: none;
    font-size: 14px;
    transition: color 0.2s;
  }

  .top-bar-links a:hover {
    color: #e50914;
  }

  .login-btn {
    background-color: transparent;
    color: #ffffff;
    border: 1px solid #e50914;
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .login-btn:hover {
    background-color: #e50914;
    box-shadow: 0 0 10px rgba(229, 9, 20, 0.4);
  }

  .landing-header {
    text-align: center;
  }

  .title-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 15px;
  }

  .logo-container {
    display: flex;
    justify-content: center;
  }

  .logo {
    width: 60px;
    height: 60px;
    box-shadow: 0 0 15px rgba(229, 9, 20, 0.4);
    border-radius: 10px; /* matched the rx of cpu svg */
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

  .about-section {
    background-color: rgba(20, 20, 20, 0.6);
    border: 1px solid #2d2d2d;
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    max-width: 800px;
    width: 100%;
  }

  .about-section h3 {
    color: #ffffff;
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 22px;
  }

  .about-section p {
    color: #aaaaaa;
    line-height: 1.6;
    margin: 0;
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
