# FMP API Group: Fundraisers

Source: https://site.financialmodelingprep.com/developer/docs#fundraisers

Endpoints: 6

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Latest Crowdfunding Campaigns API

Discover the most recent crowdfunding campaigns with the FMP Latest Crowdfunding Campaigns API. Stay informed on which companies and projects are actively raising funds, their financial details, and offering terms.

**Endpoint**

`GET https://financialmodelingprep.com/stable/crowdfunding-offerings-latest?page=0&limit=100`

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
| `companyName` | string |
| `date` | string |
| `filingDate` | string |
| `acceptedDate` | string |
| `formType` | string |
| `formSignification` | string |
| `nameOfIssuer` | string |
| `legalStatusForm` | string |
| `jurisdictionOrganization` | string |
| `issuerStreet` | string |
| `issuerCity` | string |
| `issuerStateOrCountry` | string |
| `issuerZipCode` | string |
| `issuerWebsite` | string |
| `intermediaryCompanyName` | null |
| `intermediaryCommissionCik` | string |
| `intermediaryCommissionFileNumber` | null |
| `compensationAmount` | null |
| `financialInterest` | null |
| `securityOfferedType` | null |
| `securityOfferedOtherDescription` | null |
| `numberOfSecurityOffered` | integer |
| `offeringPrice` | integer |
| `offeringAmount` | integer |
| `overSubscriptionAccepted` | string |
| `overSubscriptionAllocationType` | null |
| `maximumOfferingAmount` | integer |
| `offeringDeadlineDate` | null |
| `currentNumberOfEmployees` | integer |
| `totalAssetMostRecentFiscalYear` | number |
| `totalAssetPriorFiscalYear` | number |
| `cashAndCashEquiValentMostRecentFiscalYear` | number |
| `cashAndCashEquiValentPriorFiscalYear` | number |
| `accountsReceivableMostRecentFiscalYear` | integer |
| `accountsReceivablePriorFiscalYear` | integer |
| `shortTermDebtMostRecentFiscalYear` | number |
| `shortTermDebtPriorFiscalYear` | number |
| `longTermDebtMostRecentFiscalYear` | integer |
| `longTermDebtPriorFiscalYear` | integer |
| `revenueMostRecentFiscalYear` | number |
| `revenuePriorFiscalYear` | number |
| `costGoodsSoldMostRecentFiscalYear` | number |
| `costGoodsSoldPriorFiscalYear` | number |
| `taxesPaidMostRecentFiscalYear` | number |
| `taxesPaidPriorFiscalYear` | number |
| `netIncomeMostRecentFiscalYear` | number |
| `netIncomePriorFiscalYear` | number |

Sample:

```json
[
  {
    "cik": "0001532978",
    "companyName": "Gumroad, Inc.",
    "date": "09-22-2011",
    "filingDate": "2026-04-08 00:00:00",
    "acceptedDate": "2026-04-08 16:54:45",
    "formType": "C-AR",
    "formSignification": "Annual Report",
    "nameOfIssuer": "Gumroad, Inc.",
    "legalStatusForm": "Corporation",
    "jurisdictionOrganization": "DE",
    "issuerStreet": "548 Market St, #41309",
    "issuerCity": "San Francisco",
    "issuerStateOrCountry": "CA",
    "issuerZipCode": "94104",
    "issuerWebsite": "https://gumroad.com/",
    "intermediaryCompanyName": null,
    "intermediaryCommissionCik": "0001532978",
    "intermediaryCommissionFileNumber": null,
    "compensationAmount": null,
    "financialInterest": null,
    "securityOfferedType": null,
    "securityOfferedOtherDescription": null,
    "numberOfSecurityOffered": 0,
    "offeringPrice": 0,
    "offeringAmount": 0,
    "overSubscriptionAccepted": "N",
    "overSubscriptionAllocationType": null,
    "maximumOfferingAmount": 0,
    "offeringDeadlineDate": null,
    "currentNumberOfEmployees": 2,
    "totalAssetMostRecentFiscalYear": 11948947.05,
    "totalAssetPriorFiscalYear": 16720734.62,
    "cashAndCashEquiValentMostRecentFiscalYear": 6153268.63,
    "cashAndCashEquiValentPriorFiscalYear": 13821885.61,
    "accountsReceivableMostRecentFiscalYear": 0,
    "accountsReceivablePriorFiscalYear": 0,
    "shortTermDebtMostRecentFiscalYear": 4191955.58,
    "shortTermDebtPriorFiscalYear": 4635820.52,
    "longTermDebtMostRecentFiscalYear": 0,
    "longTermDebtPriorFiscalYear": 0,
    "...": "8 more fields"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/latest-crowdfunding

### Crowdfunding Campaign Search API

Search for crowdfunding campaigns by company name, campaign name, or platform with the FMP Crowdfunding Campaign Search API. Access detailed information to track and analyze crowdfunding activities.

**Endpoint**

`GET https://financialmodelingprep.com/stable/crowdfunding-offerings-search?name=enotap`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| name* | string | enotap |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `cik` | string |
| `name` | string |
| `date` | null |

