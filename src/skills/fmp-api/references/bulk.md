# FMP API Group: Bulk

Source: https://site.financialmodelingprep.com/developer/docs#bulk

Endpoints: 18

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Company Profile Bulk API

The FMP Profile Bulk API allows users to retrieve comprehensive company profile data in bulk. Access essential information, such as company details, stock price, market cap, sector, industry, and more for multiple companies in a single request.

**Endpoint**

`GET https://financialmodelingprep.com/stable/profile-bulk?part=0`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| part* | string | 0 |

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
    "price": 271.36,
    "marketCap": 4009711150080,
    "beta": 1.107,
    "lastDividend": 1.03,
    "range": "169.21-288.62",
    "change": -0.83,
    "changePercentage": -0.30493,
    "volume": 44494594,
    "averageVolume": 48811139,
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

Docs: https://site.financialmodelingprep.com/developer/docs/stable/profile-bulk

### Stock Rating Bulk API

The FMP Rating Bulk API provides users with comprehensive rating data for multiple stocks in a single request. Retrieve key financial ratings and recommendations such as overall ratings, DCF recommendations, and more for multiple companies at once.

**Endpoint**

`GET https://financialmodelingprep.com/stable/rating-bulk`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `rating` | string |
| `discountedCashFlowScore` | string |
| `returnOnEquityScore` | string |
| `returnOnAssetsScore` | string |
| `debtToEquityScore` | string |
| `priceToEarningsScore` | string |
| `priceToBookScore` | string |

Sample:

```json
[
  {
    "symbol": "000001.SZ",
    "date": "2025-07-09",
    "rating": "B+",
    "discountedCashFlowScore": "5",
    "returnOnEquityScore": "3",
    "returnOnAssetsScore": "2",
    "debtToEquityScore": "1",
    "priceToEarningsScore": "4",
    "priceToBookScore": "4"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/rating-bulk

### DCF Valuations Bulk API

The FMP DCF Bulk API enables users to quickly retrieve discounted cash flow (DCF) valuations for multiple symbols in one request. Access the implied price movement and percentage differences for all listed companies.

**Endpoint**

`GET https://financialmodelingprep.com/stable/dcf-bulk`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `dcf` | string |
| `Stock Price` | string |

Sample:

```json
[
  {
    "symbol": "000002.SZ",
    "date": "2025-07-09",
    "dcf": "179.6654688379575",
    "Stock Price": "6.54"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/dcf-bulk

### Financial Scores Bulk API

The FMP Scores Bulk API allows users to quickly retrieve a wide range of key financial scores and metrics for multiple symbols. These scores provide valuable insights into company performance, financial health, and operational efficiency.

**Endpoint**

`GET https://financialmodelingprep.com/stable/scores-bulk`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `reportedCurrency` | string |
| `altmanZScore` | string |
| `piotroskiScore` | string |
| `workingCapital` | string |
| `totalAssets` | string |
| `retainedEarnings` | string |
| `ebit` | string |
| `marketCap` | string |
| `totalLiabilities` | string |
| `revenue` | string |

Sample:

```json
[
  {
    "symbol": "000001.SZ",
    "reportedCurrency": "CNY",
    "altmanZScore": "0.29153682196643543",
    "piotroskiScore": "5",
    "workingCapital": "746131000000",
    "totalAssets": "5777858000000",
    "retainedEarnings": "255621000000",
    "ebit": "32590000000",
    "marketCap": "236751980000",
    "totalLiabilities": "5271746000000",
    "revenue": "167996000000"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/scores-bulk

### Price Target Summary Bulk API

The Price Target Summary Bulk API provides a comprehensive overview of price targets for all listed symbols over multiple timeframes. With this API, users can quickly retrieve price target data, helping investors and analysts compare current prices to projected targets across different periods.

**Endpoint**

`GET https://financialmodelingprep.com/stable/price-target-summary-bulk`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `lastMonthCount` | string |
| `lastMonthAvgPriceTarget` | string |
| `lastQuarterCount` | string |
| `lastQuarterAvgPriceTarget` | string |
| `lastYearCount` | string |
| `lastYearAvgPriceTarget` | string |
| `allTimeCount` | string |
| `allTimeAvgPriceTarget` | string |
| `publishers` | string |

Sample:

```json
[
  {
    "symbol": "A",
    "lastMonthCount": "0",
    "lastMonthAvgPriceTarget": "0",
    "lastQuarterCount": "1",
    "lastQuarterAvgPriceTarget": "116",
    "lastYearCount": "6",
    "lastYearAvgPriceTarget": "142.17",
    "allTimeCount": "18",
    "allTimeAvgPriceTarget": "146.61",
    "publishers": "[\"\"TheFly\""
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/price-target-summary-bulk

### ETF Holder Bulk API

The ETF Holder Bulk API allows users to quickly retrieve detailed information about the assets and shares held by Exchange-Traded Funds (ETFs). This API provides insights into the weight each asset carries within the ETF, along with key financial information related to these holdings.

**Endpoint**

`GET https://financialmodelingprep.com/stable/etf-holder-bulk?part=1`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| part* | string | 1 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `name` | string |
| `sharesNumber` | string |
| `asset` | string |
| `weightPercentage` | string |
| `cusip` | string |
| `isin` | string |
| `marketValue` | string |
| `lastUpdated"` | string |

Sample:

