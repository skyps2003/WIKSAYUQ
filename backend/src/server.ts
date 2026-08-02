import app from './app';
import { isDatabaseHealthy } from './config/database';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[server]: Server is running at http://0.0.0.0:${PORT}`);
  
  const dbConnected = await isDatabaseHealthy();
  if (dbConnected) {
    console.log(`[database]: Successfully connected to Supabase Postgres!`);
  } else {
    console.log(`[database]: Failed to connect to the database. Check your .env file.`);
  }
});