Sample:

```json
[
  {
    "cik": "0001912939",
    "name": "Enotap LLC",
    "date": null
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/crowdfunding-search

### Crowdfunding By CIK API

Access detailed information on all crowdfunding campaigns launched by a specific company with the FMP Crowdfunding By CIK API.

**Endpoint**

`GET https://financialmodelingprep.com/stable/crowdfunding-offerings?cik=0001916078`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| cik* | string | 0001916078 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `cik` | string |
| `companyName` | string |
| `date` | string |
| `filingDate` | string |
| `acceptedDate` | string |
| `formType` | string |
| `formSignification` | string |
| `nameOfIssuer` | string |
| `legalStatusForm` | string |
| `jurisdictionOrganization` | string |
| `issuerStreet` | string |
| `issuerCity` | string |
| `issuerStateOrCountry` | string |
| `issuerZipCode` | string |
| `issuerWebsite` | string |
| `intermediaryCompanyName` | string |
| `intermediaryCommissionCik` | string |
| `intermediaryCommissionFileNumber` | string |
| `compensationAmount` | string |
| `financialInterest` | string |
| `securityOfferedType` | string |
| `securityOfferedOtherDescription` | string |
| `numberOfSecurityOffered` | integer |
| `offeringPrice` | integer |
| `offeringAmount` | integer |
| `overSubscriptionAccepted` | string |
| `overSubscriptionAllocationType` | string |
| `maximumOfferingAmount` | integer |
| `offeringDeadlineDate` | string |
| `currentNumberOfEmployees` | integer |
| `totalAssetMostRecentFiscalYear` | integer |
| `totalAssetPriorFiscalYear` | integer |
| `cashAndCashEquiValentMostRecentFiscalYear` | integer |
| `cashAndCashEquiValentPriorFiscalYear` | integer |
| `accountsReceivableMostRecentFiscalYear` | integer |
| `accountsReceivablePriorFiscalYear` | integer |
| `shortTermDebtMostRecentFiscalYear` | integer |
| `shortTermDebtPriorFiscalYear` | integer |
| `longTermDebtMostRecentFiscalYear` | integer |
| `longTermDebtPriorFiscalYear` | integer |
| `revenueMostRecentFiscalYear` | integer |
| `revenuePriorFiscalYear` | integer |
| `costGoodsSoldMostRecentFiscalYear` | integer |
| `costGoodsSoldPriorFiscalYear` | integer |
| `taxesPaidMostRecentFiscalYear` | integer |
| `taxesPaidPriorFiscalYear` | integer |
| `netIncomeMostRecentFiscalYear` | integer |
| `netIncomePriorFiscalYear` | integer |

Sample:

