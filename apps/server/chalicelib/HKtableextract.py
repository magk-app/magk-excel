from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import pandas as pd
import time

def scrape_manually_reconstruct(date_str, output_file):
    url = f"https://www.immd.gov.hk/eng/facts/passenger-statistics.html?d={date_str}"

    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    driver = webdriver.Chrome(options=options)

    try:
        driver.get(url)
        time.sleep(5)  # Ensure page and JS fully loaded

        # Find table containing "Control Point" in header
        table_element = driver.find_element(By.XPATH, "//table[.//th[contains(text(), 'Control Point')]]")

        rows = table_element.find_elements(By.TAG_NAME, "tr")
        print(f"Found {len(rows)} rows in the table.")

        all_rows = []
        for row in rows:
            cells = row.find_elements(By.XPATH, "./th|./td")
            row_data = [cell.text.strip() for cell in cells]
            if any(row_data):
                all_rows.append(row_data)

    finally:
        driver.quit()

    # Inspect first 5 rows for understanding header structure
    print("Sample of first 5 extracted rows:")
    for i, r in enumerate(all_rows[:5]):
        print(f"Row {i}: {r}")

    header_rows_count = 3  # or whatever you determined

    header_rows = all_rows[:header_rows_count]
    data_rows = all_rows[header_rows_count:]

    # ===== MANUAL HEADER ADJUSTMENT HERE =====
    # Insert blanks in header rows to align columns manually
    data_rows[0] = ['', '', '', '', '', 'Arrival', '', '', '', '', 'Departure']
    data_rows[1] = ['', '', '', '', '', 'Hong Kong Residents', 'Mainland Visitors', 'Other Visitors', 'Total',
                    '', 'Hong Kong Residents', 'Mainland Visitors', 'Other Visitors', 'Total']
    # ========================================

    max_len = 14
    print(f"Padding all header rows to {max_len} columns")

    header_rows_padded = [r + ['']*(max_len - len(r)) for r in header_rows]

    for i, r in enumerate(header_rows_padded):
        print(f"Padded header row {i} length: {len(r)}, content: {r}")

    # Proceed building MultiIndex and DataFrame as usual
    header_tuples = list(zip(*header_rows_padded))
    assert len(header_tuples) == max_len, f"Header count {len(header_tuples)} != data columns {max_len}"

    multi_index = pd.MultiIndex.from_tuples(header_tuples)


    # Construct MultiIndex column tuples again
    header_tuples = list(zip(*header_rows_padded))

    # Make sure length matches data columns count
    assert len(header_tuples) == max_len, f"Header count {len(header_tuples)} != data columns {max_len}"

    multi_index = pd.MultiIndex.from_tuples(header_tuples)
    print(f"Number of MultiIndex columns: {len(multi_index)}")

    # Build DataFrame
    df = pd.DataFrame(data_rows, columns=multi_index)

    # Optional: flatten for Excel export ease
    df.columns = [' '.join(filter(None, map(str, col))).strip() for col in df.columns.values]

    # Remove repeated header rows if found inside data (check first column contains 'Control Point')
    df = df[~df.iloc[:, 0].str.contains('Control Point', na=False)]

    # Drop completely empty rows
    df.dropna(how='all', inplace=True)
    df.reset_index(drop=True, inplace=True)

    df.to_excel(output_file, index=False)
    print(f"Saved full passenger statistics to: {output_file}")


if __name__ == "__main__":
    date_to_scrape = "20250718"
    output_file_path = f"passenger_stats_{date_to_scrape}.xlsx"
    scrape_manually_reconstruct(date_to_scrape, output_file_path)
