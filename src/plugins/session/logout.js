async function handler(request, reply) {
  const { ObjectId } = this.mongo
  const { userId, userToken } = request

  await this.db.users.updateOne(
    { _id: new ObjectId(userId) },
    {
      $pull: {
        sessions: userToken
      }
    }
  )

  if (process.env.COOKIE_NAME) {
    reply.clearCookie(process.env.COOKIE_NAME)
  }

  reply.status(204).send()
}

export default {
  method: 'POST',
  url: '/api/logout',
  handler,
  config: {
    authenticated: true
  }
}
