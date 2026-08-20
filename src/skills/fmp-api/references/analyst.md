# FMP API Group: Analyst

Source: https://site.financialmodelingprep.com/developer/docs#analyst

Endpoints: 8

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Financial Estimates API

Retrieve analyst financial estimates for stock symbols with the FMP Financial Estimates API. Access projected figures like revenue, earnings per share (EPS), and other key financial metrics as forecasted by industry analysts to inform your investment decisions.

**Endpoint**

`GET https://financialmodelingprep.com/stable/analyst-estimates?symbol=AAPL&period=annual&page=0&limit=10`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| period* | string | `annual`, `quarter` |
| page | number | 0 |
| limit | number | 10 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `revenueLow` | integer |
| `revenueHigh` | integer |
| `revenueAvg` | integer |
| `ebitdaLow` | integer |
| `ebitdaHigh` | integer |
| `ebitdaAvg` | integer |
| `ebitLow` | integer |
| `ebitHigh` | integer |
| `ebitAvg` | integer |
| `netIncomeLow` | integer |
| `netIncomeHigh` | integer |
| `netIncomeAvg` | integer |
| `sgaExpenseLow` | integer |
| `sgaExpenseHigh` | integer |
| `sgaExpenseAvg` | integer |
| `epsAvg` | number |
| `epsHigh` | number |
| `epsLow` | number |
| `numAnalystsRevenue` | integer |
| `numAnalystsEps` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "date": "2029-09-28",
    "revenueLow": 483092500000,
    "revenueHigh": 483093500000,
    "revenueAvg": 483093000000,
    "ebitdaLow": 155952166036,
    "ebitdaHigh": 155952488856,
    "ebitdaAvg": 155952327446,
    "ebitLow": 140628295747,
    "ebitHigh": 140628586847,
    "ebitAvg": 140628441297,
    "netIncomeLow": 139446957701,
    "netIncomeHigh": 157185372990,
    "netIncomeAvg": 149150359609,
    "sgaExpenseLow": 31694652812,
    "sgaExpenseHigh": 31694718420,
    "sgaExpenseAvg": 31694685616,
    "epsAvg": 9.68,
    "epsHigh": 10.20148,
    "epsLow": 9.05024,
    "numAnalystsRevenue": 16,
    "numAnalystsEps": 6
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/financial-estimates

### Ratings Snapshot API

Quickly assess the financial health and performance of companies with the FMP Ratings Snapshot API. This API provides a comprehensive snapshot of financial ratings for stock symbols in our database, based on various key financial ratios.

**Endpoint**

`GET https://financialmodelingprep.com/stable/ratings-snapshot?symbol=AAPL`

Note: maximum `1` records per request.

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
| `rating` | string |
| `overallScore` | integer |
| `discountedCashFlowScore` | integer |
| `returnOnEquityScore` | integer |
| `returnOnAssetsScore` | integer |
| `debtToEquityScore` | integer |
| `priceToEarningsScore` | integer |
| `priceToBookScore` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "rating": "A-",
    "overallScore": 4,
    "discountedCashFlowScore": 3,
    "returnOnEquityScore": 5,
    "returnOnAssetsScore": 5,
    "debtToEquityScore": 4,
    "priceToEarningsScore": 2,
    "priceToBookScore": 1
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/ratings-snapshot

### Historical Ratings API

Track changes in financial performance over time with the FMP Historical Ratings API. This API provides access to historical financial ratings for stock symbols in our database, allowing users to view ratings and key financial metric scores for specific dates.

**Endpoint**

`GET https://financialmodelingprep.com/stable/ratings-historical?symbol=AAPL`

