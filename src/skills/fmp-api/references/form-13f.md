# FMP API Group: Form 13F

Source: https://site.financialmodelingprep.com/developer/docs#form-13f

Endpoints: 8

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Institutional Ownership Filings API

Stay up to date with the most recent SEC filings related to institutional ownership using the Institutional Ownership Filings API. This tool allows you to track the latest reports and disclosures from institutional investors, giving you a real-time view of major holdings and regulatory submissions.

**Endpoint**

`GET https://financialmodelingprep.com/stable/institutional-ownership/latest?page=0&limit=100`

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
| `cik` | string |
| `name` | string |
| `date` | string |
| `filingDate` | string |
| `acceptedDate` | string |
| `formType` | string |
| `link` | string |
| `finalLink` | string |

Sample:

```json
[
  {
    "cik": "0001963967",
    "name": "CPA ASSET MANAGEMENT LLC",
    "date": "2024-12-31",
    "filingDate": "2025-02-04 00:00:00",
    "acceptedDate": "2025-02-04 17:28:36",
    "formType": "13F-HR",
    "link": "https://www.sec.gov/Archives/edgar/data/1963967/000196396725000001/0001963967-25-000001-index.htm",
    "finalLink": "https://www.sec.gov/Archives/edgar/data/1963967/000196396725000001/boc2024q413f.xml"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/latest-filings

### Filings Extract API

The SEC Filings Extract API allows users to extract detailed data directly from official SEC filings. This API provides access to key information such as company shares, security details, and filing links, making it easier to analyze corporate disclosures.

**Endpoint**

`GET https://financialmodelingprep.com/stable/institutional-ownership/extract?cik=0001388838&year=2023&quarter=3`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| cik* | string | 0001388838 |
| year* | string | 2023 |
| quarter* | string | 3 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `filingDate` | string |
| `acceptedDate` | string |
| `cik` | string |
| `securityCusip` | string |
| `symbol` | string |
| `nameOfIssuer` | string |
| `shares` | integer |
| `titleOfClass` | string |
| `sharesType` | string |
| `putCallShare` | string |
| `value` | integer |
| `link` | string |
| `finalLink` | string |

Sample:

```json
[
  {
    "date": "2023-09-30",
    "filingDate": "2023-11-13",
    "acceptedDate": "2023-11-13",
    "cik": "0001388838",
    "securityCusip": "674215207",
    "symbol": "CHRD",
    "nameOfIssuer": "CHORD ENERGY CORPORATION",
    "shares": 13280,
    "titleOfClass": "COM NEW",
    "sharesType": "SH",
    "putCallShare": "",
    "value": 2152290,
    "link": "https://www.sec.gov/Archives/edgar/data/1388838/000117266123003760/0001172661-23-003760-index.htm",
    "finalLink": "https://www.sec.gov/Archives/edgar/data/1388838/000117266123003760/infotable.xml"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/filings-extract

### Form 13F Filings Dates API

The Form 13F Filings Dates API allows you to retrieve dates associated with Form 13F filings by institutional investors. This is crucial for tracking stock holdings of institutional investors at specific points in time, providing valuable insights into their investment strategies.

**Endpoint**

`GET https://financialmodelingprep.com/stable/institutional-ownership/dates?cik=0001067983`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| cik* | string | 0001067983 |

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
    "date": "2024-09-30",
    "year": 2024,
    "quarter": 3
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/form-13f-filings-dates

### Filings Extract With Analytics By Holder API

The Filings Extract With Analytics By Holder API provides an analytical breakdown of institutional filings. This API offers insight into stock movements, strategies, and portfolio changes by major institutional holders, helping you understand their investment behavior and track significant changes in stock ownership.

**Endpoint**

