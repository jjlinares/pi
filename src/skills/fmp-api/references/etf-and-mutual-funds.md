# FMP API Group: ETF & Mutual Funds

Source: https://site.financialmodelingprep.com/developer/docs#etf-and-mutual-funds

Endpoints: 9

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### ETF & Fund Holdings API

Get a detailed breakdown of the assets held within ETFs and mutual funds using the FMP ETF & Fund Holdings API. Access real-time data on the specific securities and their weights in the portfolio, providing insights into asset composition and fund strategies.

**Endpoint**

`GET https://financialmodelingprep.com/stable/etf/holdings?symbol=SPY`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | SPY |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `asset` | string |
| `name` | string |
| `isin` | string |
| `securityCusip` | string |
| `sharesNumber` | integer |
| `weightPercentage` | number |
| `marketValue` | number |
| `updatedAt` | string |
| `updated` | string |

Sample:

```json
[
  {
    "symbol": "SPY",
    "asset": "AAPL",
    "name": "APPLE INC",
    "isin": "US0378331005",
    "securityCusip": "037833100",
    "sharesNumber": 188106081,
    "weightPercentage": 7.137,
    "marketValue": 44744793487.47,
    "updatedAt": "2025-01-16 05:01:09",
    "updated": "2025-02-04 19:02:31"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/holdings

### ETF & Mutual Fund Information API

Access comprehensive data on ETFs and mutual funds with the FMP ETF & Mutual Fund Information API. Retrieve essential details such as ticker symbol, fund name, expense ratio, assets under management, and more.

**Endpoint**

`GET https://financialmodelingprep.com/stable/etf/info?symbol=SPY`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | SPY |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `name` | string |
| `description` | string |
| `isin` | string |
| `assetClass` | string |
| `securityCusip` | string |
| `domicile` | string |
| `website` | string |
| `etfCompany` | string |
| `expenseRatio` | number |
| `assetsUnderManagement` | integer |
| `avgVolume` | integer |
| `inceptionDate` | string |
| `nav` | number |
| `navCurrency` | string |
| `holdingsCount` | integer |
| `updatedAt` | string |
| `sectorsList` | array<object> |
| `sectorsList[].industry` | string |
| `sectorsList[].exposure` | number |

Sample:

```json
[
  {
    "symbol": "SPY",
    "name": "SPDR S&P 500 ETF Trust",
    "description": "The Trust seeks to achieve its investment objective by holding a portfolio of the common stocks that are included in th…",
    "isin": "US78462F1030",
    "assetClass": "Equity",
    "securityCusip": "78462F103",
    "domicile": "US",
    "website": "https://www.ssga.com/us/en/institutional/etfs/spdr-sp-500-etf-trust-spy",
    "etfCompany": "SPDR",
    "expenseRatio": 0.0945,
    "assetsUnderManagement": 633120180000,
    "avgVolume": 46396400,
    "inceptionDate": "1993-01-22",
    "nav": 603.64,
    "navCurrency": "USD",
    "holdingsCount": 503,
    "updatedAt": "2024-12-03T20:32:48.873Z",
    "sectorsList": [
      {
        "industry": "Basic Materials",
        "exposure": 1.97
      }
    ]
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/information

### ETF & Fund Country Allocation API

Gain insight into how ETFs and mutual funds distribute assets across different countries with the FMP ETF & Fund Country Allocation API. This tool provides detailed information on the percentage of assets allocated to various regions, helping you make informed investment decisions.

**Endpoint**

`GET https://financialmodelingprep.com/stable/etf/country-weightings?symbol=SPY`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | SPY |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `country` | string |
| `weightPercentage` | string |

Sample:

```json
[
  {
    "country": "United States",
    "weightPercentage": "97.29%"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/country-weighting

### ETF Asset Exposure API

Discover which ETFs hold specific stocks with the FMP ETF Asset Exposure API. Access detailed information on market value, share numbers, and weight percentages for assets within ETFs.

**Endpoint**

`GET https://financialmodelingprep.com/stable/etf/asset-exposure?symbol=AAPL`

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
| `asset` | string |
| `sharesNumber` | integer |
| `weightPercentage` | number |
| `marketValue` | integer |

Sample:

```json
[
  {
    "symbol": "ZECP",
    "asset": "AAPL",
    "sharesNumber": 5482,
    "weightPercentage": 5.86,
    "marketValue": 0
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/etf-asset-exposure

### ETF Sector Weighting API

The FMP ETF Sector Weighting API provides a breakdown of the percentage of an ETF's assets that are invested in each sector. For example, an investor may want to invest in an ETF that has a high exposure to the technology sector if they believe that the technology sector is poised for growth.

**Endpoint**

`GET https://financialmodelingprep.com/stable/etf/sector-weightings?symbol=SPY`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | SPY |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `sector` | string |
| `weightPercentage` | number |

Sample:

