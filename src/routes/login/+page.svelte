<script>
  import { login } from '$lib/auth.js';
  import { goto } from '$app/navigation';

  let usernameOrEmail = $state('');
  let password = $state('');
  let errorMsg = $state('');
  let loading = $state(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      errorMsg = "Please fill in all fields.";
      return;
    }

    loading = true;
    errorMsg = '';

    try {
      // Execute local auth sign-in
      const user = await login(usernameOrEmail, password);
      
      // Redirect based on role
      if (user.role === 'admin') {
        goto('/admin/dashboard');
      } else {
        goto('/dashboard');
      }
    } catch (err) {
      errorMsg = err.message || "Invalid username/email or password.";
    } finally {
      loading = false;
    }
  }
</script>

<div class="auth-page auth-bg-overlay">
  <div class="auth-card-wrapper">
    <div class="brand" onclick={() => goto('/')}>
      <span class="brand-smart">SMART</span><span class="brand-stock">STOCK</span>
    </div>
    
    <div class="auth-card">
      <h2>Customer Sign In</h2>
      
      {#if errorMsg}
        <div class="error-banner">
          <span class="error-icon">⚠️</span>
          <span class="error-text">{errorMsg}</span>
        </div>
      {/if}
      
      <form onsubmit={handleLogin} class="auth-form">
        <div class="form-group">
          <input 
            type="text" 
            bind:value={usernameOrEmail} 
            placeholder="Username or Email" 
            required 
            class="auth-input"
          />
        </div>
        
        <div class="form-group">
          <input 
            type="password" 
            bind:value={password} 
            placeholder="Password" 
            required 
            class="auth-input"
          />
        </div>
        
        <button type="submit" disabled={loading} class="auth-btn">
          {#if loading}Signing In...{:else}Sign In{/if}
        </button>
      </form>
      
      <div class="auth-footer">
        <p>New to SmartStock? <span class="link-text" onclick={() => goto('/register')}>Create an account now</span></p>
        <p class="portal-switch" onclick={() => goto('/admin/login')}>Access Admin Control Panel</p>
        <p class="home-link" onclick={() => goto('/')}>← Back to Home</p>
      </div>
    </div>
  </div>
</div>

<style>
  .auth-page {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Inter', system-ui, sans-serif;
    padding: 20px;
    box-sizing: border-box;
  }

  .auth-card-wrapper {
    width: 100%;
    max-width: 450px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .brand {
    font-size: 32px;
    font-weight: 900;
    cursor: pointer;
    letter-spacing: 1px;
    user-select: none;
  }

  .brand-smart {
    color: #ffffff;
  }

  .brand-stock {
    color: #e50914;
    text-shadow: 0 0 10px rgba(229, 9, 20, 0.4);
  }

  .auth-card {
    width: 100%;
    background-color: rgba(0, 0, 0, 0.85);
    border: 1px solid #2d2d2d;
    border-radius: 8px;
    padding: 50px 40px;
    box-sizing: border-box;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.8);
  }

  .auth-card h2 {
    color: #ffffff;
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 25px 0;
  }

  .error-banner {
    background-color: rgba(229, 9, 20, 0.15);
    border: 1px solid #e50914;
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .error-icon {
    font-size: 16px;
  }

  .error-text {
    color: #ff8888;
    font-size: 13px;
    font-weight: 500;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .auth-input {
    width: 100%;
    background-color: #333333;
    border: 1px solid #333333;
    border-radius: 4px;
    padding: 14px;
    color: #ffffff;
    font-size: 15px;
    box-sizing: border-box;
    transition: all 0.2s;
  }

  .auth-input::placeholder {
    color: #8c8c8c;
  }

  .auth-input:focus {
    background-color: #444444;
  }

  .auth-btn {
    background-color: #e50914;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    padding: 15px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.2s, box-shadow 0.2s;
    margin-top: 10px;
  }

  .auth-btn:hover:not(:disabled) {
    background-color: #b20710;
    box-shadow: 0 0 15px rgba(229, 9, 20, 0.4);
  }

  .auth-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .auth-footer {
    margin-top: 30px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .auth-footer p {
    margin: 0;
    color: #737373;
    font-size: 13px;
    font-weight: 500;
  }

  .link-text {
    color: #ffffff;
    cursor: pointer;
  }

  .link-text:hover {
    text-decoration: underline;
  }

  .portal-switch {
    color: #e50914 !important;
    font-weight: 600 !important;
    cursor: pointer;
    margin-top: 5px !important;
    display: inline-block;
  }

  .portal-switch:hover {
    text-decoration: underline;
  }

  .home-link {
    cursor: pointer;
    font-size: 12px !important;
    margin-top: 10px !important;
  }

  .home-link:hover {
    color: #ffffff !important;
  }

  @media (max-width: 480px) {
    .auth-card {
      padding: 30px 20px;
    }
  }
</style>
