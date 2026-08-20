# FMP API Group: Statements

Source: https://site.financialmodelingprep.com/developer/docs#statements

Endpoints: 27

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Income Statement API

Access detailed income statement data for publicly traded companies with the Income Statements API. Track profitability, compare competitors, and identify business trends with up-to-date financial data.

**Endpoint**

`GET https://financialmodelingprep.com/stable/income-statement?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |
| period | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY`, `annual`, `quarter` |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `income-statement`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/income-statement

### Balance Sheet Statement API

Access detailed balance sheet statements for publicly traded companies with the Balance Sheet Data API. Analyze assets, liabilities, and shareholder equity to gain insights into a company's financial health.

**Endpoint**

`GET https://financialmodelingprep.com/stable/balance-sheet-statement?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |
| period | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY`, `annual`, `quarter` |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `balance-sheet-statement`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/balance-sheet-statement

### Cash Flow Statement API

Gain insights into a company's cash flow activities with the Cash Flow Statements API. Analyze cash generated and used from operations, investments, and financing activities to evaluate the financial health and sustainability of a business.

**Endpoint**

`GET https://financialmodelingprep.com/stable/cash-flow-statement?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |
| period | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY`, `annual`, `quarter` |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `cashflow-statement`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cashflow-statement

### Latest Financial Statements API

**Endpoint**

`GET https://financialmodelingprep.com/stable/latest-financial-statements?page=0&limit=250`

Note: maximum `250` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| page | number | 0 |
| limit | number | 250 |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `latest-financial-statements`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/latest-financial-statements

### Income Statements TTM API

**Endpoint**

`GET https://financialmodelingprep.com/stable/income-statement-ttm?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `income-statements-ttm`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/income-statements-ttm

### Balance Sheet Statements TTM API

**Endpoint**

`GET https://financialmodelingprep.com/stable/balance-sheet-statement-ttm?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `balance-sheet-statements-ttm`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/balance-sheet-statements-ttm

### Cashflow Statements TTM API

**Endpoint**

`GET https://financialmodelingprep.com/stable/cash-flow-statement-ttm?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `cashflow-statements-ttm`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cashflow-statements-ttm

### Key Metrics API

Access essential financial metrics for a company with the FMP Financial Key Metrics API. Evaluate revenue, net income, P/E ratio, and more to assess performance and compare it to competitors.

**Endpoint**

`GET https://financialmodelingprep.com/stable/key-metrics?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |
| period | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY`, `annual`, `quarter` |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `key-metrics`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/key-metrics

### Financial Ratios API

Analyze a company's financial performance using the Financial Ratios API. This API provides detailed profitability, liquidity, and efficiency ratios, enabling users to assess a company's operational and financial health across various metrics.

**Endpoint**

`GET https://financialmodelingprep.com/stable/ratios?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |
| period | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY`, `annual`, `quarter` |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `metrics-ratios`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/metrics-ratios

### Key Metrics TTM API

Retrieve a comprehensive set of trailing twelve-month (TTM) key performance metrics with the TTM Key Metrics API. Access data related to a company's profitability, capital efficiency, and liquidity, allowing for detailed analysis of its financial health over the past year.

**Endpoint**

`GET https://financialmodelingprep.com/stable/key-metrics-ttm?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `key-metrics-ttm`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/key-metrics-ttm

### Financial Ratios TTM API

Gain access to trailing twelve-month (TTM) financial ratios with the TTM Ratios API. This API provides key performance metrics over the past year, including profitability, liquidity, and efficiency ratios.

**Endpoint**

`GET https://financialmodelingprep.com/stable/ratios-ttm?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `metrics-ratios-ttm`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/metrics-ratios-ttm

### Financial Scores API

Assess a company's financial strength using the Financial Health Scores API. This API provides key metrics such as the Altman Z-Score and Piotroski Score, giving users insights into a companyâs overall financial health and stability.

**Endpoint**

`GET https://financialmodelingprep.com/stable/financial-scores?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `financial-scores`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/financial-scores

### Owner Earnings API

Retrieve a company's owner earnings with the Owner Earnings API, which provides a more accurate representation of cash available to shareholders by adjusting net income. This metric is crucial for evaluating a companyâs profitability from the perspective of investors.

**Endpoint**

