# FMP API Group: Calendar

Source: https://site.financialmodelingprep.com/developer/docs#calendar

Endpoints: 9

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Dividends Company API

Stay informed about upcoming dividend payments with the FMP Dividends Company API. This API provides essential dividend data for individual stock symbols, including record dates, payment dates, declaration dates, and more.

**Endpoint**

`GET https://financialmodelingprep.com/stable/dividends?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 100 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `recordDate` | string |
| `paymentDate` | string |
| `declarationDate` | string |
| `adjDividend` | number |
| `dividend` | number |
| `yield` | number |
| `frequency` | string |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "date": "2025-02-10",
    "recordDate": "2025-02-10",
    "paymentDate": "2025-02-13",
    "declarationDate": "2025-01-30",
    "adjDividend": 0.25,
    "dividend": 0.25,
    "yield": 0.42955326460481097,
    "frequency": "Quarterly"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/dividends-company

### Dividends Calendar API

Stay informed on upcoming dividend events with the Dividend Events Calendar API. Access a comprehensive schedule of dividend-related dates for all stocks, including record dates, payment dates, declaration dates, and dividend yields.

**Endpoint**

`GET https://financialmodelingprep.com/stable/dividends-calendar`

Note: maximum `4000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| from | date | 2026-01-27 |
| to | date | 2026-04-27 |
| page | number | 0 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `recordDate` | string |
| `paymentDate` | string |
| `declarationDate` | string |
| `adjDividend` | number |
| `dividend` | number |
| `yield` | number |
| `frequency` | string |

Sample:

```json
[
  {
    "symbol": "1D0.SI",
    "date": "2025-02-04",
    "recordDate": "",
    "paymentDate": "",
    "declarationDate": "",
    "adjDividend": 0.01,
    "dividend": 0.01,
    "yield": 6.25,
    "frequency": "Semi-Annual"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/dividends-calendar

### Earnings Report API

Retrieve in-depth earnings information with the FMP Earnings Report API. Gain access to key financial data for a specific stock symbol, including earnings report dates, EPS estimates, and revenue projections to help you stay on top of company performance.

**Endpoint**

`GET https://financialmodelingprep.com/stable/earnings?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 100 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `epsActual` | null |
| `epsEstimated` | null |
| `revenueActual` | null |
| `revenueEstimated` | null |
| `lastUpdated` | string |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "date": "2025-10-29",
    "epsActual": null,
    "epsEstimated": null,
    "revenueActual": null,
    "revenueEstimated": null,
    "lastUpdated": "2025-02-04"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/earnings-company

### Earnings Calendar API

Stay informed on upcoming and past earnings announcements with the FMP Earnings Calendar API. Access key data, including announcement dates, estimated earnings per share (EPS), and actual EPS for publicly traded companies.

**Endpoint**

`GET https://financialmodelingprep.com/stable/earnings-calendar`

Note: maximum `4000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| from | date | 2026-01-27 |
| to | date | 2026-04-27 |
| page | number | 0 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `epsActual` | number |
| `epsEstimated` | number |
| `revenueActual` | integer |
| `revenueEstimated` | integer |
| `lastUpdated` | string |

Sample:

```json
[
  {
    "symbol": "KEC.NS",
    "date": "2024-11-04",
    "epsActual": 3.32,
    "epsEstimated": 4.97,
    "revenueActual": 51133100000,
    "revenueEstimated": 44687400000,
    "lastUpdated": "2024-12-08"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/earnings-calendar

### IPOs Calendar API

Access a comprehensive list of all upcoming initial public offerings (IPOs) with the FMP IPO Calendar API. Stay up to date on the latest companies entering the public market, with essential details on IPO dates, company names, expected pricing, and exchange listings.

**Endpoint**

`GET https://financialmodelingprep.com/stable/ipos-calendar`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| from | date | 2026-01-27 |
| to | date | 2026-04-27 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `daa` | string |
| `company` | string |
| `exchange` | string |
| `actions` | string |
| `shares` | null |
| `priceRange` | null |
| `marketCap` | null |

Sample:

```json
[
  {
    "symbol": "PEVC",
    "date": "2025-02-03",
    "daa": "2025-02-03T05:00:00.000Z",
    "company": "Pacer Funds Trust",
    "exchange": "NYSE",
    "actions": "Expected",
    "shares": null,
    "priceRange": null,
    "marketCap": null
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/ipos-calendar

### IPOs Disclosure API

Access a comprehensive list of disclosure filings for upcoming initial public offerings (IPOs) with the FMP IPO Disclosures API. Stay updated on regulatory filings, including filing dates, effectiveness dates, CIK numbers, and form types, with direct links to official SEC documents.

**Endpoint**

`GET https://financialmodelingprep.com/stable/ipos-disclosure`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| from | date | 2026-01-27 |
| to | date | 2026-04-27 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `filingDate` | string |
| `acceptedDate` | string |
| `effectivenessDate` | string |
| `cik` | string |
| `form` | string |
| `url` | string |

Sample:

```json
[
  {
    "symbol": "SCHM",
    "filingDate": "2025-02-03",
    "acceptedDate": "2025-02-03",
    "effectivenessDate": "2025-02-03",
    "cik": "0001454889",
    "form": "CERT",
    "url": "https://www.sec.gov/Archives/edgar/data/1454889/000114336225000044/SCCR020325.pdf"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/ipos-disclosure

### IPOs Prospectus API

Access comprehensive information on IPO prospectuses with the FMP IPO Prospectus API. Get key financial details, such as public offering prices, discounts, commissions, proceeds before expenses, and more. This API also provides links to official SEC prospectuses, helping investors stay informed on companies entering the public market.

**Endpoint**

`GET https://financialmodelingprep.com/stable/ipos-prospectus`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| from | date | 2026-01-27 |
| to | date | 2026-04-27 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `acceptedDate` | string |
| `filingDate` | string |
| `ipoDate` | string |
| `cik` | string |
| `pricePublicPerShare` | number |
| `pricePublicTotal` | number |
| `discountsAndCommissionsPerShare` | number |
| `discountsAndCommissionsTotal` | number |
| `proceedsBeforeExpensesPerShare` | number |
| `proceedsBeforeExpensesTotal` | number |
| `form` | string |
| `url` | string |

Sample:

```json
[
  {
    "symbol": "ATAK",
    "acceptedDate": "2025-02-03",
    "filingDate": "2025-02-03",
    "ipoDate": "2022-03-20",
    "cik": "0001883788",
    "pricePublicPerShare": 0.78,
    "pricePublicTotal": 4649936.72,
    "discountsAndCommissionsPerShare": 0.04,
    "discountsAndCommissionsTotal": 254909.67,
    "proceedsBeforeExpensesPerShare": 0.74,
    "proceedsBeforeExpensesTotal": 4395207.05,
    "form": "424B4",
    "url": "https://www.sec.gov/Archives/edgar/data/1883788/000149315225004604/form424b4.htm"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/ipos-prospectus

### Stock Split Details API

Access detailed information on stock splits for a specific company using the FMP Stock Split Details API. This API provides essential data, including the split date and the split ratio, helping users understand changes in a company's share structure after a stock split.

**Endpoint**

`GET https://financialmodelingprep.com/stable/splits?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 100 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `numerator` | integer |
| `denominator` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "date": "2020-08-31",
    "numerator": 4,
    "denominator": 1
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/splits-company

### Stock Splits Calendar API

Stay informed about upcoming stock splits with the FMP Stock Splits Calendar API. This API provides essential data on upcoming stock splits across multiple companies, including the split date and ratio, helping you track changes in share structures before they occur.

**Endpoint**

`GET https://financialmodelingprep.com/stable/splits-calendar`

Note: maximum `4000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| from | date | 2026-01-27 |
| to | date | 2026-04-27 |
| page | number | 0 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `numerator` | integer |
| `denominator` | integer |

Sample:

```json
[
  {
    "symbol": "EYEN",
    "date": "2025-02-03",
    "numerator": 1,
    "denominator": 80
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/splits-calendar
