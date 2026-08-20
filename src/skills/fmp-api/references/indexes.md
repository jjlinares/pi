# FMP API Group: Indexes

Source: https://site.financialmodelingprep.com/developer/docs#indexes

Endpoints: 15

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Stock Market Indexes List API

Retrieve a comprehensive list of stock market indexes across global exchanges using the FMP Stock Market Indexes List API. This API provides essential information such as the symbol, name, exchange, and currency for each index, helping analysts and investors keep track of various market benchmarks.

**Endpoint**

`GET https://financialmodelingprep.com/stable/index-list`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `name` | string |
| `exchange` | string |
| `currency` | string |

Sample:

```json
[
  {
    "symbol": "^TTIN",
    "name": "S&P/TSX Capped Industrials Index",
    "exchange": "TSX",
    "currency": "CAD"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/indexes-list

### Index Quote API

Access real-time stock index quotes with the Stock Index Quote API. Stay updated with the latest price changes, daily highs and lows, volume, and other key metrics for major stock indices around the world.

**Endpoint**

`GET https://financialmodelingprep.com/stable/quote?symbol=^VIX`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | ^VIX |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `name` | string |
| `price` | number |
| `changePercentage` | number |
| `change` | number |
| `volume` | integer |
| `dayLow` | number |
| `dayHigh` | number |
| `yearHigh` | number |
| `yearLow` | number |
| `marketCap` | integer |
| `priceAvg50` | number |
| `priceAvg200` | number |
| `exchange` | string |
| `open` | number |
| `previousClose` | number |
| `timestamp` | integer |

Sample:

```json
[
  {
    "symbol": "^VIX",
    "name": "CBOE Volatility Index",
    "price": 16.37,
    "changePercentage": -5.37572,
    "change": -0.93,
    "volume": 0,
    "dayLow": 16.02,
    "dayHigh": 17.22,
    "yearHigh": 60.13,
    "yearLow": 12.7,
    "marketCap": 0,
    "priceAvg50": 16.5992,
    "priceAvg200": 19.3432,
    "exchange": "INDEX",
    "open": 17.02,
    "previousClose": 17.3,
    "timestamp": 1761336901
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/index-quote

### Index Short Quote API

Access concise stock index quotes with the Stock Index Short Quote API. This API provides a snapshot of the current price, change, and volume for stock indexes, making it ideal for users who need a quick overview of market movements.

**Endpoint**

`GET https://financialmodelingprep.com/stable/quote-short?symbol=^VIX`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | ^VIX |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `change` | number |
| `volume` | integer |

Sample:

```json
[
  {
    "symbol": "^VIX",
    "price": 16.37,
    "change": -0.93,
    "volume": 0
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/index-quote-short

### All Index Quotes API

The All Index Quotes API provides real-time quotes for a wide range of stock indexes, from major market benchmarks to niche indexes. This API allows users to track market performance across multiple indexes in a single request, giving them a broad view of the financial markets.

**Endpoint**

`GET https://financialmodelingprep.com/stable/batch-index-quotes`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| short | boolean | true |

**Response**

Format: JSON array<object>

Sample:

```json
[
  {}
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/all-index-quotes

### Historical Index Light Chart API

Retrieve end-of-day historical prices for stock indexes using the Historical Price Data API. This API provides essential data such as date, price, and volume, enabling detailed analysis of price movements over time.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=^VIX`