```json
[
  {
    "cik": "0001916078",
    "companyName": "OYO Fitness, Inc",
    "date": "12-31-2021",
    "filingDate": "2022-07-21 00:00:00",
    "acceptedDate": "2022-07-21 17:28:54",
    "formType": "C-U",
    "formSignification": "Progress Update",
    "nameOfIssuer": "OYO Fitness, Inc",
    "legalStatusForm": "Corporation",
    "jurisdictionOrganization": "DE",
    "issuerStreet": "374 N. 750TH RD",
    "issuerCity": "OVERBROOK",
    "issuerStateOrCountry": "KS",
    "issuerZipCode": "66524",
    "issuerWebsite": "https://www.oyofitness.com/",
    "intermediaryCompanyName": "StartEngine Capital, LLC",
    "intermediaryCommissionCik": "0001665160",
    "intermediaryCommissionFileNumber": "007-00007",
    "compensationAmount": "7 - 13 percent",
    "financialInterest": "Two percent (2%) of securities of the total amount of investments raised in the offering, along the same terms as inves…",
    "securityOfferedType": "Other",
    "securityOfferedOtherDescription": "Non-Voting Common Stock",
    "numberOfSecurityOffered": 5000,
    "offeringPrice": 2,
    "offeringAmount": 10000,
    "overSubscriptionAccepted": "Y",
    "overSubscriptionAllocationType": "Other",
    "maximumOfferingAmount": 1070000,
    "offeringDeadlineDate": "07-19-2022",
    "currentNumberOfEmployees": 5,
    "totalAssetMostRecentFiscalYear": 497717,
    "totalAssetPriorFiscalYear": 248472,
    "cashAndCashEquiValentMostRecentFiscalYear": 150142,
    "cashAndCashEquiValentPriorFiscalYear": 54571,
    "accountsReceivableMostRecentFiscalYear": 0,
    "accountsReceivablePriorFiscalYear": 0,
    "shortTermDebtMostRecentFiscalYear": 3286745,
    "shortTermDebtPriorFiscalYear": 2214117,
    "longTermDebtMostRecentFiscalYear": 82243,
    "longTermDebtPriorFiscalYear": 105850,
    "...": "8 more fields"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/crowdfunding-by-cik

### Equity Offering Updates API

Stay informed about the latest equity offerings with the FMP Equity Offering Updates API. Track new shares being issued by companies and get insights into exempt offerings and amendments.

**Endpoint**

`GET https://financialmodelingprep.com/stable/fundraising-latest?page=0&limit=10`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| page | number | 0 |
| limit | number | 10 |
| cik | string | 0002013736 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `cik` | string |
| `companyName` | string |
| `date` | string |
| `filingDate` | string |
| `acceptedDate` | string |
| `formType` | string |
| `formSignification` | string |
| `entityName` | string |
| `issuerStreet` | string |
| `issuerCity` | string |
| `issuerStateOrCountry` | string |
| `issuerStateOrCountryDescription` | string |
| `issuerZipCode` | string |
| `issuerPhoneNumber` | string |
| `jurisdictionOfIncorporation` | string |
| `entityType` | string |
| `incorporatedWithinFiveYears` | boolean |
| `yearOfIncorporation` | string |
| `relatedPersonFirstName` | string |
| `relatedPersonLastName` | string |
| `relatedPersonStreet` | string |
| `relatedPersonCity` | string |
| `relatedPersonStateOrCountry` | string |
| `relatedPersonStateOrCountryDescription` | string |
| `relatedPersonZipCode` | string |
| `relatedPersonRelationship` | string |
| `industryGroupType` | string |
| `revenueRange` | string |
| `federalExemptionsExclusions` | string |
| `isAmendment` | boolean |
| `dateOfFirstSale` | string |
| `durationOfOfferingIsMoreThanYear` | boolean |
| `securitiesOfferedAreOfEquityType` | null |
| `isBusinessCombinationTransaction` | boolean |
| `minimumInvestmentAccepted` | integer |
| `totalOfferingAmount` | integer |
| `totalAmountSold` | integer |
| `totalAmountRemaining` | integer |
| `hasNonAccreditedInvestors` | boolean |
| `totalNumberAlreadyInvested` | integer |
| `salesCommissions` | integer |
| `findersFees` | integer |
| `grossProceedsUsed` | integer |

Sample:

```json
[
  {
    "cik": "0002103666",
    "companyName": "Evolution Ventures Minerva Fund, LP - B4",
    "date": "2026-04-08",
    "filingDate": "2026-04-08 00:00:00",
    "acceptedDate": "2026-04-08 17:30:42",
    "formType": "D/A",
    "formSignification": "Notice of Exempt Offering of Securities Amendement",
    "entityName": "Evolution Ventures Minerva Fund, LP - B4",
    "issuerStreet": "2006 196TH ST SW",
    "issuerCity": "LYNNWOOD",
    "issuerStateOrCountry": "WA",
    "issuerStateOrCountryDescription": "WASHINGTON",
    "issuerZipCode": "98036",
    "issuerPhoneNumber": "206.801.6359",
    "jurisdictionOfIncorporation": "DELAWARE",
    "entityType": "Limited Partnership",
    "incorporatedWithinFiveYears": true,
    "yearOfIncorporation": "2025",
    "relatedPersonFirstName": "N/A",
    "relatedPersonLastName": "Fund GP, LLC",
    "relatedPersonStreet": "301 North Market Street, Suite 1414",
    "relatedPersonCity": "Wilmington",
    "relatedPersonStateOrCountry": "DE",
    "relatedPersonStateOrCountryDescription": "DELAWARE",
    "relatedPersonZipCode": "19801",
    "relatedPersonRelationship": "Director",
    "industryGroupType": "Pooled Investment Fund",
    "revenueRange": "Decline to Disclose",
    "federalExemptionsExclusions": "06b, 3C, 3C.1",
    "isAmendment": true,
    "dateOfFirstSale": "2026-01-01",
    "durationOfOfferingIsMoreThanYear": false,
    "securitiesOfferedAreOfEquityType": null,
    "isBusinessCombinationTransaction": false,
    "minimumInvestmentAccepted": 10000,
    "totalOfferingAmount": 186842,
    "totalAmountSold": 186842,
    "totalAmountRemaining": 0,
    "hasNonAccreditedInvestors": false,
    "totalNumberAlreadyInvested": 17,
    "...": "3 more fields"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/latest-equity-offering

### Equity Offering Search API

Easily search for equity offerings by company name or stock symbol with the FMP Equity Offering Search API. Access detailed information about recent share issuances to stay informed on company fundraising activities.

**Endpoint**

`GET https://financialmodelingprep.com/stable/fundraising-search?name=NJOY`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| name* | string | NJOY |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `cik` | string |
| `name` | string |
| `date` | string |

