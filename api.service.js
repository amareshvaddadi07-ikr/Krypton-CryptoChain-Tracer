import blockchainService from './blockchain.service.js';

export const {
  limiter,
  cache,
  getNextKey,
  fetchWithRateLimit,
  bfsTrace,
} = blockchainService;

export default blockchainService;
