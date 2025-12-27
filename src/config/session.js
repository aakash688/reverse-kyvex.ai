import session from 'express-session';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';

dotenv.config();

export const sessionConfig = session({
  name: process.env.SESSION_NAME || 'admin_session',
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: parseInt(process.env.SESSION_MAX_AGE || '86400000') / 1000, // Convert to seconds
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'), // 24 hours
    sameSite: 'lax',
  },
});

