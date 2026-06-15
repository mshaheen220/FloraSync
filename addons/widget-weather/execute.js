import WeatherWidget from './WeatherWidget.tsx';

// The main application will dynamically import this file and look for this export.
// The key 'dashboard' matches the entryPoint in manifest.json.
export const components = {
  dashboard: WeatherWidget,
};

// This hook is invoked by the backend when the frontend calls POST /api/addons/execute
export const execute = async (db, gardenId, actionId, contextData, user) => {
  // Dynamically import web-push to avoid breaking the frontend Vite build
  const pushLib = 'web-push';
  const webpush = (await import(/* @vite-ignore */ pushLib)).default;

  // Note: For a robust system, these VAPID keys should be generated during 
  // an 'installScript' phase and saved to the SQLite database.
  const VAPID_KEYS = {
    publicKey: process.env.VAPID_PUBLIC_KEY || 'YOUR_GENERATED_VAPID_PUBLIC_KEY',
    privateKey: process.env.VAPID_PRIVATE_KEY || 'YOUR_GENERATED_VAPID_PRIVATE_KEY'
  };

  webpush.setVapidDetails(
    'mailto:admin@florasync.local',
    VAPID_KEYS.publicKey,
    VAPID_KEYS.privateKey
  );

  if (actionId === 'get-vapid-key') {
    return { success: true, publicKey: VAPID_KEYS.publicKey };
  }

  if (actionId === 'save-subscription') {
    const { subscription } = contextData;
    if (!subscription) {
      return { success: false, error: 'No subscription object provided.' };
    }

    // In a real implementation, you would persist this to the database.
    // This allows a background job (e.g., cron) to send notifications later.
    // Example using SQLite's json_set function:
    try {
      // await db.run(
      //   'UPDATE users SET addon_settings = json_set(addon_settings, "$.weather_push_subscription", ?) WHERE id = ?',
      //   [JSON.stringify(subscription), user.id]
      // );
      console.log(`Received push subscription for user ${user.id}:`, subscription.endpoint);
      return { success: true, message: 'Subscription received by backend.' };
    } catch (dbError) {
      console.error('Failed to save push subscription to DB:', dbError);
      return { success: false, error: 'Database error while saving subscription.' };
    }
  }
  
  if (actionId === 'trigger-weather-check') {
    await checkWeatherAndNotify(db, contextData.settings, contextData.subscription, webpush);
    return { success: true };
  }

  return { success: false, error: 'Unknown action' };
};

/**
 * Simulates the garden summary interpretation and triggers a notification if Severity 2 (Critical).
 */
const checkWeatherAndNotify = async (db, settings, subscription, webpush) => {
  if (!settings || !settings.latitude || !settings.longitude) return;
  
  const apiKey = process.env.VITE_TOMORROW_IO_API_KEY;
  if (!apiKey) return;

  try {
    const url = `https://api.tomorrow.io/v4/weather/forecast?location=${settings.latitude},${settings.longitude}&apikey=${apiKey}&units=imperial`;
    const res = await fetch(url);
    const data = await res.json();
    
    const currentVals = data.timelines?.hourly?.[0]?.values || {};
    const windSpeed = currentVals.windSpeed || 0;
    
    const futureCodes = data.timelines?.hourly?.slice(0, 12).map(h => h.values.weatherCode) || [];
    const stormComing = futureCodes.some(c => c === 8000);
    const heavyRainComing = futureCodes.some(c => c === 4201 || c === 6201 || c === 4001 || c === 6001);

    let criticalAlert = null;

    // Interpret critical metrics based on the rules in weather-utils.ts
    if (windSpeed > 15) {
      criticalAlert = 'High winds detected! Secure tall crops and monitor for rapid drying.';
    } else if (stormComing || heavyRainComing) {
      criticalAlert = 'Storms or heavy rain expected soon. Hold off on watering and ensure good drainage.';
    }

    if (criticalAlert && subscription) {
      const payload = JSON.stringify({
        title: 'FloraSync Weather Alert',
        body: criticalAlert,
        url: '/' // Ensure it clicks back to the Dashboard
      });
      await webpush.sendNotification(subscription, payload);
    }
  } catch (error) {
    console.error('Failed to check weather or trigger push notification:', error);
  }
};