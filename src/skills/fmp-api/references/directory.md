# FMP API Group: Directory

Source: https://site.financialmodelingprep.com/developer/docs#directory

Endpoints: 11

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Company Symbols List API

Easily retrieve a comprehensive list of financial symbols with the FMP Company Symbols List API. Access a broad range of stock symbols and other tradable financial instruments from various global exchanges, helping you explore the full range of available securities.

**Endpoint**

`GET https://financialmodelingprep.com/stable/stock-list`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `companyName` | string |

Sample:

```json
[
  {
    "symbol": "6898.HK",
    "companyName": "China Aluminum Cans Holdings Limited"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/company-symbols-list

### Financial Statement Symbols List API

Access a comprehensive list of companies with available financial statements through the FMP Financial Statement Symbols List API. Find companies listed on major global exchanges and obtain up-to-date financial data including income statements, balance sheets, and cash flow statements, are provided.

**Endpoint**

`GET https://financialmodelingprep.com/stable/financial-statement-symbol-list`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `companyName` | string |
| `tradingCurrency` | string |
| `reportingCurrency` | string |

Sample:

```json
[
  {
    "symbol": "6898.HK",
    "companyName": "China Aluminum Cans Holdings Limited",
    "tradingCurrency": "HKD",
    "reportingCurrency": "HKD"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/financial-symbols-list

### CIK List API

Access a comprehensive database of CIK (Central Index Key) numbers for SEC-registered entities with the FMP CIK List API. This endpoint is essential for businesses, financial professionals, and individuals who need quick access to CIK numbers for regulatory compliance, financial transactions, and investment research.

**Endpoint**

`GET https://financialmodelingprep.com/stable/cik-list?page=0&limit=1000`

Note: maximum `10000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| page | number | 0 |
| limit | number | 1000 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `cik` | string |
| `companyName` | string |

Sample:

```json
[
  {
    "cik": "0002036063",
    "companyName": "LUZ Capital Partners, LLC"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cik-list

### Symbol Changes List API

Stay informed about the latest stock symbol changes with the FMP Stock Symbol Changes API. Track changes due to mergers, acquisitions, stock splits, and name changes to ensure accurate trading and analysis.

**Endpoint**

`GET https://financialmodelingprep.com/stable/symbol-change`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| invalid | string | false |
| limit | number | 100 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `companyName` | string |
| `oldSymbol` | string |
| `newSymbol` | string |

Sample:

```json
[
  {
    "date": "2025-02-03",
    "companyName": "XPLR Infrastructure, LP Common Units representing limited partner interests",
    "oldSymbol": "NEP",
    "newSymbol": "XIFR"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/symbol-changes-list

### ETF Symbol Search API

Quickly find ticker symbols and company names for Exchange Traded Funds (ETFs) using the FMP ETF Symbol Search API. This tool simplifies identifying specific ETFs by their name or ticker.

**Endpoint**

`GET https://financialmodelingprep.com/stable/etf-list`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `name` | string |

Sample:

```json
[
  {
    "symbol": "GULF",
    "name": "WisdomTree Middle East Dividend Fund"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/etfs-list

### Actively Trading List API

List all actively trading companies and financial instruments with the FMP Actively Trading List API. This endpoint allows users to filter and display securities that are currently being traded on public exchanges, ensuring you access real-time market activity.

**Endpoint**

`GET https://financialmodelingprep.com/stable/actively-trading-list`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `name` | string |

Sample:

```json
[
  {
    "symbol": "6898.HK",
    "name": "China Aluminum Cans Holdings Limited"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/actively-trading-list

### Earnings Transcript List API

Access available earnings transcripts for companies with the FMP Earnings Transcript List API. Retrieve a list of companies with earnings transcripts, along with the total number of transcripts available for each company.

**Endpoint**

`GET https://financialmodelingprep.com/stable/earnings-transcript-list`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `companyName` | string |
| `noOfTranscripts` | string |

Sample:

```json
[
  {
    "symbol": "MCUJF",
    "companyName": "Medicure Inc.",
    "noOfTranscripts": "16"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/earnings-transcript-list

### Available Exchanges API

Access a complete list of supported stock exchanges using the FMP Available Exchanges API. This API provides a comprehensive overview of global stock exchanges, allowing users to identify where securities are traded and filter data by specific exchanges for further analysis.

**Endpoint**

`GET https://financialmodelingprep.com/stable/available-exchanges`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `exchange` | string |
| `name` | string |
| `countryName` | string |
| `countryCode` | string |
| `symbolSuffix` | string |
| `delay` | string |

Sample:

```json
[
  {
    "exchange": "AMEX",
    "name": "New York Stock Exchange Arca",
    "countryName": "United States of America",
    "countryCode": "US",
    "symbolSuffix": "N/A",
    "delay": "Real-time"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/available-exchanges

### Available Sectors API

Access a complete list of industry sectors using the FMP Available Sectors API. This API helps users categorize and filter companies based on their respective sectors, enabling deeper analysis and more focused queries across different industries.

**Endpoint**

`GET https://financialmodelingprep.com/stable/available-sectors`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `sector` | string |

Sample:

```json
[
  {
    "sector": "Basic Materials"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/available-sectors

### Available Industries API

Access a comprehensive list of industries where stock symbols are available using the FMP Available Industries API. This API helps users filter and categorize companies based on their industry for more focused research and analysis.

**Endpoint**

`GET https://financialmodelingprep.com/stable/available-industries`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `industry` | string |

Sample:

```json
[
  {
    "industry": "Steel"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/available-industries

### Available Countries API

Access a comprehensive list of countries where stock symbols are available with the FMP Available Countries API. This API enables users to filter and analyze stock symbols based on the country of origin or the primary market where the securities are traded.

**Endpoint**

`GET https://financialmodelingprep.com/stable/available-countries`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `country` | string |

Sample:

```json
[
  {
    "country": "FK"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/available-countries