`GET https://financialmodelingprep.com/stable/institutional-ownership/extract-analytics/holder?symbol=AAPL&year=2023&quarter=3&page=0&limit=10`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| year* | string | 2023 |
| quarter* | string | 3 |
| page | number | 0 |
| limit | number | 10 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `cik` | string |
| `filingDate` | string |
| `investorName` | string |
| `symbol` | string |
| `securityName` | string |
| `typeOfSecurity` | string |
| `securityCusip` | string |
| `sharesType` | string |
| `putCallShare` | string |
| `investmentDiscretion` | string |
| `industryTitle` | string |
| `weight` | number |
| `lastWeight` | number |
| `changeInWeight` | number |
| `changeInWeightPercentage` | number |
| `marketValue` | integer |
| `lastMarketValue` | integer |
| `changeInMarketValue` | integer |
| `changeInMarketValuePercentage` | number |
| `sharesNumber` | integer |
| `lastSharesNumber` | integer |
| `changeInSharesNumber` | integer |
| `changeInSharesNumberPercentage` | number |
| `quarterEndPrice` | number |
| `avgPricePaid` | number |
| `isNew` | boolean |
| `isSoldOut` | boolean |
| `ownership` | number |
| `lastOwnership` | number |
| `changeInOwnership` | number |
| `changeInOwnershipPercentage` | number |
| `holdingPeriod` | integer |
| `firstAdded` | string |
| `performance` | integer |
| `performancePercentage` | number |
| `lastPerformance` | integer |
| `changeInPerformance` | integer |
| `isCountedForPerformance` | boolean |

Sample:

```json
[
  {
    "date": "2023-09-30",
    "cik": "0000102909",
    "filingDate": "2023-12-18",
    "investorName": "VANGUARD GROUP INC",
    "symbol": "AAPL",
    "securityName": "APPLE INC",
    "typeOfSecurity": "COM",
    "securityCusip": "037833100",
    "sharesType": "SH",
    "putCallShare": "Share",
    "investmentDiscretion": "SOLE",
    "industryTitle": "ELECTRONIC COMPUTERS",
    "weight": 5.4673,
    "lastWeight": 5.996,
    "changeInWeight": -0.5287,
    "changeInWeightPercentage": -8.8175,
    "marketValue": 222572509140,
    "lastMarketValue": 252876459509,
    "changeInMarketValue": -30303950369,
    "changeInMarketValuePercentage": -11.9837,
    "sharesNumber": 1299997133,
    "lastSharesNumber": 1303688506,
    "changeInSharesNumber": -3691373,
    "changeInSharesNumberPercentage": -0.2831,
    "quarterEndPrice": 171.21,
    "avgPricePaid": 95.86,
    "isNew": false,
    "isSoldOut": false,
    "ownership": 8.3336,
    "lastOwnership": 8.305,
    "changeInOwnership": 0.0286,
    "changeInOwnershipPercentage": 0.3445,
    "holdingPeriod": 42,
    "firstAdded": "2013-06-30",
    "performance": -29671950396,
    "performancePercentage": -11.7338,
    "lastPerformance": 38078179274,
    "changeInPerformance": -67750129670,
    "isCountedForPerformance": true
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/filings-extract-with-analytics-by-holder

### Holder Performance Summary API

The Holder Performance Summary API provides insights into the performance of institutional investors based on their stock holdings. This data helps track how well institutional holders are performing, their portfolio changes, and how their performance compares to benchmarks like the S&P 500.

**Endpoint**

`GET https://financialmodelingprep.com/stable/institutional-ownership/holder-performance-summary?cik=0001067983&page=0`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| cik* | string | 0001067983 |
| page | number | 0 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `cik` | string |
| `investorName` | string |
| `portfolioSize` | integer |
| `securitiesAdded` | integer |
| `securitiesRemoved` | integer |
| `marketValue` | integer |
| `previousMarketValue` | integer |
| `changeInMarketValue` | integer |
| `changeInMarketValuePercentage` | number |
| `averageHoldingPeriod` | integer |
| `averageHoldingPeriodTop10` | integer |
| `averageHoldingPeriodTop20` | integer |
| `turnover` | number |
| `turnoverAlternateSell` | number |
| `turnoverAlternateBuy` | number |
| `performance` | integer |
| `performancePercentage` | number |
| `lastPerformance` | integer |
| `changeInPerformance` | integer |
| `performance1year` | integer |
| `performancePercentage1year` | number |
| `performance3year` | integer |
| `performancePercentage3year` | number |
| `performance5year` | integer |
| `performancePercentage5year` | number |
| `performanceSinceInception` | integer |
| `performanceSinceInceptionPercentage` | number |
| `performanceRelativeToSP500Percentage` | number |
| `performance1yearRelativeToSP500Percentage` | number |
| `performance3yearRelativeToSP500Percentage` | number |
| `performance5yearRelativeToSP500Percentage` | number |
| `performanceSinceInceptionRelativeToSP500Percentage` | number |