```json
[
  {
    "symbol": "EXCH.AS",
    "name": "SAMSUNG ELECTRO MECHANICS LTD",
    "sharesNumber": "15514",
    "asset": "009150.KS",
    "weightPercentage": "0.09611",
    "cusip": "",
    "isin": "KR7009150004",
    "marketValue": "1553142.49",
    "lastUpdated\"": "2024-09-06\""
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/etf-holder-bulk

### Upgrades Downgrades Consensus Bulk API

The Upgrades Downgrades Consensus Bulk API provides a comprehensive view of analyst ratings across all symbols. Retrieve bulk data for analyst upgrades, downgrades, and consensus recommendations to gain insights into the market's outlook on individual stocks.

**Endpoint**

`GET https://financialmodelingprep.com/stable/upgrades-downgrades-consensus-bulk`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `strongBuy` | string |
| `buy` | string |
| `hold` | string |
| `sell` | string |
| `strongSell` | string |
| `consensus` | string |

Sample:

```json
[
  {
    "symbol": "",
    "strongBuy": "0",
    "buy": "1",
    "hold": "1",
    "sell": "0",
    "strongSell": "0",
    "consensus": "Buy"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/upgrades-downgrades-consensus-bulk

### Key Metrics TTM Bulk API

The Key Metrics TTM Bulk API allows users to retrieve trailing twelve months (TTM) data for all companies available in the database. The API provides critical financial ratios and metrics based on each companyâs latest financial report, offering insights into company performance and financial health.

**Endpoint**

`GET https://financialmodelingprep.com/stable/key-metrics-ttm-bulk`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `marketCap` | string |
| `enterpriseValueTTM` | string |
| `evToSalesTTM` | string |
| `evToOperatingCashFlowTTM` | string |
| `evToFreeCashFlowTTM` | string |
| `evToEBITDATTM` | string |
| `netDebtToEBITDATTM` | string |
| `currentRatioTTM` | string |
| `incomeQualityTTM` | string |
| `grahamNumberTTM` | string |
| `grahamNetNetTTM` | string |
| `taxBurdenTTM` | string |
| `interestBurdenTTM` | string |
| `workingCapitalTTM` | string |
| `investedCapitalTTM` | string |
| `returnOnAssetsTTM` | string |
| `operatingReturnOnAssetsTTM` | string |
| `returnOnTangibleAssetsTTM` | string |
| `returnOnEquityTTM` | string |
| `returnOnInvestedCapitalTTM` | string |
| `returnOnCapitalEmployedTTM` | string |
| `earningsYieldTTM` | string |
| `freeCashFlowYieldTTM` | string |
| `capexToOperatingCashFlowTTM` | string |
| `capexToDepreciationTTM` | string |
| `capexToRevenueTTM` | string |
| `salesGeneralAndAdministrativeToRevenueTTM` | string |
| `researchAndDevelopementToRevenueTTM` | string |
| `stockBasedCompensationToRevenueTTM` | string |
| `intangiblesToTotalAssetsTTM` | string |
| `averageReceivablesTTM` | string |
| `averagePayablesTTM` | string |
| `averageInventoryTTM` | string |
| `daysOfSalesOutstandingTTM` | string |
| `daysOfPayablesOutstandingTTM` | string |
| `daysOfInventoryOutstandingTTM` | string |
| `operatingCycleTTM` | string |
| `cashConversionCycleTTM` | string |
| `freeCashFlowToEquityTTM` | string |
| `freeCashFlowToFirmTTM` | string |
| `tangibleAssetValueTTM` | string |
| `netCurrentAssetValueTTM` | string |

Sample:

