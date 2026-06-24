<script>
  import { registerUser, login } from '$lib/auth.js';
  import { goto } from '$app/navigation';

  let name = $state('');
  let username = $state('');
  let email = $state('');
  let phone = $state('');
  let password = $state('');
  let confirmPassword = $state('');

  let errorMsg = $state('');
  let successMsg = $state('');
  let loading = $state(false);

  async function handleRegister(e) {
    e.preventDefault();

    if (!name || !username || !email || !phone || !password || !confirmPassword) {
      errorMsg = "Please fill in all fields.";
      return;
    }

    if (password !== confirmPassword) {
      errorMsg = "Passwords do not match.";
      return;
    }

    if (password.length < 6) {
      errorMsg = "Password must be at least 6 characters long.";
      return;
    }

    loading = true;
    errorMsg = '';
    successMsg = '';

    try {
      // 1. Create User
      await registerUser({ name, username, email, phone, password });
      
      // 2. Automatically Log In
      await login(username, password);

      successMsg = "Account created successfully! Redirecting...";
      setTimeout(() => {
        goto('/dashboard');
      }, 1500);

    } catch (err) {
      errorMsg = err.message || "Registration failed.";
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
      <h2>Create Account</h2>

      {#if errorMsg}
        <div class="banner error-banner">
          <span class="banner-icon">⚠️</span>
          <span class="banner-text">{errorMsg}</span>
        </div>
      {/if}

      {#if successMsg}
        <div class="banner success-banner">
          <span class="banner-icon">✓</span>
          <span class="banner-text">{successMsg}</span>
        </div>
      {/if}

      <form onsubmit={handleRegister} class="auth-form">
        <div class="form-group">
          <input 
            type="text" 
            bind:value={name} 
            placeholder="Full Name" 
            required 
            class="auth-input"
          />
        </div>

        <div class="form-group">
          <input 
            type="text" 
            bind:value={username} 
            placeholder="Username" 
            required 
            class="auth-input"
          />
        </div>

        <div class="form-group">
          <input 
            type="email" 
            bind:value={email} 
            placeholder="Email Address" 
            required 
            class="auth-input"
          />
        </div>

        <div class="form-group">
          <input 
            type="tel" 
            bind:value={phone} 
            placeholder="Phone Number" 
            required 
            class="auth-input"
          />
        </div>

        <div class="form-group font-mono">
          <input 
            type="password" 
            bind:value={password} 
            placeholder="Password (min 6 chars)" 
            required 
            class="auth-input"
          />
        </div>

        <div class="form-group font-mono input-with-icon">
          <input 
            type="password" 
            bind:value={confirmPassword} 
            placeholder="Confirm Password" 
            required 
            class="auth-input"
          />
          {#if confirmPassword}
            {#if password === confirmPassword}
              <span class="match-status">✅</span>
            {:else}
              <div class="inline-error">Passwords do not match</div>
            {/if}
          {/if}
        </div>

        <button type="submit" disabled={loading || (confirmPassword && password !== confirmPassword)} class="auth-btn">
          {#if loading}Creating Account...{:else}Create Account{/if}
        </button>
      </form>

      <div class="auth-footer">
        <p>Already have an account? <span class="link-text" onclick={() => goto('/login')}>Sign In</span></p>
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
    padding: 40px 20px;
    box-sizing: border-box;
  }

  .auth-card-wrapper {
    width: 100%;
    max-width: 480px;
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
    padding: 40px 40px;
    box-sizing: border-box;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.8);
  }

  .auth-card h2 {
    color: #ffffff;
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 25px 0;
    text-align: center;
  }

  .banner {
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .error-banner {
    background-color: rgba(229, 9, 20, 0.15);
    border: 1px solid #e50914;
  }

  .success-banner {
    background-color: rgba(46, 125, 50, 0.15);
    border: 1px solid #2e7d32;
  }

  .banner-icon {
    font-size: 16px;
  }

  .banner-text {
    font-size: 13px;
    font-weight: 500;
  }

  .error-banner .banner-text {
    color: #ff8888;
  }

  .success-banner .banner-text {
    color: #a5d6a7;
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

  .match-status {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
  }

  .inline-error {
    color: #ff8888;
    font-size: 12px;
    margin-top: 6px;
    margin-left: 2px;
    font-family: 'Inter', system-ui, sans-serif;
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
    margin-top: 25px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    text-align: center;
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
    font-weight: 600;
  }

  .link-text:hover {
    text-decoration: underline;
  }

  .home-link {
    cursor: pointer;
    font-size: 12px !important;
    margin-top: 5px !important;
    display: inline-block;
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
