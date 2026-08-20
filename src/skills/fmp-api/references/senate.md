# FMP API Group: Senate

Source: https://site.financialmodelingprep.com/developer/docs#senate

Endpoints: 6

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Latest Senate Financial Disclosures API

Access the latest financial disclosures from U.S. Senate members with the FMP Latest Senate Financial Disclosures API. Track recent trades, asset ownership, and transaction details for enhanced transparency in government financial activities.

**Endpoint**

`GET https://financialmodelingprep.com/stable/senate-latest?page=0&limit=100`

Note: maximum `250` records per request.

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
| `symbol` | string |
| `disclosureDate` | string |
| `transactionDate` | string |
| `firstName` | string |
| `lastName` | string |
| `office` | string |
| `district` | string |
| `owner` | string |
| `assetDescription` | string |
| `assetType` | string |
| `type` | string |
| `amount` | string |
| `comment` | string |
| `link` | string |

Sample:

```json
[
  {
    "symbol": "PEP",
    "disclosureDate": "2026-04-08",
    "transactionDate": "2026-03-30",
    "firstName": "Sheldon",
    "lastName": "Whitehouse",
    "office": "Sheldon Whitehouse",
    "district": "RI",
    "owner": "Spouse",
    "assetDescription": "PepsiCo Inc",
    "assetType": "Stock",
    "type": "Sale",
    "amount": "$1,001 - $15,000",
    "comment": "",
    "link": "https://efdsearch.senate.gov/search/view/ptr/853d0789-28db-4789-9654-a73cff7740d7/"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/senate-latest

### Latest House Financial Disclosures API

Access real-time financial disclosures from U.S. House members with the FMP Latest House Financial Disclosures API. Track recent trades, asset ownership, and financial holdings for enhanced visibility into political figures' financial activities.

**Endpoint**

`GET https://financialmodelingprep.com/stable/house-latest?page=0&limit=100`

Note: maximum `250` records per request.

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
| `symbol` | string |
| `disclosureDate` | string |
| `transactionDate` | string |
| `firstName` | string |
| `lastName` | string |
| `office` | string |
| `district` | string |
| `owner` | string |
| `assetDescription` | string |
| `assetType` | string |
| `type` | string |
| `amount` | string |
| `capitalGainsOver200USD` | string |
| `comment` | string |
| `link` | string |

Sample:

```json
[
  {
    "symbol": "BBIO",
    "disclosureDate": "2026-04-08",
    "transactionDate": "2026-03-19",
    "firstName": "Gilbert",
    "lastName": "Cisneros",
    "office": "Gilbert Cisneros",
    "district": "CA31",
    "owner": "",
    "assetDescription": "BRIDGEBIO PHARMA INC",
    "assetType": "Stock",
    "type": "Purchase",
    "amount": "$1,001 - $15,000",
    "capitalGainsOver200USD": "False",
    "comment": "",
    "link": "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20034285.pdf"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/house-latest

### Senate Trading Activity API

Monitor the trading activity of US Senators with the FMP Senate Trading Activity API. Access detailed information on trades made by Senators, including trade dates, assets, amounts, and potential conflicts of interest.

**Endpoint**

`GET https://financialmodelingprep.com/stable/senate-trades?symbol=AAPL`

Note: maximum `250` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| page | number | 0 |
| limit | number | 100 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `disclosureDate` | string |
| `transactionDate` | string |
| `firstName` | string |
| `lastName` | string |
| `office` | string |
| `district` | string |
| `owner` | string |
| `assetDescription` | string |
| `assetType` | string |
| `type` | string |
| `amount` | string |
| `capitalGainsOver200USD` | string |
| `comment` | string |
| `link` | string |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "disclosureDate": "2026-02-15",
    "transactionDate": "2026-01-15",
    "firstName": "John",
    "lastName": "Boozman",
    "office": "John Boozman",
    "district": "AR",
    "owner": "Joint",
    "assetDescription": "Apple Inc",
    "assetType": "Stock",
    "type": "Purchase",
    "amount": "$1,001 - $15,000",
    "capitalGainsOver200USD": "False",
    "comment": "--",
    "link": "https://efdsearch.senate.gov/search/view/ptr/135ebfe9-099e-4d58-ba46-f739b90d61da/"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/senate-trading