```json
[
  {
    "symbol": "000001.SZ",
    "marketCap": "249171756000",
    "enterpriseValueTTM": "-496959244000",
    "evToSalesTTM": "-2.95816117050406",
    "evToOperatingCashFlowTTM": "-2.9831814247210167",
    "evToFreeCashFlowTTM": "-3.028355803098073",
    "evToEBITDATTM": "-14.656106051669223",
    "netDebtToEBITDATTM": "-22.004571192638906",
    "currentRatioTTM": "0",
    "incomeQualityTTM": "15.217593861331872",
    "grahamNumberTTM": "31.017865999534138",
    "grahamNetNetTTM": "-199.05514330278228",
    "taxBurdenTTM": "0.8225101702576465",
    "interestBurdenTTM": "1.4030970878917606",
    "workingCapitalTTM": "746131000000",
    "investedCapitalTTM": "772543000000",
    "returnOnAssetsTTM": "0.007558510437605078",
    "operatingReturnOnAssetsTTM": "0.013555578495362656",
    "returnOnTangibleAssetsTTM": "0.007576346366296015",
    "returnOnEquityTTM": "0.09082717681735725",
    "returnOnInvestedCapitalTTM": "0.011141314993384131",
    "returnOnCapitalEmployedTTM": "0.013545504233575834",
    "earningsYieldTTM": "0.14960077934639543",
    "freeCashFlowYieldTTM": "0.6585898925077207",
    "capexToOperatingCashFlowTTM": "0.014917130388325619",
    "capexToDepreciationTTM": "1.855862584017924",
    "capexToRevenueTTM": "0.014792018857591847",
    "salesGeneralAndAdministrativeToRevenueTTM": "0.10163337222314817",
    "researchAndDevelopementToRevenueTTM": "0",
    "stockBasedCompensationToRevenueTTM": "0",
    "intangiblesToTotalAssetsTTM": "0.002354159621091415",
    "averageReceivablesTTM": "0",
    "averagePayablesTTM": "0",
    "averageInventoryTTM": "0",
    "daysOfSalesOutstandingTTM": "0",
    "daysOfPayablesOutstandingTTM": "0",
    "daysOfInventoryOutstandingTTM": "0",
    "operatingCycleTTM": "0",
    "cashConversionCycleTTM": "0",
    "freeCashFlowToEquityTTM": "910233000000",
    "...": "3 more fields"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/key-metrics-ttm-bulk

### Ratios TTM Bulk API

The Ratios TTM Bulk API offers an efficient way to retrieve trailing twelve months (TTM) financial ratios for stocks. It provides users with detailed insights into a companyâs profitability, liquidity, efficiency, leverage, and valuation ratios, all based on the most recent financial report.

**Endpoint**

`GET https://financialmodelingprep.com/stable/ratios-ttm-bulk`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `grossProfitMarginTTM` | string |
| `ebitMarginTTM` | string |
| `ebitdaMarginTTM` | string |
| `operatingProfitMarginTTM` | string |
| `pretaxProfitMarginTTM` | string |
| `continuousOperationsProfitMarginTTM` | string |
| `netProfitMarginTTM` | string |
| `bottomLineProfitMarginTTM` | string |
| `receivablesTurnoverTTM` | string |
| `payablesTurnoverTTM` | string |
| `inventoryTurnoverTTM` | string |
| `fixedAssetTurnoverTTM` | string |
| `assetTurnoverTTM` | string |
| `currentRatioTTM` | string |
| `quickRatioTTM` | string |
| `solvencyRatioTTM` | string |
| `cashRatioTTM` | string |
| `priceToEarningsRatioTTM` | string |
| `priceToEarningsGrowthRatioTTM` | string |
| `forwardPriceToEarningsGrowthRatioTTM` | string |
| `priceToBookRatioTTM` | string |
| `priceToSalesRatioTTM` | string |
| `priceToFreeCashFlowRatioTTM` | string |
| `priceToOperatingCashFlowRatioTTM` | string |
| `debtToAssetsRatioTTM` | string |
| `debtToEquityRatioTTM` | string |
| `debtToCapitalRatioTTM` | string |
| `longTermDebtToCapitalRatioTTM` | string |
| `financialLeverageRatioTTM` | string |
| `workingCapitalTurnoverRatioTTM` | string |
| `operatingCashFlowRatioTTM` | string |
| `operatingCashFlowSalesRatioTTM` | string |
| `freeCashFlowOperatingCashFlowRatioTTM` | string |
| `debtServiceCoverageRatioTTM` | string |
| `interestCoverageRatioTTM` | string |
| `shortTermOperatingCashFlowCoverageRatioTTM` | string |
| `operatingCashFlowCoverageRatioTTM` | string |
| `capitalExpenditureCoverageRatioTTM` | string |
| `dividendPaidAndCapexCoverageRatioTTM` | string |
| `dividendPayoutRatioTTM` | string |
| `dividendYieldTTM` | string |
| `enterpriseValueTTM` | string |
| `revenuePerShareTTM` | string |
| `netIncomePerShareTTM` | string |
| `interestDebtPerShareTTM` | string |
| `cashPerShareTTM` | string |
| `bookValuePerShareTTM` | string |
| `tangibleBookValuePerShareTTM` | string |
| `shareholdersEquityPerShareTTM` | string |
| `operatingCashFlowPerShareTTM` | string |
| `capexPerShareTTM` | string |
| `freeCashFlowPerShareTTM` | string |
| `netIncomePerEBTTTM` | string |
| `ebtPerEbitTTM` | string |
| `priceToFairValueTTM` | string |
| `debtToMarketCapTTM` | string |
| `effectiveTaxRateTTM` | string |
| `enterpriseValueMultipleTTM` | string |
| `dividendPerShareTTM` | string |
| `...` | additional fields omitted |

Sample:

```json
[
  {
    "symbol": "000001.SZ",
    "grossProfitMarginTTM": "1.1622776732779352",
    "ebitMarginTTM": "0.22525536322293388",
    "ebitdaMarginTTM": "0.2018381390033096",
    "operatingProfitMarginTTM": "0.4658682349579752",
    "pretaxProfitMarginTTM": "0.3160551441700993",
    "continuousOperationsProfitMarginTTM": "0.25995857044215337",
    "netProfitMarginTTM": "0.25995857044215337",
    "bottomLineProfitMarginTTM": "0.25995857044215337",
    "receivablesTurnoverTTM": "0",
    "payablesTurnoverTTM": "0",
    "inventoryTurnoverTTM": "0",
    "fixedAssetTurnoverTTM": "13.114441842310695",
    "assetTurnoverTTM": "0.029075827062555015",
    "currentRatioTTM": "0",
    "quickRatioTTM": "0",
    "solvencyRatioTTM": "0.008534174446189174",
    "cashRatioTTM": "0",
    "priceToEarningsRatioTTM": "6.68445715569793",
    "priceToEarningsGrowthRatioTTM": "-3.6096068640768793",
    "forwardPriceToEarningsGrowthRatioTTM": "2.4481492401413427",
    "priceToBookRatioTTM": "0.576796465809228",
    "priceToSalesRatioTTM": "1.483200528584014",
    "priceToFreeCashFlowRatioTTM": "1.518395607609901",
    "priceToOperatingCashFlowRatioTTM": "1.7523793147342828",
    "debtToAssetsRatioTTM": "0",
    "debtToEquityRatioTTM": "0",
    "debtToCapitalRatioTTM": "0",
    "longTermDebtToCapitalRatioTTM": "0",
    "financialLeverageRatioTTM": "11.416164801466868",
    "workingCapitalTurnoverRatioTTM": "0.23544250931631752",
    "operatingCashFlowRatioTTM": "0",
    "operatingCashFlowSalesRatioTTM": "0.991612895545132",
    "freeCashFlowOperatingCashFlowRatioTTM": "0.9850828696116743",
    "debtServiceCoverageRatioTTM": "0.24758322210087771",
    "interestCoverageRatioTTM": "0.7914088096104842",
    "shortTermOperatingCashFlowCoverageRatioTTM": "0",
    "operatingCashFlowCoverageRatioTTM": "0",
    "capitalExpenditureCoverageRatioTTM": "67.03702213279678",
    "dividendPaidAndCapexCoverageRatioTTM": "6.192364879934577",
    "...": "20 more fields"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/ratios-ttm-bulk

### Stock Peers Bulk API

The Stock Peers Bulk API allows you to quickly retrieve a comprehensive list of peer companies for all stocks in the database. By accessing this data, you can easily compare a stockâs performance with its closest competitors or similar companies within the same industry or sector.

**Endpoint**

`GET https://financialmodelingprep.com/stable/peers-bulk`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `peers` | string |

