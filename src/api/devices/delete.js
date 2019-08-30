import { AuthorizationLevel } from '../../libs/enums'
import { NotFoundError } from '../../libs/errors'

import deviceSchema from './schema'

async function handler(request, reply) {
  const { ObjectId } = this.mongo

  const { value } = await this.db.devices.findOneAndUpdate(
    {
      _id: new ObjectId(request.params.id),
      userId: request.userId,
      _deleted: {
        $exists: false
      }
    },
    {
      $set: {
        _deleted: new Date()
      },
      $unset: {
        token: ''
      }
    }
  )
  if (!value) {
    throw new NotFoundError('Device not found')
  }

  reply.status(200).send(value)
}

export default {
  method: 'DELETE',
  url: '/:id',
  handler,
  config: {
    authorizationLevel: AuthorizationLevel.USER
  },
  schema: {
    description: 'Delete device',
    tags: ['device'],
    params: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-f0-9]{24}$'
        }
      },
      required: ['id']
    },
    response: {
      200: deviceSchema
    }
  }
}
