/**
 * ============================================================
 *  FingerPressBot 手指按压机器人固件 v1.0
 * ============================================================
 *  硬件：ESP32 DevKitC V4 (WROOM-32E) + MG90S 舵机
 *  功能：
 *    1. Blynk IoT 手机 APP 远程控制（扫码配网，改 WiFi 不用重烧固件）
 *    2. "按压一次"：舵机从待机角转到按压角，保持后回位
 *    3. 按压行程可调：Blynk 滑杆 V1（按压角度，角度差 x 摇臂半径 = 行程）
 *    4. 按压保持时间可调：Blynk 滑杆 V2（默认 400ms，勿超过 2s）
 *    5. 状态/计数回传：V3 状态文本、V4 按压次数（NVS 存储，断电不丢失）
 *    6. 按压间隔锁 3 秒，防止误触/连点损坏按键
 *    7. 本地 Web 状态页兜底（同一 WiFi 下手机浏览器访问设备 IP）
 *    8. 上电自动按压模式（Blynk 开关 V5，默认关闭；
 *       供米家智能插座联动使用：米家自动化断电-通电即触发一次按压）
 *
 *  接线：
 *    舵机红线  -> ESP32 5V (VIN) 引脚
 *    舵机棕线  -> ESP32 GND 引脚
 *    舵机橙线  -> ESP32 GPIO13（PWM 信号）
 *    供电：5V/2A 充电头经 USB 口供电（舵机峰值电流约 1A）
 *
 *  首次使用步骤（详见 docs/03-Blynk配置指南.md）：
 *    1. Arduino IDE 安装：ESP32 支持包、Blynk 库、ESP32Servo 库
 *    2. 在 blynk.cloud 网页创建 Template，将模板 ID 填入下方
 *    3. 编译烧录后，手机 Blynk APP 添加设备 -> 扫码配网 -> 自动上线
 * ============================================================
 */

// ============================================================
// 配置区：唯一需要你修改的地方（二选一，默认 Edgent 扫码配网）
// ============================================================

// 模式选择：
//   true  = Edgent 扫码配网（推荐）：首次上电设备进入配网模式，
//           用手机 Blynk APP 扫码并输入 WiFi 密码，之后改 WiFi
//           不用重新烧录固件。
//   false = 传统模式：把 WiFi 账号密码和 AuthToken 写死在代码里，
//           需要重新编译烧录才能改 WiFi。
#define USE_EDGENT_MODE true

// 在 blynk.cloud 创建 Template 后获得（形如 "TMPL3xxxxxxxxxx"）
#define BLYNK_TEMPLATE_ID "TMPL000000000000"
#define BLYNK_DEVICE_NAME "FingerPressBot"
#define BLYNK_TEMPLATE_NAME "FingerPressBot"
#define BLYNK_PRINT Serial    // Blynk 日志输出到串口

#if USE_EDGENT_MODE
  #include <BlynkEdgent.h>
#else
  #include <WiFi.h>
  #include <WiFiClient.h>
  #include <BlynkSimpleEsp32.h>
  char auth[] = "你的AuthToken";   // Blynk APP 中设备页查看
  char ssid[] = "你的WiFi名称";    // 仅支持 2.4G
  char pass[] = "你的WiFi密码";
#endif

// ============================================================
// 依赖库（Arduino 库管理器搜索安装）
//   1. Blynk      by Volodymyr Shymanskyy（新版 Blynk IoT，非 Legacy）
//   2. ESP32Servo by Kevin Harrington（ESP32 专用舵机库）
//   3. WebServer / Preferences：ESP32 支持包自带，无需额外安装
// ============================================================

#include <ESP32Servo.h>
#include <WebServer.h>
#include <Preferences.h>

// ============================================================
// 引脚与参数定义
// ============================================================

#define SERVO_PIN       13        // 舵机信号线（避开下载/启动引脚）
#define SERVO_MIN_PULSE 500       // 舵机最小脉宽 us（500 = 0 度）
#define SERVO_MAX_PULSE 2400      // 舵机最大脉宽 us（2400 = 180 度）

// 默认参数（Blynk 滑杆可随时调整，调整后自动存入 NVS 掉电保存）
#define DEFAULT_IDLE_ANGLE   10   // 待机角度（度），摇臂抬起
#define DEFAULT_PRESS_ANGLE  35   // 按压角度（度），行程 = (press-idle) x 摇臂半径
#define DEFAULT_HOLD_MS      400  // 按住保持时间（毫秒），勿调大（长按4秒会强关电脑）
#define PRESS_LOCK_MS        3000 // 按压间隔锁（毫秒），防止连点误触
#define MIN_PRESS_ANGLE      15   // 按压角最小限制（防止力度过大）
#define MAX_PRESS_ANGLE      90   // 按压角最大限制（防止损坏按键）
#define MIN_HOLD_MS          100  // 保持时间下限
#define MAX_HOLD_MS          2000 // 保持时间上限

// ============================================================
// 全局变量
// ============================================================

