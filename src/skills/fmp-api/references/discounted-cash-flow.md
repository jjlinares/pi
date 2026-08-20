# FMP API Group: Discounted Cash Flow

Source: https://site.financialmodelingprep.com/developer/docs#discounted-cash-flow

Endpoints: 4

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### DCF Valuation API

Estimate the intrinsic value of a company with the FMP Discounted Cash Flow Valuation API. Calculate the DCF valuation based on expected future cash flows and discount rates.

**Endpoint**

`GET https://financialmodelingprep.com/stable/discounted-cash-flow?symbol=AAPL`

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
| `dcf` | number |
| `Stock Price` | number |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "date": "2026-04-08",
    "dcf": 159.36622443786206,
    "Stock Price": 258.25
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/dcf-advanced

### Levered DCF API

Analyze a companyâs value with the FMP Levered Discounted Cash Flow (DCF) API, which incorporates the impact of debt. This API provides post-debt company valuation, offering investors a more accurate measure of a company's true worth by accounting for its debt obligations.

**Endpoint**

`GET https://financialmodelingprep.com/stable/levered-discounted-cash-flow?symbol=AAPL`

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
| `dcf` | number |
| `Stock Price` | number |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "date": "2026-04-08",
    "dcf": 152.32738976131944,
    "Stock Price": 258.25
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/dcf-levered

### Custom DCF Advanced API

Run a tailored Discounted Cash Flow (DCF) analysis using the FMP Custom DCF Advanced API. With detailed inputs, this API allows users to fine-tune their assumptions and variables, offering a more personalized and precise valuation for a company.

**Endpoint**

