import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import os
import threading
from datetime import datetime, timedelta
import pandas as pd
import tempfile
from datetime import datetime


# Import your existing function which writes Excel files directly
from HKtableextract import scrape_manually_reconstruct


def scrape_and_return_df(date_str):
    """
    Calls the existing scrape_manually_reconstruct(date_str, output_file)
    which writes an Excel file to output_file.
    This wrapper saves to a temp file, reads it back into a DataFrame,
    then deletes the temp file, and returns the DataFrame.
    """
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
        temp_filename = tmp.name

    try:
        scrape_manually_reconstruct(date_str, temp_filename)
        df = pd.read_excel(temp_filename, sheet_name=0)
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

    return df



class HKTableExtractApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("HK Table Extract Tool")
        self.geometry("600x450")

        self.database_file = ""

        today_str = datetime.now().strftime("%Y%m%d")  # Current date as YYYYMMDD string

        # Start Date Entry
        ttk.Label(self, text="Start Date (YYYYMMDD):").pack(pady=(10, 0))
        self.start_date_var = tk.StringVar(value=today_str)
        start_entry = ttk.Entry(self, textvariable=self.start_date_var)
        start_entry.pack(pady=5, fill='x', padx=10)

        # End Date Entry
        ttk.Label(self, text="End Date (YYYYMMDD):").pack(pady=(10, 0))
        self.end_date_var = tk.StringVar(value=today_str)
        end_entry = ttk.Entry(self, textvariable=self.end_date_var)
        end_entry.pack(pady=5, fill='x', padx=10)

        # Database File Selection Frame (only folder selection removed)
        db_frame = ttk.Frame(self)
        db_frame.pack(pady=5, fill='x', padx=10)

        self.db_label = ttk.Label(db_frame, text="No database file selected", wraplength=500)
        self.db_label.pack(side='left', fill='x', expand=True)

        select_db_btn = ttk.Button(db_frame, text="Select Database File", command=self.select_database_file)
        select_db_btn.pack(side='right')

        # Run Button
        run_btn = ttk.Button(self, text="Run Scraper for Date Range", command=self.run_scraper_thread)
        run_btn.pack(pady=10)

        # Log Frame
        log_frame = ttk.LabelFrame(self, text="Log")
        log_frame.pack(fill='both', expand=True, padx=10, pady=(5, 10))

        self.log_text = tk.Text(log_frame, height=15, state='disabled', wrap='word')
        self.log_text.pack(side='left', fill='both', expand=True)

        scrollbar = ttk.Scrollbar(log_frame, orient='vertical', command=self.log_text.yview)
        scrollbar.pack(side='right', fill='y')

        self.log_text.config(yscrollcommand=scrollbar.set)

    def select_database_file(self):
        file_selected = filedialog.askopenfilename(
            filetypes=[("Excel files", "*.xlsx *.xls")],
            title="Select Excel Database File"
        )
        if file_selected:
            self.database_file = file_selected
            self.db_label.config(text=file_selected)
            self.log(f"Selected database file: {file_selected}")

    def run_scraper_thread(self):
        # Disable the run button while scraping
        for child in self.winfo_children():
            if isinstance(child, ttk.Button) and child.cget('text').startswith('Run Scraper'):
                child.config(state='disabled')
                break

        t = threading.Thread(target=self.run_scraper)
        t.daemon = True
        t.start()

    def run_scraper(self):
        start_date_str = self.start_date_var.get().strip()
        end_date_str = self.end_date_var.get().strip()

        # Validate dates format
        try:
            start_date = datetime.strptime(start_date_str, "%Y%m%d")
            end_date = datetime.strptime(end_date_str, "%Y%m%d")
        except ValueError:
            self.log("Error: Invalid date format. Please enter date as YYYYMMDD.", True)
            self.enable_run_button()
            messagebox.showerror("Invalid Date", "Please enter valid dates in YYYYMMDD format.")
            return

        if start_date > end_date:
            self.log("Error: Start date is after end date.", True)
            self.enable_run_button()
            messagebox.showerror("Date Range Error", "Start date must not be after end date.")
            return

        if not self.database_file:
            self.log("Error: No database file selected.", True)
            self.enable_run_button()
            messagebox.showerror("No Database File", "Please select the existing Excel database file first.")
            return

        # Check if database file exists
        if not os.path.isfile(self.database_file):
            self.log(f"Error: The database file '{self.database_file}' does not exist.", True)
            self.enable_run_button()
            messagebox.showerror("Database File Not Found", f"The file '{self.database_file}' was not found.")
            return

        current_date = start_date
        total_days = (end_date - start_date).days + 1

        try:
            for day_count in range(total_days):
                date_str = current_date.strftime("%Y%m%d")
                date_sheet_name = current_date.strftime("%d%m%y")  # ddmmyy format

                self.log(f"Scraping date {date_str} ({day_count + 1}/{total_days})...")

                # Use the wrapper function that calls your existing scraper and returns a DataFrame
                df = scrape_and_return_df(date_str)

                if df is None or df.empty:
                    self.log(f"No data returned for {date_str}, skipping.", True)
                    current_date += timedelta(days=1)
                    continue

                # Check if sheet with the same name already exists
                with pd.ExcelFile(self.database_file) as xls:
                    existing_sheets = xls.sheet_names

                if date_sheet_name in existing_sheets:
                    self.log(f"Warning: Sheet '{date_sheet_name}' already exists. It will be replaced.")

                    # Read all sheets except the one to replace
                    all_sheets_dfs = {}
                    with pd.ExcelFile(self.database_file) as xls:
                        for sheet in existing_sheets:
                            if sheet != date_sheet_name:
                                all_sheets_dfs[sheet] = pd.read_excel(xls, sheet_name=sheet)

                    # Write all the other sheets + the new sheet (replace)
                    with pd.ExcelWriter(self.database_file, engine='openpyxl', mode='w') as writer:
                        for sheet, data in all_sheets_dfs.items():
                            data.to_excel(writer, sheet_name=sheet, index=False)
                        df.to_excel(writer, sheet_name=date_sheet_name, index=False)

                    self.log(f"Replaced existing sheet '{date_sheet_name}' in database.")
                else:
                    # Append new sheet
                    with pd.ExcelWriter(self.database_file, engine='openpyxl', mode='a', if_sheet_exists='error') as writer:
                        df.to_excel(writer, sheet_name=date_sheet_name, index=False)
                    self.log(f"Appended new sheet '{date_sheet_name}' to database.")

                current_date += timedelta(days=1)

            self.log("Scraping completed successfully.\n")
            messagebox.showinfo("Success", f"Scraping completed for {total_days} days.\nSheets added to:\n{self.database_file}")

        except Exception as e:
            self.log(f"Error during scraping: {e}", True)
            messagebox.showerror("Error", f"Error during scraping:\n{e}")

        finally:
            self.enable_run_button()

    def log(self, message, error=False):
        def append():
            self.log_text['state'] = 'normal'
            if error:
                self.log_text.insert(tk.END, f"ERROR: {message}\n")
            else:
                self.log_text.insert(tk.END, message + "\n")
            self.log_text.see(tk.END)
            self.log_text['state'] = 'disabled'

        self.after(0, append)

    def enable_run_button(self):
        for child in self.winfo_children():
            if isinstance(child, ttk.Button) and child.cget('text').startswith('Run Scraper'):
                child.config(state='normal')
                break


if __name__ == "__main__":
    app = HKTableExtractApp()
    app.mainloop()
