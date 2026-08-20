# FMP API Group: Crypto

Source: https://site.financialmodelingprep.com/developer/docs#crypto

Endpoints: 9

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Cryptocurrency List API

Access a comprehensive list of all cryptocurrencies traded on exchanges worldwide with the FMP Cryptocurrencies Overview API. Get detailed information on each cryptocurrency to inform your investment strategies.

**Endpoint**

`GET https://financialmodelingprep.com/stable/cryptocurrency-list`

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
| `icoDate` | string |
| `circulatingSupply` | integer |
| `totalSupply` | null |

Sample:

```json
[
  {
    "symbol": "ALIENUSD",
    "name": "Alien Inu USD",
    "exchange": "CCC",
    "icoDate": "2021-11-22",
    "circulatingSupply": 0,
    "totalSupply": null
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cryptocurrency-list

### Full Cryptocurrency Quote API

Access real-time quotes for all cryptocurrencies with the FMP Full Cryptocurrency Quote API. Obtain comprehensive price data including current, high, low, and open prices.

**Endpoint**

`GET https://financialmodelingprep.com/stable/quote?symbol=BTCUSD`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | BTCUSD |

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
    "symbol": "BTCUSD",
    "name": "Bitcoin USD",
    "price": 118741.16,
    "changePercentage": -0.03193323,
    "change": -37.93,
    "volume": 75302985728,
    "dayLow": 117435.22,
    "dayHigh": 119535.45,
    "yearHigh": 123091.61,
    "yearLow": 49121.24,
    "marketCap": 2344693699320,
    "priceAvg50": 109824.32,
    "priceAvg200": 98161.086,
    "exchange": "CRYPTO",
    "open": 118779.09,
    "previousClose": 118779.09,
    "timestamp": 1753374602
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cryptocurrency-quote

### Cryptocurrency Quote Short API

Access real-time cryptocurrency quotes with the FMP Cryptocurrency Quick Quote API. Get a concise overview of current crypto prices, changes, and trading volume for a wide range of digital assets.

**Endpoint**

`GET https://financialmodelingprep.com/stable/quote-short?symbol=BTCUSD`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | BTCUSD |

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
    "symbol": "BTCUSD",
    "price": 118741.16,
    "change": -37.93,
    "volume": 75302985728
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cryptocurrency-quote-short

### All Cryptocurrencies Quotes API

Access live price data for a wide range of cryptocurrencies with the FMP Real-Time Cryptocurrency Batch Quotes API. Get real-time updates on prices, market changes, and trading volumes for digital assets in a single request.

**Endpoint**

`GET https://financialmodelingprep.com/stable/batch-crypto-quotes`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| short | boolean | true |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `change` | number |
| `volume` | number |

Sample:

```json
[
  {
    "symbol": "00USD",
    "price": 0.01755108,
    "change": 0.00035108,
    "volume": 3719492.41
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/all-cryptocurrency-quotes

### Historical Cryptocurrency Light Chart API

Access historical end-of-day prices for a variety of cryptocurrencies with the Historical Cryptocurrency Price Snapshot API. Track trends in price and trading volume over time to better understand market behavior.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=BTCUSD`

Note: maximum `5000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | BTCUSD |
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
    "symbol": "BTCUSD",
    "date": "2025-07-24",
    "price": 118741.16,
    "volume": 75302985728
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cryptocurrency-historical-price-eod-light

### Historical Cryptocurrency Full Chart API

Access comprehensive end-of-day (EOD) price data for cryptocurrencies with the Full Historical Cryptocurrency Data API. Analyze long-term price trends, market movements, and trading volumes to inform strategic decisions.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=BTCUSD`

Note: maximum `5000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | BTCUSD |
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
    "symbol": "BTCUSD",
    "date": "2025-07-24",
    "open": 118779.09,
    "high": 119535.45,
    "low": 117435.22,
    "close": 118741.16,
    "volume": 75302985728,
    "change": -37.93,
    "changePercent": -0.03193323,
    "vwap": 118570.61
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cryptocurrency-historical-price-eod-full

### 1-Minute Interval Cryptocurrency Data API

Get real-time, 1-minute interval price data for cryptocurrencies with the 1-Minute Cryptocurrency Intraday Data API. Monitor short-term price fluctuations and trading volume to stay updated on market movements.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/1min?symbol=BTCUSD`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | BTCUSD |
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
| `volume` | number |

Sample:

```json
[
  {
    "date": "2025-07-24 12:29:00",
    "open": 118797.96,
    "low": 118760.42,
    "high": 118818.11,
    "close": 118784.04,
    "volume": 52293740.08888889
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cryptocurrency-intraday-1-min

### 5-Minute Interval Cryptocurrency Data API

Analyze short-term price trends with the 5-Minute Interval Cryptocurrency Data API. Access real-time, intraday price data for cryptocurrencies to monitor rapid market movements and optimize trading strategies.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/5min?symbol=BTCUSD`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | BTCUSD |
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
| `volume` | number |

Sample:

```json
[
  {
    "date": "2025-07-24 12:25:00",
    "open": 118988.32,
    "low": 118797.03,
    "high": 118997.22,
    "close": 118797.03,
    "volume": 208601161.95555556
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cryptocurrency-intraday-5-min

### 1-Hour Interval Cryptocurrency Data API

Access detailed 1-hour intraday price data for cryptocurrencies with the 1-Hour Interval Cryptocurrency Data API. Track hourly price movements to gain insights into market trends and make informed trading decisions throughout the day.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/1hour?symbol=BTCUSD`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | BTCUSD |
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
| `volume` | number |

Sample:

```json
[
  {
    "date": "2025-07-24 12:00:00",
    "open": 119189.36,
    "low": 118768.68,
    "high": 119272.88,
    "close": 118797.03,
    "volume": 1493617925.6888888
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cryptocurrency-intraday-1-hour
