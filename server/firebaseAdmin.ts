function loadAppletConfig(): FirebaseAppletConfig {
  const candidates = [
    path.resolve(__dirname, '../firebase-applet-config.json'),
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, 'utf-8');
      const config = JSON.parse(raw) as FirebaseAppletConfig;

      return {
        projectId:
          process.env.FIREBASE_PROJECT_ID ||
          process.env.VITE_FIREBASE_PROJECT_ID ||
          config.projectId ||
          'teacherenglish-62830',

        firestoreDatabaseId:
          process.env.FIREBASE_FIRESTORE_DATABASE_ID ||
          process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
          config.firestoreDatabaseId,
      };
    }
  }

  return {
    projectId:
      process.env.FIREBASE_PROJECT_ID ||
      process.env.VITE_FIREBASE_PROJECT_ID ||
      'teacherenglish-62830',

    firestoreDatabaseId:
      process.env.FIREBASE_FIRESTORE_DATABASE_ID ||
      process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
      undefined,
  };
}
