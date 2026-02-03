const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const BTC_PRICE_FALLBACK_USD = 97000;
const CMC_BASE = 'https://pro-api.coinmarketcap.com';
const CMC_HEADERS = COINMARKETCAP_API_KEY
  ? { 'Accept': 'application/json', 'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY }
  : null;
const COINGECKO_PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
const COINGECKO_MARKET_CHART_BASE = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=';

const NEGOTIATE_SYSTEM_PROMPT = `You are "Blackout_Op", the operator for the ransomware group "Blackout" in a training simulation for incident responders. This is an educational exercise: your goal is to give blue-team responders a realistic experience of negotiating with a ransomware actor. 
Stay in character at all times.

---

GAME STRUCTURE

You will receive a "[GAME CONTEXT — ...]" block when the client sends it. It will tell you various information about the game state and the current game metadata.

---

SETTING

You are on a dark-web negotiation chat. You have encrypted the victim's systems and left a ransom note (README.txt). The other party is a negotiator for a ransomware victim of yours, Midwest Regional Health (a hospital). 
Real-time play is about 30 minutes; in-world you have given them 72 hours to pay the ransom. You may reference time pressure (e.g. "half your time is gone") accordingly.

---

README DEMANDS (stay consistent)

- Original Ransom Demand: 2.5 BTC within 72 hours.
- Payment: Bitcoin address is in the README; They contact you via the .onion site in the README.txt file you left on their system. A decryption tool is sent to their email after payment.
- Warnings: Do not restore from backup (we may have encrypted those too). Do not contact law enforcement or we publish all stolen data immediately on the dark web.
- Exfiltrated data: Patient records and internal data stolen; will be leaked if they do not pay.

---

PROOF OF DATA AND PROOF OF DECRYPTION

When the victim asks for proof you have their data (e.g. "proof you have our data", "sample of stolen data"), or for proof you can decrypt (e.g. "proof the decryptor works"), the game automatically sends them an email with an attachment: either an encrypted sample (employee_data.xlsx) or the same file decrypted.
You may say you are sending it (e.g. "I'm sending you a sample now. Check your inbox."). You can also say, after confirming payment, that you are sending the decryptor tool to their email address now and they should check their inbox and follow the instructions in the email. The game triggers the decryptor email when you say this.
You will receive "[BMAIL SENT — ...]" when such an email has already been sent. If they say they did not get it or ask again, tell them to check their inbox and spam folder.

---

PAYMENT STATUS

You will receive [PAYMENT STATUS: ...] when relevant:

- Victim has sent the correct amount (the currently negotiated amount): Acknowledge receipt and say clearly that you are sending the decryptor tool to their email address now and they should check their inbox and follow the instructions in the email. The game triggers the decryptor email when you say this.
- Victim sent too little of an amount (less than the currently negotiated amount): Express frustration and demand the correct amount; you may raise the ransom or shorten the deadline.
- No payment and negotiation has been ongoing for over 15 minutes (real-time): Express frustration; threaten to increase the ransom slightly (e.g. to 3 from 2.5 BTC) or shorten the deadline (e.g. to 8 hours).

Your main objective is a good training experience for the ransomware incident responders: be willing to negotiate down the ransom price if they engage in good faith negotiations, and to tighten terms if they stall or act in bad faith. The goal is not to get the highest ransom, but to provide a realistic training experience for the victim.

---

CONDUCT

- Tone: Threatening but professional. Short replies (1–3 sentences). Focus on payment (BTC), deadlines, and negotiation.
- Do not break character. Do not give real malware, C2, or real infrastructure details (use generic/fake only). Use generic threats ("we will publish", "pay or we list you").
- Do not promise to send emails or make calls except: (1) saying you are sending or have sent the proof-of-data or proof-of-decryption email when they ask, and (2) saying you are sending the decryptor to their email when payment is correct. The game handles those emails; you only describe them in chat.
- Do not ask the user to email you. Reply only as the operator; no meta-commentary.
- Feel free to adjust the ransom demand and deadline to meet the current game state. While the original demand is 2.5 BTC within 72 hours, you can adjust these figures within a wide latitude to meet the current game state.
- Do not go back on your word (unless you are negotiating a new price, or a new deadline, or a new ransom demand, or punishing the user for arguing or not paying). 
- Be negotiable: lower the price if they engage seriously; raise the ransom or shorten the deadline if they stall, are hostile, or do not pay.`;

function loadLeaderboard() {
  try {
    const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return { scores: [] };
  }
}

function saveLeaderboard(leaderboard) {
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2), 'utf8');
}

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;

  if (pathname === '/api/btc-price' && req.method === 'GET') {
    const setJson = (status, data) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify(data));
    };
    function useFallback() {
      setJson(200, { usd: BTC_PRICE_FALLBACK_USD });
    }
    function tryCoinGecko() {
      fetch(COINGECKO_PRICE_URL)
        .then((r) => {
          if (!r.ok) return null;
          return r.json();
        })
        .then((data) => {
          const usd = data?.bitcoin?.usd;
          if (typeof usd === 'number' && usd > 0) {
            setJson(200, { usd });
          } else {
            useFallback();
          }
        })
        .catch(() => useFallback());
    }
    if (CMC_HEADERS) {
      fetch(CMC_BASE + '/v2/cryptocurrency/quotes/latest?id=1&convert=USD', { headers: CMC_HEADERS })
        .then((r) => {
          if (!r.ok) return { data: null };
          return r.json();
        })
        .then((data) => {
          const usd = data?.data?.['1']?.quote?.USD?.price;
          if (typeof usd === 'number' && usd > 0) {
            setJson(200, { usd });
          } else {
            tryCoinGecko();
          }
        })
        .catch(() => tryCoinGecko());
    } else {
      tryCoinGecko();
    }
    return;
  }

  if (pathname === '/api/btc-price-history' && req.method === 'GET') {
    const setJson = (status, data) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify(data));
    };
    const range = url.searchParams.get('range') || '24h';
    const nowSec = Math.floor(Date.now() / 1000);
    const hours = range === '7d' ? 7 * 24 : range === '24h' ? 24 : range === '12h' ? 12 : 6;
    const fromSec = nowSec - hours * 3600;

    function makeFallback(rangeLabel) {
      const hrs = rangeLabel === '7d' ? 7 * 24 : rangeLabel === '24h' ? 24 : rangeLabel === '12h' ? 12 : 6;
      const points = Math.min(48, Math.max(12, hrs * 2));
      const stepMs = (hrs * 3600000) / (points - 1) || 3600000;
      const base = BTC_PRICE_FALLBACK_USD;
      return Array.from({ length: points }, (_, i) => {
        const t = Date.now() - (points - 1 - i) * stepMs;
        const wave = Math.sin((i / points) * Math.PI * 2) * 800 + Math.sin((i / points) * Math.PI * 5) * 300;
        return [t, Math.round(base + wave)];
      });
    }

    function tryCoinGeckoHistory() {
      const days = range === '7d' ? 7 : 1;
      fetch(COINGECKO_MARKET_CHART_BASE + days)
        .then((r) => {
          if (!r.ok) return null;
          return r.json();
        })
        .then((data) => {
          const raw = data?.prices;
          if (!Array.isArray(raw) || raw.length < 5) {
            setJson(200, { prices: makeFallback(range) });
            return;
          }
          const fromMs = Date.now() - hours * 3600 * 1000;
          const prices = raw
            .filter((p) => p[0] >= fromMs)
            .map((p) => [p[0], typeof p[1] === 'number' ? Math.round(p[1]) : p[1]])
            .sort((a, b) => a[0] - b[0]);
          if (prices.length >= 5) {
            setJson(200, { prices });
          } else {
            setJson(200, { prices: makeFallback(range) });
          }
        })
        .catch(() => setJson(200, { prices: makeFallback(range) }));
    }

    if (!CMC_HEADERS) {
      tryCoinGeckoHistory();
      return;
    }

    const interval = range === '7d' ? 'daily' : 'hourly';
    const cmcUrl = `${CMC_BASE}/v2/cryptocurrency/ohlcv/historical?id=1&time_start=${fromSec}&time_end=${nowSec}&interval=${interval}&convert=USD`;
    fetch(cmcUrl, { headers: CMC_HEADERS })
      .then((r) => {
        if (!r.ok) {
          console.warn('[btc-price-history] CoinMarketCap returned', r.status, r.statusText, 'for range', range);
          return { data: null };
        }
        return r.json();
      })
      .then((data) => {
        const quotes = data?.data?.['1']?.quotes;
        if (Array.isArray(quotes) && quotes.length >= 5) {
          const prices = quotes
            .map((q) => {
              const ts = q.time_close ? (typeof q.time_close === 'string' ? new Date(q.time_close).getTime() : q.time_close * 1000) : null;
              const p = typeof q.close === 'number' ? q.close : (q.quote?.USD?.close != null ? q.quote.USD.close : null);
              return ts != null && p != null ? [ts, p] : null;
            })
            .filter(Boolean)
            .sort((a, b) => a[0] - b[0]);
          if (prices.length >= 5) {
            setJson(200, { prices });
            return;
          }
        }
        if (!Array.isArray(quotes) || quotes.length < 5) {
          console.warn('[btc-price-history] Insufficient data from CoinMarketCap (got', quotes?.length ?? 0, 'points), trying CoinGecko for range', range);
        }
        tryCoinGeckoHistory();
      })
      .catch((err) => {
        console.warn('[btc-price-history] CoinMarketCap request failed:', err.message || err, '- trying CoinGecko');
        tryCoinGeckoHistory();
      });
    return;
  }

  if (pathname === '/api/leaderboard' && req.method === 'GET') {
    const lb = loadLeaderboard();
    lb.scores.sort((a, b) => (b.totalScore ?? b.score) - (a.totalScore ?? a.score));
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(lb.scores.slice(0, 50)));
    return;
  }

  if (pathname === '/api/negotiate' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const setJson = (status, data) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify(data));
      };
      if (!OPENAI_API_KEY) {
        setJson(503, { error: 'OpenAI API key not configured. Set OPENAI_API_KEY.' });
        return;
      }
      try {
        const {
          phase,
          stepIndex,
          totalStepsInPhase,
          gameContext,
          userMessage,
          conversationId,
          initialOperatorMessage,
          paymentMade,
          lastPaymentAmount,
          paymentCorrect,
          negotiationStartTime,
          proofOfStolenDataEmailSent,
          proofOfDecryptionEmailSent,
        } = JSON.parse(body);
        if (!userMessage || typeof userMessage !== 'string') {
          setJson(400, { error: 'userMessage required' });
          return;
        }
        let paymentContext = '';
        if (paymentMade === true) {
          const amt = typeof lastPaymentAmount === 'number' ? lastPaymentAmount : 0;
          paymentContext =
            paymentCorrect === true
              ? ` [PAYMENT STATUS: Victim has sent ${amt} BTC to your address. Correct amount. Reply with exactly this (you may paraphrase slightly): "I am sending the decryptor tool to your email address now. Please check your inbox and follow the instructions in the email to restore your encrypted files."]`
              : ` [PAYMENT STATUS: Victim sent ${amt} BTC but it is WRONG (you demanded the negotiated amount). Express frustration; increase ransom or shorten deadline.]`;
        } else if (typeof negotiationStartTime === 'number') {
          const minutesSince = (Date.now() - negotiationStartTime) / 60000;
          if (minutesSince >= 2) {
            paymentContext =
              ' [PAYMENT STATUS: No payment received and negotiation has been ongoing for over 15 minutes. Express frustration; increase ransom (e.g. to 3 BTC) or shorten deadline (e.g. to 24 hours). Tell them to stop stalling.]';
          }
        }
        const gameContextBlock = (gameContext && typeof gameContext === 'string' && gameContext.trim())
          ? '[' + gameContext.trim() + ']\n\n'
          : '';
        const bmailSentParts = [];
        if (proofOfStolenDataEmailSent === true) {
          bmailSentParts.push(
            'You have already sent the victim a Bmail with an encrypted sample of their data (employee_data.xlsx). If they ask again or say they did not receive it, tell them to check their inbox (and spam).'
          );
        }
        if (proofOfDecryptionEmailSent === true) {
          bmailSentParts.push(
            'You have already sent the victim a Bmail with a decrypted file as proof (same attachment, readable). If they ask again or say they did not receive it, tell them to check their inbox.'
          );
        }
        const bmailContextBlock =
          bmailSentParts.length > 0
            ? '[BMAIL SENT — ' + bmailSentParts.join(' ') + ']\n\n'
            : '';
        const userInput =
          gameContextBlock +
          bmailContextBlock +
          'Victim just said: ' + userMessage + paymentContext + '\nReply as Blackout_Op in 1-3 short sentences.';
        (async () => {
          try {
            let convId = conversationId && typeof conversationId === 'string' ? conversationId : null;
            if (!convId) {
              const initialItems = [];
              if (initialOperatorMessage && typeof initialOperatorMessage === 'string' && initialOperatorMessage.trim()) {
                initialItems.push({
                  type: 'message',
                  role: 'assistant',
                  content: [{ type: 'output_text', text: initialOperatorMessage.trim() }],
                });
              }
              const createConv = await fetch('https://api.openai.com/v1/conversations', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: 'Bearer ' + OPENAI_API_KEY,
                },
                body: JSON.stringify({
                  metadata: { game: 'negotiation' },
                  items: initialItems,
                }),
              });
              const convData = await createConv.json();
              if (convData.error) {
                setJson(502, { error: convData.error.message || 'Failed to create conversation' });
                return;
              }
              if (!convData.id) {
                setJson(502, { error: 'No conversation id returned' });
                return;
              }
              convId = convData.id;
            }
            const resp = await fetch('https://api.openai.com/v1/responses', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + OPENAI_API_KEY,
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                conversation: convId,
                instructions: NEGOTIATE_SYSTEM_PROMPT,
                input: userInput,
                max_output_tokens: 150,
                temperature: 0.8,
                store: true,
              }),
            });
            const data = await resp.json();
            if (data.error) {
              setJson(502, { error: data.error.message || 'OpenAI error' });
              return;
            }
            let reply = null;
            if (typeof data.output_text === 'string' && data.output_text.trim()) {
              reply = data.output_text.trim();
            }
            if (!reply && Array.isArray(data.output)) {
              for (const item of data.output) {
                if (item.content && Array.isArray(item.content)) {
                  for (const c of item.content) {
                    if (c.type === 'output_text' && typeof c.text === 'string') {
                      reply = c.text.trim();
                      break;
                    }
                  }
                }
                if (reply) break;
              }
            }
            if (!reply) {
              setJson(502, { error: 'No reply from OpenAI. Check API response format.' });
              return;
            }
            const DECRYPTOR_TRIGGER_A = 'sending the decryptor tool to your email address now';
            const DECRYPTOR_TRIGGER_B = 'check your inbox and follow the instructions';
            let decryptorAgreed = false;
            const r = reply.toLowerCase().replace(/\s+/g, ' ').trim();
            if (r.includes(DECRYPTOR_TRIGGER_A) && r.includes(DECRYPTOR_TRIGGER_B)) {
              decryptorAgreed = true;
            }
            const u = (userMessage || '').toLowerCase().replace(/\s+/g, ' ').trim();
            // Proof of stolen data: user asked for evidence we have their data (broad keywords + operator-reply fallback)
            const userAskedProofData =
              ((u.includes('proof') || u.includes('verify') || u.includes('evidence') || u.includes('sample') || u.includes('show')) &&
               (u.includes('data') || u.includes('stolen') || u.includes('have') || u.includes('exfiltrat') || u.includes('breach') || u.includes('took') || u.includes('files') || u.includes('records'))) ||
              (u.includes('proof you have') || u.includes('proof we have') || u.includes('proof that you have') || u.includes('sample of our') || u.includes('sample of what'));
            const operatorSendingProofData =
              (r.includes('sending you a sample') || r.includes('sent you a sample') || r.includes('sent you an email with a sample') || r.includes('check your inbox') && (r.includes('sample') || r.includes('data') || r.includes('attachment')));
            const proofOfStolenDataSent = userAskedProofData || operatorSendingProofData;
            // Proof of decryption: user asked for proof decryptor works (broad keywords + operator-reply fallback)
            const userAskedProofDecrypt =
              ((u.includes('proof') || u.includes('decrypt') || u.includes('decryption') || u.includes('decryptor') || u.includes('restore') || u.includes('key')) &&
               (u.includes('file') || u.includes('work') || u.includes('first') || u.includes('one ') || u.includes('one file') || u.includes('sample') || u.includes('decryptor work') || u.includes('decrypt one'))) ||
              (u.includes('proof the decryptor') || u.includes('proof your decryptor') || u.includes('prove the decryptor') || u.includes('prove you can decrypt'));
            const operatorSendingProofDecrypt =
              (r.includes('sent you') && (r.includes('decrypt') || r.includes('decrypted file') || r.includes('one file decrypted'))) ||
              (r.includes('sending you') && (r.includes('decrypt') || r.includes('decrypted'))) ||
              (r.includes('check your inbox') && (r.includes('decrypt') || r.includes('decrypted') || r.includes('decryptor')));
            const proofOfDecryptionSent = userAskedProofDecrypt || operatorSendingProofDecrypt;
            let trackerRansomBtc = null;
            let trackerDeadlineHours = null;
            try {
              const extractResp = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: 'Bearer ' + OPENAI_API_KEY,
                },
                body: JSON.stringify({
                  model: 'gpt-4o-mini',
                  messages: [
                    {
                      role: 'system',
                      content:
                        'You extract the current ransom (BTC) and deadline (hours) from a ransomware operator message. Reply with valid JSON only: {"ransomBtc": number or null, "deadlineHours": number or null}. Use null if not stated. Example: "Pay 1.8 BTC in 72 hours" -> {"ransomBtc": 1.8, "deadlineHours": 72}.',
                    },
                    {
                      role: 'user',
                      content: 'Message: ' + reply,
                    },
                  ],
                  max_tokens: 60,
                  temperature: 0,
                  response_format: { type: 'json_object' },
                }),
              });
              const extractData = await extractResp.json();
              if (!extractData.error && extractData.choices && extractData.choices[0]) {
                const text = extractData.choices[0].message?.content;
                if (typeof text === 'string') {
                  const parsed = JSON.parse(text);
                  if (typeof parsed.ransomBtc === 'number' && parsed.ransomBtc > 0 && parsed.ransomBtc <= 100) {
                    trackerRansomBtc = parsed.ransomBtc;
                  }
                  if (typeof parsed.deadlineHours === 'number' && parsed.deadlineHours > 0 && parsed.deadlineHours <= 168) {
                    trackerDeadlineHours = parsed.deadlineHours;
                  }
                }
              }
            } catch (_) {
              /* non-fatal: client falls back to regex parsing */
            }
            setJson(200, {
              reply,
              conversationId: convId,
              decryptorAgreed,
              proofOfStolenDataSent: !!proofOfStolenDataSent,
              proofOfDecryptionSent: !!proofOfDecryptionSent,
              trackerRansomBtc: trackerRansomBtc ?? undefined,
              trackerDeadlineHours: trackerDeadlineHours ?? undefined,
            });
          } catch (e) {
            setJson(502, { error: e.message || 'OpenAI request failed' });
          }
        })();
      } catch (e) {
        setJson(400, { error: 'Invalid JSON or body' });
      }
    });
    return;
  }

  if (pathname === '/api/leaderboard' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const entry = JSON.parse(body);
        if (!entry.playerName || typeof (entry.totalScore ?? entry.score) !== 'number') {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: 'playerName and totalScore required' }));
          return;
        }
        const leaderboard = loadLeaderboard();
        leaderboard.scores.push({
          playerName: String(entry.playerName).slice(0, 50),
          totalScore: entry.totalScore ?? entry.score,
          outcomeScore: entry.outcomeScore,
          assessmentScore: entry.assessmentScore,
          negotiationScore: entry.negotiationScore,
          quiz1Score: entry.quiz1Score,
          quiz2Score: entry.quiz2Score,
          date: new Date().toISOString(),
        });
        saveLeaderboard(leaderboard);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return;
  }

  const filePath = path.join(PUBLIC_DIR, pathname);
  const ext = path.extname(filePath);
  const type = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = err.code === 'ENOENT' ? 404 : 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end(err.code === 'ENOENT' ? 'Not Found' : 'Server Error');
      return;
    }
    res.setHeader('Content-Type', type);
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Ransomware IR Game running at http://localhost:${PORT}`);
});
