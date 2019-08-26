import { AuthorizationLevel } from '../../libs/enums'
import { NotFoundError } from '../../libs/errors'

import deviceSchema from './schema'

async function handler(request, reply) {
  const { ObjectId } = this.mongo
  const device = await this.db.devices.findOne({
    _id: new ObjectId(request.params._id),
    userId: request.userId
  })
  if (!device) {
    throw new NotFoundError('Device not found')
  }
  reply.send(device)
}

export default {
  method: 'GET',
  url: '/:_id',
  handler,
  config: {
    authorizationLevel: AuthorizationLevel.USER
  },
  schema: {
    params: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
          pattern: '^[a-f0-9]{24}$'
        }
      },
      required: ['_id']
    },
    response: {
      200: deviceSchema
    }
  }
}
