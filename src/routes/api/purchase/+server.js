import { json } from '@sveltejs/kit';
import { dbGetProducts as srvGetProducts, dbUpdateProduct as srvUpdateProduct, dbAddOrder as srvAddOrder } from '$lib/firebase.js';

export async function POST({ request, fetch }) {
  try {
    const { userId, username, email, items } = await request.json();

    if (!userId || !items || !items.length) {
      return json({ success: false, message: "Checkout failed: User details or cart items are missing." }, { status: 400 });
    }

    const products = await srvGetProducts();
    const checkedItems = [];

    // 1. Validate stock first
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return json({ success: false, message: `Product with ID ${item.productId} not found.` }, { status: 400 });
      }

      if (product.stock < item.quantity) {
        return json({ 
          success: false, 
          message: `Insufficient stock for "${product.name}". Only ${product.stock} units available, but ${item.quantity} requested.` 
        }, { status: 400 });
      }
      checkedItems.push({ item, product });
    }

    const createdOrders = [];

    // 2. Reduce stock and record order for each item
    for (const { item, product } of checkedItems) {
      // Decrement stock quantity
      const newStock = product.stock - item.quantity;
      await srvUpdateProduct(product.id, { stock: newStock });

      // Create order entry
      const totalPrice = product.price * item.quantity;
      const newOrder = await srvAddOrder({
        userId,
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        totalPrice,
        orderStatus: "Completed"
      });

      createdOrders.push(newOrder);

      // 3. Dispatch Email Notification
      try {
        await fetch('/api/email-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username || "User",
            email: email,
            productName: product.name,
            quantity: item.quantity,
            totalPrice
          })
        });
      } catch (err) {
        console.error(`Failed to send email notification for order of ${product.name}:`, err);
      }
    }

    return json({ 
      success: true, 
      message: "Purchase processed successfully!", 
      orders: createdOrders 
    }, { status: 200 });

  } catch (error) {
    return json({ success: false, message: "Internal server error during checkout: " + error.message }, { status: 500 });
  }
}
