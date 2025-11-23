const nodemailer = require('nodemailer');

// Создаем тестовый аккаунт (один для всех функций)
async function createTestTransporter() {
  let testAccount = await nodemailer.createTestAccount();
  
  // Логируем данные аккаунта (чтобы вы могли войти, если нужно)
  // console.log('Ethereal User:', testAccount.user);
  // console.log('Ethereal Pass:', testAccount.pass);

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

// --- HTML ШАБЛОНЫ ---

// 1. Шаблон для НОВОГО заказа
function createOrderEmailHtml(order) {
  const itemsHtml = order.orderItems.map(item => `
    <li>${item.name} (${item.size}ml) x ${item.quantity} - £${item.price}</li>
  `).join('');

  return `
    <h1>Спасибо за ваш заказ!</h1>
    <p>Номер заказа: <strong>${order._id.toString().slice(-6)}</strong></p>
    <p>Сумма: £${order.totalPrice.toFixed(2)}</p>
    <h3>Состав:</h3>
    <ul>${itemsHtml}</ul>
    <p>Мы сообщим вам, когда статус заказа изменится.</p>
  `;
}

// 2. Шаблон для ОБНОВЛЕНИЯ СТАТУСА
function createStatusUpdateHtml(order) {
  let messageBody = '';
  
  switch (order.status) {
    case 'В работе':
      messageBody = 'Ваш заказ принят в работу. Мы бережно упаковываем ваши ароматы.';
      break;
    case 'Отправлено':
      messageBody = 'Отличные новости! Ваш заказ передан в службу доставки. Ожидайте прибытия.';
      break;
    case 'Доставлено':
      messageBody = 'Ваш заказ доставлен. Надеемся, вам понравятся ароматы! Будем рады отзыву.';
      break;
    case 'Отменено':
      messageBody = 'Ваш заказ был отменен. Если это ошибка, пожалуйста, свяжитесь с нами.';
      break;
    default:
      messageBody = `Статус вашего заказа изменен на: ${order.status}`;
  }

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
      <h2 style="color: #333;">Обновление по заказу #${order._id.toString().slice(-6)}</h2>
      <p style="font-size: 1.1em; color: #2c3e50;">
        <strong>Новый статус: ${order.status}</strong>
      </p>
      <p>${messageBody}</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <a href="http://localhost:3000/profile" style="color: #333;">Перейти в Личный Кабинет</a>
    </div>
  `;
}

// --- ФУНКЦИИ ОТПРАВКИ ---

// 1. Отправка подтверждения заказа (вызывается при покупке)
async function sendOrderConfirmationEmail(order) {
  try {
    const transporter = await createTestTransporter();
    const info = await transporter.sendMail({
      from: '"AROMATICUS" <no-reply@aromaticus.com>',
      to: order.shippingInfo.email, // ❗️ Отправляем КЛИЕНТУ
      subject: `Заказ #${order._id.toString().slice(-6)} подтвержден`,
      html: createOrderEmailHtml(order),
    });
    console.log(`📧 Письмо (Заказ) отправлено: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    console.error(`❌ Ошибка email: ${error}`);
  }
}

// 2. Отправка обновления статуса (вызывается из Админки)
async function sendOrderStatusEmail(order) {
  try {
    const transporter = await createTestTransporter();
    const info = await transporter.sendMail({
      from: '"AROMATICUS" <no-reply@aromaticus.com>',
      to: order.shippingInfo.email, // ❗️ Отправляем КЛИЕНТУ
      subject: `Обновление статуса заказа #${order._id.toString().slice(-6)}`,
      html: createStatusUpdateHtml(order),
    });
    console.log(`📧 Письмо (Статус) отправлено: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    console.error(`❌ Ошибка email: ${error}`);
  }
}

module.exports = { sendOrderConfirmationEmail, sendOrderStatusEmail };