Sample:

```json
[
  {
    "date": "2024-09-30",
    "cik": "0001067983",
    "investorName": "BERKSHIRE HATHAWAY INC",
    "portfolioSize": 40,
    "securitiesAdded": 3,
    "securitiesRemoved": 4,
    "marketValue": 266378900503,
    "previousMarketValue": 279969062343,
    "changeInMarketValue": -13590161840,
    "changeInMarketValuePercentage": -4.8542,
    "averageHoldingPeriod": 18,
    "averageHoldingPeriodTop10": 31,
    "averageHoldingPeriodTop20": 27,
    "turnover": 0.175,
    "turnoverAlternateSell": 13.9726,
    "turnoverAlternateBuy": 1.1974,
    "performance": 17707926874,
    "performancePercentage": 6.325,
    "lastPerformance": 38318168662,
    "changeInPerformance": -20610241788,
    "performance1year": 89877376224,
    "performancePercentage1year": 28.5368,
    "performance3year": 91730847239,
    "performancePercentage3year": 31.2597,
    "performance5year": 157058602844,
    "performancePercentage5year": 73.1617,
    "performanceSinceInception": 182067479115,
    "performanceSinceInceptionPercentage": 198.2138,
    "performanceRelativeToSP500Percentage": 6.325,
    "performance1yearRelativeToSP500Percentage": 28.5368,
    "performance3yearRelativeToSP500Percentage": 36.5632,
    "performance5yearRelativeToSP500Percentage": 36.1296,
    "performanceSinceInceptionRelativeToSP500Percentage": 37.0968
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/holder-performance-summary

### Holders Industry Breakdown API

The Holders Industry Breakdown API provides an overview of the sectors and industries that institutional holders are investing in. This API helps analyze how institutional investors distribute their holdings across different industries and track changes in their investment strategies over time.

**Endpoint**

`GET https://financialmodelingprep.com/stable/institutional-ownership/holder-industry-breakdown?cik=0001067983&year=2023&quarter=3`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| cik* | string | 0001067983 |
| year* | string | 2023 |
| quarter* | string | 3 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `cik` | string |
| `investorName` | string |
| `industryTitle` | string |
| `weight` | number |
| `lastWeight` | number |
| `changeInWeight` | number |
| `changeInWeightPercentage` | number |
| `performance` | integer |
| `performancePercentage` | number |
| `lastPerformance` | integer |
| `changeInPerformance` | integer |

Sample:

```json
[
  {
    "date": "2023-09-30",
    "cik": "0001067983",
    "investorName": "BERKSHIRE HATHAWAY INC",
    "industryTitle": "ELECTRONIC COMPUTERS",
    "weight": 49.7704,
    "lastWeight": 51.0035,
    "changeInWeight": -1.2332,
    "changeInWeightPercentage": -2.4178,
    "performance": -20838154294,
    "performancePercentage": -178.2938,
    "lastPerformance": 26615340304,
    "changeInPerformance": -47453494598
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/holders-industry-breakdown

### Positions Summary API

The Positions Summary API provides a comprehensive snapshot of institutional holdings for a specific stock symbol. It tracks key metrics like the number of investors holding the stock, changes in the number of shares, total investment value, and ownership percentages over time.

**Endpoint**

`GET https://financialmodelingprep.com/stable/institutional-ownership/symbol-positions-summary?symbol=AAPL&year=2023&quarter=3`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| year* | string | 2023 |
| quarter* | string | 3 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `cik` | string |
| `date` | string |
| `investorsHolding` | integer |
| `lastInvestorsHolding` | integer |
| `investorsHoldingChange` | integer |
| `numberOf13Fshares` | integer |
| `lastNumberOf13Fshares` | integer |
| `numberOf13FsharesChange` | integer |
| `totalInvested` | integer |
| `lastTotalInvested` | integer |
| `totalInvestedChange` | integer |
| `ownershipPercent` | number |
| `lastOwnershipPercent` | number |
| `ownershipPercentChange` | number |
| `newPositions` | integer |
| `lastNewPositions` | integer |
| `newPositionsChange` | integer |
| `increasedPositions` | integer |
| `lastIncreasedPositions` | integer |
| `increasedPositionsChange` | integer |
| `closedPositions` | integer |
| `lastClosedPositions` | integer |
| `closedPositionsChange` | integer |
| `reducedPositions` | integer |
| `lastReducedPositions` | integer |
| `reducedPositionsChange` | integer |
| `totalCalls` | integer |
| `lastTotalCalls` | integer |
| `totalCallsChange` | integer |
| `totalPuts` | integer |
| `lastTotalPuts` | integer |
| `totalPutsChange` | integer |
| `putCallRatio` | number |
| `lastPutCallRatio` | number |
| `putCallRatioChange` | number |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "cik": "0000320193",
    "date": "2023-09-30",
    "investorsHolding": 4805,
    "lastInvestorsHolding": 4749,
    "investorsHoldingChange": 56,
    "numberOf13Fshares": 9247670386,
    "lastNumberOf13Fshares": 9345671472,
    "numberOf13FsharesChange": -98001086,
    "totalInvested": 1613733330618,
    "lastTotalInvested": 1825154796061,
    "totalInvestedChange": -211421465443,
    "ownershipPercent": 59.2821,
    "lastOwnershipPercent": 59.5356,
    "ownershipPercentChange": -0.2535,
    "newPositions": 158,
    "lastNewPositions": 188,
    "newPositionsChange": -30,
    "increasedPositions": 1921,
    "lastIncreasedPositions": 1775,
    "increasedPositionsChange": 146,
    "closedPositions": 156,
    "lastClosedPositions": 122,
    "closedPositionsChange": 34,
    "reducedPositions": 2375,
    "lastReducedPositions": 2506,
    "reducedPositionsChange": -131,
    "totalCalls": 173528138,
    "lastTotalCalls": 198746782,
    "totalCallsChange": -25218644,
    "totalPuts": 192878290,
    "lastTotalPuts": 177007062,
    "totalPutsChange": 15871228,
    "putCallRatio": 1.1115,
    "lastPutCallRatio": 0.8906,
    "putCallRatioChange": 22.0894
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/positions-summary

### Industry Performance Summary API

The Industry Performance Summary API provides an overview of how various industries are performing financially. By analyzing the value of industries over a specific period, this API helps investors and analysts understand the health of entire sectors and make informed decisions about sector-based investments.

**Endpoint**

`GET https://financialmodelingprep.com/stable/institutional-ownership/industry-summary?year=2023&quarter=3`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| year* | string | 2023 |
| quarter* | string | 3 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `industryTitle` | string |
| `industryValue` | integer |
| `date` | string |

Sample:

```json
[
  {
    "industryTitle": "ABRASIVE, ASBESTOS & MISC NONMETALLIC MINERAL PRODS",
    "industryValue": 10979226300,
    "date": "2023-09-30"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/industry-summary
