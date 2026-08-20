# FMP API Group: Earnings Transcript

Source: https://site.financialmodelingprep.com/developer/docs#earnings-transcript

Endpoints: 4

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Latest Earning Transcripts API

Access available earnings transcripts for companies with the FMP Latest Earning Transcripts API. Retrieve a list of companies with earnings transcripts, along with the total number of transcripts available for each company.

**Endpoint**

`GET https://financialmodelingprep.com/stable/earning-call-transcript-latest`

Note: maximum `100` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| limit | number | 100 |
| page | number | 0 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `period` | string |
| `fiscalYear` | integer |
| `date` | string |

Sample:

```json
[
  {
    "symbol": "CSWC",
    "period": "Q3",
    "fiscalYear": 2025,
    "date": "2025-02-04"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/latest-transcripts

### Earnings Transcript API

Access the full transcript of a companyâs earnings call with the FMP Earnings Transcript API. Stay informed about a companyâs financial performance, future plans, and overall strategy by analyzing management's communication.

**Endpoint**

`GET https://financialmodelingprep.com/stable/earning-call-transcript?symbol=AAPL&year=2020&quarter=3`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| year* | string | 2020 |
| quarter* | string | 3 |
| limit | number | 1 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `period` | string |
| `year` | integer |
| `date` | string |
| `content` | string |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "period": "Q3",
    "year": 2020,
    "date": "2020-07-30",
    "content": "Operator: Good day, everyone. Welcome to the Apple Incorporated Third Quarter Fiscal Year 2020 Earnings Conference Call…"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/search-transcripts

### Transcripts Dates By Symbol API

Access earnings call transcript dates for specific companies with the FMP Transcripts Dates By Symbol API. Get a comprehensive overview of earnings call schedules based on fiscal year and quarter.

**Endpoint**

`GET https://financialmodelingprep.com/stable/earning-call-transcript-dates?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `quarter` | integer |
| `fiscalYear` | integer |
| `date` | string |

Sample:

```json
[
  {
    "quarter": 1,
    "fiscalYear": 2025,
    "date": "2025-01-30"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/transcripts-dates-by-symbol

### Available Transcript Symbols API

Access a complete list of stock symbols with available earnings call transcripts using the FMP Available Earnings Transcript Symbols API. Retrieve information on which companies have earnings transcripts and how many are accessible for detailed financial analysis.

**Endpoint**

`GET https://financialmodelingprep.com/stable/earnings-transcript-list`

**Parameters**

None documented.

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `companyName` | string |
| `noOfTranscripts` | string |

Sample:

```json
[
  {
    "symbol": "MCUJF",
    "companyName": "Medicure Inc.",
    "noOfTranscripts": "16"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/available-transcript-symbols
