// Supabase JWT verification middleware supporting HS256 and RS256
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const supabase = require('../config/supabase');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET; // HS256 secret from Supabase API settings
const JWT_ISSUER = process.env.JWT_ISSUER || `${SUPABASE_URL}/auth/v1`;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'authenticated';

// RS256 JWKS client (only used if token header.alg indicates RS*)
const jwks = jwksClient({
  jwksUri: `${SUPABASE_URL}/auth/v1/keys`,
  cache: true,
  rateLimit: true,
});

function getSigningKey(header, callback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

function decodeHeader(token) {
  try {
    const [h] = token.split('.');
    const json = Buffer.from(h, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return {};
  }
}

async function verifySupabaseJwt(token) {
  const header = decodeHeader(token);
  const alg = header.alg || 'HS256';

  if (alg && alg.startsWith('RS')) {
    // Verify with JWKS (RS256)
    return await new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getSigningKey,
        {
          algorithms: ['RS256'],
          // issuer/audience may vary depending on project settings; keep permissive
        },
        (err, decoded) => (err ? reject(err) : resolve(decoded))
      );
    });
  }

  // Default: HS256 with Supabase JWT secret
  if (!JWT_SECRET) throw new Error('SUPABASE_JWT_SECRET not configured');
  return jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256'],
    // do not enforce iss/aud to avoid mismatches across environments
  });
}

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = await verifySupabaseJwt(token);
    const userId = decoded.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Invalid token: missing user ID' });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, nombre, rol, activo')
      .eq('id', userId)
      .single();

    if (error || !profile || !profile.activo) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = {
      id: profile.id,
      email: profile.email,
      nombre: profile.nombre,
      rol: profile.rol,
      activo: profile.activo,
    };
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  try {
    const decoded = await verifySupabaseJwt(token);
    const userId = decoded.sub;
    if (!userId) return next();

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
  } catch (_) {
    // Ignore token errors for optional auth
  }
  next();
};

module.exports = { authenticateToken, authorizeRoles, optionalAuth };
