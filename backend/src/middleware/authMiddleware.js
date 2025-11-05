// Supabase JWT verification middleware using JWKS
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const supabase = require('../config/supabase');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mkflmlbqfdcvdnknmkmt.supabase.co';
const JWT_ISSUER = process.env.JWT_ISSUER || `${SUPABASE_URL}/auth/v1`;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'authenticated';

// JWKS client to fetch Supabase public keys
const client = jwksClient({
  jwksUri: `${SUPABASE_URL}/auth/v1/keys`,
  cache: true,
  rateLimit: true,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }

  try {
    // Verify JWT using Supabase JWKS
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        {
          audience: JWT_AUDIENCE,
          issuer: JWT_ISSUER,
          algorithms: ['RS256'],
        },
        (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded);
        }
      );
    });

    // Extract user ID from sub claim (UUID)
    const userId = decoded.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: missing user ID',
      });
    }

    // Fetch user profile from Supabase to get role and active status
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, nombre, rol, activo')
      .eq('id', userId)
      .single();

    if (error || !profile || !profile.activo) {
      console.error('User profile fetch error:', error);
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    // Attach user to request (mimic old structure for compatibility)
    req.user = {
      id: profile.id,
      email: profile.email,
      nombre: profile.nombre,
      rol: profile.rol,
      activo: profile.activo,
    };

    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(
          token,
          getKey,
          {
            audience: JWT_AUDIENCE,
            issuer: JWT_ISSUER,
            algorithms: ['RS256'],
          },
          (err, decoded) => {
            if (err) return reject(err);
            resolve(decoded);
          }
        );
      });

      const userId = decoded.sub;
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, nombre, rol, activo')
          .eq('id', userId)
          .eq('activo', true)
          .single();

        if (profile) {
          req.user = {
            id: profile.id,
            email: profile.email,
            nombre: profile.nombre,
            rol: profile.rol,
            activo: profile.activo,
          };
        }
      }
    } catch (error) {
      // Token invalid, continue without user
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  optionalAuth,
};
