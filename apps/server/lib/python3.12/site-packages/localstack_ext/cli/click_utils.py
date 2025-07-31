from typing import List
from localstack.cli import console
def print_table(column_headers,columns):
	C=columns;B=column_headers;from rich.table import Table;assert len(B)==len(C);A=Table(show_header=True,header_style='bold')
	for D in B:A.add_column(D)
	for E in zip(*C):A.add_row(*E)
	console.print(A)