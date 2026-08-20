# FMP API Group: Company

Source: https://site.financialmodelingprep.com/developer/docs#company

Endpoints: 17

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Company Profile Data API

Access detailed company profile data with the FMP Company Profile Data API. This API provides key financial and operational information for a specific stock symbol, including the company's market capitalization, stock price, industry, and much more.

**Endpoint**

`GET https://financialmodelingprep.com/stable/profile?symbol=AAPL`

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
| `marketCap` | integer |
| `beta` | number |
| `lastDividend` | number |
| `range` | string |
| `change` | number |
| `changePercentage` | number |
| `volume` | integer |
| `averageVolume` | integer |
| `companyName` | string |
| `currency` | string |
| `cik` | string |
| `isin` | string |
| `cusip` | string |
| `exchangeFullName` | string |
| `exchange` | string |
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
    "marketCap": 3900351299800,
    "beta": 1.109,
    "lastDividend": 1.04,
    "range": "169.21-265.29",
    "change": 3.24,
    "changePercentage": 1.24817,
    "volume": 36725325,
    "averageVolume": 47424558,
    "companyName": "Apple Inc.",
    "currency": "USD",
    "cik": "0000320193",
    "isin": "US0378331005",
    "cusip": "037833100",
    "exchangeFullName": "NASDAQ Global Select",
    "exchange": "NASDAQ",
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

Docs: https://site.financialmodelingprep.com/developer/docs/stable/profile-symbol

### Company Profile by CIK API

Retrieve detailed company profile data by CIK (Central Index Key) with the FMP Company Profile by CIK API. This API allows users to search for companies using their unique CIK identifier and access a full range of company data, including stock price, market capitalization, industry, and much more.

**Endpoint**

`GET https://financialmodelingprep.com/stable/profile-cik?cik=320193`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| cik* | string | 320193 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `marketCap` | integer |
| `beta` | number |
| `lastDividend` | number |
| `range` | string |
| `change` | number |
| `changePercentage` | number |
| `volume` | integer |
| `averageVolume` | integer |
| `companyName` | string |
| `currency` | string |
| `cik` | string |
| `isin` | string |
| `cusip` | string |
| `exchangeFullName` | string |
| `exchange` | string |
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
    "marketCap": 3900351299800,
    "beta": 1.109,
    "lastDividend": 1.04,
    "range": "169.21-265.29",
    "change": 3.24,
    "changePercentage": 1.24817,
    "volume": 36725325,
    "averageVolume": 47424558,
    "companyName": "Apple Inc.",
    "currency": "USD",
    "cik": "0000320193",
    "isin": "US0378331005",
    "cusip": "037833100",
    "exchangeFullName": "NASDAQ Global Select",
    "exchange": "NASDAQ",
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

Docs: https://site.financialmodelingprep.com/developer/docs/stable/profile-cik

### Company Notes API

Retrieve detailed information about company-issued notes with the FMP Company Notes API. Access essential data such as CIK number, stock symbol, note title, and the exchange where the notes are listed.

**Endpoint**

