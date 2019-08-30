async function handler(client, packet) {
  const { ObjectId } = this.mongo

  const now = new Date()
  const value = packet.body.readUInt32BE(0)

  client.log.trace(`Light: ${value}lx`)

  await Promise.all([
    this.db.devices.updateOne(
      { _id: new ObjectId(client.deviceId) },
      {
        $set: {
          heartbeat: now,
          'readings.light': value
        }
      }
    ),
    this.db.readings.insertOne({
      userId: client.userId,
      deviceId: client.deviceId,
      type: 'LIGHT',
      value: value,
      _created: now
    })
  ])
}

export default {
  authenticated: true,
  version: 1,
  command: 0x74,
  length: 4,
  handler
}
