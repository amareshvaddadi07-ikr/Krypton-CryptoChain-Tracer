import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { onWalletChange, getCaseStatus, handleVaspReply, getAllCases } from './ladder.service.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: POST /api/cases/:id/wallet-change
  app.post('/api/cases/:id/wallet-change', async (req, res) => {
    const { id } = req.params;
    const { newWalletAddress, oldWalletAddress } = req.body;
    try {
      const result = await onWalletChange(oldWalletAddress, newWalletAddress, id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: GET /api/cases/:id
  app.get('/api/cases/:id', (req, res) => {
    const { id } = req.params;
    const caseData = getCaseStatus(id);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(caseData);
  });

  // API Route: POST /api/cases/:id/reply
  app.post('/api/cases/:id/reply', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await handleVaspReply(id, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: GET /api/cases
  app.get('/api/cases', (req, res) => {
    res.json(getAllCases());
  });

  // 3. BACKEND PROXY: Rate-limited blockchain BFS trace with Bottleneck & NodeCache
  app.get('/api/trace', async (req, res) => {
    const wallet = (req.query.wallet as string) || (req.query.address as string);
    const maxHops = req.query.maxHops ? parseInt(req.query.maxHops as string, 10) : 5;
    if (!wallet) {
      return res.status(400).json({ error: 'wallet query parameter is required' });
    }

    try {
      const { bfsTrace } = await import('./blockchain.service.js');
      const result = await bfsTrace(wallet, { maxHops });
      res.json(result);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('rate')) {
        return res.status(429).json({
          error: 'Rate exceeded.',
          message: 'API Limit Reached - Showing cached trail. Retrying in 5s...',
          retryAfter: 5,
        });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // 4. API Route: GET /api/ncrp/similar
  app.get('/api/ncrp/similar', async (req, res) => {
    const wallet = (req.query.wallet as string) || (req.query.address as string) || '';
    const amountParam = req.query.amount ? parseFloat(req.query.amount as string) : undefined;
    try {
      const { getSimilarNcrpCases } = await import('./src/data/ncrpDatabase.js');
      const cases = getSimilarNcrpCases(wallet, amountParam);
      res.json({
        wallet,
        total: cases.length,
        similarCount: cases.length,
        cases,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Statutory Auto-Escalation Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
