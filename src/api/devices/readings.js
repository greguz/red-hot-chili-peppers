import { AuthorizationLevel } from '../../libs/enums'
import { NotFoundError } from '../../libs/errors'

const readingSchema = {
  type: 'object',
  properties: {
    _id: {
      type: 'string'
    },
    type: {
      type: 'string'
    },
    value: {
      type: 'number'
    },
    _created: {
      type: 'string',
      format: 'date-time'
    }
  }
}

function parseSort(value) {
  const fields = value ? value.split(',') : []

  return fields.reduce((acc, field) => {
    let order = 1

    if (/:asc$/.test(field)) {
      field = field.substring(0, field.length - 4)
    } else if (/:desc$/.test(field)) {
      field = field.substring(0, field.length - 5)
      order = -1
    }

    return {
      ...acc,
      [field]: order
    }
  }, {})
}

function parseProjection(value) {
  const fields = value ? value.split(',') : []
  return fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {})
}

async function handler(request, reply) {
  const { ObjectId } = this.mongo

  const device = await this.db.devices.findOne(
    {
      _id: new ObjectId(request.params.id),
      userId: request.userId,
      _deleted: {
        $exists: false
      }
    },
    {
      projection: {
        _id: 1
      }
    }
  )
  if (!device) {
    throw new NotFoundError('Device not found')
  }

  const page = request.query.page || 1
  const size = request.query.size || 50

  const query = {
    $and: [
      {
        userId: request.userId,
        deviceId: device._id.toHexString()
      },
      request.generateMongoQuery()
    ]
  }

  const options = {
    limit: size,
    skip: size * (page - 1),
    projection: parseProjection(request.query.fields),
    sort: parseSort(request.query.sort)
  }

  const [count, items] = await Promise.all([
    this.db.readings.countDocuments(query),
    this.db.readings.find(query, options).toArray()
  ])

  reply.status(200).send({
    page,
    size,
    count,
    items
  })
}

export default {
  method: 'GET',
  url: '/:id/readings',
  handler,
  config: {
    authorizationLevel: AuthorizationLevel.USER
  },
  schema: {
    description: 'Fetch device readings',
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
    querystring: {
      type: 'object',
      properties: {
        page: {
          type: 'integer',
          minimum: 1
        },
        size: {
          type: 'integer',
          minimum: 1,
          maximum: 100
        }
      },
      additionalProperties: true
    },
    response: {
      200: {
        type: 'object',
        properties: {
          page: {
            type: 'integer'
          },
          size: {
            type: 'integer'
          },
          count: {
            type: 'integer'
          },
          items: {
            type: 'array',
            items: readingSchema
          }
        }
      }
    }
  }
}