Note: maximum `5000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | ^VIX |
| from | date | 2026-01-27 |
| to | date | 2026-04-27 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `price` | number |
| `volume` | integer |

Sample:

```json
[
  {
    "symbol": "^VIX",
    "date": "2026-04-08",
    "price": 21.04,
    "volume": 0
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/index-historical-price-eod-light

### Historical Index Full Chart API

Access full historical end-of-day prices for stock indexes using the Detailed Historical Price Data API. This API provides comprehensive information, including open, high, low, close prices, volume, and additional metrics for detailed financial analysis.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=^VIX`

Note: maximum `5000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | ^VIX |
| from | date | 2026-01-27 |
| to | date | 2026-04-27 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `open` | number |
| `high` | number |
| `low` | number |
| `close` | number |
| `volume` | integer |
| `change` | number |
| `changePercent` | number |
| `vwap` | number |

Sample:

```json
[
  {
    "symbol": "^VIX",
    "date": "2026-04-08",
    "open": 20.97,
    "high": 22.17,
    "low": 19.91,
    "close": 21.04,
    "volume": 0,
    "change": 0.07,
    "changePercent": 0.33381,
    "vwap": 21.0225
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/index-historical-price-eod-full

### 1-Minute Interval Index Price API

Retrieve 1-minute interval intraday data for stock indexes using the Intraday 1-Minute Price Data API. This API provides granular price information, helping users track short-term price movements and trading volume within each minute.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/1min?symbol=^VIX`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | ^VIX |
| from | date | 2024-01-01 |
| to | date | 2024-03-01 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `open` | number |
| `low` | number |
| `high` | number |
| `close` | number |
| `volume` | integer |

Sample:

```json
[
  {
    "date": "2026-04-08 15:59:00",
    "open": 21.1,
    "low": 21.02,
    "high": 21.1,
    "close": 21.03,
    "volume": 0
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/index-intraday-1-min

### 5-Minute Interval Index Price API

Retrieve 5-minute interval intraday price data for stock indexes using the Intraday 5-Minute Price Data API. This API provides crucial insights into price movements and trading volume within 5-minute windows, ideal for traders who require short-term data.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/5min?symbol=^VIX`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | ^VIX |
| from | date | 2024-01-01 |
| to | date | 2024-03-01 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `open` | number |
| `low` | number |
| `high` | number |
| `close` | number |
| `volume` | integer |

Sample:

```json
[
  {
    "date": "2026-04-08 15:55:00",
    "open": 21.26,
    "low": 21.02,
    "high": 21.3,
    "close": 21.03,
    "volume": 0
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/index-intraday-5-min

### 1-Hour Interval Index Price API

Access 1-hour interval intraday data for stock indexes using the Intraday 1-Hour Price Data API. This API provides detailed price movements and volume within hourly intervals, making it ideal for tracking medium-term market trends during the trading day.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/1hour?symbol=^VIX`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | ^VIX |
| from | date | 2024-01-01 |
| to | date | 2024-03-01 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `open` | number |
| `low` | number |
| `high` | number |
| `close` | number |
| `volume` | integer |

Sample:

```json
[
  {
    "date": "2026-04-08 15:30:00",
    "open": 21.62,
    "low": 21.02,
    "high": 21.62,
    "close": 21.03,
    "volume": 0
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/index-intraday-1-hour

### S&P 500 Index API

Access detailed data on the S&P 500 index using the S&P 500 Index API. Track the performance and key information of the companies that make up this major stock market index.

**Endpoint**

`GET https://financialmodelingprep.com/stable/sp500-constituent`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `name` | string |
| `sector` | string |
| `subSector` | string |
| `headQuarter` | string |
| `dateFirstAdded` | string |
| `cik` | string |
| `founded` | string |

Sample:

```json
[
  {
    "symbol": "COHR",
    "name": "Coherent, Inc.",
    "sector": "Technology",
    "subSector": "Hardware, Equipment & Parts",
    "headQuarter": "Santa Clara, California",
    "dateFirstAdded": "2026-03-23",
    "cik": "0000820318",
    "founded": "2022-09-01"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/sp-500

### Nasdaq Index API

Access comprehensive data for the Nasdaq index with the Nasdaq Index API. Monitor real-time movements and track the historical performance of companies listed on this prominent stock exchange.

**Endpoint**

`GET https://financialmodelingprep.com/stable/nasdaq-constituent`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `name` | string |
| `sector` | string |
| `subSector` | string |
| `headQuarter` | string |
| `dateFirstAdded` | null |
| `cik` | string |
| `founded` | string |

Sample:

```json
[
  {
    "symbol": "ADBE",
    "name": "Adobe Inc.",
    "sector": "Technology",
    "subSector": "Software - Infrastructure",
    "headQuarter": "San Jose, CA",
    "dateFirstAdded": null,
    "cik": "0000796343",
    "founded": "1982-12-01"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/nasdaq

### Dow Jones API

Access data on the Dow Jones Industrial Average using the Dow Jones API. Track current values, analyze trends, and get detailed information about the companies that make up this important stock index.

**Endpoint**

`GET https://financialmodelingprep.com/stable/dowjones-constituent`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `name` | string |
| `sector` | string |
| `subSector` | string |
| `headQuarter` | string |
| `dateFirstAdded` | string |
| `cik` | string |
| `founded` | string |

Sample:

```json
[
  {
    "symbol": "NVDA",
    "name": "Nvidia",
    "sector": "Technology",
    "subSector": "Semiconductors",
    "headQuarter": "Santa Clara, CA",
    "dateFirstAdded": "2024-11-08",
    "cik": "0001045810",
    "founded": "1993-04-05"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/dow-jones

### Historical S&P 500 API

Retrieve historical data for the S&P 500 index using the Historical S&P 500 API. Analyze past changes in the index, including additions and removals of companies, to understand trends and performance over time.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-sp500-constituent`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `dateAdded` | string |
| `addedSecurity` | string |
| `removedTicker` | string |
| `removedSecurity` | string |
| `date` | string |
| `symbol` | string |
| `reason` | string |

Sample:

```json
[
  {
    "dateAdded": "March 23, 2026",
    "addedSecurity": "EchoStar Corporation",
    "removedTicker": "PAYC",
    "removedSecurity": "Paycom Software",
    "date": "2026-03-23",
    "symbol": "SATS",
    "reason": "Market capitalization change."
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/historical-sp-500

### Historical Nasdaq API

Access historical data for the Nasdaq index using the Historical Nasdaq API. Analyze changes in the index composition and view how it has evolved over time, including company additions and removals.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-nasdaq-constituent`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `dateAdded` | string |
| `addedSecurity` | string |
| `removedTicker` | string |
| `removedSecurity` | string |
| `date` | string |
| `symbol` | string |
| `reason` | string |

Sample:

```json
[
  {
    "dateAdded": "January 20, 2026",
    "addedSecurity": "Walmart",
    "removedTicker": "AZN",
    "removedSecurity": "AstraZeneca",
    "date": "2026-01-19",
    "symbol": "WMT",
    "reason": "Walmart transferred its listing from NYSE to NASDAQ and replaced AstraZeneca in the index"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/historical-nasdaq

### Historical Dow Jones API

Access historical data for the Dow Jones Industrial Average using the Historical Dow Jones API. Analyze changes in the indexâs composition and study its performance across different periods.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-dowjones-constituent`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `dateAdded` | string |
| `addedSecurity` | string |
| `removedTicker` | string |
| `removedSecurity` | string |
| `date` | string |
| `symbol` | string |
| `reason` | string |

Sample:

```json
[
  {
    "dateAdded": "November 8, 2024",
    "addedSecurity": "Nvidia",
    "removedTicker": "INTC",
    "removedSecurity": "Intel Corporation",
    "date": "2024-11-07",
    "symbol": "NVDA",
    "reason": "Market capitalization change"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/historical-dow-jones
