// routes/404API.js
import express from 'express';
import { authMiddleware } from '../lib/auth.js';              // for dashboard (JWT)
import { apiKeyAuthMiddleware } from '../lib/apiKeyAuth.js';  // for 404 API usage
import ApiKey from '../models/ApiKey.js';
import {
  createApiKeyForUser,
  deactivateAllKeysForUser
} from '../lib/apiKeys.js';

const router = express.Router();

/**
 * 404 Payments / Facilitator config
 * We keep default assets, but your USERS provide payTo, amount, etc.
 */
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_SOLANA = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const FACILITATOR_BASE_URL =
  process.env.FACILITATOR_URL || 'https://facilitator.payai.network';

const SETTLEMENT_RETRY_DELAYS_MS = [1000, 5000];
const RETRYABLE_FACILITATOR_ERRORS = [
  'replacement transaction underpriced',
  'nonce too low',
  'already known'
];

const FACILITATOR_FEE_PAYER_CACHE_TTL_MS = 5 * 60 * 1000;
const facilitatorFeePayerCache = new Map(); // Map<"base"|"solana", { feePayer, expiresAt }>

/** ------------------------------------------------------------------
 *  Helper functions
 * ------------------------------------------------------------------ */

function normalizeResourceUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.host = parsed.host.replace(/^www\./, '');
    return parsed.toString();
  } catch {
    return url;
  }
}

