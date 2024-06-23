#include "DHTesp.h"
#include <WiFi.h>
#include <HTTPClient.h>


const char* host = "https://httpie.io/app"; // Измените на адрес вашего сервера Django
const int port = 8000;

const int DHT_PIN = 0;
DHTesp dhtSensor;

void setup() {
  dhtSensor.setup(DHT_PIN, DHTesp::DHT22);
  Serial.begin(115200);
  Serial.print("Connecting to WiFi");
  WiFi.begin("Wokwi-GUEST", ""); // Подключение к виртуальной точке доступа Wokwi-GUEST без пароля
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }
  Serial.println("WiFi Connected!");
}
void loop() {
  delay(2000); // Ждем нового считывания с датчика (DHT22 имеет частоту семплирования ~0.5 Гц)

  TempAndHumidity data = dhtSensor.getTempAndHumidity();

  // Создание HTTP-клиента
  HTTPClient httpClient;

  // Формирование URL для отправки данных на сервер Django
  String url = String(host) + "/handle_sensor_data";
  url.concat("?temperature=");
  url.concat(String(data.temperature, 2));
  url.concat("&humidity=");
  url.concat(String(data.humidity, 1));

  Serial.println("POST request:");
  Serial.println("URL: " + url);
  Serial.println("Body: " + String(data.temperature, 2) + "°C, " + String(data.humidity, 1) + "%");

  // Отправка HTTP-запроса POST на сервер Django
  httpClient.begin(url);
  int httpResponseCode = httpClient.POST("");


  // Обработка ответа от сервера Django
  if (httpResponseCode > 0) {
    Serial.printf("HTTP Response code: %d\n", httpResponseCode);
    String response = httpClient.getString();
    Serial.println(response);
  } else {
    Serial.printf("Error occurred while sending HTTP request: %s\n", httpClient.errorToString(httpResponseCode).c_str());
  }

  // Завершение HTTP-соединения
  httpClient.end();

  // Задержка перед следующим считыванием
  delay(5000);
}
