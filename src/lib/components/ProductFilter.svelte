<script>
  let { activeCategory = $bindable('All'), searchQuery = $bindable('') } = $props();

  const categories = [
    'All',
    'CPU',
    'GPU',
    'RAM',
    'SSD',
    'Motherboard',
    'Processor',
    'Keyboard',
    'Mouse',
    'Monitor',
    'Cabinet'
  ];

  function selectCategory(category) {
    activeCategory = category;
  }
</script>

<div class="filter-wrapper">
  <!-- Search input -->
  <div class="search-box">
    <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
    </svg>
    <input 
      type="text" 
      bind:value={searchQuery} 
      placeholder="Search hardware products (e.g. Intel, RTX)..." 
      class="search-input" 
    />
    {#if searchQuery}
      <button class="clear-search" onclick={() => searchQuery = ''}>×</button>
    {/if}
  </div>

  <!-- Category selector pills -->
  <div class="categories-list">
    {#each categories as category}
      <button 
        class="category-pill {activeCategory === category ? 'active' : ''}" 
        onclick={() => selectCategory(category)}
      >
        {category}
      </button>
    {/each}
  </div>
</div>

<style>
  .filter-wrapper {
    margin-bottom: 30px;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .search-box {
    position: relative;
    max-width: 600px;
    margin: 0 auto 20px auto;
  }

  .search-icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: #888888;
  }

  .search-input {
    width: 100%;
    background-color: #1a1a1a;
    border: 1px solid #333333;
    border-radius: 25px;
    padding: 12px 45px;
    color: #ffffff;
    font-size: 15px;
    box-sizing: border-box;
    transition: all 0.3s;
  }

  .search-input:focus {
    outline: none;
    border-color: #e50914;
    background-color: #222222;
    box-shadow: 0 0 10px rgba(229, 9, 20, 0.2);
  }

  .clear-search {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: #888888;
    font-size: 20px;
    cursor: pointer;
    line-height: 1;
    padding: 0;
  }

  .clear-search:hover {
    color: #ffffff;
  }

  .categories-list {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding: 5px 0 10px 0;
    justify-content: center;
    scrollbar-width: thin;
    scrollbar-color: #e50914 #141414;
  }

  /* Custom horizontal scrollbar for category pills */
  .categories-list::-webkit-scrollbar {
    height: 5px;
  }

  .categories-list::-webkit-scrollbar-track {
    background: #141414;
  }

  .categories-list::-webkit-scrollbar-thumb {
    background: #2a2a2a;
    border-radius: 4px;
  }

  .category-pill {
    background-color: #1a1a1a;
    color: #aaaaaa;
    border: 1px solid #333333;
    padding: 8px 18px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  .category-pill:hover {
    background-color: #222;
    color: #ffffff;
    border-color: #555;
  }

  .category-pill.active {
    background-color: #e50914;
    color: #ffffff;
    border-color: #e50914;
    box-shadow: 0 0 10px rgba(229, 9, 20, 0.4);
  }

  @media (max-width: 768px) {
    .categories-list {
      justify-content: flex-start;
      padding-left: 10px;
    }
  }
</style>
