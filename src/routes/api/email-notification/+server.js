import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
  try {
    const { username, email, productName, quantity, totalPrice } = await request.json();

    const serviceId = env.EMAILJS_SERVICE_ID || null;
    const templateId = env.EMAILJS_TEMPLATE_ID || null;
    const publicKey = env.EMAILJS_PUBLIC_KEY || env.PUBLIC_EMAILJS_PUBLIC_KEY || null;
    const privateKey = env.EMAILJS_PRIVATE_KEY || null;

    if (serviceId && templateId && publicKey) {
      // Execute live EmailJS dispatch via API
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          accessToken: privateKey,
          template_params: {
            to_name: username,
            to_email: email,
            product_name: productName,
            quantity: quantity,
            total_price: totalPrice,
            message: `Thank you for your purchase, ${username}! Your order of ${quantity}x ${productName} has been confirmed. Total price paid: ₹${Number(totalPrice).toLocaleString('en-IN')}.`
          }
        })
      });

      if (response.ok) {
        return json({ success: true, message: "Email sent successfully via EmailJS." });
      } else {
        const errorText = await response.text();
        console.error("EmailJS API failed:", errorText);
        // Fallback to simulation log
      }
    }

    // SIMULATED EMAIL CONSOLE LOG (Zero-Setup Output)
    const line = "==========================================================================";
    console.log(`
${line}
📧 SIMULATED CONFIRMATION EMAIL SENT TO: ${email || 'customer@example.com'}
${line}
To: ${username} <${email || 'customer@example.com'}>
Subject: Smart Stock Management System - Order Confirmation

Dear ${username},

Thank you for your order! Your purchase has been confirmed successfully.

Order Summary:
--------------------------------------------------------------------------
Product:       ${productName}
Quantity:      ${quantity}
Total Price:   ₹${Number(totalPrice).toLocaleString('en-IN')}
Status:        Confirmed
Delivery:      Standard Shipping (2-3 Business Days)

Thank you for choosing Smart Stock Management System!
${line}
`);

    return json({ 
      success: true, 
      message: "Email notification simulated successfully in the server logs.",
      simulated: true 
    });

  } catch (error) {
    return json({ success: false, message: "Error in email notification service: " + error.message }, { status: 500 });
  }
}
