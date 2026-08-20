# FMP API Group: Chart

Source: https://site.financialmodelingprep.com/developer/docs#chart

Endpoints: 10

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Stock Chart Light API

Access simplified stock chart data using the FMP Basic Stock Chart API. This API provides essential charting information, including date, price, and trading volume, making it ideal for tracking stock performance with minimal data and creating basic price and volume charts.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=AAPL`

Note: maximum `5000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
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
    "symbol": "AAPL",
    "date": "2025-02-04",
    "price": 232.8,
    "volume": 44489128
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/historical-price-eod-light

### Stock Price and Volume Data API

Access full price and volume data for any stock symbol using the FMP Comprehensive Stock Price and Volume Data API. Get detailed insights, including open, high, low, close prices, trading volume, price changes, percentage changes, and volume-weighted average price (VWAP).

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=AAPL`

Note: maximum `5000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
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
    "symbol": "AAPL",
    "date": "2025-02-04",
    "open": 227.2,
    "high": 233.13,
    "low": 226.65,
    "close": 232.8,
    "volume": 44489128,
    "change": 5.6,
    "changePercent": 2.46479,
    "vwap": 230.86
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/historical-price-eod-full

### Unadjusted Stock Price API

Access stock price and volume data without adjustments for stock splits with the FMP Unadjusted Stock Price Chart API. Get accurate insights into stock performance, including open, high, low, and close prices, along with trading volume, without split-related changes.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-price-eod/non-split-adjusted?symbol=AAPL`

Note: maximum `5000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| from | date | 2026-01-27 |
| to | date | 2026-04-27 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `adjOpen` | number |
| `adjHigh` | number |
| `adjLow` | number |
| `adjClose` | number |
| `volume` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "date": "2025-02-04",
    "adjOpen": 227.2,
    "adjHigh": 233.13,
    "adjLow": 226.65,
    "adjClose": 232.8,
    "volume": 44489128
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/historical-price-eod-non-split-adjusted

### Dividend Adjusted Price Chart API

Analyze stock performance with dividend adjustments using the FMP Dividend-Adjusted Price Chart API. Access end-of-day price and volume data that accounts for dividend payouts, offering a more comprehensive view of stock trends over time.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-price-eod/dividend-adjusted?symbol=AAPL`

Note: maximum `5000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| from | date | 2026-01-27 |
| to | date | 2026-04-27 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `adjOpen` | number |
| `adjHigh` | number |
| `adjLow` | number |
| `adjClose` | number |
| `volume` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "date": "2025-02-04",
    "adjOpen": 227.2,
    "adjHigh": 233.13,
    "adjLow": 226.65,
    "adjClose": 232.8,
    "volume": 44489128
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/historical-price-eod-dividend-adjusted

### 1 Min Interval Stock Chart API

Access precise intraday stock price and volume data with the FMP 1-Minute Interval Stock Chart API. Retrieve real-time or historical stock data in 1-minute intervals, including key information such as open, high, low, and close prices, and trading volume for each minute.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/1min?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| from | date | 2024-01-01 |
| to | date | 2024-03-01 |
| nonadjusted | boolean | false |

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
    "date": "2025-02-04 15:59:00",
    "open": 233.01,
    "low": 232.72,
    "high": 233.13,
    "close": 232.79,
    "volume": 720121
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/intraday-1-min

### 5 Min Interval Stock Chart API

Access stock price and volume data with the FMP 5-Minute Interval Stock Chart API. Retrieve detailed stock data in 5-minute intervals, including open, high, low, and close prices, along with trading volume for each 5-minute period. This API is perfect for short-term trading analysis and building intraday charts.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/5min?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| from | date | 2024-01-01 |
| to | date | 2024-03-01 |
| nonadjusted | boolean | false |

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
    "date": "2025-02-04 15:55:00",
    "open": 232.87,
    "low": 232.72,
    "high": 233.13,
    "close": 232.79,
    "volume": 1555040
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/intraday-5-min

### 15 Min Interval Stock Chart API

Access stock price and volume data with the FMP 15-Minute Interval Stock Chart API. Retrieve detailed stock data in 15-minute intervals, including open, high, low, close prices, and trading volume. This API is ideal for creating intraday charts and analyzing medium-term price trends during the trading day.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/15min?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| from | date | 2024-01-01 |
| to | date | 2024-03-01 |
| nonadjusted | boolean | false |

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
    "date": "2025-02-04 15:45:00",
    "open": 232.25,
    "low": 232.18,
    "high": 233.13,
    "close": 232.79,
    "volume": 2535629
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/intraday-15-min

### 30 Min Interval Stock Chart API

Access stock price and volume data with the FMP 30-Minute Interval Stock Chart API. Retrieve essential stock data in 30-minute intervals, including open, high, low, close prices, and trading volume. This API is perfect for creating intraday charts and tracking medium-term price movements for more strategic trading decisions.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/30min?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| from | date | 2024-01-01 |
| to | date | 2024-03-01 |
| nonadjusted | boolean | false |

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
    "date": "2025-02-04 15:30:00",
    "open": 232.29,
    "low": 232.01,
    "high": 233.13,
    "close": 232.79,
    "volume": 3476320
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/intraday-30-min

### 1 Hour Interval Stock Chart API

Track stock price movements over hourly intervals with the FMP 1-Hour Interval Stock Chart API. Access essential stock price and volume data, including open, high, low, and close prices for each hour, to analyze broader intraday trends with precision.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/1hour?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| from | date | 2024-01-01 |
| to | date | 2024-03-01 |
| nonadjusted | boolean | false |

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
    "date": "2025-02-04 15:30:00",
    "open": 232.29,
    "low": 232.01,
    "high": 233.13,
    "close": 232.37,
    "volume": 15079381
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/intraday-1-hour

### 4 Hour Interval Stock Chart API

Analyze stock price movements over extended intraday periods with the FMP 4-Hour Interval Stock Chart API. Access key stock price and volume data in 4-hour intervals, perfect for tracking longer intraday trends and understanding broader market movements.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/4hour?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| from | date | 2024-01-01 |
| to | date | 2024-03-01 |
| nonadjusted | boolean | false |

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
    "date": "2025-02-04 12:30:00",
    "open": 231.79,
    "low": 231.37,
    "high": 233.13,
    "close": 232.37,
    "volume": 23781913
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/intraday-4-hour
