import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function statutoryApiPlugin(): Plugin {
  return {
    name: 'statutory-ladder-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/cases')) {
          const url = new URL(req.url, 'http://localhost');
          const pathname = url.pathname;

          // POST /api/cases/:id/wallet-change
          const walletChangeMatch = pathname.match(/^\/api\/cases\/([^/]+)\/wallet-change$/);
          if (walletChangeMatch && req.method === 'POST') {
            const caseId = decodeURIComponent(walletChangeMatch[1]);
            let bodyStr = '';
            req.on('data', (chunk) => {
              bodyStr += chunk;
            });
            req.on('end', async () => {
              try {
                const body = JSON.parse(bodyStr || '{}');
                const { newWalletAddress, oldWalletAddress } = body;
                const ladderService = await import('./ladder.service.js');
                const result = await ladderService.onWalletChange(oldWalletAddress, newWalletAddress, caseId);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify(result));
              } catch (err: any) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }

          // GET /api/cases/:id
          const getCaseMatch = pathname.match(/^\/api\/cases\/([^/]+)$/);
          if (getCaseMatch && req.method === 'GET') {
            const caseId = decodeURIComponent(getCaseMatch[1]);
            try {
              const ladderService = await import('./ladder.service.js');
              const status = ladderService.getCaseStatus(caseId);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = status ? 200 : 404;
              res.end(JSON.stringify(status || { error: 'Case not found' }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
            return;
          }
        }

        // 3. BACKEND PROXY: /api/trace with Bottleneck & NodeCache
        if (req.url && req.url.startsWith('/api/trace')) {
          const url = new URL(req.url, 'http://localhost');
          const wallet = url.searchParams.get('wallet') || url.searchParams.get('address');
          const maxHops = parseInt(url.searchParams.get('maxHops') || '5', 10);

          if (!wallet) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'wallet query parameter is required' }));
            return;
          }

          try {
            const { bfsTrace } = await import('./blockchain.service.js');
            const result = await bfsTrace(wallet, { maxHops });
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            if (err.message && err.message.toLowerCase().includes('rate')) {
              res.statusCode = 429;
              res.end(
                JSON.stringify({
                  error: 'Rate exceeded.',
                  message: 'API Limit Reached - Showing cached trail. Retrying in 5s...',
                  retryAfter: 5,
                })
              );
            } else {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          }
          return;
        }

        // 4. GET /api/ncrp/similar
        if (req.url && req.url.startsWith('/api/ncrp/similar')) {
          const url = new URL(req.url, 'http://localhost');
          const wallet = url.searchParams.get('wallet') || url.searchParams.get('address') || '';
          const amountParam = url.searchParams.get('amount') ? parseFloat(url.searchParams.get('amount')!) : undefined;

          try {
            const { getSimilarNcrpCases } = await import('./src/data/ncrpDatabase.ts');
            const cases = getSimilarNcrpCases(wallet, amountParam);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                wallet,
                total: cases.length,
                similarCount: cases.length,
                cases,
              })
            );
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), statutoryApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
