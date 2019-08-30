async function handler(client, packet) {
  const { ObjectId } = this.mongo

  const now = new Date()
  const value = packet.body.readUInt8(0)

  client.log.trace(`Battery: ${value}%`)

  await Promise.all([
    this.db.devices.updateOne(
      { _id: new ObjectId(client.deviceId) },
      {
        $set: {
          heartbeat: now,
          'readings.battery': value
        }
      }
    ),
    this.db.readings.insertOne({
      userId: client.userId,
      deviceId: client.deviceId,
      type: 'BATTERY',
      value: value,
      _created: now
    })
  ])
}

export default {
  authenticated: true,
  version: 1,
  command: 0x73,
  length: 1,
  handler
}
