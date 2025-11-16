// middleware/verifyToken.js
const jwt = require('jsonwebtoken');

/**
 * Это "middleware" (промежуточное ПО).
 * Он встраивается в запрос ПЕРЕД тем, как запрос попадет в основной роут.
 * Его задача - проверить JWT-токен из заголовка Authorization.
 */
const verifyToken = (req, res, next) => {
  // 1. Получаем заголовок
  // Формат: "Authorization: Bearer <TOKEN>"
  const authHeader = req.headers['authorization'];
  
  // 2. Вытаскиваем сам токен
  const token = authHeader && authHeader.split(' ')[1]; 

  if (token == null) {
    // 3. Если токена нет - Ошибка 401 (Нет авторизации)
    return res.status(401).json({ message: 'Доступ запрещен: Токен не предоставлен' });
  }

  // 4. Проверяем, действителен ли токен
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // 5. Если токен невалидный (поддельный или истек) - Ошибка 403 (Запрещено)
      return res.status(403).json({ message: 'Доступ запрещен: Невалидный токен' });
    }

    // 6. Все в порядке. Записываем данные из токена (например, user.id) 
    //    в объект запроса, чтобы роут мог их использовать.
    req.user = user; 
    
    // 7. ❗️ ВАЖНО: Передаем управление дальше, к самому роуту
    next(); 
  });
};

module.exports = verifyToken;