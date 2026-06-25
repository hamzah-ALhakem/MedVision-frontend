// src/services/aiService.js

import { AI_API_URL } from '../config/env';

export const predictTumor = async (featuresArray) => {
  try {
    console.log("📤 Sending Data via Proxy...", { features: featuresArray });

    // زيادة مدة الانتظار (Timeout) لأن سيرفر Render بطيء
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // انتظار 60 ثانية

    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ features: featuresArray }),
      signal: controller.signal // ربط التايم أوت
    });

    clearTimeout(timeoutId); // إلغاء المؤقت إذا نجح الطلب

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Server Error:", errorText);
      throw new Error(`خطأ من السيرفر: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ AI Response:", data);

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error("تجاوز السيرفر الوقت المسموح (السيرفر نائم، حاول مرة أخرى الآن)");
    }
    console.error("🚨 Connection Failed:", error);
    throw error;
  }
};