Sample:

```json
[
  {
    "symbol": "000001.SZ",
    "peers": "600036.SS"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/peers-bulk

### Earnings Surprises Bulk API

The Earnings Surprises Bulk API allows users to retrieve bulk data on annual earnings surprises, enabling quick analysis of which companies have beaten, missed, or met their earnings estimates. This API provides actual versus estimated earnings per share (EPS) for multiple companies at once, offering valuable insights for investors and analysts.

**Endpoint**

`GET https://financialmodelingprep.com/stable/earnings-surprises-bulk?year=2026`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| year* | string | 2026 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `epsActual` | string |
| `epsEstimated` | string |
| `lastUpdated` | string |

Sample:

```json
[
  {
    "symbol": "AMKYF",
    "date": "2025-07-09",
    "epsActual": "0.3631",
    "epsEstimated": "0.3615",
    "lastUpdated": "2025-07-09"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/earnings-surprises-bulk

### Income Statement Bulk API

The Bulk Income Statement API allows users to retrieve detailed income statement data in bulk. This API is designed for large-scale data analysis, providing comprehensive insights into a company's financial performance, including revenue, gross profit, expenses, and net income.

**Endpoint**

`GET https://financialmodelingprep.com/stable/income-statement-bulk?year=2026&period=Q1`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| year* | string | 2026 |
| period* | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY` |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `symbol` | string |
| `reportedCurrency` | string |
| `cik` | string |
| `filingDate` | string |
| `acceptedDate` | string |
| `fiscalYear` | string |
| `period` | string |
| `revenue` | string |
| `costOfRevenue` | string |
| `grossProfit` | string |
| `researchAndDevelopmentExpenses` | string |
| `generalAndAdministrativeExpenses` | string |
| `sellingAndMarketingExpenses` | string |
| `sellingGeneralAndAdministrativeExpenses` | string |
| `otherExpenses` | string |
| `operatingExpenses` | string |
| `costAndExpenses` | string |
| `netInterestIncome` | string |
| `interestIncome` | string |
| `interestExpense` | string |
| `depreciationAndAmortization` | string |
| `ebitda` | string |
| `ebit` | string |
| `nonOperatingIncomeExcludingInterest` | string |
| `operatingIncome` | string |
| `totalOtherIncomeExpensesNet` | string |
| `incomeBeforeTax` | string |
| `incomeTaxExpense` | string |
| `netIncomeFromContinuingOperations` | string |
| `netIncomeFromDiscontinuedOperations` | string |
| `otherAdjustmentsToNetIncome` | string |
| `netIncome` | string |
| `netIncomeDeductions` | string |
| `bottomLineNetIncome` | string |
| `eps` | string |
| `epsDiluted` | string |
| `weightedAverageShsOut` | string |
| `weightedAverageShsOutDil` | string |

Sample:

```json
[
  {
    "date": "2025-03-31",
    "symbol": "000001.SZ",
    "reportedCurrency": "CNY",
    "cik": "0000000000",
    "filingDate": "2025-03-31",
    "acceptedDate": "2025-03-31 00:00:00",
    "fiscalYear": "2025",
    "period": "Q1",
    "revenue": "33644000000",
    "costOfRevenue": "0",
    "grossProfit": "33644000000",
    "researchAndDevelopmentExpenses": "0",
    "generalAndAdministrativeExpenses": "9055000000",
    "sellingAndMarketingExpenses": "0",
    "sellingGeneralAndAdministrativeExpenses": "9055000000",
    "otherExpenses": "314000000",
    "operatingExpenses": "9369000000",
    "costAndExpenses": "9369000000",
    "netInterestIncome": "22788000000",
    "interestIncome": "44938000000",
    "interestExpense": "22150000000",
    "depreciationAndAmortization": "0",
    "ebitda": "16802000000",
    "ebit": "0",
    "nonOperatingIncomeExcludingInterest": "24275000000",
    "operatingIncome": "24275000000",
    "totalOtherIncomeExpensesNet": "-7392000000",
    "incomeBeforeTax": "16883000000",
    "incomeTaxExpense": "2787000000",
    "netIncomeFromContinuingOperations": "14096000000",
    "netIncomeFromDiscontinuedOperations": "0",
    "otherAdjustmentsToNetIncome": "0",
    "netIncome": "14096000000",
    "netIncomeDeductions": "0",
    "bottomLineNetIncome": "14096000000",
    "eps": "0.62",
    "epsDiluted": "0.62",
    "weightedAverageShsOut": "22735483871",
    "weightedAverageShsOutDil": "22735483871"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/income-statement-bulk

### Income Statement Growth Bulk API

The Bulk Income Statement Growth API provides access to growth data for income statements across multiple companies. Track and analyze growth trends over time for key financial metrics such as revenue, net income, and operating income, enabling a better understanding of corporate performance trends.

**Endpoint**

`GET https://financialmodelingprep.com/stable/income-statement-growth-bulk?year=2026&period=Q1`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| year* | string | 2026 |
| period* | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY` |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `fiscalYear` | string |
| `period` | string |
| `reportedCurrency` | string |
| `growthRevenue` | string |
| `growthCostOfRevenue` | string |
| `growthGrossProfit` | string |
| `growthGrossProfitRatio` | string |
| `growthResearchAndDevelopmentExpenses` | string |
| `growthGeneralAndAdministrativeExpenses` | string |
| `growthSellingAndMarketingExpenses` | string |
| `growthOtherExpenses` | string |
| `growthOperatingExpenses` | string |
| `growthCostAndExpenses` | string |
| `growthInterestIncome` | string |
| `growthInterestExpense` | string |
| `growthDepreciationAndAmortization` | string |
| `growthEBITDA` | string |
| `growthOperatingIncome` | string |
| `growthIncomeBeforeTax` | string |
| `growthIncomeTaxExpense` | string |
| `growthNetIncome` | string |
| `growthEPS` | string |
| `growthEPSDiluted` | string |
| `growthWeightedAverageShsOut` | string |
| `growthWeightedAverageShsOutDil` | string |
| `growthEBIT` | string |
| `growthNonOperatingIncomeExcludingInterest` | string |
| `growthNetInterestIncome` | string |
| `growthTotalOtherIncomeExpensesNet` | string |
| `growthNetIncomeFromContinuingOperations` | string |
| `growthOtherAdjustmentsToNetIncome` | string |
| `growthNetIncomeDeductions` | string |

Sample:

```json
[
  {
    "symbol": "000001.SZ",
    "date": "2025-03-31",
    "fiscalYear": "2025",
    "period": "Q1",
    "reportedCurrency": "CNY",
    "growthRevenue": "-0.04159070191431176",
    "growthCostOfRevenue": "0",
    "growthGrossProfit": "-0.04159070191431176",
    "growthGrossProfitRatio": "0",
    "growthResearchAndDevelopmentExpenses": "0",
    "growthGeneralAndAdministrativeExpenses": "1.7466809598416757",
    "growthSellingAndMarketingExpenses": "0",
    "growthOtherExpenses": "-0.9860376183912135",
    "growthOperatingExpenses": "-0.095830920671685",
    "growthCostAndExpenses": "-0.095830920671685",
    "growthInterestIncome": "-0.003105727849505302",
    "growthInterestExpense": "-0.08421879522057303",
    "growthDepreciationAndAmortization": "0",
    "growthEBITDA": "0",
    "growthOperatingIncome": "-0.018874787810201278",
    "growthIncomeBeforeTax": "1.4139262224764084",
    "growthIncomeTaxExpense": "0.2582392776523702",
    "growthNetIncome": "1.9495710399665203",
    "growthEPS": "1.6956521739130435",
    "growthEPSDiluted": "1.6956521739130435",
    "growthWeightedAverageShsOut": "0.09825852256371011",
    "growthWeightedAverageShsOutDil": "0.09825852256371011",
    "growthEBIT": "1",
    "growthNonOperatingIncomeExcludingInterest": "-0.5659209985158163",
    "growthNetInterestIncome": "0.09080465272126753",
    "growthTotalOtherIncomeExpensesNet": "0.5835023664638269",
    "growthNetIncomeFromContinuingOperations": "1.9495710399665203",
    "growthOtherAdjustmentsToNetIncome": "0",
    "growthNetIncomeDeductions": "0"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/income-statement-growth-bulk

### Balance Sheet Statement Bulk API

The Bulk Balance Sheet Statement API provides comprehensive access to balance sheet data across multiple companies. It enables users to analyze financial positions by retrieving key figures such as total assets, liabilities, and equity. Ideal for comparing the financial health and stability of different companies on a large scale.

**Endpoint**

`GET https://financialmodelingprep.com/stable/balance-sheet-statement-bulk?year=2026&period=Q1`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| year* | string | 2026 |
| period* | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY` |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `symbol` | string |
| `reportedCurrency` | string |
| `cik` | string |
| `filingDate` | string |
| `acceptedDate` | string |
| `fiscalYear` | string |
| `period` | string |
| `cashAndCashEquivalents` | string |
| `shortTermInvestments` | string |
| `cashAndShortTermInvestments` | string |
| `netReceivables` | string |
| `accountsReceivables` | string |
| `otherReceivables` | string |
| `inventory` | string |
| `prepaids` | string |
| `otherCurrentAssets` | string |
| `totalCurrentAssets` | string |
| `propertyPlantEquipmentNet` | string |
| `goodwill` | string |
| `intangibleAssets` | string |
| `goodwillAndIntangibleAssets` | string |
| `longTermInvestments` | string |
| `taxAssets` | string |
| `otherNonCurrentAssets` | string |
| `totalNonCurrentAssets` | string |
| `otherAssets` | string |
| `totalAssets` | string |
| `totalPayables` | string |
| `accountPayables` | string |
| `otherPayables` | string |
| `accruedExpenses` | string |
| `shortTermDebt` | string |
| `capitalLeaseObligationsCurrent` | string |
| `taxPayables` | string |
| `deferredRevenue` | string |
| `otherCurrentLiabilities` | string |
| `totalCurrentLiabilities` | string |
| `longTermDebt` | string |
| `capitalLeaseObligationsNonCurrent` | string |
| `deferredRevenueNonCurrent` | string |
| `deferredTaxLiabilitiesNonCurrent` | string |
| `otherNonCurrentLiabilities` | string |
| `totalNonCurrentLiabilities` | string |
| `otherLiabilities` | string |
| `capitalLeaseObligations` | string |
| `totalLiabilities` | string |
| `treasuryStock` | string |
| `preferredStock` | string |
| `commonStock` | string |
| `retainedEarnings` | string |
| `additionalPaidInCapital` | string |
| `accumulatedOtherComprehensiveIncomeLoss` | string |
| `otherTotalStockholdersEquity` | string |
| `totalStockholdersEquity` | string |
| `totalEquity` | string |
| `minorityInterest` | string |
| `totalLiabilitiesAndTotalEquity` | string |
| `totalInvestments` | string |
| `totalDebt` | string |
| `...` | additional fields omitted |

Sample:

```json
[
  {
    "date": "2025-03-31",
    "symbol": "MTLRP.ME",
    "reportedCurrency": "RUB",
    "cik": "0000000000",
    "filingDate": "2025-05-31",
    "acceptedDate": "2025-03-31 07:00:00",
    "fiscalYear": "2025",
    "period": "Q1",
    "cashAndCashEquivalents": "1985000",
    "shortTermInvestments": "0",
    "cashAndShortTermInvestments": "1985000",
    "netReceivables": "9666577000",
    "accountsReceivables": "9666577000",
    "otherReceivables": "0",
    "inventory": "4520000",
    "prepaids": "0",
    "otherCurrentAssets": "27293000",
    "totalCurrentAssets": "9700830000",
    "propertyPlantEquipmentNet": "194000",
    "goodwill": "0",
    "intangibleAssets": "5665000",
    "goodwillAndIntangibleAssets": "5665000",
    "longTermInvestments": "237373355000",
    "taxAssets": "791813000",
    "otherNonCurrentAssets": "0",
    "totalNonCurrentAssets": "238171027000",
    "otherAssets": "0",
    "totalAssets": "247871857000",
    "totalPayables": "3861497000",
    "accountPayables": "3861497000",
    "otherPayables": "0",
    "accruedExpenses": "0",
    "shortTermDebt": "4842848000",
    "capitalLeaseObligationsCurrent": "0",
    "taxPayables": "2484576000",
    "deferredRevenue": "0",
    "otherCurrentLiabilities": "146647000",
    "totalCurrentLiabilities": "8851455000",
    "longTermDebt": "178923999000",
    "capitalLeaseObligationsNonCurrent": "0",
    "...": "21 more fields"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/balance-sheet-statement-bulk

### Balance Sheet Statement Growth Bulk API

The Balance Sheet Growth Bulk API allows users to retrieve growth data across multiple companiesâ balance sheets, enabling detailed analysis of how financial positions have changed over time.

**Endpoint**

`GET https://financialmodelingprep.com/stable/balance-sheet-statement-growth-bulk?year=2026&period=Q1`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| year* | string | 2026 |
| period* | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY` |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `fiscalYear` | string |
| `period` | string |
| `reportedCurrency` | string |
| `growthCashAndCashEquivalents` | string |
| `growthShortTermInvestments` | string |
| `growthCashAndShortTermInvestments` | string |
| `growthNetReceivables` | string |
| `growthInventory` | string |
| `growthOtherCurrentAssets` | string |
| `growthTotalCurrentAssets` | string |
| `growthPropertyPlantEquipmentNet` | string |
| `growthGoodwill` | string |
| `growthIntangibleAssets` | string |
| `growthGoodwillAndIntangibleAssets` | string |
| `growthLongTermInvestments` | string |
| `growthTaxAssets` | string |
| `growthOtherNonCurrentAssets` | string |
| `growthTotalNonCurrentAssets` | string |
| `growthOtherAssets` | string |
| `growthTotalAssets` | string |
| `growthAccountPayables` | string |
| `growthShortTermDebt` | string |
| `growthTaxPayables` | string |
| `growthDeferredRevenue` | string |
| `growthOtherCurrentLiabilities` | string |
| `growthTotalCurrentLiabilities` | string |
| `growthLongTermDebt` | string |
| `growthDeferredRevenueNonCurrent` | string |
| `growthDeferredTaxLiabilitiesNonCurrent` | string |
| `growthOtherNonCurrentLiabilities` | string |
| `growthTotalNonCurrentLiabilities` | string |
| `growthOtherLiabilities` | string |
| `growthTotalLiabilities` | string |
| `growthPreferredStock` | string |
| `growthCommonStock` | string |
| `growthRetainedEarnings` | string |
| `growthAccumulatedOtherComprehensiveIncomeLoss` | string |
| `growthOthertotalStockholdersEquity` | string |
| `growthTotalStockholdersEquity` | string |
| `growthMinorityInterest` | string |
| `growthTotalEquity` | string |
| `growthTotalLiabilitiesAndStockholdersEquity` | string |
| `growthTotalInvestments` | string |
| `growthTotalDebt` | string |
| `growthNetDebt` | string |
| `growthAccountsReceivables` | string |
| `growthOtherReceivables` | string |
| `growthPrepaids` | string |
| `growthTotalPayables` | string |
| `growthOtherPayables` | string |
| `growthAccruedExpenses` | string |
| `growthCapitalLeaseObligationsCurrent` | string |
| `growthAdditionalPaidInCapital` | string |
| `growthTreasuryStock` | string |

Sample:

```json
[
  {
    "symbol": "000001.SZ",
    "date": "2025-03-31",
    "fiscalYear": "2025",
    "period": "Q1",
    "reportedCurrency": "CNY",
    "growthCashAndCashEquivalents": "0.09574482145872953",
    "growthShortTermInvestments": "0",
    "growthCashAndShortTermInvestments": "0.09574482145872953",
    "growthNetReceivables": "0",
    "growthInventory": "0",
    "growthOtherCurrentAssets": "0",
    "growthTotalCurrentAssets": "0.09574482145872953",
    "growthPropertyPlantEquipmentNet": "-0.06373337231398918",
    "growthGoodwill": "0",
    "growthIntangibleAssets": "-0.03270278935556268",
    "growthGoodwillAndIntangibleAssets": "-0.01477618426770969",
    "growthLongTermInvestments": "-0.0774117797082201",
    "growthTaxAssets": "0",
    "growthOtherNonCurrentAssets": "0.07678934705504345",
    "growthTotalNonCurrentAssets": "-0.01112505367669385",
    "growthOtherAssets": "0.001488576544346165",
    "growthTotalAssets": "0.001488576544346165",
    "growthAccountPayables": "0",
    "growthShortTermDebt": "0",
    "growthTaxPayables": "-0.0279424216765453",
    "growthDeferredRevenue": "0",
    "growthOtherCurrentLiabilities": "0.12022416350749959",
    "growthTotalCurrentLiabilities": "0",
    "growthLongTermDebt": "0",
    "growthDeferredRevenueNonCurrent": "0",
    "growthDeferredTaxLiabilitiesNonCurrent": "0",
    "growthOtherNonCurrentLiabilities": "0",
    "growthTotalNonCurrentLiabilities": "0",
    "growthOtherLiabilities": "-0.0005084911577141635",
    "growthTotalLiabilities": "-0.0005084911577141635",
    "growthPreferredStock": "0",
    "growthCommonStock": "0",
    "growthRetainedEarnings": "0.049325752755485314",
    "growthAccumulatedOtherComprehensiveIncomeLoss": "0",
    "growthOthertotalStockholdersEquity": "-0.0035208940994345805",
    "...": "16 more fields"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/balance-sheet-statement-growth-bulk

### Cash Flow Statement Bulk API

The Cash Flow Statement Bulk API provides access to detailed cash flow reports for a wide range of companies. This API enables users to retrieve bulk cash flow statement data, helping to analyze companiesâ operating, investing, and financing activities over time.

**Endpoint**

`GET https://financialmodelingprep.com/stable/cash-flow-statement-bulk?year=2026&period=Q1`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| year* | string | 2026 |
| period* | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY` |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `symbol` | string |
| `reportedCurrency` | string |
| `cik` | string |
| `filingDate` | string |
| `acceptedDate` | string |
| `fiscalYear` | string |
| `period` | string |
| `netIncome` | string |
| `depreciationAndAmortization` | string |
| `deferredIncomeTax` | string |
| `stockBasedCompensation` | string |
| `changeInWorkingCapital` | string |
| `accountsReceivables` | string |
| `inventory` | string |
| `accountsPayables` | string |
| `otherWorkingCapital` | string |
| `otherNonCashItems` | string |
| `netCashProvidedByOperatingActivities` | string |
| `investmentsInPropertyPlantAndEquipment` | string |
| `acquisitionsNet` | string |
| `purchasesOfInvestments` | string |
| `salesMaturitiesOfInvestments` | string |
| `otherInvestingActivities` | string |
| `netCashProvidedByInvestingActivities` | string |
| `netDebtIssuance` | string |
| `longTermNetDebtIssuance` | string |
| `shortTermNetDebtIssuance` | string |
| `netStockIssuance` | string |
| `netCommonStockIssuance` | string |
| `commonStockIssuance` | string |
| `commonStockRepurchased` | string |
| `netPreferredStockIssuance` | string |
| `netDividendsPaid` | string |
| `commonDividendsPaid` | string |
| `preferredDividendsPaid` | string |
| `otherFinancingActivities` | string |
| `netCashProvidedByFinancingActivities` | string |
| `effectOfForexChangesOnCash` | string |
| `netChangeInCash` | string |
| `cashAtEndOfPeriod` | string |
| `cashAtBeginningOfPeriod` | string |
| `operatingCashFlow` | string |
| `capitalExpenditure` | string |
| `freeCashFlow` | string |
| `incomeTaxesPaid` | string |
| `interestPaid` | string |

Sample:

```json
[
  {
    "date": "2025-03-31",
    "symbol": "000001.SZ",
    "reportedCurrency": "CNY",
    "cik": "0000000000",
    "filingDate": "2025-03-31",
    "acceptedDate": "2025-03-31 00:00:00",
    "fiscalYear": "2025",
    "period": "Q1",
    "netIncome": "0",
    "depreciationAndAmortization": "0",
    "deferredIncomeTax": "0",
    "stockBasedCompensation": "0",
    "changeInWorkingCapital": "0",
    "accountsReceivables": "0",
    "inventory": "0",
    "accountsPayables": "0",
    "otherWorkingCapital": "0",
    "otherNonCashItems": "162946000000",
    "netCashProvidedByOperatingActivities": "162946000000",
    "investmentsInPropertyPlantAndEquipment": "-338000000",
    "acquisitionsNet": "0",
    "purchasesOfInvestments": "-227916000000",
    "salesMaturitiesOfInvestments": "253172000000",
    "otherInvestingActivities": "25000000",
    "netCashProvidedByInvestingActivities": "24943000000",
    "netDebtIssuance": "0",
    "longTermNetDebtIssuance": "0",
    "shortTermNetDebtIssuance": "0",
    "netStockIssuance": "0",
    "netCommonStockIssuance": "0",
    "commonStockIssuance": "0",
    "commonStockRepurchased": "0",
    "netPreferredStockIssuance": "0",
    "netDividendsPaid": "-2538000000",
    "commonDividendsPaid": "-2538000000",
    "preferredDividendsPaid": "0",
    "otherFinancingActivities": "-155860000000",
    "netCashProvidedByFinancingActivities": "-158398000000",
    "effectOfForexChangesOnCash": "-130000000",
    "netChangeInCash": "29361000000",
    "...": "7 more fields"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cash-flow-statement-bulk

### Cash Flow Statement Growth Bulk API

The Cash Flow Statement Growth Bulk API allows you to retrieve bulk growth data for cash flow statements, enabling you to track changes in cash flows over time. This API is ideal for analyzing the cash flow growth trends of multiple companies simultaneously.

**Endpoint**

`GET https://financialmodelingprep.com/stable/cash-flow-statement-growth-bulk?year=2026&period=Q1`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| year* | string | 2026 |
| period* | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY` |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `fiscalYear` | string |
| `period` | string |
| `reportedCurrency` | string |
| `growthNetIncome` | string |
| `growthDepreciationAndAmortization` | string |
| `growthDeferredIncomeTax` | string |
| `growthStockBasedCompensation` | string |
| `growthChangeInWorkingCapital` | string |
| `growthAccountsReceivables` | string |
| `growthInventory` | string |
| `growthAccountsPayables` | string |
| `growthOtherWorkingCapital` | string |
| `growthOtherNonCashItems` | string |
| `growthNetCashProvidedByOperatingActivites` | string |
| `growthInvestmentsInPropertyPlantAndEquipment` | string |
| `growthAcquisitionsNet` | string |
| `growthPurchasesOfInvestments` | string |
| `growthSalesMaturitiesOfInvestments` | string |
| `growthOtherInvestingActivites` | string |
| `growthNetCashUsedForInvestingActivites` | string |
| `growthDebtRepayment` | string |
| `growthCommonStockIssued` | string |
| `growthCommonStockRepurchased` | string |
| `growthDividendsPaid` | string |
| `growthOtherFinancingActivites` | string |
| `growthNetCashUsedProvidedByFinancingActivities` | string |
| `growthEffectOfForexChangesOnCash` | string |
| `growthNetChangeInCash` | string |
| `growthCashAtEndOfPeriod` | string |
| `growthCashAtBeginningOfPeriod` | string |
| `growthOperatingCashFlow` | string |
| `growthCapitalExpenditure` | string |
| `growthFreeCashFlow` | string |
| `growthNetDebtIssuance` | string |
| `growthLongTermNetDebtIssuance` | string |
| `growthShortTermNetDebtIssuance` | string |
| `growthNetStockIssuance` | string |
| `growthPreferredDividendsPaid` | string |
| `growthIncomeTaxesPaid` | string |
| `growthInterestPaid` | string |

Sample:

```json
[
  {
    "symbol": "000001.SZ",
    "date": "2025-03-31",
    "fiscalYear": "2025",
    "period": "Q1",
    "reportedCurrency": "CNY",
    "growthNetIncome": "0",
    "growthDepreciationAndAmortization": "0",
    "growthDeferredIncomeTax": "0",
    "growthStockBasedCompensation": "0",
    "growthChangeInWorkingCapital": "0",
    "growthAccountsReceivables": "0",
    "growthInventory": "0",
    "growthAccountsPayables": "0",
    "growthOtherWorkingCapital": "0",
    "growthOtherNonCashItems": "3.2072823819457614",
    "growthNetCashProvidedByOperatingActivites": "3.2072823819457614",
    "growthInvestmentsInPropertyPlantAndEquipment": "0.7332280978689818",
    "growthAcquisitionsNet": "0",
    "growthPurchasesOfInvestments": "-0.12254537395030414",
    "growthSalesMaturitiesOfInvestments": "0.3847853673478318",
    "growthOtherInvestingActivites": "-0.8417721518987342",
    "growthNetCashUsedForInvestingActivites": "2.1699343339587243",
    "growthDebtRepayment": "1",
    "growthCommonStockIssued": "0",
    "growthCommonStockRepurchased": "0",
    "growthDividendsPaid": "0.6798284344644885",
    "growthOtherFinancingActivites": "-1.7077146619443309",
    "growthNetCashUsedProvidedByFinancingActivities": "-3.2122934677858628",
    "growthEffectOfForexChangesOnCash": "-1.0731570061902083",
    "growthNetChangeInCash": "2.348938711752274",
    "growthCashAtEndOfPeriod": "0.11426914604625096",
    "growthCashAtBeginningOfPeriod": "-0.07809495106059301",
    "growthOperatingCashFlow": "3.2072823819457614",
    "growthCapitalExpenditure": "0.7332280978689818",
    "growthFreeCashFlow": "3.16553689621649",
    "growthNetDebtIssuance": "1",
    "growthLongTermNetDebtIssuance": "1",
    "growthShortTermNetDebtIssuance": "0",
    "growthNetStockIssuance": "0",
    "growthPreferredDividendsPaid": "0.6798284344644885",
    "...": "2 more fields"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cash-flow-statement-growth-bulk

### Eod Bulk API

The EOD Bulk API allows users to retrieve end-of-day stock price data for multiple symbols in bulk. This API is ideal for financial analysts, traders, and investors who need to assess valuations for a large number of companies.

**Endpoint**

`GET https://financialmodelingprep.com/stable/eod-bulk?date=2024-10-22`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| date* | string | 2024-10-22 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `open` | string |
| `low` | string |
| `high` | string |
| `close` | string |
| `adjClose` | string |
| `volume` | string |

Sample:

```json
[
  {
    "symbol": "EGS745W1C011.CA",
    "date": "2024-10-22",
    "open": "2.67",
    "low": "2.7",
    "high": "2.9",
    "close": "2.93",
    "adjClose": "2.93",
    "volume": "920904"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/eod-bulk