`GET https://financialmodelingprep.com/stable/custom-discounted-cash-flow?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| revenueGrowthPct | number | 0.1094119804597946 |
| ebitdaPct | number | 0.31273548388 |
| depreciationAndAmortizationPct | number | 0.0345531631720999 |
| cashAndShortTermInvestmentsPct | number | 0.2344222126801843 |
| receivablesPct | number | 0.1533770531229388 |
| inventoriesPct | number | 0.0155245674227653 |
| payablePct | number | 0.1614868903169657 |
| ebitPct | number | 0.2781823207138459 |
| capitalExpenditurePct | number | 0.0306025847141713 |
| operatingCashFlowPct | number | 0.2886333485760204 |
| sellingGeneralAndAdministrativeExpensesPct | number | 0.0662854095187211 |
| taxRate | number | 0.14919579658453103 |
| longTermGrowthRate | number | 4 |
| costOfDebt | number | 3.64 |
| costOfEquity | number | 9.51168 |
| marketRiskPremium | number | 4.72 |
| beta | number | 1.244 |
| riskFreeRate | number | 3.64 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `year` | string |
| `symbol` | string |
| `revenue` | integer |
| `revenuePercentage` | number |
| `ebitda` | integer |
| `ebitdaPercentage` | number |
| `ebit` | integer |
| `ebitPercentage` | number |
| `depreciation` | integer |
| `depreciationPercentage` | number |
| `totalCash` | integer |
| `totalCashPercentage` | number |
| `receivables` | integer |
| `receivablesPercentage` | number |
| `inventories` | integer |
| `inventoriesPercentage` | number |
| `payable` | integer |
| `payablePercentage` | number |
| `capitalExpenditure` | integer |
| `capitalExpenditurePercentage` | number |
| `price` | number |
| `beta` | number |
| `dilutedSharesOutstanding` | integer |
| `costofDebt` | number |
| `taxRate` | number |
| `afterTaxCostOfDebt` | number |
| `riskFreeRate` | number |
| `marketRiskPremium` | number |
| `costOfEquity` | number |
| `totalDebt` | integer |
| `totalEquity` | integer |
| `totalCapital` | integer |
| `debtWeighting` | number |
| `equityWeighting` | number |
| `wacc` | number |
| `taxRateCash` | integer |
| `ebiat` | integer |
| `ufcf` | integer |
| `sumPvUfcf` | integer |
| `longTermGrowthRate` | integer |
| `terminalValue` | integer |
| `presentTerminalValue` | integer |
| `enterpriseValue` | integer |
| `netDebt` | integer |
| `equityValue` | integer |
| `equityValuePerShare` | number |
| `freeCashFlowT1` | integer |

Sample:

```json
[
  {
    "year": "2030",
    "symbol": "AAPL",
    "revenue": 529528728806,
    "revenuePercentage": 4.09,
    "ebitda": 191125428209,
    "ebitdaPercentage": 36.09,
    "ebit": 177353356628,
    "ebitPercentage": 33.49,
    "depreciation": 15508463644,
    "depreciationPercentage": 2.93,
    "totalCash": 79685715467,
    "totalCashPercentage": 15.05,
    "receivables": 114078294622,
    "receivablesPercentage": 21.54,
    "inventories": 8411056160,
    "inventoriesPercentage": 1.59,
    "payable": 101862682518,
    "payablePercentage": 19.24,
    "capitalExpenditure": -14907445037,
    "capitalExpenditurePercentage": -2.82,
    "price": 262.82,
    "beta": 1.109,
    "dilutedSharesOutstanding": 15004697000,
    "costofDebt": 3.92,
    "taxRate": 15.61,
    "afterTaxCostOfDebt": 3.31,
    "riskFreeRate": 3.92,
    "marketRiskPremium": 4.72,
    "costOfEquity": 9.15,
    "totalDebt": 112377000000,
    "totalEquity": 3943534465540,
    "totalCapital": 4055911465540,
    "debtWeighting": 2.77,
    "equityWeighting": 97.23,
    "wacc": 8.99,
    "taxRateCash": 16785417,
    "ebiat": 147583856418,
    "ufcf": 145836268225,
    "sumPvUfcf": 505377678906,
    "longTermGrowthRate": 4,
    "...": "7 more fields"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/custom-dcf-advanced

### Custom DCF Levered API

Run a tailored Discounted Cash Flow (DCF) analysis using the FMP Custom DCF Advanced API. With detailed inputs, this API allows users to fine-tune their assumptions and variables, offering a more personalized and precise valuation for a company.

**Endpoint**

`GET https://financialmodelingprep.com/stable/custom-levered-discounted-cash-flow?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| revenueGrowthPct | number | 0.1094119804597946 |
| ebitdaPct | number | 0.31273548388 |
| depreciationAndAmortizationPct | number | 0.0345531631720999 |
| cashAndShortTermInvestmentsPct | number | 0.2344222126801843 |
| receivablesPct | number | 0.1533770531229388 |
| inventoriesPct | number | 0.0155245674227653 |
| payablePct | number | 0.1614868903169657 |
| ebitPct | number | 0.2781823207138459 |
| capitalExpenditurePct | number | 0.0306025847141713 |
| operatingCashFlowPct | number | 0.2886333485760204 |
| sellingGeneralAndAdministrativeExpensesPct | number | 0.0662854095187211 |
| taxRate | number | 0.14919579658453103 |
| longTermGrowthRate | number | 4 |
| costOfDebt | number | 3.64 |
| costOfEquity | number | 9.51168 |
| marketRiskPremium | number | 4.72 |
| beta | number | 1.244 |
| riskFreeRate | number | 3.64 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `year` | string |
| `symbol` | string |
| `revenue` | integer |
| `revenuePercentage` | number |
| `capitalExpenditure` | integer |
| `capitalExpenditurePercentage` | number |
| `price` | number |
| `beta` | number |
| `dilutedSharesOutstanding` | integer |
| `costofDebt` | number |
| `taxRate` | number |
| `afterTaxCostOfDebt` | number |
| `riskFreeRate` | number |
| `marketRiskPremium` | number |
| `costOfEquity` | number |
| `totalDebt` | integer |
| `totalEquity` | integer |
| `totalCapital` | integer |
| `debtWeighting` | number |
| `equityWeighting` | number |
| `wacc` | number |
| `operatingCashFlow` | integer |
| `pvLfcf` | integer |
| `sumPvLfcf` | integer |
| `longTermGrowthRate` | integer |
| `freeCashFlow` | integer |
| `terminalValue` | integer |
| `presentTerminalValue` | integer |
| `enterpriseValue` | integer |
| `netDebt` | integer |
| `equityValue` | integer |
| `equityValuePerShare` | number |
| `freeCashFlowT1` | integer |
| `operatingCashFlowPercentage` | number |

Sample:

```json
[
  {
    "year": "2030",
    "symbol": "AAPL",
    "revenue": 529528728806,
    "revenuePercentage": 4.09,
    "capitalExpenditure": -14907445037,
    "capitalExpenditurePercentage": -2.82,
    "price": 262.82,
    "beta": 1.109,
    "dilutedSharesOutstanding": 15004697000,
    "costofDebt": 3.92,
    "taxRate": 15.61,
    "afterTaxCostOfDebt": 3.31,
    "riskFreeRate": 3.92,
    "marketRiskPremium": 4.72,
    "costOfEquity": 9.15,
    "totalDebt": 112377000000,
    "totalEquity": 3943534465540,
    "totalCapital": 4055911465540,
    "debtWeighting": 2.77,
    "equityWeighting": 97.23,
    "wacc": 8.99,
    "operatingCashFlow": 153867620418,
    "pvLfcf": 90350972645,
    "sumPvLfcf": 492288755830,
    "longTermGrowthRate": 4,
    "freeCashFlow": 138960175381,
    "terminalValue": 2895457471723,
    "presentTerminalValue": 1882606999493,
    "enterpriseValue": 2374895755323,
    "netDebt": 76443000000,
    "equityValue": 2298452755323,
    "equityValuePerShare": 153.18,
    "freeCashFlowT1": 144518582396,
    "operatingCashFlowPercentage": 29.06
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/custom-dcf-levered