function parsePaymentHeader(paymentHeader) {
  try {
    const json = Buffer.from(paymentHeader, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (err) {
    console.log('[404] Failed to parse payment header:', err);
    return null;
  }
}

function shouldRetrySettlement(status, facilitatorError) {
  if (status >= 500 || status === 429) return true;
  if (!facilitatorError) return false;
  const normalized = facilitatorError.toLowerCase();
  return RETRYABLE_FACILITATOR_ERRORS.some((hint) =>
    normalized.includes(hint)
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isSupportedNetworkGuard(network) {
  return network === 'base' || network === 'solana';
}

async function getFacilitatorFeePayer(network) {
  const cached = facilitatorFeePayerCache.get(network);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.feePayer;
  }

  const response = await fetch(`${FACILITATOR_BASE_URL}/supported`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch facilitator supported networks: ${response.status}`
    );
  }

  const data = await response.json();
  const entry = data.kinds?.find(
    (kind) => kind.network === network && kind.scheme === 'exact'
  );
  const feePayer = entry?.extra?.feePayer;

  if (!feePayer) {
    throw new Error(`Facilitator did not provide feePayer for network ${network}`);
  }

  facilitatorFeePayerCache.set(network, {
    feePayer,
    expiresAt: Date.now() + FACILITATOR_FEE_PAYER_CACHE_TTL_MS
  });

  return feePayer;
}

async function withFacilitatorExtras(requirements) {
  const hydrated = await Promise.all(
    requirements.map(async (requirement) => {
      if (requirement.network !== 'solana') return requirement;

      try {
        const feePayer = await getFacilitatorFeePayer('solana');
        return {
          ...requirement,
          extra: {
            ...requirement.extra,
            feePayer
          }
        };
      } catch (err) {
        console.error('[404] Falling back to default Solana feePayer', err);
        return requirement;
      }
    })
  );

  return hydrated;
}

/**
 * Verify payment with facilitator using merchant-provided requirements
 * requirement: {
 *   scheme?: string;
 *   network: "base" | "solana";
 *   payTo: string;
 *   asset?: string;
 *   maxAmountRequired: string | number;
 *   description?: string;
 *   maxTimeoutSeconds?: number;
 *   mimeType?: string;
 *   extra?: object;
 * }
 */
async function verifyPayment(paymentHeader, resourceUrl, requirement) {
  const resource = normalizeResourceUrl(resourceUrl);

  const paymentProof = parsePaymentHeader(paymentHeader);
  if (!paymentProof) {
    return {
      isValid: false,
      invalidReason: 'Invalid payment header format'
    };
  }

  const paymentNetworkRaw =
    typeof paymentProof.network === 'string'
      ? paymentProof.network.toLowerCase()
      : '';

  if (!isSupportedNetworkGuard(paymentNetworkRaw)) {
    return {
      isValid: false,
      invalidReason: `Unsupported payment network: ${paymentProof.network}`
    };
  }

  // Make sure header network matches merchant's expected network
  if (requirement.network && paymentNetworkRaw !== requirement.network) {
    return {
      isValid: false,
      invalidReason: `Network mismatch: expected ${requirement.network}, got ${paymentNetworkRaw}`
    };
  }

  const network = paymentNetworkRaw;
  const payTo = requirement.payTo;
  const asset =
    requirement.asset || (network === 'solana' ? USDC_SOLANA : USDC_BASE);
  const maxAmountRequired = String(requirement.maxAmountRequired);

  let feePayer = requirement.extra?.feePayer;
  if (!feePayer && network === 'solana') {
    try {
      feePayer = await getFacilitatorFeePayer('solana');
    } catch (err) {
      console.error('[404] Failed to fetch facilitator feePayer during verify', err);
    }
  }

  const description = requirement.description || '';
  const maxTimeoutSeconds = requirement.maxTimeoutSeconds || 300;
  const mimeType = requirement.mimeType || 'application/json';

  const verifyPayload = {
    x402Version: paymentProof.x402Version ?? 1,
    scheme: requirement.scheme || paymentProof.scheme,
    network,
    paymentHeader,
    paymentPayload: paymentProof,
    paymentRequirements: {
      scheme: requirement.scheme || paymentProof.scheme,
      network,
      payTo,
      asset,
      resource,
      maxAmountRequired,
      description,
      maxTimeoutSeconds,
      mimeType,
      extra: {
        ...(requirement.extra || {}),
        ...(feePayer ? { feePayer } : {})
      }
    }
  };

  console.log('[404] Verifying payment with facilitator:', JSON.stringify(verifyPayload).substring(0, 300));

  const verifyResponse = await fetch(`${FACILITATOR_BASE_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(verifyPayload)
  });

  const responseText = await verifyResponse.text();
  if (verifyResponse.ok) {
    const result = JSON.parse(responseText);
    return { ...result, network };
  }

  return {
    isValid: false,
    invalidReason: `Facilitator returned ${verifyResponse.status}: ${responseText}`
  };
}

/**
 * Settle payment with facilitator
 */
async function settlePayment(paymentHeader, resourceUrl, network, requirement) {
  const resource = normalizeResourceUrl(resourceUrl);

  const paymentProof = parsePaymentHeader(paymentHeader);
  if (!paymentProof) {
    return {
      success: false,
      error: 'Invalid payment header format',
      txHash: null,
      networkId: null
    };
  }

  const payTo = requirement.payTo;
  const asset =
    requirement.asset || (network === 'solana' ? USDC_SOLANA : USDC_BASE);
  const maxAmountRequired = String(requirement.maxAmountRequired);

  let feePayer = requirement.extra?.feePayer;
  if (!feePayer && network === 'solana') {
    try {
      feePayer = await getFacilitatorFeePayer('solana');
    } catch (err) {
      console.error('[404] Failed to fetch facilitator feePayer during settle', err);
    }
  }

  const description = requirement.description || '';
  const maxTimeoutSeconds = requirement.maxTimeoutSeconds || 300;
  const mimeType = requirement.mimeType || 'application/json';

  const settlePayload = {
    x402Version: paymentProof.x402Version ?? 1,
    scheme: requirement.scheme || paymentProof.scheme,
    network,
    paymentHeader,
    paymentPayload: paymentProof,
    paymentRequirements: {
      scheme: requirement.scheme || paymentProof.scheme,
      network,
      payTo,
      asset,
      resource,
      maxAmountRequired,
      description,
      maxTimeoutSeconds,
      mimeType,
      extra: {
        ...(requirement.extra || {}),
        ...(feePayer ? { feePayer } : {})
      }
    }
  };

  console.log('[404] Settling payment...', JSON.stringify(settlePayload).substring(0, 300));

  let lastErrorMessage = null;

  for (let attempt = 1; attempt <= SETTLEMENT_RETRY_DELAYS_MS.length + 1; attempt++) {
    try {
      const settleResponse = await fetch(`${FACILITATOR_BASE_URL}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settlePayload)
      });

      if (settleResponse.ok) {
        const result = await settleResponse.json();
        return result;
      }

      const responseText = await settleResponse.text();
      console.log(
        `[404] Settlement response (${settleResponse.status}):`,
        responseText
      );

      let facilitatorError = null;
      try {
        const parsed = JSON.parse(responseText);
        if (parsed && typeof parsed.error === 'string') {
          facilitatorError = parsed.error;
        }
      } catch {
        // ignore
      }

      lastErrorMessage = facilitatorError || 'Settlement request failed';

      if (
        attempt <= SETTLEMENT_RETRY_DELAYS_MS.length &&
        shouldRetrySettlement(settleResponse.status, facilitatorError)
      ) {
        const delayMs = SETTLEMENT_RETRY_DELAYS_MS[attempt - 1];
        console.log(
          `[404] Retryable settlement failure detected (attempt ${attempt}) - retrying in ${delayMs}ms`
        );
        await delay(delayMs);
        continue;
      }

      return {
        success: false,
        error: lastErrorMessage,
        txHash: null,
        networkId: null
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      lastErrorMessage = message;
      console.log(`[404] Settlement attempt ${attempt} threw:`, message);

      if (attempt <= SETTLEMENT_RETRY_DELAYS_MS.length) {
        const delayMs = SETTLEMENT_RETRY_DELAYS_MS[attempt - 1];
        console.log(`[404] Retrying settlement after error in ${delayMs}ms`);
        await delay(delayMs);
        continue;
      }

      return {
        success: false,
        error: message,
        txHash: null,
        networkId: null
      };
    }
  }

  return {
    success: false,
    error: lastErrorMessage || 'Settlement request failed',
    txHash: null,
    networkId: null
  };
}

/** ------------------------------------------------------------------
 *  API KEY MANAGEMENT (for your users via dashboard)
 * ------------------------------------------------------------------ */

// GET /404/keys  -> get existing key or auto-generate one
router.get('/keys', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    let apiKey = await ApiKey.findOne({ user_id: userId, is_active: true }).lean();

    if (apiKey) {
      return res.json({
        ok: true,
        existing: true,
        apiKeyId: apiKey.key_id,
        hasSecret: false
      });
    }

    const { keyId, secret } = await createApiKeyForUser(userId);

    return res.json({
      ok: true,
      existing: false,
      apiKeyId: keyId,
      apiSecret: secret // show once
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to get API key' });
  }
});

// POST /404/keys/rotate  -> deactivate old keys + create a new pair
router.post('/keys/rotate', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    await deactivateAllKeysForUser(userId);
    const { keyId, secret } = await createApiKeyForUser(userId);

    res.json({
      ok: true,
      apiKeyId: keyId,
      apiSecret: secret
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to rotate API key' });
  }
});

/** ------------------------------------------------------------------
 *  404 PAYMENTS: your users accept payments
 *  - Auth: x-api-key + x-api-secret (apiKeyAuthMiddleware)
 * ------------------------------------------------------------------ */

/**
 * Build a challenge that your user's frontend/wallet can use.
 *
 * POST /404/payments/challenge
 *
 * headers: x-api-key, x-api-secret
 *
 * body example:
 * {
 *   "resource": "https://merchant.com/api/premium-data?foo=bar",
 *   "method": "GET",
 *   "requirements": [
 *     {
 *       "network": "base",
 *       "payTo": "0xMerchantBaseAddress...",
 *       "asset": "0x8335...USDC",         // optional, defaults USDC_BASE
 *       "maxAmountRequired": "100000",    // 0.1 USDC with 6 decimals
 *       "description": "Pay for premium API access",
 *       "maxTimeoutSeconds": 300,
 *       "mimeType": "application/json",
 *       "extra": { "plan": "pro" }
 *     }
 *   ]
 * }
 */
router.post('/payments/challenge', apiKeyAuthMiddleware, async (req, res) => {
  try {
    const { resource, method = 'GET', requirements } = req.body || {};

    if (!resource) {
      return res.status(400).json({ ok: false, error: 'resource is required' });
    }
    if (!Array.isArray(requirements) || requirements.length === 0) {
      return res.status(400).json({ ok: false, error: 'requirements array is required' });
    }

    const resourceUrl = normalizeResourceUrl(resource);
    const url = new URL(resource);

    const acceptsRaw = requirements.map((r) => {
      if (!r.network || !isSupportedNetworkGuard(r.network)) {
        throw new Error('Each requirement.network must be "base" or "solana"');
      }
      if (!r.payTo) {
        throw new Error('Each requirement.payTo is required');
      }
      if (r.maxAmountRequired === undefined || r.maxAmountRequired === null) {
        throw new Error('Each requirement.maxAmountRequired is required');
      }

      return {
        scheme: r.scheme || 'exact',
        network: r.network,
        maxAmountRequired: String(r.maxAmountRequired),
        resource: resourceUrl,
        description:
          r.description || `Access ${url.pathname} (${r.network})`,
        mimeType: r.mimeType || 'application/json',
        payTo: r.payTo,
        maxTimeoutSeconds: r.maxTimeoutSeconds || 300,
        asset:
          r.asset || (r.network === 'solana' ? USDC_SOLANA : USDC_BASE),
        outputSchema:
          r.outputSchema || {
            type: 'object',
            description: 'API response data'
          },
        extra: r.extra || {}
      };
    });

    const accepts = await withFacilitatorExtras(acceptsRaw);

    const challenge = {
      x402Version: 1,
      resource: resourceUrl,
      method,
      accepts
    };

    res.json({
      ok: true,
      challenge
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ ok: false, error: err.message || 'Failed to create challenge' });
  }
});

/**
 * Verify + settle a payment for your user.
 *
 * POST /404/payments/verify-and-settle
 *
 * headers: x-api-key, x-api-secret
 *
 * body example:
 * {
 *   "paymentHeader": "<x-payment header from wallet (base64 JSON)>",
 *   "resource": "https://merchant.com/api/premium-data?foo=bar",
 *   "requirement": {
 *     "network": "base",
 *     "payTo": "0xMerchantBaseAddress...",
 *     "asset": "0x8335...USDC",           // optional, defaults USDC_BASE
 *     "maxAmountRequired": "100000",      // 0.1 USDC with 6 decimals
 *     "description": "Pay for premium API access",
 *     "maxTimeoutSeconds": 300,
 *     "mimeType": "application/json",
 *     "extra": { "plan": "pro" }
 *   }
 * }
 */
router.post('/payments/verify-and-settle', apiKeyAuthMiddleware, async (req, res) => {
  try {
    const { paymentHeader, resource, requirement } = req.body || {};

    if (!paymentHeader || !resource || !requirement) {
      return res.status(400).json({
        ok: false,
        error: 'paymentHeader, resource and requirement are required'
      });
    }

    const resourceUrl = normalizeResourceUrl(resource);

    // verify
    const verification = await verifyPayment(
      paymentHeader,
      resourceUrl,
      requirement
    );

    if (!verification.isValid || !verification.network) {
      return res.status(402).json({
        ok: false,
        error: verification.invalidReason || 'Payment verification failed'
      });
    }

    // settle
    const settlement = await settlePayment(
      paymentHeader,
      resourceUrl,
      verification.network,
      requirement
    );

    if (!settlement.success) {
      return res.status(402).json({
        ok: false,
        error: settlement.error || 'Settlement failed'
      });
    }

    const paymentResponse = {
      success: true,
      txHash: settlement.txHash,
      networkId: settlement.networkId || verification.network,
      timestamp: new Date().toISOString()
    };

    res.json({
      ok: true,
      payment: paymentResponse
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Payment processing error' });
  }
});

export default router;
