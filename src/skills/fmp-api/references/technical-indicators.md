# FMP API Group: Technical Indicators

Source: https://site.financialmodelingprep.com/developer/docs#technical-indicators

Endpoints: 9

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Simple Moving Average API

**Endpoint**

`GET https://financialmodelingprep.com/stable/technical-indicators/sma?symbol=AAPL&periodLength=10&timeframe=1day`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| periodLength* | number | 10 |
| timeframe* | string | `1min`, `5min`, `15min`, `30min`, `1hour`, `4hour`, `1day` |
| from | date | 2026-01-08 |
| to | date | 2026-04-08 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `open` | number |
| `high` | number |
| `low` | number |
| `close` | number |
| `volume` | integer |
| `sma` | number |

Sample:

```json
[
  {
    "date": "2026-04-08 00:00:00",
    "open": 258.45,
    "high": 259.75,
    "low": 256.53,
    "close": 258.9,
    "volume": 39655304,
    "sma": 253.754
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/simple-moving-average

### Exponential Moving Average API

**Endpoint**

`GET https://financialmodelingprep.com/stable/technical-indicators/ema?symbol=AAPL&periodLength=10&timeframe=1day`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| periodLength* | number | 10 |
| timeframe* | string | `1min`, `5min`, `15min`, `30min`, `1hour`, `4hour`, `1day` |
| from | date | 2026-01-08 |
| to | date | 2026-04-08 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `open` | number |
| `high` | number |
| `low` | number |
| `close` | number |
| `volume` | integer |
| `ema` | number |

Sample:

```json
[
  {
    "date": "2026-04-08 00:00:00",
    "open": 258.45,
    "high": 259.75,
    "low": 256.53,
    "close": 258.9,
    "volume": 39655304,
    "ema": 254.84409682340092
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/exponential-moving-average

### Weighted Moving Average API

**Endpoint**

`GET https://financialmodelingprep.com/stable/technical-indicators/wma?symbol=AAPL&periodLength=10&timeframe=1day`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| periodLength* | number | 10 |
| timeframe* | string | `1min`, `5min`, `15min`, `30min`, `1hour`, `4hour`, `1day` |
| from | date | 2026-01-08 |
| to | date | 2026-04-08 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `open` | number |
| `high` | number |
| `low` | number |
| `close` | number |
| `volume` | integer |
| `wma` | number |

Sample:

```json
[
  {
    "date": "2026-04-08 00:00:00",
    "open": 258.45,
    "high": 259.75,
    "low": 256.53,
    "close": 258.9,
    "volume": 39655304,
    "wma": 255.03400000000005
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/weighted-moving-average

### Double Exponential Moving Average API

**Endpoint**

`GET https://financialmodelingprep.com/stable/technical-indicators/dema?symbol=AAPL&periodLength=10&timeframe=1day`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| periodLength* | number | 10 |
| timeframe* | string | `1min`, `5min`, `15min`, `30min`, `1hour`, `4hour`, `1day` |
| from | date | 2026-01-08 |
| to | date | 2026-04-08 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `open` | number |
| `high` | number |
| `low` | number |
| `close` | number |
| `volume` | integer |
| `dema` | number |

Sample:

```json
[
  {
    "date": "2026-04-08 00:00:00",
    "open": 258.45,
    "high": 259.75,
    "low": 256.53,
    "close": 258.9,
    "volume": 39655304,
    "dema": 255.93918344492874
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/double-exponential-moving-average

### Triple Exponential Moving Average API

**Endpoint**

`GET https://financialmodelingprep.com/stable/technical-indicators/tema?symbol=AAPL&periodLength=10&timeframe=1day`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| periodLength* | number | 10 |
| timeframe* | string | `1min`, `5min`, `15min`, `30min`, `1hour`, `4hour`, `1day` |
| from | date | 2026-01-08 |
| to | date | 2026-04-08 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `open` | number |
| `high` | number |
| `low` | number |
| `close` | number |
| `volume` | integer |
| `tema` | number |

Sample:

```json
[
  {
    "date": "2026-04-08 00:00:00",
    "open": 258.45,
    "high": 259.75,
    "low": 256.53,
    "close": 258.9,
    "volume": 39655304,
    "tema": 257.8714144716564
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/triple-exponential-moving-average

### Relative Strength Index API

**Endpoint**

`GET https://financialmodelingprep.com/stable/technical-indicators/rsi?symbol=AAPL&periodLength=10&timeframe=1day`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| periodLength* | number | 10 |
| timeframe* | string | `1min`, `5min`, `15min`, `30min`, `1hour`, `4hour`, `1day` |
| from | date | 2026-01-08 |
| to | date | 2026-04-08 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `open` | number |
| `high` | number |
| `low` | number |
| `close` | number |
| `volume` | integer |
| `rsi` | number |

Sample:

```json
[
  {
    "date": "2026-04-08 00:00:00",
    "open": 258.45,
    "high": 259.75,
    "low": 256.53,
    "close": 258.9,
    "volume": 39655304,
    "rsi": 57.094104905869884
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/relative-strength-index

### Standard Deviation API

**Endpoint**

`GET https://financialmodelingprep.com/stable/technical-indicators/standarddeviation?symbol=AAPL&periodLength=10&timeframe=1day`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| periodLength* | number | 10 |
| timeframe* | string | `1min`, `5min`, `15min`, `30min`, `1hour`, `4hour`, `1day` |
| from | date | 2026-01-08 |
| to | date | 2026-04-08 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `open` | number |
| `high` | number |
| `low` | number |
| `close` | number |
| `volume` | integer |
| `standardDeviation` | number |

Sample:

```json
[
  {
    "date": "2026-04-08 00:00:00",
    "open": 258.45,
    "high": 259.75,
    "low": 256.53,
    "close": 258.9,
    "volume": 39655304,
    "standardDeviation": 3.716923997070693
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/standard-deviation

### Williams API

**Endpoint**

`GET https://financialmodelingprep.com/stable/technical-indicators/williams?symbol=AAPL&periodLength=10&timeframe=1day`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| periodLength* | number | 10 |
| timeframe* | string | `1min`, `5min`, `15min`, `30min`, `1hour`, `4hour`, `1day` |
| from | date | 2026-01-08 |
| to | date | 2026-04-08 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `open` | number |
| `high` | number |
| `low` | number |
| `close` | number |
| `volume` | integer |
| `williams` | number |

Sample:

```json
[
  {
    "date": "2026-04-08 00:00:00",
    "open": 258.45,
    "high": 259.75,
    "low": 256.53,
    "close": 258.9,
    "volume": 39655304,
    "williams": -19.579579579579825
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/williams

### Average Directional Index API

**Endpoint**

`GET https://financialmodelingprep.com/stable/technical-indicators/adx?symbol=AAPL&periodLength=10&timeframe=1day`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| periodLength* | number | 10 |
| timeframe* | string | `1min`, `5min`, `15min`, `30min`, `1hour`, `4hour`, `1day` |
| from | date | 2026-01-08 |
| to | date | 2026-04-08 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `open` | number |
| `high` | number |
| `low` | number |
| `close` | number |
| `volume` | integer |
| `adx` | number |

Sample:

```json
[
  {
    "date": "2026-04-08 00:00:00",
    "open": 258.45,
    "high": 259.75,
    "low": 256.53,
    "close": 258.9,
    "volume": 39655304,
    "adx": 19.958386928035946
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/average-directional-index
