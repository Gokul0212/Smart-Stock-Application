<script>
  import { authUser } from '$lib/auth.js';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { dbGetProducts, dbGetOrders } from '$lib/firebase.js';
  import Sidebar from '$lib/components/Sidebar.svelte';

  let products = $state([]);
  let orders = $state([]);
  let loading = $state(true);
  let sidebarOpen = $state(true);

  const unsubscribe = authUser.subscribe(val => {
    if (typeof window !== 'undefined' && (!val || val.role !== 'admin')) {
      goto('/admin/login');
    }
  });

  onMount(async () => {
    try {
      products = await dbGetProducts();
      orders = await dbGetOrders();
    } catch (e) {
      console.error("Failed to load analytics data", e);
    } finally {
      loading = false;
    }
  });

  onDestroy(() => {
    unsubscribe();
  });

  // Analytics derivations
  let totalStockUnits = $derived(products.reduce((acc, p) => acc + Number(p.stock), 0));
  let totalInventoryValue = $derived(products.reduce((acc, p) => acc + (Number(p.price) * Number(p.stock)), 0));
  let lowStockProducts = $derived(products.filter(p => Number(p.stock) < 5));
  let totalOrdersCount = $derived(orders.length);
  let totalSalesRevenue = $derived(orders.reduce((acc, o) => acc + Number(o.totalPrice), 0));

  // Category distribution
  let categoryStats = $derived(() => {
    const stats = {};
    products.forEach(p => {
      if (!stats[p.category]) {
        stats[p.category] = { count: 0, stock: 0, value: 0 };
      }
      stats[p.category].count += 1;
      stats[p.category].stock += Number(p.stock);
      stats[p.category].value += Number(p.price) * Number(p.stock);
    });
    return Object.entries(stats).map(([category, info]) => ({
      category,
      ...info
    })).sort((a,b) => b.stock - a.stock);
  });

  // Calculate percentage of total stock for visual charts
  function getStockPercentage(stock, total) {
    if (total === 0) return 0;
    return Math.min(100, Math.round((stock / total) * 100));
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
        <h1>Inventory & Stock Analytics</h1>
      </div>
    </div>

    {#if loading}
      <p class="loading-msg">Compiling analytics report...</p>
    {:else}
      <!-- High Level Financial & Stock Stats -->
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="label">Total Stock Valuation</span>
          <span class="value text-glow">₹{totalInventoryValue.toLocaleString('en-IN')}</span>
          <span class="subtitle">Asset value in warehouse</span>
        </div>

        <div class="metric-card">
          <span class="label">Total Stock Units</span>
          <span class="value">{totalStockUnits}</span>
          <span class="subtitle">Total units across all items</span>
        </div>

        <div class="metric-card">
          <span class="label">Total Orders Processed</span>
          <span class="value">{totalOrdersCount}</span>
          <span class="subtitle">Transactions completed</span>
        </div>

        <div class="metric-card sales-card">
          <span class="label">Gross Sales Revenue</span>
          <span class="value text-glow">₹{totalSalesRevenue.toLocaleString('en-IN')}</span>
          <span class="subtitle">Total sales checkout revenue</span>
        </div>
      </div>

      <div class="charts-layout">
        <!-- Category Inventory Breakdown (Visual Progress Bars) -->
        <div class="chart-box">
          <h2>Stock Distribution by Category</h2>
          
          <div class="category-bars">
            {#each categoryStats() as stat}
              <div class="category-bar-row">
                <div class="bar-labels">
                  <span class="cat-name">{stat.category}</span>
                  <span class="cat-details">{stat.count} products • {stat.stock} units</span>
                </div>
                <div class="bar-container">
                  <div class="bar-fill" style="width: {getStockPercentage(stat.stock, totalStockUnits)}%"></div>
                </div>
                <div class="bar-value">
                  {getStockPercentage(stat.stock, totalStockUnits)}%
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Low Stock Items alerts panel -->
        <div class="info-box">
          <h2>Critical Alerts</h2>
          
          <div class="alert-status">
            {#if lowStockProducts.length === 0}
              <div class="no-alerts">
                <span class="ok-icon">✓</span>
                <p>All stock levels healthy! No items are currently running low.</p>
              </div>
            {:else}
              <div class="alerts-warning-head">
                ⚠️ {lowStockProducts.length} items require replenishment:
              </div>
              <div class="alerts-scroller">
                {#each lowStockProducts as item}
                  <div class="alert-item">
                    <div class="alert-info">
                      <h4>{item.name}</h4>
                      <span>Cat: {item.category} • Price: ₹{Number(item.price).toLocaleString('en-IN')}</span>
                    </div>
                    <div class="alert-status-badge">
                      <span class="stock-num">{item.stock}</span> left
                    </div>
                    <button class="restock-btn" onclick={() => goto(`/admin/products/edit/${item.id}`)}>Restock</button>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Financial Table -->
      <div class="table-container">
        <h2>Category Valuation Ledger</h2>
        <table class="analytics-table">
          <thead>
            <tr>
              <th>Hardware Category</th>
              <th>Total Products</th>
              <th>Warehouse Stock Units</th>
              <th>Average Price</th>
              <th>Inventory Valuation</th>
            </tr>
          </thead>
          <tbody>
            {#each categoryStats() as stat}
              <tr>
                <td><strong>{stat.category}</strong></td>
                <td>{stat.count}</td>
                <td>{stat.stock}</td>
                <td>₹{Math.round(stat.stock > 0 ? (stat.value / stat.stock) : 0).toLocaleString('en-IN')}</td>
                <td class="red-text">₹{stat.value.toLocaleString('en-IN')}</td>
              </tr>
            {/each}
            {#if categoryStats().length === 0}
              <tr>
                <td colspan="5" class="empty-table">No data available.</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    {/if}
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

  .content-header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
  }

  .loading-msg {
    color: #888;
    text-align: center;
    padding: 50px;
  }

  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin: 30px 0;
  }

  .metric-card {
    background-color: #141414;
    border: 1px solid #222;
    border-radius: 6px;
    padding: 20px;
    display: flex;
    flex-direction: column;
  }

  .metric-card .label {
    font-size: 12px;
    text-transform: uppercase;
    font-weight: 700;
    color: #888888;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  .metric-card .value {
    font-size: 28px;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 5px;
  }

  .metric-card .subtitle {
    font-size: 11px;
    color: #666;
  }

  .sales-card {
    border-color: rgba(229, 9, 20, 0.3);
  }

  .sales-card .value {
    color: #e50914;
  }

  /* Charts Layout */
  .charts-layout {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 30px;
    margin-bottom: 40px;
  }

  .chart-box, .info-box {
    background-color: #141414;
    border: 1px solid #222;
    border-radius: 8px;
    padding: 30px;
    box-sizing: border-box;
  }

  h2 {
    font-size: 18px;
    font-weight: 750;
    margin: 0 0 25px 0;
    border-left: 3px solid #e50914;
    padding-left: 10px;
  }

  /* Category Progress Bars */
  .category-bars {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .category-bar-row {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .bar-labels {
    width: 180px;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .cat-name {
    color: #fff;
    font-weight: 700;
    font-size: 14px;
  }

  .cat-details {
    color: #666;
    font-size: 11px;
  }

  .bar-container {
    flex-grow: 1;
    background-color: #222;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
  }

  .bar-fill {
    background-color: #e50914;
    height: 100%;
    border-radius: 4px;
    box-shadow: 0 0 8px rgba(229, 9, 20, 0.6);
  }

  .bar-value {
    width: 40px;
    text-align: right;
    font-size: 13px;
    font-weight: 600;
    color: #aaa;
    flex-shrink: 0;
  }

  /* Critical Alerts info-box */
  .no-alerts {
    text-align: center;
    padding: 40px 10px;
  }

  .ok-icon {
    font-size: 36px;
    color: #2e7d32;
    background-color: rgba(46, 125, 50, 0.1);
    width: 60px;
    height: 60px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    margin-bottom: 15px;
    border: 1px solid rgba(46, 125, 50, 0.3);
  }

  .no-alerts p {
    color: #888;
    font-size: 13px;
    margin: 0;
  }

  .alerts-warning-head {
    color: #ff4d4d;
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 15px;
  }

  .alerts-scroller {
    max-height: 250px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .alert-item {
    background-color: #1a1a1a;
    border: 1px solid #2d2d2d;
    border-radius: 4px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .alert-info h4 {
    margin: 0 0 3px 0;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    max-width: 150px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .alert-info span {
    font-size: 10px;
    color: #666;
  }

  .alert-status-badge {
    font-size: 11px;
    color: #aaa;
  }

  .stock-num {
    color: #ff3333;
    font-weight: 800;
    font-size: 13px;
  }

  .restock-btn {
    background-color: transparent;
    color: #e50914;
    border: 1px solid #e50914;
    border-radius: 3px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .restock-btn:hover {
    background-color: #e50914;
    color: white;
  }

  /* Valuation Ledger Table */
  .table-container {
    background-color: #141414;
    border: 1px solid #222;
    border-radius: 8px;
    padding: 30px;
  }

  .analytics-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    text-align: left;
  }

  .analytics-table th {
    border-bottom: 2px solid #333;
    padding: 12px;
    color: #888;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 12px;
  }

  .analytics-table td {
    padding: 14px 12px;
    border-bottom: 1px solid #222;
    color: #dddddd;
  }

  .analytics-table tr:hover td {
    background-color: #181818;
  }

  .red-text {
    color: #e50914;
    font-weight: 700;
  }

  .empty-table {
    text-align: center;
    color: #666;
    padding: 30px;
  }

  @media (max-width: 1100px) {
    .charts-layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 480px) {
    .metrics-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
