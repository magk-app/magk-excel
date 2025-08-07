import { useCallback } from 'react';

interface DemoFunctionsOptions {
  activeSessionId?: string;
  addMessage: (sessionId: string, message: any) => void;
  updateMessage: (sessionId: string, messageId: string, updates: any) => void;
  getActiveSession: () => any;
}

export function useDemoFunctions({
  activeSessionId,
  addMessage,
  updateMessage,
  getActiveSession
}: DemoFunctionsOptions) {
  const simulateTyping = useCallback((sessionId: string, messageId: string, fullText: string, delay: number = 50) => {
    let currentIndex = 0;
    const typeChar = () => {
      if (currentIndex <= fullText.length) {
        updateMessage(sessionId, messageId, {
          role: 'assistant',
          content: fullText.substring(0, currentIndex)
        });
        currentIndex++;
        if (currentIndex <= fullText.length) {
          setTimeout(typeChar, delay);
        }
      }
    };
    typeChar();
  }, [updateMessage]);

  const runHKPassengerDemo = useCallback(async () => {
    if (!activeSessionId) return;
    
    // Add user message
    const userMessageId = `demo_hk_${Date.now()}`;
    addMessage(activeSessionId, {
      id: userMessageId,
      role: 'user',
      content: 'I need to extract the latest Hong Kong passenger statistics from the Immigration Department website. Can you help me scrape the arrival and departure data and create an Excel file?',
      timestamp: new Date()
    });

    // Add assistant response with proper conversation flow
    const assistantMessageId = `demo_hk_response_${Date.now()}`;
    addMessage(activeSessionId, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    });

    // Full response text
    const fullResponse = `I'll help you extract the Hong Kong passenger statistics from the Immigration Department website. Let me scrape the arrival and departure data for you.

## 🔍 Analyzing Website Structure

First, I'm accessing the Hong Kong Immigration Department's statistics page to understand the data structure...

\`\`\`
🌐 Connecting to www.immd.gov.hk
📊 Identifying data tables
🔎 Locating passenger statistics section
\`\`\`

## 📊 Data Extraction

I've found the passenger statistics tables. Here's what I'm extracting:

- **Arrival Statistics by Control Point**
  - Hong Kong International Airport: 45,892 passengers
  - Lo Wu: 28,456 passengers
  - Lok Ma Chau: 15,234 passengers
  - West Kowloon Station: 12,678 passengers

- **Departure Statistics by Control Point**
  - Hong Kong International Airport: 44,567 passengers
  - Lo Wu: 27,890 passengers
  - Lok Ma Chau: 14,567 passengers  
  - West Kowloon Station: 11,234 passengers

## 📈 Creating Excel Report

Now I'm organizing this data into a structured Excel file with the following sheets:

1. **Summary Dashboard** - Overview with charts
2. **Arrival Data** - Detailed arrival statistics
3. **Departure Data** - Detailed departure statistics
4. **Trends Analysis** - Month-over-month comparisons

## ✅ Export Complete!

I've successfully extracted the Hong Kong passenger statistics and created a comprehensive Excel report with:

- Total Arrivals: **102,260 passengers**
- Total Departures: **98,258 passengers**
- Net Movement: **+4,002 passengers**

📥 **Download your report:** [HK_Passenger_Statistics_2025.xlsx](data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,demo)

The Excel file includes interactive charts, pivot tables, and formatted data tables for easy analysis. You can open it in Excel or Google Sheets for further analysis.`;

    // Simulate typing animation
    simulateTyping(activeSessionId, assistantMessageId, fullResponse, 30);
  }, [activeSessionId, addMessage, simulateTyping]);

  const runPDFBalanceSheetDemo = useCallback(async () => {
    if (!activeSessionId) return;
    
    // Add user message with PDF link
    const userMessageId = `demo_pdf_${Date.now()}`;
    addMessage(activeSessionId, {
      id: userMessageId,
      role: 'user',
      content: 'I need to extract the consolidated balance sheets from Google\'s latest 10-Q filing. Can you help me extract the financial data from this PDF?\n\n📎 [https://abc.xyz/assets/51/e1/bf43f01041f6a8882a29d7e89cae/goog-10-q-q1-2025.pdf](https://abc.xyz/assets/51/e1/bf43f01041f6a8882a29d7e89cae/goog-10-q-q1-2025.pdf)',
      timestamp: new Date()
    });

    // Add assistant response
    const assistantMessageId = `demo_pdf_response_${Date.now()}`;
    addMessage(activeSessionId, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    });

    const fullResponse = `I'll extract the consolidated balance sheet data from Google's 10-Q filing PDF. Let me process this document for you.

## 📄 Processing PDF Document

Analyzing the PDF structure and extracting financial tables...

\`\`\`
📥 Downloading PDF (156 pages)
🔍 Scanning for financial statements
📊 Locating balance sheet section
✂️ Extracting tabular data
\`\`\`

## 💰 Consolidated Balance Sheet - Alphabet Inc.

I've successfully extracted the balance sheet data. Here are the key figures:

### **Assets (in millions)**
| Item | Q1 2025 | Q4 2024 | Change |
|------|---------|---------|--------|
| **Current Assets** | | | |
| Cash and cash equivalents | $24,048 | $23,902 | +0.6% |
| Marketable securities | $91,883 | $89,654 | +2.5% |
| Accounts receivable | $39,304 | $40,258 | -2.4% |
| Other current assets | $8,713 | $8,124 | +7.3% |
| **Total Current Assets** | **$163,948** | **$161,938** | **+1.2%** |
| | | | |
| **Non-Current Assets** | | | |
| Property and equipment, net | $134,346 | $131,234 | +2.4% |
| Goodwill | $29,198 | $29,067 | +0.5% |
| Other non-current assets | $48,369 | $47,892 | +1.0% |
| **Total Assets** | **$375,861** | **$370,131** | **+1.5%** |

### **Liabilities & Equity (in millions)**
| Item | Q1 2025 | Q4 2024 | Change |
|------|---------|---------|--------|
| **Current Liabilities** | | | |
| Accounts payable | $7,481 | $7,993 | -6.4% |
| Accrued expenses | $42,613 | $44,512 | -4.3% |
| Deferred revenue | $3,908 | $3,651 | +7.0% |
| **Total Current Liabilities** | **$54,002** | **$56,156** | **-3.8%** |
| | | | |
| **Stockholders' Equity** | | | |
| Common stock | $73,116 | $71,234 | +2.6% |
| Retained earnings | $236,003 | $230,122 | +2.6% |
| **Total Stockholders' Equity** | **$309,119** | **$301,356** | **+2.6%** |

## 📊 Excel Export Generated

I've created a comprehensive Excel file with:

✅ **Sheet 1: Balance Sheet** - Complete balance sheet with all line items
✅ **Sheet 2: Financial Ratios** - Key metrics and calculations
✅ **Sheet 3: Trend Analysis** - Quarter-over-quarter comparisons
✅ **Sheet 4: Charts** - Visual representations of key metrics

## 💡 Key Insights

- **Strong Cash Position**: $115.9B in cash and marketable securities
- **Asset Growth**: Total assets increased by 1.5% QoQ
- **Improved Equity**: Stockholders' equity grew by 2.6%
- **Reduced Liabilities**: Current liabilities decreased by 3.8%

📥 **Download Excel Report:** [Google_Balance_Sheet_Q1_2025.xlsx](data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,demo)

The Excel file is ready for download and includes all extracted data with proper formatting, formulas, and charts for your analysis.`;

    // Simulate typing animation
    simulateTyping(activeSessionId, assistantMessageId, fullResponse, 25);
  }, [activeSessionId, addMessage, simulateTyping]);

  return {
    runHKPassengerDemo,
    runPDFBalanceSheetDemo
  };
}