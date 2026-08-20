# FMP API Group: Market Performance

Source: https://site.financialmodelingprep.com/developer/docs#market-performance

Endpoints: 11

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Market Sector Performance Snapshot API

Get a snapshot of sector performance using the Market Sector Performance Snapshot API. Analyze how different industries are performing in the market based on average changes across sectors.

**Endpoint**

`GET https://financialmodelingprep.com/stable/sector-performance-snapshot?date=2024-02-01`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| date* | string | 2024-02-01 |
| exchange | string | NASDAQ |
| sector | string | Energy |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `sector` | string |
| `exchange` | string |
| `averageChange` | number |

Sample:

```json
[
  {
    "date": "2024-02-01",
    "sector": "Basic Materials",
    "exchange": "NASDAQ",
    "averageChange": -0.31481377464310634
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/sector-performance-snapshot

### Industry Performance Snapshot API

Access detailed performance data by industry using the Industry Performance Snapshot API. Analyze trends, movements, and daily performance metrics for specific industries across various stock exchanges.

**Endpoint**

`GET https://financialmodelingprep.com/stable/industry-performance-snapshot?date=2024-02-01`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| date* | string | 2024-02-01 |
| exchange | string | NASDAQ |
| industry | string | Biotechnology |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `industry` | string |
| `exchange` | string |
| `averageChange` | number |

Sample:

```json
[
  {
    "date": "2024-02-01",
    "industry": "Advertising Agencies",
    "exchange": "NASDAQ",
    "averageChange": 3.8660194344955996
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/industry-performance-snapshot

### Historical Market Sector Performance API

Access historical sector performance data using the Historical Market Sector Performance API. Review how different sectors have performed over time across various stock exchanges.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-sector-performance?sector=Energy`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| from | string | 2024-02-01 |
| exchange | string | NASDAQ |
| sector* | string | Energy |
| to | string | 2024-03-01 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `sector` | string |
| `exchange` | string |
| `averageChange` | number |

Sample:

```json
[
  {
    "date": "2024-02-01",
    "sector": "Energy",
    "exchange": "NASDAQ",
    "averageChange": 0.6397534025664513
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/historical-sector-performance

### Historical Industry Performance API

Access historical performance data for industries using the Historical Industry Performance API. Track long-term trends and analyze how different industries have evolved over time across various stock exchanges.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-industry-performance?industry=Biotechnology`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| industry* | string | Biotechnology |
| exchange | string | NASDAQ |
| from | string | 2024-02-01 |
| to | string | 2024-03-01 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `industry` | string |
| `exchange` | string |
| `averageChange` | number |

Sample:

```json
[
  {
    "date": "2024-02-01",
    "industry": "Biotechnology",
    "exchange": "NASDAQ",
    "averageChange": 1.1479066960358322
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/historical-industry-performance

### Sector Pe Snapshot API

Retrieve the price-to-earnings (P/E) ratios for various sectors using the Sector P/E Snapshot API. Compare valuation levels across sectors to better understand market valuations.

**Endpoint**

`GET https://financialmodelingprep.com/stable/sector-pe-snapshot?date=2024-02-01`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| date* | string | 2024-02-01 |
| exchange | string | NASDAQ |
| sector | string | Energy |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `sector` | string |
| `exchange` | string |
| `pe` | number |

Sample:

```json
[
  {
    "date": "2024-02-01",
    "sector": "Basic Materials",
    "exchange": "NASDAQ",
    "pe": 15.687711758428254
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/sector-pe-snapshot

### Industry Pe Snapshot API

View price-to-earnings (P/E) ratios for different industries using the Industry P/E Snapshot API. Analyze valuation levels across various industries to understand how each is priced relative to its earnings.

**Endpoint**

`GET https://financialmodelingprep.com/stable/industry-pe-snapshot?date=2024-02-01`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| date* | string | 2024-02-01 |
| exchange | string | NASDAQ |
| industry | string | Biotechnology |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `industry` | string |
| `exchange` | string |
| `pe` | number |

Sample:

```json
[
  {
    "date": "2024-02-01",
    "industry": "Advertising Agencies",
    "exchange": "NASDAQ",
    "pe": 71.09601665201151
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/industry-pe-snapshot

### Historical Sector PE API

Access historical price-to-earnings (P/E) ratios for various sectors using the Historical Sector P/E API. Analyze how sector valuations have evolved over time to understand long-term trends and market shifts.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-sector-pe?sector=Energy`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| from | string | 2024-02-01 |
| exchange | string | NASDAQ |
| sector* | string | Energy |
| to | string | 2024-03-01 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `sector` | string |
| `exchange` | string |
| `pe` | number |

Sample:

```json
[
  {
    "date": "2024-02-01",
    "sector": "Energy",
    "exchange": "NASDAQ",
    "pe": 14.411400922841464
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/historical-sector-pe

### Historical Industry PE API

Access historical price-to-earnings (P/E) ratios by industry using the Historical Industry P/E API. Track valuation trends across various industries to understand how market sentiment and valuations have evolved over time.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-industry-pe?industry=Biotechnology`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| industry* | string | Biotechnology |
| exchange | string | NASDAQ |
| from | string | 2024-02-01 |
| to | string | 2024-03-01 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `industry` | string |
| `exchange` | string |
| `pe` | number |

Sample:

```json
[
  {
    "date": "2024-02-01",
    "industry": "Biotechnology",
    "exchange": "NASDAQ",
    "pe": 10.181600321811821
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/historical-industry-pe

### Biggest Stock Gainers API

Track the stocks with the largest price increases using the Top Stock Gainers API. Identify the companies that are leading the market with significant price surges, offering potential growth opportunities.

**Endpoint**

`GET https://financialmodelingprep.com/stable/biggest-gainers`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `name` | string |
| `change` | number |
| `changesPercentage` | number |
| `exchange` | string |

Sample:

```json
[
  {
    "symbol": "LTRY",
    "price": 0.5876,
    "name": "Lottery.com Inc.",
    "change": 0.2756,
    "changesPercentage": 88.3333,
    "exchange": "NASDAQ"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/biggest-gainers

### Biggest Stock Losers API

Access data on the stocks with the largest price drops using the Biggest Stock Losers API. Identify companies experiencing significant declines and track the stocks that are falling the fastest in the market.

**Endpoint**

`GET https://financialmodelingprep.com/stable/biggest-losers`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `name` | string |
| `change` | number |
| `changesPercentage` | integer |
| `exchange` | string |

Sample:

```json
[
  {
    "symbol": "IDEX",
    "price": 0.0021,
    "name": "Ideanomics, Inc.",
    "change": -0.0029,
    "changesPercentage": -58,
    "exchange": "NASDAQ"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/biggest-losers

### Top Traded Stocks API

View the most actively traded stocks using the Top Traded Stocks API. Identify the companies experiencing the highest trading volumes in the market and track where the most trading activity is happening.

**Endpoint**

`GET https://financialmodelingprep.com/stable/most-actives`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `name` | string |
| `change` | number |
| `changesPercentage` | number |
| `exchange` | string |

Sample:

```json
[
  {
    "symbol": "LUCY",
    "price": 5.03,
    "name": "Innovative Eyewear, Inc.",
    "change": -0.01,
    "changesPercentage": -0.1984,
    "exchange": "NASDAQ"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/most-active
