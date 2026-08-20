# FMP API Group: Search

Source: https://site.financialmodelingprep.com/developer/docs#search

Endpoints: 7

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Stock Symbol Search API

Easily find the ticker symbol of any stock with the FMP Stock Symbol Search API. Search by symbol across multiple global markets.

**Endpoint**

`GET https://financialmodelingprep.com/stable/search-symbol?query=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| query* | string | AAPL |
| limit | number | 50 |
| exchange | string | NASDAQ |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `name` | string |
| `currency` | string |
| `exchangeFullName` | string |
| `exchange` | string |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "currency": "USD",
    "exchangeFullName": "NASDAQ Global Select",
    "exchange": "NASDAQ"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/search-symbol

### Company Name Search API

Search for ticker symbols, company names, and exchange details for equity securities and ETFs listed on various exchanges with the FMP Name Search API. This endpoint is useful for retrieving ticker symbols when you know the full or partial company or asset name but not the symbol identifier.

**Endpoint**

`GET https://financialmodelingprep.com/stable/search-name?query=AA`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| query* | string | AA |
| limit | number | 50 |
| exchange | string | NASDAQ |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `name` | string |
| `currency` | string |
| `exchangeFullName` | string |
| `exchange` | string |

Sample:

```json
[
  {
    "symbol": "AAGUSD",
    "name": "AAG USD",
    "currency": "USD",
    "exchangeFullName": "CCC",
    "exchange": "CRYPTO"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/search-name

### CIK API

Easily retrieve the Central Index Key (CIK) for publicly traded companies with the FMP CIK API. Access unique identifiers needed for SEC filings and regulatory documents for a streamlined compliance and financial analysis process.

**Endpoint**

`GET https://financialmodelingprep.com/stable/search-cik?cik=320193`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| cik* | string | 320193 |
| limit | number | 50 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `companyName` | string |
| `cik` | string |
| `exchangeFullName` | string |
| `exchange` | string |
| `currency` | string |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "companyName": "Apple Inc.",
    "cik": "0000320193",
    "exchangeFullName": "NASDAQ Global Select",
    "exchange": "NASDAQ",
    "currency": "USD"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/search-cik

### CUSIP API

Easily search and retrieve financial securities information by CUSIP number using the FMP CUSIP API. Find key details such as company name, stock symbol, and market capitalization associated with the CUSIP.

**Endpoint**

`GET https://financialmodelingprep.com/stable/search-cusip?cusip=037833100`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| cusip* | string | 037833100 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `companyName` | string |
| `cusip` | string |
| `marketCap` | number |

Sample:

```json
[
  {
    "symbol": "AAPL.NE",
    "companyName": "Apple Inc.",
    "cusip": "037833100",
    "marketCap": 5156676087644.16
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/search-cusip

### Search Isin API

Easily search and retrieve the International Securities Identification Number (ISIN) for financial securities using the FMP ISIN API. Find key details such as company name, stock symbol, and market capitalization associated with the ISIN.

**Endpoint**

`GET https://financialmodelingprep.com/stable/search-isin?isin=US0378331005`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| isin* | string | US0378331005 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `name` | string |
| `isin` | string |
| `marketCap` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "isin": "US0378331005",
    "marketCap": 3900351299800
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/search-isin

### Stock Screener API

Discover stocks that align with your investment strategy using the FMP Stock Screener API. Filter stocks based on market cap, price, volume, beta, sector, country, and more to identify the best opportunities.

**Endpoint**

`GET https://financialmodelingprep.com/stable/company-screener`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| marketCapMoreThan | number | 1000000 |
| marketCapLowerThan | number | 10000000000000 |
| sector | string | Technology |
| industry | string | Consumer Electronics |
| betaMoreThan | number | 0.5 |
| betaLowerThan | number | 1.5 |
| priceMoreThan | number | 10 |
| priceLowerThan | number | 500 |
| dividendMoreThan | number | 0.5 |
| dividendLowerThan | number | 2 |
| volumeMoreThan | number | 1000 |
| volumeLowerThan | number | 100000000 |
| exchange | string | NASDAQ |
| country | string | US |
| isEtf | boolean | false |
| isFund | boolean | false |
| isActivelyTrading | boolean | true |
| limit | number | 1000 |
| includeAllShareClasses | boolean | false |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `companyName` | string |
| `marketCap` | null |
| `sector` | string |
| `industry` | string |
| `beta` | null |
| `price` | number |
| `lastAnnualDividend` | null |
| `volume` | integer |
| `exchange` | string |
| `exchangeShortName` | string |
| `country` | string |
| `isEtf` | boolean |
| `isFund` | boolean |
| `isActivelyTrading` | boolean |

Sample:

```json
[
  {
    "symbol": "WIMA",
    "companyName": "WisdomTree International Adaptive Moving Average Fund",
    "marketCap": null,
    "sector": "Financial Services",
    "industry": "Asset Management",
    "beta": null,
    "price": 41.0956,
    "lastAnnualDividend": null,
    "volume": 2979,
    "exchange": "NASDAQ Global Market",
    "exchangeShortName": "NASDAQ",
    "country": "US",
    "isEtf": false,
    "isFund": true,
    "isActivelyTrading": true
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/search-company-screener

### Exchange Variants API

Search across multiple public exchanges to find where a given stock symbol is listed using the FMP Exchange Variants API. This allows users to quickly identify all the exchanges where a security is actively traded.

**Endpoint**

`GET https://financialmodelingprep.com/stable/search-exchange-variants?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `beta` | number |
| `volAvg` | integer |
| `mktCap` | integer |
| `lastDiv` | number |
| `range` | string |
| `changes` | number |
| `companyName` | string |
| `currency` | string |
| `cik` | string |
| `isin` | string |
| `cusip` | string |
| `exchange` | string |
| `exchangeShortName` | string |
| `industry` | string |
| `website` | string |
| `description` | string |
| `ceo` | string |
| `sector` | string |
| `country` | string |
| `fullTimeEmployees` | string |
| `phone` | string |
| `address` | string |
| `city` | string |
| `state` | string |
| `zip` | string |
| `dcfDiff` | number |
| `dcf` | number |
| `image` | string |
| `ipoDate` | string |
| `defaultImage` | boolean |
| `isEtf` | boolean |
| `isActivelyTrading` | boolean |
| `isAdr` | boolean |
| `isFund` | boolean |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "price": 262.82,
    "beta": 1.109,
    "volAvg": 47424558,
    "mktCap": 3900351299800,
    "lastDiv": 1.04,
    "range": "169.21-288.62",
    "changes": 3.24,
    "companyName": "Apple Inc.",
    "currency": "USD",
    "cik": "0000320193",
    "isin": "US0378331005",
    "cusip": "037833100",
    "exchange": "NASDAQ Global Select",
    "exchangeShortName": "NASDAQ",
    "industry": "Consumer Electronics",
    "website": "https://www.apple.com",
    "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worl…",
    "ceo": "Timothy D. Cook",
    "sector": "Technology",
    "country": "US",
    "fullTimeEmployees": "164000",
    "phone": "(408) 996-1010",
    "address": "One Apple Park Way",
    "city": "Cupertino",
    "state": "CA",
    "zip": "95014",
    "dcfDiff": 105.92261,
    "dcf": 152.32738976131944,
    "image": "https://images.financialmodelingprep.com/symbol/AAPL.png",
    "ipoDate": "1980-12-12",
    "defaultImage": false,
    "isEtf": false,
    "isActivelyTrading": true,
    "isAdr": false,
    "isFund": false
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/search-exchange-variants
