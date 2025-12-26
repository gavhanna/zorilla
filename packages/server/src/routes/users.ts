import { Elysia, t } from 'elysia';
import { usersController } from '../controllers/users.controller';

const usersRoutes = new Elysia({ prefix: '/users' })

  // GET /users - Get all users
  .get('/', async () => {
    return await usersController.getAll();
  })

  // GET /users/:id - Get a single user by ID
  .get('/:id', async ({ params }) => {
    const user = await usersController.getById(params.id);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  })

  // POST /users - Create a new user
  .post(
    '/',
    async ({ body }) => {
      return await usersController.create(body as any);
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String({ format: 'email' }),
        password: t.String(),
        avatar: t.String(),
      }),
    }
  )

  // PATCH /users/:id - Update a user
  .patch(
    '/:id',
    async ({ params, body }) => {
      const user = await usersController.update(params.id, body as any);

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    },
    {
      body: t.Partial(
        t.Object({
          name: t.String(),
          email: t.String({ format: 'email' }),
          password: t.String(),
          avatar: t.String(),
        })
      ),
    }
  )

  // DELETE /users/:id - Soft delete a user
  .delete('/:id', async ({ params }) => {
    const user = await usersController.delete(params.id);

    if (!user) {
      throw new Error('User not found');
    }

    return { message: 'User deleted successfully', user };
  });

export default usersRoutes;
