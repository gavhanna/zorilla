import { Elysia, t } from 'elysia';
import { authController } from '../controllers/auth.controller';

const authRoutes = new Elysia({ prefix: '/auth' })

  // POST /auth/register - Register a new user
  .post(
    '/register',
    async ({ body, set }) => {
      try {
        const result = await authController.register(body as any);
        set.status = 201;
        return result;
      } catch (error: any) {
        set.status = 400;
        return { message: error.message || 'Registration failed' };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 6 }),
      }),
    }
  )

  // POST /auth/login - Login user
  .post(
    '/login',
    async ({ body, set }) => {
      try {
        return await authController.login(body as any);
      } catch (error: any) {
        set.status = 401;
        return { message: error.message || 'Login failed' };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
      }),
    }
  )

  // GET /auth/me - Get current user (protected route)
  .get('/me', async ({ headers, set }) => {
    try {
      const authHeader = headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        set.status = 401;
        return { message: 'No token provided' };
      }

      const token = authHeader.substring(7);
      const user = await authController.verifyToken(token);

      return user;
    } catch (error: any) {
      set.status = 401;
      return { message: error.message || 'Invalid token' };
    }
  });

export default authRoutes;
