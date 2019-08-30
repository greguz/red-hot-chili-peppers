export default {
  type: 'object',
  properties: {
    _id: {
      type: 'string'
    },
    mac: {
      type: 'string'
    },
    name: {
      type: 'string'
    },
    heartbeat: {
      type: 'string'
    },
    readings: {
      type: 'object',
      properties: {
        battery: {
          type: 'number' // %
        },
        light: {
          type: 'number' // lx
        },
        airHumidity: {
          type: 'number' // %
        },
        airTemperature: {
          type: 'number' // °C
        },
        soilMoisture: {
          type: 'number' // %
        },
        soilTemperature: {
          type: 'number' // °C
        }
      }
    }
  }
}
