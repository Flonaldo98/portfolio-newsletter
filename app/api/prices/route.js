export async function GET() {
  const holdings = [
    { name: 'Investor B', ticker: 'INVE-B.ST', weight: 10.68 },
    { name: "L'Oreal", ticker: 'OR.PA', weight: 6.91 },
    { name: 'Microsoft', ticker: 'MSFT', weight: 6.64 },
    { name: 'AstraZeneca ADR', ticker: 'AZN', weight: 4.83 },
    { name: 'Amazon', ticker: 'AMZN', weight: 4.52 },
    { name: 'Hermès International', ticker: 'RMS.PA', weight: 4.15 },
    { name: 'Münchener Rück', ticker: 'MUV2.DE', weight: 4.07 },
    { name: 'Mastercard', ticker: 'MA', weight: 3.99 },
    { name: 'Rio Tinto', ticker: 'RIO', weight: 3.90 },
    { name: 'Shell', ticker: 'SHEL', weight: 3.74 },
    { name: 'Roche Holding', ticker: 'ROG.SW', weight: 3.65 },
    { name: 'ASML Holding', ticker: 'ASML', weight: 3.61 },
    { name: 'Novartis', ticker: 'NVS', weight: 3.49 },
    { name: 'Brookfield Renewable', ticker: 'BEP', weight: 3.18 },
    { name: 'WisdomTree Uranium', ticker: 'WTEM.L', weight: 3.06 },
    { name: 'Siemens AG', ticker: 'SIE.DE', weight: 3.05 },
    { name: 'Apple', ticker: 'AAPL', weight: 3.03 },
    { name: 'Ahold Delhaize', ticker: 'AD.AS', weight: 3.01 },
    { name: 'iShares MSCI India ETF', ticker: 'NDIA.L', weight: 3.01 },
    { name: 'TSMC', ticker: 'TSM', weight: 2.92 },
    { name: 'Bunge', ticker: 'BG', weight: 2.86 },
    { name: 'MercadoLibre', ticker: 'MELI', weight: 2.77 },
    { name: 'Royal Bank of Canada', ticker: 'RY', weight: 2.64 },
    { name: 'Philip Morris', ticker: 'PM', weight: 2.47 },
    { name: 'Xtrackers MSCI Singapore', ticker: 'XMSG.L', weight: 2.12 },
    { name: 'Cresud A ADR', ticker: 'CRESY', weight: 1.52 },
  ];

  const results = await Promise.all(
    holdings.map(async (h) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(h.ticker)}?interval=1d&range=2d`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const json = await res.json();
        const meta = json?.chart?.result?.[0]?.meta;
        if (!meta) return { ...h, price: null, change: null, currency: '' };
        const price = meta.regularMarketPrice ?? null;
        const prev = meta.chartPreviousClose ?? meta.previousClose ?? null;
        const change = price && prev ? ((price - prev) / prev) * 100 : null;
        return { ...h, price, change, currency: meta.currency ?? '' };
      } catch {
        return { ...h, price: null, change: null, currency: '' };
      }
    })
  );

  return Response.json(results);
}
