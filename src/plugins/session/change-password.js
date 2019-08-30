import { BadRequestError } from '../../libs/errors'

async function handler(request, reply) {
  const { ObjectId } = this.mongo
  const { userId } = request
  const { oldPassword, newPassword } = request.body

  const user = await this.db.users.findOne({ _id: new ObjectId(userId) })

  const valid = await this.session.comparePassword(oldPassword, user.password)
  if (!valid) {
    throw new BadRequestError('Incorrect password')
  }

  await this.db.users.updateOne(
    { _id: user._id },
    {
      $set: {
        password: await this.session.hashPassword(newPassword)
      }
    }
  )

  reply.status(204).send()
}

export default {
  method: 'POST',
  url: '/api/change-password',
  handler,
  config: {
    authenticated: true
  },
  schema: {
    description: "Change current user's password",
    tags: ['auth'],
    body: {
      type: 'object',
      properties: {
        oldPassword: {
          type: 'string',
          description: 'Current user password'
        },
        newPassword: {
          type: 'string',
          minLength: 8,
          description: 'New password'
        }
      },
      required: ['oldPassword', 'newPassword']
    }
  }
}