`GET https://financialmodelingprep.com/stable/company-notes?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `cik` | string |
| `symbol` | string |
| `title` | string |
| `exchange` | string |

Sample:

```json
[
  {
    "cik": "0000320193",
    "symbol": "AAPL",
    "title": "0.000% Notes due 2025",
    "exchange": "NASDAQ"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/company-notes

### Stock Peer Comparison API

Identify and compare companies within the same sector and market capitalization range using the FMP Stock Peer Comparison API. Gain insights into how a company stacks up against its peers on the same exchange.

**Endpoint**

`GET https://financialmodelingprep.com/stable/stock-peers?symbol=AAPL`

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
| `companyName` | string |
| `price` | number |
| `mktCap` | integer |

Sample:

```json
[
  {
    "symbol": "GOOGL",
    "companyName": "Alphabet Inc.",
    "price": 317.32,
    "mktCap": 3838620208180
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/peers

### Delisted Companies API

Stay informed with the FMP Delisted Companies API. Access a comprehensive list of companies that have been delisted from US exchanges to avoid trading in risky stocks and identify potential financial troubles.

**Endpoint**

`GET https://financialmodelingprep.com/stable/delisted-companies?page=0&limit=100`

Note: maximum `100` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| page | number | 0 |
| limit | number | 100 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `companyName` | string |
| `exchange` | string |
| `ipoDate` | string |
| `delistedDate` | string |

Sample:

```json
[
  {
    "symbol": "5CV.DE",
    "companyName": "CureVac N.V.",
    "exchange": "XETRA",
    "ipoDate": "2020-08-25",
    "delistedDate": "2026-12-05"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/delisted-companies

### Company Employee Count API

Retrieve detailed workforce information for companies, including employee count, reporting period, and filing date. The FMP Company Employee Count API also provides direct links to official SEC documents for further verification and in-depth research.

**Endpoint**

`GET https://financialmodelingprep.com/stable/employee-count?symbol=AAPL`

Note: maximum `10000` records per request.

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
| `cik` | string |
| `acceptanceTime` | string |
| `periodOfReport` | string |
| `companyName` | string |
| `formType` | string |
| `filingDate` | string |
| `employeeCount` | integer |
| `source` | string |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "cik": "0000320193",
    "acceptanceTime": "2025-10-31 06:01:26",
    "periodOfReport": "2025-09-27",
    "companyName": "Apple Inc.",
    "formType": "10-K",
    "filingDate": "2025-10-31",
    "employeeCount": 166000,
    "source": "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/0000320193-25-000079-index.htm"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/employee-count

### Company Historical Employee Count API

Access historical employee count data for a company based on specific reporting periods. The FMP Company Historical Employee Count API provides insights into how a companyâs workforce has evolved over time, allowing users to analyze growth trends and operational changes.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-employee-count?symbol=AAPL`

Note: maximum `10000` records per request.

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
| `cik` | string |
| `acceptanceTime` | string |
| `periodOfReport` | string |
| `companyName` | string |
| `formType` | string |
| `filingDate` | string |
| `employeeCount` | integer |
| `source` | string |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "cik": "0000320193",
    "acceptanceTime": "2025-10-31 06:01:26",
    "periodOfReport": "2025-09-27",
    "companyName": "Apple Inc.",
    "formType": "10-K",
    "filingDate": "2025-10-31",
    "employeeCount": 166000,
    "source": "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/0000320193-25-000079-index.htm"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/historical-employee-count

### Company Market Cap API

Retrieve the market capitalization for a specific company on any given date using the FMP Company Market Capitalization API. This API provides essential data to assess the size and value of a company in the stock market, helping users gauge its overall market standing.

**Endpoint**

`GET https://financialmodelingprep.com/stable/market-capitalization?symbol=AAPL`

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
| `date` | string |
| `marketCap` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "date": "2025-10-24",
    "marketCap": 3900351299800
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/market-cap

### Batch Market Cap API

Retrieve market capitalization data for multiple companies in a single request with the FMP Batch Market Capitalization API. This API allows users to compare the market size of various companies simultaneously, streamlining the analysis of company valuations.

**Endpoint**

`GET https://financialmodelingprep.com/stable/market-capitalization-batch?symbols=AAPL,MSFT,GOOG`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbols* | string | AAPL,MSFT,GOOG |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `marketCap` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "date": "2025-10-24",
    "marketCap": 3900351299800
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/batch-market-cap

### Historical Market Cap API

Access historical market capitalization data for a company using the FMP Historical Market Capitalization API. This API helps track the changes in market value over time, enabling long-term assessments of a company's growth or decline.

**Endpoint**

`GET https://financialmodelingprep.com/stable/historical-market-capitalization?symbol=AAPL`

Note: maximum `5000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 100 |
| from | date | 2026-01-27 |
| to | date | 2026-04-27 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `marketCap` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "date": "2026-04-08",
    "marketCap": 3818298106199
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/historical-market-cap

### Company Share Float & Liquidity API

Understand the liquidity and volatility of a stock with the FMP Company Share Float and Liquidity API. Access the total number of publicly traded shares for any company to make informed investment decisions.

**Endpoint**

`GET https://financialmodelingprep.com/stable/shares-float?symbol=AAPL`

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
| `date` | string |
| `freeFloat` | number |
| `floatShares` | integer |
| `outstandingShares` | integer |
| `source` | string |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "date": "2026-04-07 07:43:00",
    "freeFloat": 99.77245934530808,
    "floatShares": 14664480994,
    "outstandingShares": 14697924749,
    "source": "https://www.sec.gov/Archives/edgar/data/320193/000032019326000006/aapl-20251227.htm"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/shares-float

### All Shares Float API

Access comprehensive shares float data for all available companies with the FMP All Shares Float API. Retrieve critical information such as free float, float shares, and outstanding shares to analyze liquidity across a wide range of companies.

**Endpoint**

`GET https://financialmodelingprep.com/stable/shares-float-all?page=0&limit=1000`

Note: maximum `5000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| limit | number | 1000 |
| page | number | 0 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `freeFloat` | integer |
| `floatShares` | integer |
| `outstandingShares` | integer |

Sample:

```json
[
  {
    "symbol": "020Y.L",
    "date": "2026-04-07 11:36:45",
    "freeFloat": 0,
    "floatShares": 0,
    "outstandingShares": 84818244
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/all-shares-float

### Latest Mergers & Acquisitions API

Access real-time data on the latest mergers and acquisitions with the FMP Latest Mergers and Acquisitions API. This API provides key information such as the transaction date, company names, and links to detailed filing information for further analysis.

**Endpoint**

`GET https://financialmodelingprep.com/stable/mergers-acquisitions-latest?page=0&limit=100`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| page | number | 0 |
| limit | number | 100 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `companyName` | string |
| `cik` | string |
| `targetedCompanyName` | string |
| `targetedCik` | string |
| `targetedSymbol` | string |
| `transactionDate` | string |
| `acceptedDate` | string |
| `link` | string |

Sample:

```json
[
  {
    "symbol": "ALGT",
    "companyName": "Allegiant Travel CO",
    "cik": "0001362468",
    "targetedCompanyName": "Sun Country Airlines Holdings, Inc.",
    "targetedCik": "0001743907",
    "targetedSymbol": "SNCY",
    "transactionDate": "2026-03-27",
    "acceptedDate": "2026-03-27 17:15:41",
    "link": "https://www.sec.gov/Archives/edgar/data/1362468/000114036126011799/ny20065073x3_s4.htm"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/latest-mergers-acquisitions

### Search Mergers & Acquisitions API

Search for specific mergers and acquisitions data with the FMP Search Mergers and Acquisitions API. Retrieve detailed information on M&A activity, including acquiring and targeted companies, transaction dates, and links to official SEC filings.

**Endpoint**

`GET https://financialmodelingprep.com/stable/mergers-acquisitions-search?name=Apple`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| name* | string | Apple |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `companyName` | string |
| `cik` | string |
| `targetedCompanyName` | string |
| `targetedCik` | string |
| `targetedSymbol` | string |
| `transactionDate` | string |
| `acceptedDate` | string |
| `link` | string |

Sample:

```json
[
  {
    "symbol": "PEGY",
    "companyName": "Pineapple Energy Inc.",
    "cik": "0000022701",
    "targetedCompanyName": "Communications Systems, Inc.",
    "targetedCik": "0000022701",
    "targetedSymbol": "JCS",
    "transactionDate": "2021-11-12",
    "acceptedDate": "2021-11-12 09:54:22",
    "link": "https://www.sec.gov/Archives/edgar/data/22701/000089710121000932/a211292_s-4.htm"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/search-mergers-acquisitions

### Company Executives API

Retrieve detailed information on company executives with the FMP Company Executives API. This API provides essential data about key executives, including their name, title, compensation, and other demographic details such as gender and year of birth.

**Endpoint**

`GET https://financialmodelingprep.com/stable/key-executives?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `title` | string |
| `name` | string |
| `pay` | null |
| `currencyPay` | string |
| `gender` | string |
| `yearBorn` | null |
| `titleSince` | null |
| `active` | boolean |

Sample:

```json
[
  {
    "title": "Senior Vice President of Worldwide Marketing",
    "name": "Greg Joswiak",
    "pay": null,
    "currencyPay": "USD",
    "gender": "male",
    "yearBorn": null,
    "titleSince": null,
    "active": true
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/company-executives

### Executive Compensation API

Retrieve comprehensive compensation data for company executives with the FMP Executive Compensation API. This API provides detailed information on salaries, stock awards, total compensation, and other relevant financial data, including filing details and links to official documents.

**Endpoint**

`GET https://financialmodelingprep.com/stable/governance-executive-compensation?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `cik` | string |
| `symbol` | string |
| `companyName` | string |
| `filingDate` | string |
| `acceptedDate` | string |
| `nameAndPosition` | string |
| `year` | integer |
| `salary` | integer |
| `bonus` | integer |
| `stockAward` | integer |
| `optionAward` | integer |
| `incentivePlanCompensation` | integer |
| `allOtherCompensation` | integer |
| `total` | integer |
| `link` | string |

Sample:

```json
[
  {
    "cik": "0000320193",
    "symbol": "AAPL",
    "companyName": "Apple Inc.",
    "filingDate": "2026-01-08",
    "acceptedDate": "2026-01-08 16:31:36",
    "nameAndPosition": "Tim Cook Chief Executive Officer",
    "year": 2025,
    "salary": 3000000,
    "bonus": 0,
    "stockAward": 57535293,
    "optionAward": 0,
    "incentivePlanCompensation": 12000000,
    "allOtherCompensation": 1759518,
    "total": 74294811,
    "link": "https://www.sec.gov/Archives/edgar/data/320193/000130817926000008/0001308179-26-000008-index.htm"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/executive-compensation

### Executive Compensation Benchmark API

Gain access to average executive compensation data across various industries with the FMP Executive Compensation Benchmark API. This API provides essential insights for comparing executive pay by industry, helping you understand compensation trends and benchmarks.

**Endpoint**

`GET https://financialmodelingprep.com/stable/executive-compensation-benchmark`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| year | string | 2024 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `industryTitle` | string |
| `year` | integer |
| `averageCompensation` | number |

Sample:

```json
[
  {
    "industryTitle": "ABRASIVE, ASBESTOS & MISC NONMETALLIC MINERAL PRODS",
    "year": 2024,
    "averageCompensation": 784407.5555555555
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/executive-compensation-benchmark
