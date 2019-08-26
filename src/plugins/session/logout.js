async function handler(request, reply) {
  const { ObjectId } = this.mongo
  const { userId, authenticationToken } = request

  await this.db.users.updateOne(
    { _id: new ObjectId(userId) },
    {
      $pull: {
        sessions: authenticationToken
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
