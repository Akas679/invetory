import bcrypt from 'bcrypt';
import session from 'express-session';
import type { Express, RequestHandler } from 'express';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: 'sessions',
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'inventory-management-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.use(getSession());

  // Initialize super admin user
  await initializeSuperAdmin();
}

async function initializeSuperAdmin() {
  try {
    const existingAdmin = await storage.getUserByUsername('Sudhamrit');
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Sudhamrit@1234', 10);
      await storage.createUser({
        username: 'Sudhamrit',
        password: hashedPassword,
        email: 'admin@inventory.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
      });
      console.log('Super admin user created: username=Sudhamrit, password=Sudhamrit@1234');
    }
  } catch (error) {
    console.error('Error initializing super admin:', error);
  }
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  if (!(req.session as any).userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser((req.session as any).userId);
    if (!user || !user.isActive) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export async function loginUser(username: string, password: string) {
  const user = await storage.getUserByUsername(username);
  if (!user || !user.isActive) {
    return null;
  }
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return null;
  }
  return user;
}