`GET https://financialmodelingprep.com/stable/owner-earnings?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `owner-earnings`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/owner-earnings

### Enterprise Values API

Access a company's enterprise value using the Enterprise Values API. This metric offers a comprehensive view of a company's total market value by combining both its equity (market capitalization) and debt, providing a better understanding of its worth.

**Endpoint**

`GET https://financialmodelingprep.com/stable/enterprise-values?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |
| period | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY`, `annual`, `quarter` |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `enterprise-values`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/enterprise-values

### Income Statement Growth API

Track key financial growth metrics with the Income Statement Growth API. Analyze how revenue, profits, and expenses have evolved over time, offering insights into a companyâs financial health and operational efficiency.

**Endpoint**

`GET https://financialmodelingprep.com/stable/income-statement-growth?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |
| period | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY`, `annual`, `quarter` |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `income-statement-growth`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/income-statement-growth

### Balance Sheet Statement Growth API

Analyze the growth of key balance sheet items over time with the Balance Sheet Statement Growth API. Track changes in assets, liabilities, and equity to understand the financial evolution of a company.

**Endpoint**

`GET https://financialmodelingprep.com/stable/balance-sheet-statement-growth?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |
| period | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY`, `annual`, `quarter` |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `balance-sheet-statement-growth`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/balance-sheet-statement-growth

### Cashflow Statement Growth API

Measure the growth rate of a companyâs cash flow with the FMP Cashflow Statement Growth API. Determine how quickly a companyâs cash flow is increasing or decreasing over time.

**Endpoint**

`GET https://financialmodelingprep.com/stable/cash-flow-statement-growth?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |
| period | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY`, `annual`, `quarter` |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `cashflow-statement-growth`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/cashflow-statement-growth

### Financial Statement Growth API

Analyze the growth of key financial statement items across income, balance sheet, and cash flow statements with the Financial Statement Growth API. Track changes over time to understand trends in financial performance.

**Endpoint**

`GET https://financialmodelingprep.com/stable/financial-growth?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |
| period | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY`, `annual`, `quarter` |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `financial-statement-growth`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/financial-statement-growth

### Financial Reports Dates API

**Endpoint**

`GET https://financialmodelingprep.com/stable/financial-reports-dates?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `financial-reports-dates`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/financial-reports-dates

### Financial Reports Form 10-K JSON API

Access comprehensive annual reports with the FMP Annual Reports on Form 10-K API. Obtain detailed information about a companyâs financial performance, business operations, and risk factors as reported to the SEC.

**Endpoint**

`GET https://financialmodelingprep.com/stable/financial-reports-json?symbol=AAPL&year=2022&period=FY`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| year* | number | 2022 |
| period* | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY` |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `financial-reports-form-10-k-json`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/financial-reports-form-10-k-json

### Financial Reports Form 10-K XLSX API

Download detailed 10-K reports in XLSX format with the Financial Reports Form 10-K XLSX API. Effortlessly access and analyze annual financial data for companies in a spreadsheet-friendly format.

**Endpoint**

`GET https://financialmodelingprep.com/stable/financial-reports-xlsx?symbol=AAPL&year=2022&period=FY`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| year* | number | 2022 |
| period* | string | `Q1`, `Q2`, `Q3`, `Q4`, `FY` |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `financial-reports-form-10-k-xlsx`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/financial-reports-form-10-k-xlsx

### Revenue Product Segmentation API

Access detailed revenue breakdowns by product line with the Revenue Product Segmentation API. Understand which products drive a company's earnings and get insights into the performance of individual product segments.

**Endpoint**

`GET https://financialmodelingprep.com/stable/revenue-product-segmentation?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| period | string | `annual`, `quarter` |
| structure | string | flat |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `revenue-product-segmentation`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/revenue-product-segmentation

### Revenue Geographic Segments API

Access detailed revenue breakdowns by geographic region with the Revenue Geographic Segments API. Analyze how different regions contribute to a companyâs total revenue and identify key markets for growth.

**Endpoint**

`GET https://financialmodelingprep.com/stable/revenue-geographic-segmentation?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| period | string | `annual`, `quarter` |
| structure | string | flat |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `revenue-geographic-segments`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/revenue-geographic-segments

### As Reported Income Statements API

Retrieve income statements as they were reported by the company with the As Reported Income Statements API. Access raw financial data directly from official company filings, including revenue, expenses, and net income.

**Endpoint**

`GET https://financialmodelingprep.com/stable/income-statement-as-reported?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |
| period | string | `annual`, `quarter` |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `as-reported-income-statements`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/as-reported-income-statements

### As Reported Balance Statements API

Access balance sheets as reported by the company with the As Reported Balance Statements API. View detailed financial data on assets, liabilities, and equity directly from official filings.

**Endpoint**

`GET https://financialmodelingprep.com/stable/balance-sheet-statement-as-reported?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |
| period | string | `annual`, `quarter` |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `as-reported-balance-statements`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/as-reported-balance-statements

### As Reported Cashflow Statements API

View cash flow statements as reported by the company with the As Reported Cash Flow Statements API. Analyze a company's cash flows related to operations, investments, and financing directly from official reports.

**Endpoint**

`GET https://financialmodelingprep.com/stable/cash-flow-statement-as-reported?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |
| period | string | `annual`, `quarter` |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `as-reported-cashflow-statements`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/as-reported-cashflow-statements

### As Reported Financial Statements API

Retrieve comprehensive financial statements as reported by companies with FMP As Reported Financial Statements API. Access complete data across income, balance sheet, and cash flow statements in their original form for detailed analysis.

**Endpoint**

`GET https://financialmodelingprep.com/stable/financial-statement-full-as-reported?symbol=AAPL`

Note: maximum `1000` records per request.

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |
| limit | number | 5 |
| period | string | `annual`, `quarter` |

**Response**

Format: JSON response. Example not embedded in the FMP docs bundle for response id `as-reported-financial-statements`; inspect a live authorized response before hardcoding fields.

Docs: https://site.financialmodelingprep.com/developer/docs/stable/as-reported-financial-statements
