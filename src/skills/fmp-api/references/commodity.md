# FMP API Group: Commodity

Source: https://site.financialmodelingprep.com/developer/docs#commodity

Endpoints: 9

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Commodities List API

Access an extensive list of tracked commodities across various sectors, including energy, metals, and agricultural products. The FMP Commodities List API provides essential data on tradable commodities, giving investors the ability to explore market options.

**Endpoint**

`GET https://financialmodelingprep.com/stable/commodities-list`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `name` | string |
| `exchange` | null |
| `tradeMonth` | string |
| `currency` | string |

Sample:

```json
[
  {
    "symbol": "HEUSX",
    "name": "Lean Hogs Futures",
    "exchange": null,
    "tradeMonth": "Dec",
    "currency": "USX"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/commodities-list

### Commodities Quote API

Access price quotes for all commodities traded worldwide with the FMP Global Commodities API. Track market movements and identify investment opportunities with comprehensive price data.

**Endpoint**

`GET https://financialmodelingprep.com/stable/quote?symbol=GCUSD`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | GCUSD |

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
| `marketCap` | null |
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
    "symbol": "GCUSD",
    "name": "Gold Futures",
    "price": 3375.3,
    "changePercentage": -0.65635,
    "change": -22.3,
    "volume": 170936,
    "dayLow": 3355.2,
    "dayHigh": 3401.1,
    "yearHigh": 3509.9,
    "yearLow": 2354.6,
    "marketCap": null,
    "priceAvg50": 3358.706,
    "priceAvg200": 3054.501,
    "exchange": "COMMODITY",
    "open": 3398.6,
    "previousClose": 3397.6,
    "timestamp": 1753372205
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/commodities-quote

### Commodities Quote Short API

Get fast and accurate quotes for commodities with the FMP Commodities Quick Quote API. Instantly access the current price, recent changes, and trading volume for various commodities.

**Endpoint**

`GET https://financialmodelingprep.com/stable/quote-short?symbol=GCUSD`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | GCUSD |

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
    "symbol": "GCUSD",
    "price": 3375.3,
    "change": -22.3,
    "volume": 170936
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/commodities-quote-short

### All Commodities Quotes API

Access quotes for multiple commodities at once with the FMP Batch Commodities Quotes API. Instantly track price changes, volume, and other key metrics for a broad range of commodities.

**Endpoint**

`GET https://financialmodelingprep.com/stable/batch-commodity-quotes`

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
| `volume` | integer |

Sample:

```json
[
  {
    "symbol": "DCUSD",
    "price": 17.18,
    "change": -0.21,
    "volume": 284
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/all-commodities-quotes

### Light Chart API

Access historical end-of-day prices for various commodities with the FMP Historical Commodities Price API. Analyze past price movements, trading volume, and trends to support informed decision-making.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=GCUSD`

Note: maximum `5000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | GCUSD |
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
    "symbol": "GCUSD",
    "date": "2025-07-24",
    "price": 3373.8,
    "volume": 174758
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/commodities-historical-price-eod-light

### Full Chart API

Access full historical end-of-day price data for commodities with the FMP Comprehensive Commodities Price API. This API enables users to analyze long-term price trends, patterns, and market movements in great detail.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=GCUSD`

Note: maximum `5000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | GCUSD |
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
    "symbol": "GCUSD",
    "date": "2025-07-24",
    "open": 3398.6,
    "high": 3401.1,
    "low": 3355.2,
    "close": 3373.8,
    "volume": 174758,
    "change": -24.8,
    "changePercent": -0.72971223,
    "vwap": 3376.7
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/commodities-historical-price-eod-full

### 1-Minute Interval Commodities Chart API

Track short-term price movements for commodities with the FMP 1-Minute Interval Commodities Chart API. This API provides detailed 1-minute interval data, enabling precise monitoring of intraday market changes.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/1min?symbol=GCUSD`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | GCUSD |
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
| `close` | integer |
| `volume` | integer |

Sample:

```json
[
  {
    "date": "2025-07-24 12:18:00",
    "open": 3374.5,
    "low": 3373.7,
    "high": 3374.5,
    "close": 3374,
    "volume": 123
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/commodities-intraday-1-min

### 5-Minute Interval Commodities Chart API

Monitor short-term price movements with the FMP 5-Minute Interval Commodities Chart API. This API provides detailed 5-minute interval data, enabling users to track near-term price trends for more strategic trading and investment decisions.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/5min?symbol=GCUSD`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | GCUSD |
| from | date | 2024-01-01 |
| to | date | 2024-03-01 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `open` | integer |
| `low` | integer |
| `high` | number |
| `close` | number |
| `volume` | integer |

Sample:

```json
[
  {
    "date": "2025-07-24 12:15:00",
    "open": 3374,
    "low": 3374,
    "high": 3374.8,
    "close": 3374.4,
    "volume": 193
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/commodities-intraday-5-min

### 1-Hour Interval Commodities Chart API

Monitor hourly price movements and trends with the FMP 1-Hour Interval Commodities Chart API. This API provides hourly data, offering a detailed look at price fluctuations throughout the trading day to support mid-term trading strategies and market analysis.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/1hour?symbol=GCUSD`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | GCUSD |
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
    "date": "2025-07-24 11:30:00",
    "open": 3378.4,
    "low": 3373.1,
    "high": 3378.8,
    "close": 3374.4,
    "volume": 7108
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/commodities-intraday-1-hour