Note: maximum `10000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 1 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `rating` | string |
| `overallScore` | integer |
| `discountedCashFlowScore` | integer |
| `returnOnEquityScore` | integer |
| `returnOnAssetsScore` | integer |
| `debtToEquityScore` | integer |
| `priceToEarningsScore` | integer |
| `priceToBookScore` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "date": "2025-02-04",
    "rating": "A-",
    "overallScore": 4,
    "discountedCashFlowScore": 3,
    "returnOnEquityScore": 5,
    "returnOnAssetsScore": 5,
    "debtToEquityScore": 4,
    "priceToEarningsScore": 2,
    "priceToBookScore": 1
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/historical-ratings

### Price Target Summary API

Gain insights into analysts' expectations for stock prices with the FMP Price Target Summary API. This API provides access to average price targets from analysts across various timeframes, helping investors assess future stock performance based on expert opinions.

**Endpoint**

`GET https://financialmodelingprep.com/stable/price-target-summary?symbol=AAPL`

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
| `lastMonthCount` | integer |
| `lastMonthAvgPriceTarget` | number |
| `lastQuarterCount` | integer |
| `lastQuarterAvgPriceTarget` | number |
| `lastYearCount` | integer |
| `lastYearAvgPriceTarget` | number |
| `allTimeCount` | integer |
| `allTimeAvgPriceTarget` | number |
| `publishers` | string |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "lastMonthCount": 1,
    "lastMonthAvgPriceTarget": 200.75,
    "lastQuarterCount": 3,
    "lastQuarterAvgPriceTarget": 204.2,
    "lastYearCount": 48,
    "lastYearAvgPriceTarget": 232.99,
    "allTimeCount": 167,
    "allTimeAvgPriceTarget": 201.21,
    "publishers": "[\"Benzinga\",\"StreetInsider\",\"TheFly\",\"Pulse 2.0\",\"TipRanks Contributor\",\"MarketWatch\",\"Investing\",\"Barrons\",\"Investor's…"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/price-target-summary

### Price Target Consensus API

Access analysts' consensus price targets with the FMP Price Target Consensus API. This API provides high, low, median, and consensus price targets for stocks, offering investors a comprehensive view of market expectations for future stock prices.

**Endpoint**

`GET https://financialmodelingprep.com/stable/price-target-consensus?symbol=AAPL`

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
| `targetHigh` | integer |
| `targetLow` | integer |
| `targetConsensus` | number |
| `targetMedian` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "targetHigh": 300,
    "targetLow": 200,
    "targetConsensus": 251.7,
    "targetMedian": 258
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/price-target-consensus

### Stock Grades API

Access the latest stock grades from top analysts and financial institutions with the FMP Grades API. Track grading actions, such as upgrades, downgrades, or maintained ratings, for specific stock symbols, providing valuable insight into how experts evaluate companies over time.

**Endpoint**

`GET https://financialmodelingprep.com/stable/grades?symbol=AAPL`

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
| `gradingCompany` | string |
| `previousGrade` | string |
| `newGrade` | string |
| `action` | string |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "date": "2025-01-31",
    "gradingCompany": "Morgan Stanley",
    "previousGrade": "Overweight",
    "newGrade": "Overweight",
    "action": "maintain"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/grades

### Historical Stock Grades API

Access a comprehensive record of analyst grades with the FMP Historical Grades API. This tool allows you to track historical changes in analyst ratings for specific stock symbol

**Endpoint**

`GET https://financialmodelingprep.com/stable/grades-historical?symbol=AAPL`

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
| `analystRatingsBuy` | integer |
| `analystRatingsHold` | integer |
| `analystRatingsSell` | integer |
| `analystRatingsStrongSell` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "date": "2025-02-01",
    "analystRatingsBuy": 8,
    "analystRatingsHold": 14,
    "analystRatingsSell": 2,
    "analystRatingsStrongSell": 2
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/historical-grades

### Stock Grades Summary API

Quickly access an overall view of analyst ratings with the FMP Grades Summary API. This API provides a consolidated summary of market sentiment for individual stock symbols, including the total number of strong buy, buy, hold, sell, and strong sell ratings. Understand the overall consensus on a stockâs outlook with just a few data points.

**Endpoint**

`GET https://financialmodelingprep.com/stable/grades-consensus?symbol=AAPL`

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
| `strongBuy` | integer |
| `buy` | integer |
| `hold` | integer |
| `sell` | integer |
| `strongSell` | integer |
| `consensus` | string |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "strongBuy": 1,
    "buy": 29,
    "hold": 11,
    "sell": 4,
    "strongSell": 0,
    "consensus": "Buy"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/grades-summary
