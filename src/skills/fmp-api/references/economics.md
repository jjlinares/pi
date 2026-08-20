# FMP API Group: Economics

Source: https://site.financialmodelingprep.com/developer/docs#economics

Endpoints: 4

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Treasury Rates API

Access latest and historical Treasury rates for all maturities with the FMP Treasury Rates API. Track key benchmarks for interest rates across the economy.

**Endpoint**

`GET https://financialmodelingprep.com/stable/treasury-rates`

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
| `date` | string |
| `month1` | number |
| `month2` | number |
| `month3` | number |
| `month6` | number |
| `year1` | number |
| `year2` | number |
| `year3` | number |
| `year5` | number |
| `year7` | number |
| `year10` | number |
| `year20` | number |
| `year30` | number |

Sample:

```json
[
  {
    "date": "2026-04-08",
    "month1": 3.67,
    "month2": 3.71,
    "month3": 3.69,
    "month6": 3.73,
    "year1": 3.69,
    "year2": 3.79,
    "year3": 3.78,
    "year5": 3.92,
    "year7": 4.1,
    "year10": 4.29,
    "year20": 4.87,
    "year30": 4.89
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/treasury-rates

### Economics Indicators API

Access real-time and historical economic data for key indicators like GDP, unemployment, and inflation with the FMP Economic Indicators API. Use this data to measure economic performance and identify growth trends.

**Endpoint**

`GET https://financialmodelingprep.com/stable/economic-indicators?name=GDP`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| name* | string | `GDP`, `realGDP`, `nominalPotentialGDP`, `realGDPPerCapita`, `federalFunds`, `CPI`, `inflationRate`, `inflation`, `retailSales`, `consumerSentiment`, `durableGoods`, `unemploymentRate`, `totalNonfarmPayroll`, `initialClaims`, `industrialProductionTotalIndex`, `newPrivatelyOwnedHousingUnitsStartedTotalUnits`, `totalVehicleSales`, `retailMoneyFunds`, `smoothedUSRecessionProbabilities`, `3MonthOr90DayRatesAndYieldsCertificatesOfDeposit`, `commercialBankInterestRateOnCreditCardPlansAllAccounts`, `30YearFixedRateMortgageAverage`, `15YearFixedRateMortgageAverage`, `tradeBalanceGoodsAndServices` |
| from | date | 2025-04-27 |
| to | date | 2026-04-27 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `name` | string |
| `date` | string |
| `value` | number |

Sample:

```json
[
  {
    "name": "GDP",
    "date": "2025-10-01",
    "value": 31442.483
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/economics-indicators

### Economic Data Releases Calendar API

Stay informed with the FMP Economic Data Releases Calendar API. Access a comprehensive calendar of upcoming economic data releases to prepare for market impacts and make informed investment decisions.

**Endpoint**

`GET https://financialmodelingprep.com/stable/economic-calendar`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| country | string | US |
| from | date | 2026-01-27 |
| to | date | 2026-04-27 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `country` | string |
| `event` | string |
| `currency` | string |
| `previous` | number |
| `estimate` | null |
| `actual` | number |
| `change` | number |
| `impact` | string |
| `changePercentage` | number |
| `unit` | null |

Sample:

```json
[
  {
    "date": "2026-04-08 23:50:00",
    "country": "JP",
    "event": "Foreign Bond Investment (Apr/04)",
    "currency": "JPY",
    "previous": -945.4,
    "estimate": null,
    "actual": -2462.4,
    "change": -1516.9,
    "impact": "Low",
    "changePercentage": -160.434,
    "unit": null
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/economics-calendar

### Market Risk Premium API

Access the market risk premium for specific dates with the FMP Market Risk Premium API. Use this key financial metric to assess the additional return expected from investing in the stock market over a risk-free investment.

**Endpoint**

`GET https://financialmodelingprep.com/stable/market-risk-premium`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `country` | string |
| `continent` | string |
| `countryRiskPremium` | number |
| `totalEquityRiskPremium` | number |

Sample:

```json
[
  {
    "country": "Zimbabwe",
    "continent": "Africa",
    "countryRiskPremium": 11.66,
    "totalEquityRiskPremium": 15.89
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/market-risk-premium