Sample:

```json
[
  {
    "cik": "0001547416",
    "name": "NJOY INC",
    "date": "2014-02-28 16:00:25"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/equity-offering-search

### Equity Offering By CIK API

Access detailed information on equity offerings announced by specific companies with the FMP Company Equity Offerings by CIK API. Track offering activity and identify potential investment opportunities.

**Endpoint**

`GET https://financialmodelingprep.com/stable/fundraising?cik=0001547416`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| cik* | string | 0001547416 |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `cik` | string |
| `companyName` | string |
| `date` | string |
| `filingDate` | string |
| `acceptedDate` | string |
| `formType` | string |
| `formSignification` | string |
| `entityName` | string |
| `issuerStreet` | string |
| `issuerCity` | string |
| `issuerStateOrCountry` | string |
| `issuerStateOrCountryDescription` | string |
| `issuerZipCode` | string |
| `issuerPhoneNumber` | string |
| `jurisdictionOfIncorporation` | string |
| `entityType` | string |
| `incorporatedWithinFiveYears` | null |
| `yearOfIncorporation` | string |
| `relatedPersonFirstName` | string |
| `relatedPersonLastName` | string |
| `relatedPersonStreet` | string |
| `relatedPersonCity` | string |
| `relatedPersonStateOrCountry` | string |
| `relatedPersonStateOrCountryDescription` | string |
| `relatedPersonZipCode` | string |
| `relatedPersonRelationship` | string |
| `industryGroupType` | string |
| `revenueRange` | string |
| `federalExemptionsExclusions` | string |
| `isAmendment` | boolean |
| `dateOfFirstSale` | string |
| `durationOfOfferingIsMoreThanYear` | boolean |
| `securitiesOfferedAreOfEquityType` | boolean |
| `isBusinessCombinationTransaction` | boolean |
| `minimumInvestmentAccepted` | integer |
| `totalOfferingAmount` | integer |
| `totalAmountSold` | integer |
| `totalAmountRemaining` | integer |
| `hasNonAccreditedInvestors` | boolean |
| `totalNumberAlreadyInvested` | integer |
| `salesCommissions` | integer |
| `findersFees` | integer |
| `grossProceedsUsed` | integer |

Sample:

```json
[
  {
    "cik": "0001547416",
    "companyName": "NJOY INC",
    "date": "2014-02-28",
    "filingDate": "2014-02-28 00:00:00",
    "acceptedDate": "2014-02-28 16:00:25",
    "formType": "D",
    "formSignification": "Notice of Exempt Offering of Securities",
    "entityName": "NJOY INC",
    "issuerStreet": "15211 N. KIERLAND BLVD., SUITE 200",
    "issuerCity": "SCOTTSDALE",
    "issuerStateOrCountry": "AZ",
    "issuerStateOrCountryDescription": "ARIZONA",
    "issuerZipCode": "85254",
    "issuerPhoneNumber": "480-397-2300",
    "jurisdictionOfIncorporation": "DELAWARE",
    "entityType": "Corporation",
    "incorporatedWithinFiveYears": null,
    "yearOfIncorporation": "",
    "relatedPersonFirstName": "CRAIG",
    "relatedPersonLastName": "WEISS",
    "relatedPersonStreet": "c/o NJOY, INC.",
    "relatedPersonCity": "SCOTTSDALE",
    "relatedPersonStateOrCountry": "AZ",
    "relatedPersonStateOrCountryDescription": "ARIZONA",
    "relatedPersonZipCode": "85254",
    "relatedPersonRelationship": "Executive Officer, Director",
    "industryGroupType": "Other",
    "revenueRange": "Decline to Disclose",
    "federalExemptionsExclusions": "06b",
    "isAmendment": false,
    "dateOfFirstSale": "2014-02-14",
    "durationOfOfferingIsMoreThanYear": false,
    "securitiesOfferedAreOfEquityType": true,
    "isBusinessCombinationTransaction": false,
    "minimumInvestmentAccepted": 0,
    "totalOfferingAmount": 71999990,
    "totalAmountSold": 71999990,
    "totalAmountRemaining": 0,
    "hasNonAccreditedInvestors": false,
    "totalNumberAlreadyInvested": 24,
    "...": "3 more fields"
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/equity-offering-by-cik