```json
[
  {
    "symbol": "SPY",
    "sector": "Basic Materials",
    "weightPercentage": 1.97
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/sector-weighting

### Mutual Fund & ETF Disclosure API

Access the latest disclosures from mutual funds and ETFs with the FMP Mutual Fund & ETF Disclosure API. This API provides updates on filings, changes in holdings, and other critical disclosure data for mutual funds and ETFs.

**Endpoint**

`GET https://financialmodelingprep.com/stable/funds/disclosure-holders-latest?symbol=AAPL`

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
| `holder` | string |
| `shares` | integer |
| `dateReported` | string |
| `change` | integer |
| `weightPercent` | number |

Sample:

```json
[
  {
    "cik": "0000106444",
    "holder": "VANGUARD FIXED INCOME SECURITIES FUNDS",
    "shares": 67030000,
    "dateReported": "2024-07-31",
    "change": 0,
    "weightPercent": 0.03840197
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/latest-disclosures

### Mutual Fund Disclosures API

Access comprehensive disclosure data for mutual funds with the FMP Mutual Fund Disclosures API. Analyze recent filings, balance sheets, and financial reports to gain insights into mutual fund portfolios.

**Endpoint**

`GET https://financialmodelingprep.com/stable/funds/disclosure?symbol=VWO&year=2023&quarter=4`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | VWO |
| year* | string | 2023 |
| quarter* | string | 4 |
| cik | string | 0000857489 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `cik` | string |
| `date` | string |
| `acceptedDate` | string |
| `symbol` | string |
| `name` | string |
| `lei` | string |
| `title` | string |
| `cusip` | string |
| `isin` | string |
| `balance` | integer |
| `units` | string |
| `cur_cd` | string |
| `valUsd` | number |
| `pctVal` | number |
| `payoffProfile` | string |
| `assetCat` | string |
| `issuerCat` | string |
| `invCountry` | string |
| `isRestrictedSec` | string |
| `fairValLevel` | string |
| `isCashCollateral` | string |
| `isNonCashCollateral` | string |
| `isLoanByFund` | string |

Sample:

```json
[
  {
    "cik": "0000857489",
    "date": "2023-10-31",
    "acceptedDate": "2023-12-28 09:26:13",
    "symbol": "000089.SZ",
    "name": "Shenzhen Airport Co Ltd",
    "lei": "3003009W045RIKRBZI44",
    "title": "SHENZ AIRPORT-A",
    "cusip": "N/A",
    "isin": "CNE000000VK1",
    "balance": 2438784,
    "units": "NS",
    "cur_cd": "CNY",
    "valUsd": 2255873.6,
    "pctVal": 0.0023838966190458215,
    "payoffProfile": "Long",
    "assetCat": "EC",
    "issuerCat": "CORP",
    "invCountry": "CN",
    "isRestrictedSec": "N",
    "fairValLevel": "2",
    "isCashCollateral": "N",
    "isNonCashCollateral": "N",
    "isLoanByFund": "N"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/mutual-fund-disclosures

### Mutual Fund & ETF Disclosure Name Search API

Easily search for mutual fund and ETF disclosures by name using the Mutual Fund & ETF Disclosure Name Search API. This API allows you to find specific reports and filings based on the fund or ETF name, providing essential details like CIK number, entity information, and reporting file number.

**Endpoint**

`GET https://financialmodelingprep.com/stable/funds/disclosure-holders-search?name=Federated Hermes Government Income Securities, Inc.`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| name* | string | Federated Hermes Government Income Securities, Inc. |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `cik` | string |
| `classId` | string |
| `seriesId` | string |
| `entityName` | string |
| `entityOrgType` | string |
| `seriesName` | string |
| `className` | string |
| `reportingFileNumber` | string |
| `address` | string |
| `city` | string |
| `zipCode` | string |
| `state` | string |

Sample:

```json
[
  {
    "symbol": "FGOAX",
    "cik": "0000355691",
    "classId": "C000024574",
    "seriesId": "S000009042",
    "entityName": "Federated Hermes Government Income Securities, Inc.",
    "entityOrgType": "30",
    "seriesName": "Federated Hermes Government Income Securities, Inc.",
    "className": "Class A Shares",
    "reportingFileNumber": "811-03266",
    "address": "4000 ERICSSON DRIVE",
    "city": "WARRENDALE",
    "zipCode": "15086-7561",
    "state": "PA"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/disclosures-name-search

### Fund & ETF Disclosures by Date API

Retrieve detailed disclosures for mutual funds and ETFs based on filing dates with the FMP Fund & ETF Disclosures by Date API. Stay current with the latest filings and track regulatory updates effectively.

**Endpoint**

`GET https://financialmodelingprep.com/stable/funds/disclosure-dates?symbol=VWO`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | VWO |
| cik | string | 0000036405 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `year` | integer |
| `quarter` | integer |

Sample:

```json
[
  {
    "date": "2024-10-31",
    "year": 2024,
    "quarter": 4
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/disclosures-dates
