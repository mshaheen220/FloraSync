import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'florasync-secret-key-123';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Support token via header OR query string (for file downloads like QR sheets)
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
  
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};