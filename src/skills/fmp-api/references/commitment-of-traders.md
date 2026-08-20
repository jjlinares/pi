# FMP API Group: Commitment Of Traders

Source: https://site.financialmodelingprep.com/developer/docs#commitment-of-traders

Endpoints: 3

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### COT Report API

Access comprehensive Commitment of Traders (COT) reports with the FMP COT Report API. This API provides detailed information about long and short positions across various sectors, helping you assess market sentiment and track positions in commodities, indices, and financial instruments.

**Endpoint**

`GET https://financialmodelingprep.com/stable/commitment-of-traders-report`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol | string | AAPL |
| from | date | 2024-01-01 |
| to | date | 2024-03-01 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `name` | string |
| `sector` | string |
| `marketAndExchangeNames` | string |
| `cftcContractMarketCode` | string |
| `cftcMarketCode` | string |
| `cftcRegionCode` | string |
| `cftcCommodityCode` | string |
| `openInterestAll` | integer |
| `noncommPositionsLongAll` | integer |
| `noncommPositionsShortAll` | integer |
| `noncommPositionsSpreadAll` | integer |
| `commPositionsLongAll` | integer |
| `commPositionsShortAll` | integer |
| `totReptPositionsLongAll` | integer |
| `totReptPositionsShortAll` | integer |
| `nonreptPositionsLongAll` | integer |
| `nonreptPositionsShortAll` | integer |
| `openInterestOld` | integer |
| `noncommPositionsLongOld` | integer |
| `noncommPositionsShortOld` | integer |
| `noncommPositionsSpreadOld` | integer |
| `commPositionsLongOld` | integer |
| `commPositionsShortOld` | integer |
| `totReptPositionsLongOld` | integer |
| `totReptPositionsShortOld` | integer |
| `nonreptPositionsLongOld` | integer |
| `nonreptPositionsShortOld` | integer |
| `openInterestOther` | integer |
| `noncommPositionsLongOther` | integer |
| `noncommPositionsShortOther` | integer |
| `noncommPositionsSpreadOther` | integer |
| `commPositionsLongOther` | integer |
| `commPositionsShortOther` | integer |
| `totReptPositionsLongOther` | integer |
| `totReptPositionsShortOther` | integer |
| `nonreptPositionsLongOther` | integer |
| `nonreptPositionsShortOther` | integer |
| `changeInOpenInterestAll` | integer |
| `changeInNoncommLongAll` | integer |
| `changeInNoncommShortAll` | integer |
| `changeInNoncommSpeadAll` | integer |
| `changeInCommLongAll` | integer |
| `changeInCommShortAll` | integer |
| `changeInTotReptLongAll` | integer |
| `changeInTotReptShortAll` | integer |
| `changeInNonreptLongAll` | integer |
| `changeInNonreptShortAll` | integer |
| `pctOfOpenInterestAll` | integer |
| `pctOfOiNoncommLongAll` | integer |
| `pctOfOiNoncommShortAll` | number |
| `pctOfOiNoncommSpreadAll` | number |
| `pctOfOiCommLongAll` | integer |
| `pctOfOiCommShortAll` | number |
| `pctOfOiTotReptLongAll` | number |
| `pctOfOiTotReptShortAll` | number |
| `pctOfOiNonreptLongAll` | number |
| `pctOfOiNonreptShortAll` | number |
| `pctOfOpenInterestOl` | integer |
| `...` | additional fields omitted |

Sample:

```json
[
  {
    "symbol": "KC",
    "date": "2024-02-27 00:00:00",
    "name": "Coffee (KC)",
    "sector": "SOFTS",
    "marketAndExchangeNames": "COFFEE C - ICE FUTURES U.S.",
    "cftcContractMarketCode": "083731",
    "cftcMarketCode": "ICUS",
    "cftcRegionCode": "1",
    "cftcCommodityCode": "83",
    "openInterestAll": 209453,
    "noncommPositionsLongAll": 75330,
    "noncommPositionsShortAll": 23630,
    "noncommPositionsSpreadAll": 47072,
    "commPositionsLongAll": 79690,
    "commPositionsShortAll": 132114,
    "totReptPositionsLongAll": 202092,
    "totReptPositionsShortAll": 202816,
    "nonreptPositionsLongAll": 7361,
    "nonreptPositionsShortAll": 6637,
    "openInterestOld": 179986,
    "noncommPositionsLongOld": 75483,
    "noncommPositionsShortOld": 35395,
    "noncommPositionsSpreadOld": 27067,
    "commPositionsLongOld": 70693,
    "commPositionsShortOld": 111666,
    "totReptPositionsLongOld": 173243,
    "totReptPositionsShortOld": 174128,
    "nonreptPositionsLongOld": 6743,
    "nonreptPositionsShortOld": 5858,
    "openInterestOther": 29467,
    "noncommPositionsLongOther": 18754,
    "noncommPositionsShortOther": 7142,
    "noncommPositionsSpreadOther": 1098,
    "commPositionsLongOther": 8997,
    "commPositionsShortOther": 20448,
    "totReptPositionsLongOther": 28849,
    "totReptPositionsShortOther": 28688,
    "nonreptPositionsLongOther": 618,
    "nonreptPositionsShortOther": 779,
    "changeInOpenInterestAll": 2957,
    "...": "88 more fields"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cot-report

### COT Analysis By Dates API

Gain in-depth insights into market sentiment with the FMP COT Report Analysis API. Analyze the Commitment of Traders (COT) reports for a specific date range to evaluate market dynamics, sentiment, and potential reversals across various sectors.

**Endpoint**

`GET https://financialmodelingprep.com/stable/commitment-of-traders-analysis`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol | string | AAPL |
| from | date | 2024-01-01 |
| to | date | 2024-03-01 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `date` | string |
| `name` | string |
| `sector` | string |
| `exchange` | string |
| `currentLongMarketSituation` | number |
| `currentShortMarketSituation` | number |
| `marketSituation` | string |
| `previousLongMarketSituation` | number |
| `previousShortMarketSituation` | number |
| `previousMarketSituation` | string |
| `netPostion` | integer |
| `previousNetPosition` | integer |
| `changeInNetPosition` | number |
| `marketSentiment` | string |
| `reversalTrend` | boolean |

Sample:

```json
[
  {
    "symbol": "B6",
    "date": "2024-02-27 00:00:00",
    "name": "British Pound (B6)",
    "sector": "CURRENCIES",
    "exchange": "BRITISH POUND - CHICAGO MERCANTILE EXCHANGE",
    "currentLongMarketSituation": 66.85,
    "currentShortMarketSituation": 33.15,
    "marketSituation": "Bullish",
    "previousLongMarketSituation": 67.97,
    "previousShortMarketSituation": 32.03,
    "previousMarketSituation": "Bullish",
    "netPostion": 46358,
    "previousNetPosition": 46312,
    "changeInNetPosition": 0.1,
    "marketSentiment": "Increasing Bullish",
    "reversalTrend": false
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cot-report-analysis

### COT Report List API

Access a comprehensive list of available Commitment of Traders (COT) reports by commodity or futures contract using the FMP COT Report List API. This API provides an overview of different market segments, allowing users to retrieve and explore COT reports for a wide variety of commodities and financial instruments.

**Endpoint**

`GET https://financialmodelingprep.com/stable/commitment-of-traders-list`

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
    "symbol": "NG",
    "name": "Natural Gas (NG)"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cot-report-list
