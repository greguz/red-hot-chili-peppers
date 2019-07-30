import { ObjectId } from 'mongodb'

import deviceSchema from './schema'

async function handler(request) {
  return this.db.devices.read({
    _id: new ObjectId(request.params._id),
    userId: request.user._id.toHexString()
  })
}

export default {
  method: 'GET',
  url: '/:_id',
  handler,
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
