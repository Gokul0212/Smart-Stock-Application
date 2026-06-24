<script>
  import { dbAddProduct, dbGetProducts, dbDeleteProduct } from '$lib/firebase.js';
  import { registerUser, registerAdmin, logout } from '$lib/auth.js';
  import { goto } from '$app/navigation';

  let loading = $state(false);
  let status = $state('');
  let errorMsg = $state('');

  const sampleProducts = [
    {
      name: "Intel Core i9-13900K",
      category: "CPU",
      price: 52999,
      stock: 12,
      imageUrl: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=60"
    },
    {
      name: "AMD Ryzen 9 7950X3D",
      category: "CPU",
      price: 64999,
      stock: 8,
      imageUrl: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=60"
    },
    {
      name: "NVIDIA GeForce RTX 4090 24GB",
      category: "GPU",
      price: 165999,
      stock: 3,
      imageUrl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&auto=format&fit=crop&q=60"
    },
    {
      name: "Corsair Vengeance 32GB DDR5 6000MHz",
      category: "RAM",
      price: 11499,
      stock: 25,
      imageUrl: "https://images.unsplash.com/photo-1562976540-1502f7596200?w=500&auto=format&fit=crop&q=60"
    },
    {
      name: "Samsung 990 PRO 2TB NVMe",
      category: "SSD",
      price: 18999,
      stock: 15,
      imageUrl: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=500&auto=format&fit=crop&q=60"
    },
    {
      name: "ASUS ROG Maximus Z790 Hero",
      category: "Motherboard",
      price: 58999,
      stock: 5,
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60"
    },
    {
      name: "Keychron Q1 Pro Mechanical",
      category: "Keyboard",
      price: 18500,
      stock: 10,
      imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&auto=format&fit=crop&q=60"
    },
    {
      name: "Logitech G Pro X Superlight",
      category: "Mouse",
      price: 12995,
      stock: 18,
      imageUrl: "https://images.unsplash.com/photo-1615663245857-ac9310d5b508?w=500&auto=format&fit=crop&q=60"
    },
    {
      name: "LG UltraGear 27\" OLED 240Hz",
      category: "Monitor",
      price: 85999,
      stock: 4,
      imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60"
    },
    {
      name: "NZXT H9 Flow Dual-Chamber",
      category: "Cabinet",
      price: 14500,
      stock: 7,
      imageUrl: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=500&auto=format&fit=crop&q=60"
    }
  ];

  async function removeDuplicates() {
    loading = true;
    errorMsg = '';
    status = 'Scanning for duplicate products...';
    
    try {
      const allProducts = await dbGetProducts();
      const seenNames = new Set();
      let deletedCount = 0;

      for (const product of allProducts) {
        if (seenNames.has(product.name)) {
          // It's a duplicate, delete it
          status = `Deleting duplicate: ${product.name}...`;
          await dbDeleteProduct(product.id);
          deletedCount++;
        } else {
          // First time seeing this name
          seenNames.add(product.name);
        }
      }

      status = `Finished! Cleaned up ${deletedCount} duplicate items.`;
    } catch (err) {
      errorMsg = "Error removing duplicates: " + err.message;
    } finally {
      loading = false;
    }
  }

  async function seedDatabase() {
    loading = true;
    errorMsg = '';
    status = 'Starting database population...';

    try {
      // 1. Add Products
      for (let i = 0; i < sampleProducts.length; i++) {
        status = `Adding product ${i + 1}/${sampleProducts.length}: ${sampleProducts[i].name}...`;
        await dbAddProduct(sampleProducts[i]);
      }

      // 2. Add Admin User
      status = 'Creating Admin user...';
      try {
        await registerAdmin({
          name: "System Admin",
          username: "admin",
          email: "admin@smartstock.com",
          password: "password123",
          adminCode: "ADMIN123"
        });
      } catch (err) {
        if (!err.message.includes("already")) throw err;
      }

      // 3. Add Regular User
      status = 'Creating Customer user...';
      try {
        await registerUser({
          name: "Test Customer",
          username: "user",
          email: "user@smartstock.com",
          phone: "9876543210",
          password: "password123"
        });
      } catch (err) {
        if (!err.message.includes("already")) throw err;
      }

      // 4. Logout and redirect
      status = 'Database seeded successfully! Redirecting...';
      await logout();
      
      setTimeout(() => {
        goto('/login');
      }, 2000);

    } catch (err) {
      errorMsg = "Error: " + err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="seed-page">
  <div class="seed-card">
    <h1>🌱 SmartStock Setup</h1>
    <p>This will populate your empty database with 10 hardware products (with images) and create two test accounts.</p>
    
    <div class="accounts-info">
      <strong>Admin Account:</strong> admin@smartstock.com / password123<br/>
      <strong>User Account:</strong> user@smartstock.com / password123
    </div>

    {#if errorMsg}
      <div class="error">{errorMsg}</div>
    {/if}

    <button onclick={seedDatabase} disabled={loading} class="seed-btn">
      {#if loading}
        <span class="spinner"></span> Processing...
      {:else}
        Populate Database Now
      {/if}
    </button>

    <button onclick={removeDuplicates} disabled={loading} class="cleanup-btn">
      🗑️ Delete Duplicate Products
    </button>

    {#if status}
      <p class="status-text">{status}</p>
    {/if}
  </div>
</div>

<style>
  .cleanup-btn {
    background-color: transparent;
    color: #ff5555;
    border: 1px solid #ff5555;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: bold;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    margin-top: 15px;
    transition: all 0.2s;
  }
  .cleanup-btn:hover:not(:disabled) {
    background-color: #ff5555;
    color: white;
  }
  .cleanup-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .seed-page {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #000;
    font-family: 'Inter', system-ui, sans-serif;
    color: white;
  }
  .seed-card {
    background-color: #111;
    border: 1px solid #333;
    padding: 40px;
    border-radius: 8px;
    max-width: 500px;
    text-align: center;
  }
  .accounts-info {
    background-color: #222;
    padding: 15px;
    border-radius: 4px;
    margin: 20px 0;
    font-family: monospace;
    text-align: left;
    color: #00ffcc;
  }
  .seed-btn {
    background-color: #e50914;
    color: white;
    border: none;
    padding: 15px 30px;
    font-size: 16px;
    font-weight: bold;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    margin-top: 10px;
  }
  .seed-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .status-text {
    margin-top: 20px;
    color: #aaa;
  }
  .error {
    color: #ff5555;
    margin-bottom: 15px;
  }
  .spinner {
    display: inline-block;
    width: 15px;
    height: 15px;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
    margin-right: 8px;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
