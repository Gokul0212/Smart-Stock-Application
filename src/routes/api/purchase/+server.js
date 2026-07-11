import { json } from '@sveltejs/kit';
import { dbProcessPurchase } from '$lib/firebase.js';

export async function POST({ request, fetch }) {
  try {
    const { userId, username, email, items } = await request.json();

    if (!userId || !items || !items.length) {
      return json({ success: false, message: "Checkout failed: User details or cart items are missing." }, { status: 400 });
    }

    let createdOrders;
    try {
      createdOrders = await dbProcessPurchase(userId, items);
    } catch (txError) {
      // Check for specific thrown errors
      if (txError.message.includes('Insufficient_Stock')) {
        const msg = txError.message.replace('Insufficient_Stock: ', '');
        return json({ success: false, message: msg }, { status: 400 });
      }
      if (txError.message.includes('Product_Not_Found')) {
        const msg = txError.message.replace('Product_Not_Found: ', '');
        return json({ success: false, message: msg }, { status: 400 });
      }
      throw txError;
    }

    // 3. Dispatch Email Notification
    for (const order of createdOrders) {
      try {
        await fetch('/api/email-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username || "User",
            email: email,
            productName: order.productName,
            quantity: order.quantity,
            totalPrice: order.totalPrice
          })
        });
      } catch (err) {
        console.error(`Failed to send email notification for order of ${order.productName}:`, err);
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