### senate-trading-by-name API

**Endpoint**

`GET https://financialmodelingprep.com/stable/senate-trades-by-name?name=Jerry`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| name* | string | Jerry |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `disclosureDate` | string |
| `transactionDate` | string |
| `firstName` | string |
| `lastName` | string |
| `office` | string |
| `district` | string |
| `owner` | string |
| `assetDescription` | string |
| `assetType` | string |
| `type` | string |
| `amount` | string |
| `capitalGainsOver200USD` | string |
| `comment` | string |
| `link` | string |

Sample:

```json
[
  {
    "symbol": "GOOG",
    "disclosureDate": "2025-10-27",
    "transactionDate": "2025-09-23",
    "firstName": "Jerry",
    "lastName": "Moran",
    "office": "Jerry Moran",
    "district": "KS",
    "owner": "Spouse",
    "assetDescription": "Alphabet Cl C",
    "assetType": "Stock",
    "type": "Sale (Partial)",
    "amount": "$1,001 - $15,000",
    "capitalGainsOver200USD": "False",
    "comment": "--",
    "link": "https://efdsearch.senate.gov/search/view/ptr/b83b6502-520b-4403-9777-60f6c2d93bc1/"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/senate-trading-by-name

### U.S. House Trades API

Track the financial trades made by U.S. House members and their families with the FMP U.S. House Trades API. Access real-time information on stock sales, purchases, and other investment activities to gain insight into their financial decisions.

**Endpoint**

`GET https://financialmodelingprep.com/stable/house-trades?symbol=AAPL`

Note: maximum `250` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| page | number | 0 |
| limit | number | 100 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `disclosureDate` | string |
| `transactionDate` | string |
| `firstName` | string |
| `lastName` | string |
| `office` | string |
| `district` | string |
| `owner` | string |
| `assetDescription` | string |
| `assetType` | string |
| `type` | string |
| `amount` | string |
| `capitalGainsOver200USD` | string |
| `comment` | string |
| `link` | string |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "disclosureDate": "2026-04-08",
    "transactionDate": "2025-11-13",
    "firstName": "Ed",
    "lastName": "Case",
    "office": "Ed Case",
    "district": "HI01",
    "owner": "",
    "assetDescription": "Apple Inc",
    "assetType": "Stock",
    "type": "Purchase",
    "amount": "$1,001 - $15,000",
    "capitalGainsOver200USD": "False",
    "comment": "",
    "link": "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20034221.pdf"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/house-trading

### house-trading-by-name API

**Endpoint**

`GET https://financialmodelingprep.com/stable/house-trades-by-name?name=James`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| name* | string | James |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `disclosureDate` | string |
| `transactionDate` | string |
| `firstName` | string |
| `lastName` | string |
| `office` | string |
| `district` | string |
| `owner` | string |
| `assetDescription` | string |
| `assetType` | string |
| `type` | string |
| `amount` | string |
| `capitalGainsOver200USD` | string |
| `comment` | string |
| `link` | string |

Sample:

```json
[
  {
    "symbol": "KD",
    "disclosureDate": "2026-01-26",
    "transactionDate": "2025-12-31",
    "firstName": "James French",
    "lastName": "Hill",
    "office": "James French Hill",
    "district": "AR02",
    "owner": "",
    "assetDescription": "Kyndryl Holdings Inc",
    "assetType": "Stock",
    "type": "Sale",
    "amount": "$1,001 - $15,000",
    "capitalGainsOver200USD": "False",
    "comment": "",
    "link": "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20033661.pdf"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/house-trading-by-name
