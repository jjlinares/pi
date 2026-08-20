---
name: financial-data-api
description: This skill should be used when the user asks financial data questions or requests market data, stock prices, company fundamentals, SEC filings, or asks to fetch, compare, screen, analyze, or validate financial data.
version: 0.1.0
---

# Financial Data API

Use the bundled Financial Modeling Prep API reference as the first source for financial data requests. Prefer this API over general web search for prices, fundamentals, statements, filings, calendars, estimates, market movers, and other structured financial datasets. Use web search only when the requested data is not covered by the API or the user explicitly asks for external sources.

The API key is already available in the environment as `FMP_API_KEY`.

## API basics

Base API host:

```text
https://financialmodelingprep.com
```

Most documented endpoints use:

```text
https://financialmodelingprep.com/stable/...
```

Authorize with either query parameter or header:

```bash
curl "https://financialmodelingprep.com/stable/quote?symbol=AAPL&apikey=$FMP_API_KEY"
```

```bash
curl -H "apikey: $FMP_API_KEY" "https://financialmodelingprep.com/stable/quote?symbol=AAPL"
```

Choose the implementation method freely: bash/curl, Python, JavaScript, app code, tests, or whatever fits the task. Keep secrets in env/config; do not hardcode API keys.

## Reading endpoint docs

Load only the reference file that matches the requested financial data. Each file contains endpoints, parameter tables, required markers, max limits, response fields, sample JSON when available, and canonical docs links.

Parameter notes:

- `*` in a parameter name means required.
- Types are listed as FMP documents them: usually `string`, `number`, or enum-like string values.
- Add `?apikey=` when the endpoint has no query string.
- Add `&apikey=` when the endpoint already has query params.
- Use ISO dates (`YYYY-MM-DD`) for date params.
- Use comma-separated symbols where the endpoint documents `symbols=AAPL,MSFT` style params.
- For paginated endpoints, `page=0` is the usual first page.

Response notes:

- Inspect the response sample before assuming shape; many endpoints return `JSON array<object>`, some return objects.
- If a reference says no response example is embedded, inspect a live authorized response before hardcoding fields.
- Handle 401/403, plan/quota errors, empty arrays, and unknown symbols explicitly.

## Reference files

- `references/search.md` — symbol/name/CIK/CUSIP/ISIN search, screener, exchange variants.
- `references/directory.md` — symbol lists, financial statement symbols, CIK list, exchanges, sectors, industries, countries.
- `references/company.md` — profiles, peers, employee count, market cap, share float, M&A, executives, compensation.
- `references/quote.md` — real-time quotes, short quotes, after-hours, batch quotes, exchange quotes.
- `references/statements.md` — income statement, balance sheet, cash flow, ratios, key metrics, growth, enterprise value, reported financials.
- `references/chart.md` — historical EOD prices and intraday chart data.
- `references/economics.md` — treasury rates, economic indicators, economic calendar, market risk premium.
- `references/calendar.md` — dividends, earnings, IPOs, splits.
- `references/earnings-transcript.md` — latest transcripts, transcript search, dates, symbols.
- `references/news.md` — market news, press releases, stock/crypto/forex news, articles.
- `references/form-13f.md` — institutional filings, holdings, holder performance, positions.
- `references/analyst.md` — estimates, ratings, price targets, grades.
- `references/market-performance.md` — sector/industry performance, PE snapshots, gainers, losers, active stocks.
- `references/technical-indicators.md` — SMA, EMA, WMA, DEMA, TEMA, RSI, ADX, standard deviation.
- `references/etf-and-mutual-funds.md` — ETF holdings, fund information, exposure, weighting, disclosures.
- `references/sec-filings.md` — latest filings, search by form/symbol/CIK, company info, industry classification.
- `references/insider-trades.md` — latest/search insider trades, reporting names, transaction types, statistics.
- `references/indexes.md` — index lists, quotes, historical prices, constituents.
- `references/market-hours.md` — exchange hours and holidays.
- `references/commodity.md` — commodity list, quotes, historical prices, intraday.
- `references/discounted-cash-flow.md` — DCF valuation endpoints.
- `references/forex.md` — forex pairs, quotes, historical prices, intraday.
- `references/crypto.md` — cryptocurrencies, quotes, historical prices, intraday.
- `references/senate.md` — senate/house trading disclosures.
- `references/esg.md` — ESG search, ratings, benchmark.
- `references/commitment-of-traders.md` — CFTC commitment of traders reports and analysis.
- `references/fundraisers.md` — crowdfunding and equity offering data.
- `references/bulk.md` — bulk datasets for profiles, ratings, scores, price targets, statements, peers, EOD, etc.