Servo      servo;                // 舵机对象
WebServer  server(80);           // 本地 Web 状态页（兜底通道）
Preferences prefs;               // NVS 存储（断电不丢失）

int    idleAngle   = DEFAULT_IDLE_ANGLE;   // 待机角
int    pressAngle  = DEFAULT_PRESS_ANGLE;  // 按压角
int    holdMs      = DEFAULT_HOLD_MS;      // 保持时间
uint32_t pressCount = 0;                   // 按压总次数
bool   powerPress  = false;                // 上电自动按压开关（米家联动用）
bool   powerPressFired = false;            // 本次上电是否已执行过自动按压

bool   busy        = false;       // 正在执行按压动作
bool   holding     = false;       // 当前处于"按住"阶段
uint32_t phaseEndTime = 0;        // 当前阶段结束时间戳
uint32_t lastPressTime = 0;       // 上次按压完成时间戳（间隔锁用）

// ============================================================
// 工具函数
// ============================================================

// 更新 Blynk 状态文本（V3）
void updateStateText(const char* text) {
  Blynk.virtualWrite(V3, text);
}

// 更新按压计数到 Blynk（V4）并存入 NVS
void updatePressCount() {
  Blynk.virtualWrite(V4, pressCount);
  prefs.putUInt("count", pressCount);
}

// 限幅函数
int clampVal(int v, int lo, int hi) { return (v < lo) ? lo : ((v > hi) ? hi : v); }

// ============================================================
// 按压动作
// ============================================================

// 执行一次按压：待机角 -> 按压角 -> 保持 -> 回位
void doPress() {
  // 间隔锁：距离上次按压结束不足 3 秒，拒绝执行
  if (millis() - lastPressTime < PRESS_LOCK_MS) {
    updateStateText("间隔锁中");
    return;
  }
  if (busy) {
    updateStateText("正在按压中");
    return;
  }

  busy      = true;
  holding   = true;
  phaseEndTime = millis() + holdMs;

  servo.write(pressAngle);        // 转到位：按下
  updateStateText("按压中");
}

// 在 loop 中驱动按压状态机
void runPressStateMachine() {
  if (!busy) return;

  uint32_t now = millis();

  if (holding && now >= phaseEndTime) {
    // 保持时间到，抬起回位
    holding = false;
    phaseEndTime = now + 500;     // 给回位留 500ms
    servo.write(idleAngle);
    updateStateText("回位中");
  } else if (!holding && now >= phaseEndTime) {
    // 回位完成，动作结束
    busy = false;
    pressCount++;
    updatePressCount();
    lastPressTime = now;
    updateStateText("就绪");
  }
}

// 上电自动按压（米家智能插座联动用）
void runPowerOnPress() {
  // 开关开启，且本次上电还没压过，且系统已就绪 3 秒
  if (powerPress && !powerPressFired && millis() > 3000) {
    powerPressFired = true;
    Serial.println("[powerPress] auto press on boot");
    doPress();
  }
}

// ============================================================
// Blynk 虚拟引脚回调（与 APP 面板组件一一对应）
// ============================================================

// V0：按压按钮（APP 中设置为"瞬时触发"模式，按下=1）
BLYNK_WRITE(V0) {
  if (param.asInt() == 1) {
    doPress();
  }
}

// V1：按压角度滑杆（行程调节，单位：度）
BLYNK_WRITE(V1) {
  pressAngle = clampVal(param.asInt(), MIN_PRESS_ANGLE, MAX_PRESS_ANGLE);
  prefs.putInt("pressAng", pressAngle);
  Serial.printf("[config] pressAngle = %d\n", pressAngle);
}

// V2：保持时间滑杆（单位：毫秒）
BLYNK_WRITE(V2) {
  holdMs = clampVal(param.asInt(), MIN_HOLD_MS, MAX_HOLD_MS);
  prefs.putUInt("holdMs", holdMs);
  Serial.printf("[config] holdMs = %d\n", holdMs);
}

// V5：上电自动按压开关（米家智能插座联动用）
BLYNK_WRITE(V5) {
  powerPress = (param.asInt() == 1);
  powerPressFired = false;       // 重置，便于测试
  prefs.putBool("pwPress", powerPress);
  Serial.printf("[config] powerPress = %d\n", powerPress);
}

// 设备上线/重连云后，把当前参数同步到 APP 面板
BLYNK_CONNECTED() {
  Blynk.virtualWrite(V1, pressAngle);
  Blynk.virtualWrite(V2, holdMs);
  Blynk.virtualWrite(V5, powerPress ? 1 : 0);
  Blynk.virtualWrite(V4, pressCount);
  updateStateText(busy ? "按压中" : "就绪");
}

// ============================================================
// 本地 Web 状态页（兜底通道：Blynk 连不上时，同一 WiFi 下
// 手机浏览器访问 http://设备IP 仍可触发按压）
// ============================================================

