# FMP API Group: Insider Trades

Source: https://site.financialmodelingprep.com/developer/docs#insider-trades

Endpoints: 6

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Latest Insider Trading API

Access the latest insider trading activity using the Latest Insider Trading API. Track which company insiders are buying or selling stocks and analyze their transactions.

**Endpoint**

`GET https://financialmodelingprep.com/stable/insider-trading/latest?page=0&limit=100`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| date | date | 2026-01-27 |
| page | number | 0 |
| limit | number | 100 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `filingDate` | string |
| `transactionDate` | string |
| `reportingCik` | string |
| `companyCik` | string |
| `transactionType` | string |
| `securitiesOwned` | integer |
| `reportingName` | string |
| `typeOfOwner` | string |
| `acquisitionOrDisposition` | string |
| `directOrIndirect` | string |
| `formType` | string |
| `securitiesTransacted` | integer |
| `price` | integer |
| `securityName` | string |
| `url` | string |

Sample:

```json
[
  {
    "symbol": "LAB",
    "filingDate": "2026-04-08",
    "transactionDate": "2026-03-20",
    "reportingCik": "0001559779",
    "companyCik": "0001162194",
    "transactionType": "A-Award",
    "securitiesOwned": 6594083,
    "reportingName": "Egholm Michael",
    "typeOfOwner": "director, officer: President & CEO",
    "acquisitionOrDisposition": "A",
    "directOrIndirect": "D",
    "formType": "4",
    "securitiesTransacted": 1042373,
    "price": 0,
    "securityName": "Common Stock",
    "url": "https://www.sec.gov/Archives/edgar/data/1162194/000119312526148615/0001193125-26-148615-index.htm"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/latest-insider-trade

### Search Insider Trades API

Search insider trading activity by company or symbol using the Search Insider Trades API. Find specific trades made by corporate insiders, including executives and directors.

**Endpoint**

`GET https://financialmodelingprep.com/stable/insider-trading/search?page=0&limit=100`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol | string | AAPL |
| page | number | 0 |
| limit | number | 100 |
| reportingCik | string | 0001496686 |
| companyCik | string | 0000320193 |
| transactionType | string | S-Sale |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `filingDate` | string |
| `transactionDate` | string |
| `reportingCik` | string |
| `companyCik` | string |
| `transactionType` | string |
| `securitiesOwned` | integer |
| `reportingName` | string |
| `typeOfOwner` | string |
| `acquisitionOrDisposition` | string |
| `directOrIndirect` | string |
| `formType` | string |
| `securitiesTransacted` | integer |
| `price` | integer |
| `securityName` | string |
| `url` | string |

Sample:

```json
[
  {
    "symbol": "LAB",
    "filingDate": "2026-04-08",
    "transactionDate": "2026-04-06",
    "reportingCik": "0001559779",
    "companyCik": "0001162194",
    "transactionType": "M-Exempt",
    "securitiesOwned": 6790596,
    "reportingName": "Egholm Michael",
    "typeOfOwner": "director, officer: President & CEO",
    "acquisitionOrDisposition": "A",
    "directOrIndirect": "D",
    "formType": "4",
    "securitiesTransacted": 196513,
    "price": 0,
    "securityName": "Common Stock",
    "url": "https://www.sec.gov/Archives/edgar/data/1162194/000119312526148615/0001193125-26-148615-index.htm"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/search-insider-trades

### Search Insider Trades by Reporting Name API

Search for insider trading activity by reporting name using the Search Insider Trades by Reporting Name API. Track trading activities of specific individuals or groups involved in corporate insider transactions.

**Endpoint**

`GET https://financialmodelingprep.com/stable/insider-trading/reporting-name?name=Zuckerberg`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| name* | string | Zuckerberg |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `reportingCik` | string |
| `reportingName` | string |

Sample:

```json
[
  {
    "reportingCik": "0001548760",
    "reportingName": "Zuckerberg Mark"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/search-reporting-name

### All Insider Transaction Types API

Access a comprehensive list of insider transaction types with the All Insider Transaction Types API. This API provides details on various transaction actions, including purchases, sales, and other corporate actions involving insider trading.

**Endpoint**

`GET https://financialmodelingprep.com/stable/insider-trading-transaction-type`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `transactionType` | string |

Sample:

```json
[
  {
    "transactionType": "A-Award"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/all-transaction-types

### Insider Trade Statistics API

Analyze insider trading activity with the Insider Trade Statistics API. This API provides key statistics on insider transactions, including total purchases, sales, and trends for specific companies or stock symbols.

**Endpoint**

`GET https://financialmodelingprep.com/stable/insider-trading/statistics?symbol=AAPL`

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
| `cik` | string |
| `year` | integer |
| `quarter` | integer |
| `acquiredTransactions` | integer |
| `disposedTransactions` | integer |
| `acquiredDisposedRatio` | number |
| `totalAcquired` | integer |
| `totalDisposed` | integer |
| `averageAcquired` | number |
| `averageDisposed` | integer |
| `totalPurchases` | integer |
| `totalSales` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "cik": "0000320193",
    "year": 2026,
    "quarter": 2,
    "acquiredTransactions": 3,
    "disposedTransactions": 20,
    "acquiredDisposedRatio": 0.15,
    "totalAcquired": 260210,
    "totalDisposed": 489420,
    "averageAcquired": 86736.6667,
    "averageDisposed": 24471,
    "totalPurchases": 0,
    "totalSales": 8
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/insider-trade-statistics

### Acquisition Ownership API

Track changes in stock ownership during acquisitions using the Acquisition Ownership API. This API provides detailed information on how mergers, takeovers, or beneficial ownership changes impact the stock ownership structure of a company.

**Endpoint**

`GET https://financialmodelingprep.com/stable/acquisition-of-beneficial-ownership?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 2000 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `cik` | string |
| `symbol` | string |
| `filingDate` | string |
| `acceptedDate` | string |
| `cusip` | string |
| `nameOfReportingPerson` | string |
| `citizenshipOrPlaceOfOrganization` | string |
| `soleVotingPower` | string |
| `sharedVotingPower` | string |
| `soleDispositivePower` | string |
| `sharedDispositivePower` | string |
| `amountBeneficiallyOwned` | string |
| `percentOfClass` | string |
| `typeOfReportingPerson` | string |
| `url` | string |

Sample:

```json
[
  {
    "cik": "0000320193",
    "symbol": "AAPL",
    "filingDate": "2024-02-14",
    "acceptedDate": "2024-02-14",
    "cusip": "037833100",
    "nameOfReportingPerson": "Redwood Fire & Casualty Insurance Company",
    "citizenshipOrPlaceOfOrganization": "State of Nebraska",
    "soleVotingPower": "0",
    "sharedVotingPower": "2676000",
    "soleDispositivePower": "0",
    "sharedDispositivePower": "2676000",
    "amountBeneficiallyOwned": "2676000",
    "percentOfClass": "0.1",
    "typeOfReportingPerson": "IC, CO",
    "url": "https://www.sec.gov/Archives/edgar/data/320193/000119312524036431/d751537dsc13ga.htm"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/acquisition-ownership
