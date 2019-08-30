// ##########################################################################
// Includes
// ##########################################################################

// Core libs
#include <ESP8266WiFi.h>

// WiFi magic - https://github.com/tzapu/WiFiManager
#include <DNSServer.h>            // Local DNS Server used for redirecting all requests to the configuration portal
#include <ESP8266WebServer.h>     // Local WebServer used to serve the configuration portal
#include <WiFiManager.h>

// Analog to digital converter - https://github.com/adafruit/Adafruit_ADS1X15
#include <Wire.h>
#include <Adafruit_ADS1015.h>

// WebSocket - https://github.com/Links2004/arduinoWebSockets
#include <WebSocketsClient.h>

// Non volatile memory - https://arduino-esp8266.readthedocs.io/en/latest/libraries.html
#include <EEPROM.h>

// ##########################################################################
// Definitions (no RAM is used)
// ##########################################################################

// Used EEPROM memory size (bytes)
#define EEPROM_SIZE 32

// Socket server config
#define SRV_HOST "renovo"
#define SRV_PORT 8008
#define SRV_URL "/device"
#define SRV_RECONNECTION 5000 // ms

// AP config
#define AP_NAME "Red Hot Chili Peppers"

// Deep sleep mode duration
#define SLEEP_TIME 30e6 // uS

// ADS1115 config
// - 0x48 (1001000) ADR -> GND
// - 0x49 (1001001) ADR -> VDD
// - 0x4A (1001010) ADR -> SDA
// - 0x4B (1001011) ADR -> SCL
#define ADS_ADDR 0x48
#define ADS_MOISTURE_PIN 0

// ##########################################################################
// Globals (in RAM)
// ##########################################################################

// Socket client instance
WebSocketsClient socket;

// Random 2 bytes (used for authentication)
byte greetCode[2] = { random(0, 255), random(0, 255) };

// Server confirmation (reset at start)
boolean authenticated = false;

// Analog to Digital converter
Adafruit_ADS1115 ads(ADS_ADDR);

// ##########################################################################
// Functions
// ##########################################################################

/**
 * Update auth status (RAM)
 */
void authenticate() {
  Serial.println("Authenticated");
  authenticated = true;
}

/**
 * Read token from flash memory into RAM
 */
void readTokenFromEEPROM(byte * token) {
  for (int i = 0; i < 32; i++) {
    token[i] = EEPROM.read(i);
  }
}

/**
 * Called every time on socket first connection (make auth call)
 */
void handleConnection() {
  Serial.println("Connected");

  int i;

  byte mac[6];
  WiFi.macAddress(mac);

  byte token[32];
  readTokenFromEEPROM(token);

  byte command = 0xa0;
  uint8_t bodyLength = 40; // 6 (mac) + 2 (greetCode) + 32 (token)

  byte payload[45] = { 0x5a, 0xa5, 0x01, command, bodyLength };

  // Write MAC address (6 bytes)
  for (i = 0; i < 6; i++) {
    payload[i + 5] = mac[i];
  }

  // Write greetCode (2 bytes)
  payload[11] = greetCode[0];
  payload[12] = greetCode[1];

  // Write token (32 bytes)
  for (i = 0; i < 32; i++) {
    payload[i + 13] = token[i];
  }

  socket.sendBIN(payload, bodyLength + 5);
}

/**
 * Called every time on socket disconnection (reset auth status)
 */
void handleDisconnection() {
  Serial.println("Disconnected");
  authenticated = false;
}

/**
 * Handle bind command (first authentication)
 */
void saveToken(uint8_t * payload, size_t length) {
  Serial.println("Binding");
  if (length == 45) {
    if (payload[11] == greetCode[0] && payload[12] == greetCode[1]) {
      for (int i = 0; i < 32; i++) {
        EEPROM.write(i, payload[i + 13]);
      }
      EEPROM.commit();

      authenticate();
    }
  }
}

/**
 * Command handler
 */
void handleCommand(uint8_t * payload, size_t length) {
  byte command = payload[3];

  switch (command) {
    case 0xaa:
      saveToken(payload, length);
      break;

    case 0xa1:
      authenticate();
      break;
  }
}

/**
 * Main socket event handler
 */
void handleSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      handleConnection();
      break;

    case WStype_DISCONNECTED:
      handleDisconnection();
      break;

    case WStype_BIN:
      // TODO: handle possible errors (malformed packets)
      handleCommand(payload, length);
      break;
  }
}

/**
 *
 */
uint8_t readBattery() {
  return 66;
}

/**
 *
 */
uint32_t readLight() {
  return 22135;
}

/**
 *
 */
uint8_t readAirHumidity() {
  return 50;
}

/**
 *
 */
int8_t readAirTemperature() {
  return 26;
}

/**
 *
 */
uint8_t readSoilMoisture() {
  uint16_t val = ads.readADC_SingleEnded(ADS_MOISTURE_PIN);

  Serial.println(val);

  uint16_t min = 6520; // TODO: read from flash
  uint16_t max = 13600; // TODO: read from flash
  if (val < min) {
    // calibrationNeeded();
    val = min;
  } else if (val > max) {
    // calibrationNeeded();
    val = max;
  }

  double a = val - min;
  double b = max - min;
  return abs(((a / b) * 100) - 100);
}

/**
 *
 */
void writeSoilMoisture() {
  uint8_t vSoilMoisture = readSoilMoisture();
  byte payload[6] = { 0x5a, 0xa5, 0x01, 0x75, 1, vSoilMoisture };
  socket.sendBIN(payload, 6);
}

/**
 *
 */
int8_t readSoilTemperature() {
  return 18;
}

/**
 * Device routine
 */
void routine() {
  // uint8_t vBattery = readBattery();
  // uint32_t vLight = readLight();
  // uint8_t vAirHumidity = readAirHumidity();
  // int8_t vAirTemperature = readAirTemperature();
  // uint8_t vSoilMoisture = readSoilMoisture();
  // int8_t vSoilTemperature = readSoilTemperature();

  // byte payload[14] = { 0x5a, 0xa5, 0x01, 0x70, 9 };
  // payload[5] = vBattery;
  // payload[6] = vLight >> 24; // BE
  // payload[7] = vLight >> 16;
  // payload[8] = vLight >> 8;
  // payload[9] = vLight >> 0;
  // payload[10] = vAirHumidity;
  // payload[11] = vAirTemperature;
  // payload[12] = vSoilMoisture;
  // payload[13] = vSoilTemperature;

  // socket.sendBIN(payload, 14);

  // TODO: other sensors
  writeSoilMoisture();

  Serial.println("Good night");
  ESP.deepSleep(SLEEP_TIME);
}

// ##########################################################################
// Setup
// ##########################################################################

void setup() {
  Serial.begin(57600);
  Serial.setDebugOutput(true);

  // Begin I2C communication (alias for Wire.begin)
  Wire.begin();

  // Read authentication token
  EEPROM.begin(EEPROM_SIZE);

  // Use WiFiManager to retrieve a valid AP connection
  WiFiManager wifiManager;
  wifiManager.autoConnect(AP_NAME);

  // Init socket connection
  socket.begin(SRV_HOST, SRV_PORT, SRV_URL);

  // Handle socket events
  socket.onEvent(handleSocketEvent);

  // Setup reconnection interval time (ms)
  socket.setReconnectInterval(SRV_RECONNECTION);
}

// ##########################################################################
// Loop
// ##########################################################################

void loop() {
  socket.loop();
  if (authenticated) {
    routine();
  }
}