const char WEB_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FingerPressBot 按压机器人</title>
<style>
  body { font-family: system-ui, sans-serif; background:#0f172a; color:#e2e8f0;
         display:flex; flex-direction:column; align-items:center; padding:40px 16px; }
  .card { background:#1e293b; border-radius:16px; padding:32px; width:100%; max-width:360px;
          text-align:center; box-shadow:0 8px 30px rgba(0,0,0,.4); }
  h1 { font-size:20px; margin:0 0 8px; }
  .status { color:#94a3b8; font-size:14px; margin-bottom:24px; }
  .btn { background:#22c55e; color:#fff; border:none; border-radius:50%;
         width:180px; height:180px; font-size:28px; font-weight:bold; cursor:pointer;
         box-shadow:0 6px 20px rgba(34,197,94,.4); transition:transform .1s; }
  .btn:active { transform:scale(.94); }
  .btn:disabled { background:#475569; box-shadow:none; cursor:not-allowed; }
  .info { margin-top:24px; font-size:14px; color:#cbd5e1; text-align:left; line-height:1.8; }
  .info b { color:#fbbf24; }
</style>
</head>
<body>
<div class="card">
  <h1>FingerPressBot</h1>
  <div class="status" id="status">加载中...</div>
  <button class="btn" id="btn" onclick="pressOnce()">按压</button>
  <div class="info" id="info">--</div>
</div>
<script>
function refresh() {
  fetch('/api/status').then(r => r.json()).then(d => {
    document.getElementById('status').textContent = d.state;
    document.getElementById('info').innerHTML =
      '按压次数：<b>' + d.count + '</b><br>' +
      '按压角度：<b>' + d.angle + '°</b>（行程 ' + d.travel + 'mm）<br>' +
      '保持时间：<b>' + d.hold + 'ms</b><br>' +
      '上电自动按压：<b>' + (d.powerPress ? '开' : '关') + '</b>';
    document.getElementById('btn').disabled = d.busy;
  });
}
function pressOnce() {
  fetch('/api/press', {method:'POST'}).then(r => r.json()).then(d => {
    document.getElementById('status').textContent = d.state;
    setTimeout(refresh, 1200);
  });
}
refresh();
setInterval(refresh, 3000);
</script>
</body>
</html>
)rawliteral";

void handleRoot() {
  server.send(200, "text/html; charset=utf-8", WEB_HTML);
}

void handleStatus() {
  // 行程估算：角度差(rad) x 摇臂半径 12mm
  float travel = (pressAngle - idleAngle) * PI / 180.0f * 12.0f;
  String json = String("{\"state\":\"") + (busy ? "按压中" : "就绪") +
                "\",\"count\":" + pressCount +
                ",\"angle\":" + pressAngle +
                ",\"travel\":" + String(travel, 1) +
                ",\"hold\":" + holdMs +
                ",\"busy\":" + (busy ? "true" : "false") +
                ",\"powerPress\":" + (powerPress ? "true" : "false") + "}";
  server.send(200, "application/json", json);
}

void handlePress() {
  doPress();
  server.send(200, "application/json", String("{\"state\":\"") + (busy ? "按压中" : "就绪") + "\"}");
}

// ============================================================
// 主程序
// ============================================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== FingerPressBot boot ===");

  // 1. 读取 NVS 保存的参数（带回限幅，防止异常值）
  prefs.begin("fpb", false);
  pressCount  = prefs.getUInt("count", 0);
  pressAngle  = clampVal(prefs.getInt("pressAng", DEFAULT_PRESS_ANGLE),
                         MIN_PRESS_ANGLE, MAX_PRESS_ANGLE);
  holdMs      = clampVal((int)prefs.getUInt("holdMs", DEFAULT_HOLD_MS),
                         MIN_HOLD_MS, MAX_HOLD_MS);
  powerPress  = prefs.getBool("pwPress", false);

  // 2. 舵机初始化（上电先回到待机角）
  servo.attach(SERVO_PIN, SERVO_MIN_PULSE, SERVO_MAX_PULSE);
  servo.write(idleAngle);

  // 3. 本地 Web 兜底页路由
  server.on("/", handleRoot);
  server.on("/api/status", handleStatus);
  server.on("/api/press", HTTP_POST, handlePress);
  server.begin();

  // 4. 连接 Blynk（Edgent 模式：首次上电进入配网状态，
  //    用手机 Blynk APP 扫码配网；配网后每次开机自动连接）
#if USE_EDGENT_MODE
  Blynk.edgent();
#else
  Blynk.config(auth);
  Blynk.connect();
#endif

  Serial.print("[wifi] local IP: ");
  Serial.println(WiFi.localIP());
  Serial.println("[web]  http://" + WiFi.localIP().toString() + "  (兜底控制页)");
  Serial.printf("[cfg] pressAngle=%d holdMs=%d count=%u powerPress=%d\n",
                pressAngle, holdMs, pressCount, powerPress);
}

void loop() {
  Blynk.run();                 // Blynk 消息处理（含自动重连）
  server.handleClient();       // Web 兜底页处理
  runPressStateMachine();      // 按压动作状态机
  runPowerOnPress();           // 上电自动按压（米家联动）
}
