const nodemailer = require('nodemailer');

async function createTestTransporter() {
  let testAccount = await nodemailer.createTestAccount();
  
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

// 1. Client Template
function createClientOrderHtml(order) {
  const itemsHtml = order.orderItems.map(item => `
    <li style="margin-bottom: 10px;">
      <strong>${item.name}</strong> (${item.size}ml) x ${item.quantity} - &pound;${item.price}
    </li>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h1 style="color: #1a1a1a;">Thank you for your order!</h1>
      <p>Your order <strong>#${order._id.toString().slice(-6)}</strong> has been successfully placed.</p>
      <p>Total Amount: <strong>&pound;${order.totalPrice.toFixed(2)}</strong></p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <h3>Order Composition:</h3>
      <ul style="list-style: none; padding: 0;">${itemsHtml}</ul>
      <p>We will notify you when your order status changes.</p>
      <a href="http://localhost:3000/profile" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #1a1a1a; color: #fff; text-decoration: none; border-radius: 4px;">View My Profile</a>
    </div>
  `;
}

// 2. Admin Template
function createAdminOrderHtml(order) {
  const itemsHtml = order.orderItems.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name} (${item.size}ml)</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">x${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">&pound;${item.price}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2px solid #e0e0e0;">
      <h2 style="color: #c0392b; margin-top: 0;">🔔 NEW ORDER! (#${order._id.toString().slice(-6)})</h2>
      <p><strong>Total Amount:</strong> &pound;${order.totalPrice.toFixed(2)}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin-top: 0;">Shipping Address:</h3>
        <p style="margin: 0;">
          <strong>${order.shippingInfo.name}</strong><br>
          ${order.shippingInfo.email}<br>
          ${order.shippingInfo.addressLine1} ${order.shippingInfo.addressLine2}<br>
          ${order.shippingInfo.city}, ${order.shippingInfo.postcode}<br>
          ${order.shippingInfo.country}
        </p>
      </div>

      <h3>Items:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="padding: 8px; text-align: left;">Name</th>
            <th style="padding: 8px; text-align: left;">Qty</th>
            <th style="padding: 8px; text-align: left;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      
      <div style="margin-top: 30px; text-align: center;">
        <a href="http://localhost:3000/admin/orders" style="background-color: #2980b9; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px;">Go to Order Management</a>
      </div>
    </div>
  `;
}

// 3. Status Update Template (for client)
function createStatusUpdateHtml(order) {
  let messageBody = '';
  switch (order.status) {
    case 'Processing': messageBody = 'Your order is being processed. We are carefully packaging your fragrances.'; break;
    case 'Shipped': messageBody = 'Great news! Your order has been dispatched for delivery.'; break;
    case 'Delivered': messageBody = 'Your order has been delivered. We hope you enjoy your fragrances!'; break;
    case 'Cancelled': messageBody = 'Your order has been cancelled.'; break;
    default: messageBody = `Your order status has been updated to: ${order.status}`;
  }
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
      <h2 style="color: #333;">Order Update #${order._id.toString().slice(-6)}</h2>
      <p style="font-size: 1.1em;"><strong>New Status: ${order.status}</strong></p>
      <p>${messageBody}</p>
      <a href="http://localhost:3000/profile" style="color: #333;">View My Profile</a>
    </div>
  `;
}

// --- SENDING FUNCTIONS ---

async function sendOrderConfirmationEmail(order) {
  try {
    const transporter = await createTestTransporter();
    
    // 1. Email to Client
    const clientInfo = await transporter.sendMail({
      from: '"AROMATICUS" <no-reply@aromaticus.com>',
      to: order.shippingInfo.email, 
      subject: `Your order #${order._id.toString().slice(-6)} has been confirmed`,
      html: createClientOrderHtml(order),
    });
    console.log(`📧 Client Email: ${nodemailer.getTestMessageUrl(clientInfo)}`);

    // 2. Email to Admin
    const adminInfo = await transporter.sendMail({
      from: '"System Bot" <bot@aromaticus.com>',
      to: 'admin@aromaticus.com', 
      subject: `🔔 NEW ORDER #${order._id.toString().slice(-6)} for £${order.totalPrice.toFixed(2)}`,
      html: createAdminOrderHtml(order),
    });
    console.log(`📧 Admin Email: ${nodemailer.getTestMessageUrl(adminInfo)}`);

  } catch (error) {
    console.error(`❌ Email error: ${error}`);
  }
}

async function sendOrderStatusEmail(order) {
  try {
    const transporter = await createTestTransporter();
    const info = await transporter.sendMail({
      from: '"AROMATICUS" <no-reply@aromaticus.com>',
      to: order.shippingInfo.email,
      subject: `Order Update #${order._id.toString().slice(-6)}`,
      html: createStatusUpdateHtml(order),
    });
    console.log(`📧 Status Email Sent: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    console.error(`❌ Email error: ${error}`);
  }
}

module.exports = { sendOrderConfirmationEmail, sendOrderStatusEmail };