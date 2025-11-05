const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// DEBUG: Verificar que las variables JWT estén disponibles
console.log('🔐 AuthController - JWT_SECRET loaded:', !!process.env.JWT_SECRET);
console.log('🔐 AuthController - JWT_REFRESH_SECRET loaded:', !!process.env.JWT_REFRESH_SECRET);

// Si las variables no están cargadas, usar valores por defecto para desarrollo
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_for_development_2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_for_development_2024';

console.log('🔐 Using JWT_SECRET:', JWT_SECRET ? '✓ Loaded' : '✗ Missing');
console.log('🔐 Using JWT_REFRESH_SECRET:', JWT_REFRESH_SECRET ? '✓ Loaded' : '✗ Missing');

const AuthController = {
  // Registro de usuario
  register: async (req, res) => {
    try {
      console.log('📝 Register attempt:', req.body);
      console.log('🔐 JWT_SECRET in register:', !!JWT_SECRET);

      const { nombre, email, password, rol } = req.body;

      // Validaciones básicas
      if (!nombre || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email and password are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Verificar si el usuario ya existe
      const existingUser = await query(
        'SELECT id FROM usuarios WHERE email = ?',
        [email]
      );

      if (existingUser.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Determinar rol (por defecto recepcionista, solo admin puede crear otros roles)
      const userRole = rol && req.user && req.user.rol === 'admin' ? rol : 'recepcionista';

      // Si no hay usuario autenticado, solo permitir crear recepcionista
      const finalRole = req.user ? userRole : 'admin';

      console.log('👤 Creating user with role:', finalRole);

      // Crear usuario
      const result = await query(
        'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
        [nombre, email, hashedPassword, finalRole]
      );

      console.log('✅ User created with ID:', result.insertId);

      // Generar tokens - USAR LAS CONSTANTES CORREGIDAS
      const accessToken = jwt.sign(
        { userId: result.insertId },
        JWT_SECRET,  // ← Usar la constante, no process.env directamente
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: result.insertId },
        JWT_REFRESH_SECRET,  // ← Usar la constante, no process.env directamente
        { expiresIn: '7d' }
      );

      console.log('🔐 Tokens generated successfully');

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: result.insertId,
            nombre,
            email,
            rol: finalRole
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('❌ Registration error details:');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Error during registration: ' + error.message
      });
    }
  },

  // Login de usuario
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      console.log('🔑 Login attempt for:', email);

      // Buscar usuario
      const users = await query(
        'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
        [email]
      );

      if (users.length === 0) {
        console.log('❌ User not found:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const user = users[0];
      console.log('👤 User found:', user.email, 'Role:', user.rol);

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        console.log('❌ Invalid password for:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      console.log('✅ Password valid for:', email);

      // Generar tokens - USAR LAS CONSTANTES CORREGIDAS
      const accessToken = jwt.sign(
        { userId: user.id },
        JWT_SECRET,  // ← Usar la constante
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_REFRESH_SECRET,  // ← Usar la constante
        { expiresIn: '7d' }
      );

      console.log('🔐 Login tokens generated for user:', user.id);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during login: ' + error.message
      });
    }
  },

  googleSignIn: async (req, res) => {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({
          success: false,
          message: 'Google ID token is required'
        });
      }

      const ticket = await client.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { email } = payload;

      const users = await query(
        'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
        [email]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not registered. Please contact an administrator.'
        });
      }

      const user = users[0];

      const accessToken = jwt.sign(
        { userId: user.id },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Google Sign-In successful',
        data: {
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
          },
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      console.error('❌ Google Sign-In error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during Google Sign-In: ' + error.message
      });
    }
  },

  // Refresh token
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);  // ← Usar la constante

      // Verificar que el usuario aún existe
      const users = await query(
        'SELECT id, nombre, email, rol FROM usuarios WHERE id = ? AND activo = TRUE',
        [decoded.userId]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      const user = users[0];

      // Generar nuevo access token
      const newAccessToken = jwt.sign(
        { userId: user.id },
        JWT_SECRET,  // ← Usar la constante
        { expiresIn: '15m' }
      );

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
          }
        }
      });
    } catch (error) {
      console.error('❌ Refresh token error:', error.message);
      res.status(403).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  },

  // Logout
  logout: async (req, res) => {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  },

  // Cambiar contraseña
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      // Obtener usuario con password
      const users = await query(
        'SELECT * FROM usuarios WHERE id = ?',
        [req.user.id]
      );

      const user = users[0];

      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash nueva contraseña
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña
      await query(
        'UPDATE usuarios SET password = ? WHERE id = ?',
        [hashedNewPassword, req.user.id]
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error changing password'
      });
    }
  }
};

module.exports = AuthController;