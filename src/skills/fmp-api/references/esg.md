# FMP API Group: ESG

Source: https://site.financialmodelingprep.com/developer/docs#esg

Endpoints: 3

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### ESG Investment Search API

Align your investments with your values using the FMP ESG Investment Search API. Discover companies and funds based on Environmental, Social, and Governance (ESG) scores, performance, controversies, and business involvement criteria.

**Endpoint**

`GET https://financialmodelingprep.com/stable/esg-disclosures?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `date` | string |
| `acceptedDate` | string |
| `symbol` | string |
| `cik` | string |
| `companyName` | string |
| `formType` | string |
| `environmentalScore` | number |
| `socialScore` | number |
| `governanceScore` | number |
| `ESGScore` | number |
| `url` | string |

Sample:

```json
[
  {
    "date": "2024-12-28",
    "acceptedDate": "2025-01-30",
    "symbol": "AAPL",
    "cik": "0000320193",
    "companyName": "Apple Inc.",
    "formType": "8-K",
    "environmentalScore": 52.52,
    "socialScore": 45.18,
    "governanceScore": 60.74,
    "ESGScore": 52.81,
    "url": "https://www.sec.gov/Archives/edgar/data/320193/000032019325000007/0000320193-25-000007-index.htm"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/esg-search

### ESG Ratings API

Access comprehensive ESG ratings for companies and funds with the FMP ESG Ratings API. Make informed investment decisions based on environmental, social, and governance (ESG) performance data.

**Endpoint**

`GET https://financialmodelingprep.com/stable/esg-ratings?symbol=AAPL`

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
| `companyName` | string |
| `industry` | string |
| `fiscalYear` | integer |
| `ESGRiskRating` | string |
| `industryRank` | string |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "cik": "0000320193",
    "companyName": "Apple Inc.",
    "industry": "CONSUMER ELECTRONICS",
    "fiscalYear": 2024,
    "ESGRiskRating": "B",
    "industryRank": "4 out of 5"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/esg-ratings

### ESG Benchmark Comparison API

Evaluate the ESG performance of companies and funds with the FMP ESG Benchmark Comparison API. Compare ESG leaders and laggards within industries to make informed and responsible investment decisions.

**Endpoint**

`GET https://financialmodelingprep.com/stable/esg-benchmark`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| year | string | 2023 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `fiscalYear` | integer |
| `sector` | string |
| `environmentalScore` | number |
| `socialScore` | number |
| `governanceScore` | number |
| `ESGScore` | number |

Sample:

```json
[
  {
    "fiscalYear": 2023,
    "sector": "APPAREL RETAIL",
    "environmentalScore": 61.36,
    "socialScore": 67.44,
    "governanceScore": 68.1,
    "ESGScore": 65.63
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/esg-benchmark
