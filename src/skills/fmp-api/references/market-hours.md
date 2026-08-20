# FMP API Group: Market Hours

Source: https://site.financialmodelingprep.com/developer/docs#market-hours

Endpoints: 3

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Global Exchange Market Hours API

Retrieve trading hours for specific stock exchanges using the Global Exchange Market Hours API. Find out the opening and closing times of global exchanges to plan your trading strategies effectively.

**Endpoint**

`GET https://financialmodelingprep.com/stable/exchange-market-hours?exchange=NASDAQ`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| exchange* | string | NASDAQ |
| timestamp | string | 1769527402 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `exchange` | string |
| `name` | string |
| `openingHour` | string |
| `closingHour` | string |
| `timezone` | string |
| `isMarketOpen` | boolean |

Sample:

```json
[
  {
    "exchange": "NASDAQ",
    "name": "NASDAQ",
    "openingHour": "09:30 AM -04:00",
    "closingHour": "04:00 PM -04:00",
    "timezone": "America/New_York",
    "isMarketOpen": false
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/exchange-market-hours

### Holidays By Exchange API

Retrieve a list of market holidays and non-trading days for a specific stock exchange using the Holidays By Exchange API. Plan your trading schedule by knowing exactly when exchanges like NASDAQ, NYSE, and others are closed.

**Endpoint**

`GET https://financialmodelingprep.com/stable/holidays-by-exchange?exchange=NASDAQ`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| exchange* | string | NASDAQ |
| from | date | 2025-04-27 |
| to | date | 2026-04-27 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `exchange` | string |
| `date` | string |
| `name` | string |
| `isClosed` | boolean |
| `adjOpenTime` | null |
| `adjCloseTime` | null |

Sample:

```json
[
  {
    "exchange": "NASDAQ",
    "date": "2026-04-03",
    "name": "Good Friday",
    "isClosed": true,
    "adjOpenTime": null,
    "adjCloseTime": null
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/holidays-by-exchange

### All Exchange Market Hours API

View the market hours for all exchanges. Check when different markets are active.

**Endpoint**

`GET https://financialmodelingprep.com/stable/all-exchange-market-hours`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| timestamp | string | 1769527402 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `exchange` | string |
| `name` | string |
| `openingHour` | string |
| `closingHour` | string |
| `timezone` | string |
| `isMarketOpen` | boolean |

Sample:

```json
[
  {
    "exchange": "ASX",
    "name": "Australian Securities Exchange",
    "openingHour": "10:00 AM +10:00",
    "closingHour": "04:00 PM +10:00",
    "timezone": "Australia/Sydney",
    "isMarketOpen": true
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/all-exchange-market-hours
