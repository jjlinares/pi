# FMP API Group: Forex

Source: https://site.financialmodelingprep.com/developer/docs#forex

Endpoints: 9

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Forex Currency Pairs API

Access a comprehensive list of all currency pairs traded on the forex market with the FMP Forex Currency Pairs API. Analyze and track the performance of currency pairs to make informed investment decisions.

**Endpoint**

`GET https://financialmodelingprep.com/stable/forex-list`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `fromCurrency` | string |
| `toCurrency` | string |
| `fromName` | string |
| `toName` | string |

Sample:

```json
[
  {
    "symbol": "ARSMXN",
    "fromCurrency": "ARS",
    "toCurrency": "MXN",
    "fromName": "Argentine Peso",
    "toName": "Mexican Peso"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/forex-list

### Forex Quote API

Access real-time forex quotes for currency pairs with the Forex Quote API. Retrieve up-to-date information on exchange rates and price changes to help monitor market movements.

**Endpoint**

`GET https://financialmodelingprep.com/stable/quote?symbol=EURUSD`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | EURUSD |

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
    "symbol": "EURUSD",
    "name": "EUR/USD",
    "price": 1.17598,
    "changePercentage": -0.14754,
    "change": -0.0017376,
    "volume": 184065,
    "dayLow": 1.17371,
    "dayHigh": 1.17911,
    "yearHigh": 1.18303,
    "yearLow": 1.01838,
    "marketCap": null,
    "priceAvg50": 1.15244,
    "priceAvg200": 1.08866,
    "exchange": "FOREX",
    "open": 1.17744,
    "previousClose": 1.17772,
    "timestamp": 1753374603
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/forex-quote

### Forex Short Quote API

Quickly access concise forex pair quotes with the Forex Quote Snapshot API. Get a fast look at live currency exchange rates, price changes, and volume in real time.

**Endpoint**

`GET https://financialmodelingprep.com/stable/quote-short?symbol=EURUSD`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | EURUSD |

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
    "symbol": "EURUSD",
    "price": 1.17598,
    "change": -0.0017376,
    "volume": 184065
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/forex-quote-short

### Batch Forex Quotes API

Easily access real-time quotes for multiple forex pairs simultaneously with the Batch Forex Quotes API. Stay updated on global currency exchange rates and monitor price changes across different markets.

**Endpoint**

`GET https://financialmodelingprep.com/stable/batch-forex-quotes`

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
    "symbol": "AEDAUD",
    "price": 0.41372,
    "change": 0.00153892,
    "volume": 0
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/all-forex-quotes

### Historical Forex Light Chart API

Access historical end-of-day forex prices with the Historical Forex Light Chart API. Track long-term price trends across different currency pairs to enhance your trading and analysis strategies.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=EURUSD`

Note: maximum `5000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | EURUSD |
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
    "symbol": "EURUSD",
    "date": "2025-07-24",
    "price": 1.17639,
    "volume": 182290
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/forex-historical-price-eod-light

### Historical Forex Full Chart API

Access comprehensive historical end-of-day forex price data with the Full Historical Forex Chart API. Gain detailed insights into currency pair movements, including open, high, low, close (OHLC) prices, volume, and percentage changes.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=EURUSD`

Note: maximum `5000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | EURUSD |
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
    "symbol": "EURUSD",
    "date": "2025-07-24",
    "open": 1.17744,
    "high": 1.17911,
    "low": 1.17371,
    "close": 1.17639,
    "volume": 182290,
    "change": -0.00105,
    "changePercent": -0.08917652,
    "vwap": 1.18
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/forex-historical-price-eod-full

### 1-Minute Interval Forex Chart API

Access real-time 1-minute intraday forex data with the 1-Minute Forex Interval Chart API. Track short-term price movements for precise, up-to-the-minute insights on currency pair fluctuations.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/1min?symbol=EURUSD`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | EURUSD |
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
    "date": "2025-07-24 12:29:00",
    "open": 1.17582,
    "low": 1.17582,
    "high": 1.17599,
    "close": 1.17598,
    "volume": 184
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/forex-intraday-1-min

### 5-Minute Interval Forex Chart API

Track short-term forex trends with the 5-Minute Forex Interval Chart API. Access detailed 5-minute intraday data to monitor currency pair price movements and market conditions in near real-time.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/5min?symbol=EURUSD`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | EURUSD |
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
    "date": "2025-07-24 12:25:00",
    "open": 1.17612,
    "low": 1.17571,
    "high": 1.17613,
    "close": 1.17578,
    "volume": 873
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/forex-intraday-5-min

### 1-Hour Interval Forex Chart API

Track forex price movements over the trading day with the 1-Hour Forex Interval Chart API. This tool provides hourly intraday data for currency pairs, giving a detailed view of trends and market shifts.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-chart/1hour?symbol=EURUSD`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | EURUSD |
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
    "date": "2025-07-24 12:00:00",
    "open": 1.17639,
    "low": 1.17571,
    "high": 1.1773,
    "close": 1.17578,
    "volume": 4909
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/forex-intraday-1-hour
