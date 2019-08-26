import { BadRequestError } from '../../libs/errors'

async function handler(request, reply) {
  const { username, password } = request.body

  const user = await this.db.users.findOne(
    { username },
    {
      projection: {
        _id: 1,
        password: 1
      }
    }
  )
  if (!user) {
    throw new BadRequestError('Invalid credentials')
  }

  const valid = await this.session.comparePassword(password, user.password)
  if (!valid) {
    throw new BadRequestError('Invalid credentials')
  }

  const token = await this.session.signToken(user._id.toHexString())

  await this.db.users.updateOne(
    { _id: user._id },
    {
      $push: {
        sessions: token
      }
    }
  )

  if (process.env.COOKIE_NAME) {
    reply.setCookie(process.env.COOKIE_NAME, token, {
      httpOnly: true
    })
  }

  reply.send({
    token,
    user: user._id
  })
}

export default {
  method: 'POST',
  url: '/api/login',
  handler,
  schema: {
    body: {
      type: 'object',
      properties: {
        username: {
          type: 'string'
        },
        password: {
          type: 'string'
        }
      },
      required: ['username', 'password']
    },
    response: {
      '2xx': {
        type: 'object',
        properties: {
          token: {
            type: 'string'
          },
          user: {
            type: 'string'
          }
        }
      }
    }
  }
}
