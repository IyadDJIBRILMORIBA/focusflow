import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);
const corsOrigin = process.env.CORS_ORIGIN ?? '*';

app.use(cors({origin: corsOrigin}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({status: 'ok'});
});

app.get('/api/ping', (_req, res) => {
  res.status(200).json({message: 'pong', timestamp: new Date().toISOString()});
});

app.listen(port, '0.0.0.0', () => {
  console.log(`FocusFlow backend listening on http://0.0.0.0:${port}`);
});
