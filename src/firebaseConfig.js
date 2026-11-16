// Firebase web configuration. These values only identify the project and are safe to publish;
// access is controlled by database.rules.json. Set to null to save on this device only.
// Film Wheel shares the owner's existing "Motobays" Firebase project (their account had no room for another),
// but uses its own hosting site and the Realtime Database, which Motobays does not use.
export const firebaseConfig = {
  apiKey: "AIzaSyDbGCwmGVp-nJNPB1m7kb-d140cxDCIFaY",
  appId: "1:742343123548:web:a7148d5c79841251c3fc99",
  projectId: "motobays-3405f",
  databaseURL: "https://motobays-3405f-default-rtdb.europe-west1.firebasedatabase.app",
};
