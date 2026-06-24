// Server-side database adapter (Stateful Mock / Firebase Admin)
import { env } from '$env/dynamic/private';

// Local default database state (stateful in memory on the server)
let serverUsers = [
  { id: "u_admin", username: "admin", email: "admin@stockmate.com", password: "admin123", role: "admin", name: "System Admin" }
];

let serverProducts = [
  {
    id: "p1",
    name: "Intel i9 Processor",
    category: "Processor",
    price: 45000,
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "p2",
    name: "AMD Ryzen 7",
    category: "Processor",
    price: 28000,
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "p3",
    name: "NVIDIA RTX 4060",
    category: "GPU",
    price: 32000,
    stock: 8,
    imageUrl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "p4",
    name: "Corsair RAM 16GB",
    category: "RAM",
    price: 6500,
    stock: 25,
    imageUrl: "https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "p5",
    name: "Samsung SSD 1TB",
    category: "SSD",
    price: 8500,
    stock: 3,
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "p6",
    name: "ASUS Motherboard",
    category: "Motherboard",
    price: 15000,
    stock: 2,
    imageUrl: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=500&auto=format&fit=crop&q=60"
  }
];

let serverOrders = [];
let serverCart = [];

// --- Server-side DB Methods ---

export async function srvGetUsers() {
  return serverUsers;
}

export async function srvAddUser(user) {
  serverUsers.push(user);
  return user;
}

export async function srvGetUserByUsernameOrEmail(identifier) {
  return serverUsers.find(u => u.username === identifier || u.email === identifier) || null;
}

export async function srvGetProducts() {
  return serverProducts;
}

export async function srvAddProduct(product) {
  const newProduct = {
    id: 'prod_' + Math.random().toString(36).substr(2, 9),
    name: product.name,
    category: product.category,
    price: Number(product.price),
    stock: Number(product.stock),
    imageUrl: product.imageUrl || "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&auto=format&fit=crop&q=60"
  };
  serverProducts.push(newProduct);
  return newProduct;
}

export async function srvUpdateProduct(id, updatedFields) {
  const idx = serverProducts.findIndex(p => p.id === id);
  if (idx !== -1) {
    serverProducts[idx] = {
      ...serverProducts[idx],
      ...updatedFields,
      price: updatedFields.price !== undefined ? Number(updatedFields.price) : serverProducts[idx].price,
      stock: updatedFields.stock !== undefined ? Number(updatedFields.stock) : serverProducts[idx].stock
    };
    return serverProducts[idx];
  }
  throw new Error("Product not found");
}

export async function srvDeleteProduct(id) {
  serverProducts = serverProducts.filter(p => p.id !== id);
  return { success: true };
}

export async function srvGetOrders() {
  return serverOrders;
}

export async function srvGetUserOrders(userId) {
  return serverOrders.filter(o => o.userId === userId);
}

export async function srvAddOrder(order) {
  const newOrder = {
    orderId: 'ord_' + Math.random().toString(36).substr(2, 9),
    purchaseDate: new Date().toISOString(),
    orderStatus: "Confirmed",
    ...order
  };
  serverOrders.push(newOrder);
  return newOrder;
}

export async function srvGetCart(userId) {
  return serverCart.filter(c => c.userId === userId);
}

export async function srvAddToCart(userId, productId, quantity = 1) {
  const existing = serverCart.find(c => c.userId === userId && c.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    serverCart.push({
      cartId: 'cart_' + Math.random().toString(36).substr(2, 9),
      userId,
      productId,
      quantity
    });
  }
  return serverCart.filter(c => c.userId === userId);
}

export async function srvUpdateCartQuantity(userId, productId, quantity) {
  const item = serverCart.find(c => c.userId === userId && c.productId === productId);
  if (item) {
    item.quantity = Math.max(1, quantity);
  }
  return serverCart.filter(c => c.userId === userId);
}

export async function srvRemoveFromCart(userId, productId) {
  serverCart = serverCart.filter(c => !(c.userId === userId && c.productId === productId));
  return serverCart.filter(c => c.userId === userId);
}

export async function srvClearCart(userId) {
  serverCart = serverCart.filter(c => c.userId !== userId);
  return [];
}
