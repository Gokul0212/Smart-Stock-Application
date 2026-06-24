<script>
  import { login } from '$lib/auth.js';
  import { goto } from '$app/navigation';

  let usernameOrEmail = $state('');
  let password = $state('');
  let showPassword = $state(false);
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
        
        <div class="form-group input-with-icon">
          <input 
            type={showPassword ? "text" : "password"} 
            bind:value={password} 
            placeholder="Password" 
            required 
            class="auth-input"
          />
          <button type="button" class="toggle-password-btn" onclick={() => showPassword = !showPassword} aria-label="Toggle password visibility">
            {#if showPassword}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            {/if}
          </button>
        </div>
        
        <button type="submit" disabled={loading} class="auth-btn">
          {#if loading}Signing In...{:else}Sign In{/if}
        </button>
      </form>
      
      <div class="auth-footer">
        <p>New to SmartStock? <a class="link-text" href="/register">Create an account now</a></p>
        <button type="button" class="portal-switch" onclick={() => goto('/admin/login')}>Access Admin Control Panel</button>
        <button type="button" class="home-link" onclick={() => goto('/')}>← Back to Home</button>
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

  .input-with-icon {
    position: relative;
  }

  .toggle-password-btn {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #8c8c8c;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .toggle-password-btn:hover {
    color: #ffffff;
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
