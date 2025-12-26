import { Elysia, t } from 'elysia';
import { recordingsController } from '../controllers/recordings.controller';

const recordingsRoutes = new Elysia({ prefix: '/recordings' })

  // GET /recordings - Get all recordings
  .get('/', async () => {
    return await recordingsController.getAll();
  })

  // GET /recordings/user/:userId - Get recordings by user ID
  .get('/user/:userId', async ({ params }) => {
    return await recordingsController.getByUserId(params.userId);
  })

  // GET /recordings/:id - Get a single recording by ID
  .get('/:id', async ({ params }) => {
    const recording = await recordingsController.getById(params.id);

    if (!recording) {
      throw new Error('Recording not found');
    }

    return recording;
  })

  // POST /recordings - Create a new recording
  .post(
    '/',
    async ({ body }) => {
      return await recordingsController.create(body as any);
    },
    {
      body: t.Object({
        name: t.String(),
        transcript: t.String(),
        geolocation: t.String(),
        user_id: t.Number(),
      }),
    }
  )

  // PATCH /recordings/:id - Update a recording
  .patch(
    '/:id',
    async ({ params, body }) => {
      const recording = await recordingsController.update(params.id, body as any);

      if (!recording) {
        throw new Error('Recording not found');
      }

      return recording;
    },
    {
      body: t.Partial(
        t.Object({
          name: t.String(),
          transcript: t.String(),
          geolocation: t.String(),
          user_id: t.Number(),
        })
      ),
    }
  )

  // DELETE /recordings/:id - Soft delete a recording
  .delete('/:id', async ({ params }) => {
    const recording = await recordingsController.delete(params.id);

    if (!recording) {
      throw new Error('Recording not found');
    }

    return { message: 'Recording deleted successfully', recording };
  });

export default recordingsRoutes;
