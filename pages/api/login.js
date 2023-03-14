import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Verify user credentials and generate JWT token
    const { email, password } = req.body;

    if (email === 'user@example.com' && password === 'password123') {
      const token = jwt.sign({ email }, process.env.JWT_SECRET);

      return res.status(200).json({ token });
    } else {
      return res.status(401).json({ error: 'Invalid login credentials.' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed.' });
  }
}