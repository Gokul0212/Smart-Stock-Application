<script>
  import { authUser } from '$lib/auth.js';
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';

  let { isOpen = true, toggleSidebar } = $props();

  let currentUser = $state(null);
  const unsubscribe = authUser.subscribe(value => {
    currentUser = value;
  });

  onDestroy(() => {
    unsubscribe();
  });
</script>

<aside class="sidebar {isOpen ? 'open' : 'closed'}">
  <div class="sidebar-header">
    <span class="panel-title">{currentUser?.role === 'admin' ? 'ADMIN PANEL' : 'USER SPACE'}</span>
  </div>

  <ul class="sidebar-links">
    {#if currentUser}
      {#if currentUser.role === 'admin'}
        <li>
          <a href="/admin/dashboard" class="sidebar-link">
            <span class="icon">📊</span> Dashboard
          </a>
        </li>
        <li>
          <a href="/admin/analytics" class="sidebar-link">
            <span class="icon">📈</span> Stock Analytics
          </a>
        </li>
        <li>
          <a href="/admin/products/add" class="sidebar-link">
            <span class="icon">➕</span> Add Product
          </a>
        </li>
      {:else}
        <li>
          <a href="/dashboard" class="sidebar-link">
            <span class="icon">🛍️</span> Browse Catalog
          </a>
        </li>
        <li>
          <a href="/cart" class="sidebar-link">
            <span class="icon">🛒</span> Shopping Cart
          </a>
        </li>
        <li>
          <a href="/orders" class="sidebar-link">
            <span class="icon">📦</span> Order History
          </a>
        </li>
      {/if}
    {:else}
      <li>
        <a href="/login" class="sidebar-link">
          <span class="icon">🔑</span> Sign In
        </a>
      </li>
      <li>
        <a href="/register" class="sidebar-link">
          <span class="icon">📝</span> Register Account
        </a>
      </li>
    {/if}
  </ul>
</aside>

<style>
  .sidebar {
    background-color: #141414;
    border-right: 1px solid #222;
    width: 240px;
    height: calc(100vh - 65px);
    position: sticky;
    top: 65px;
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease, transform 0.3s ease;
    font-family: 'Inter', system-ui, sans-serif;
    overflow-y: auto;
  }

  .sidebar.closed {
    width: 0;
    overflow: hidden;
    transform: translateX(-240px);
    border-right: none;
  }

  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid #222;
    text-align: center;
  }

  .panel-title {
    color: #e50914;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 2px;
  }

  .sidebar-links {
    list-style: none;
    padding: 0;
    margin: 20px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    padding: 12px 24px;
    color: #aaaaaa;
    text-decoration: none;
    font-size: 15px;
    font-weight: 500;
    border-left: 3px solid transparent;
    transition: all 0.2s ease;
  }

  .sidebar-link:hover {
    color: #ffffff;
    background-color: #1c1c1c;
    border-left-color: #e50914;
  }

  .icon {
    margin-right: 12px;
    font-size: 16px;
  }

  @media (max-width: 768px) {
    .sidebar {
      position: fixed;
      z-index: 99;
    }
  }
</style>
