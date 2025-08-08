#!/usr/bin/env python3
"""
Textbook OCR Processor - Process large textbooks in chunks

This script processes a large PDF textbook in manageable chunks,
using OCR to extract text. It saves each chunk to a separate file
and can also merge them into a single output file when complete.

Usage:
    python extract_textbook_chunks.py <pdf_file> <output_dir> [--chunk-size N] [--start N] [--end N] [--merge]

Example:
    python extract_textbook_chunks.py 405_txtbook.pdf textbook_chunks --chunk-size 50 --start 1 --end 570 --merge
"""

import os
import sys
import time
import argparse
from pdf2image import convert_from_path
import pytesseract
from concurrent.futures import ThreadPoolExecutor, as_completed


def extract_text_from_page(page, page_num, total_pages, absolute_page_num):
    """
    Extract text from a single page using OCR.
    
    Args:
        page: The page image to process
        page_num: The relative page number within the current chunk
        total_pages: Total pages in the current chunk
        absolute_page_num: The absolute page number in the PDF
    """
    print(f"Processing page {page_num}/{total_pages}...", end="\r", flush=True)
    text = pytesseract.image_to_string(page)
    # Add a clear page header to identify the exact page in the textbook
    page_header = f"\n\n====================\nTEXTBOOK PAGE {absolute_page_num}\n====================\n\n"
    return page_header + text


def process_chunk(pdf_path, output_file, start_page, end_page, max_workers=4):
    """Process a chunk of pages from the PDF and save to output_file."""
    try:
        print(f"\nProcessing chunk from page {start_page} to {end_page}")
        chunk_start_time = time.time()
        
        # Convert pages to images
        print(f"Converting pages {start_page}-{end_page} to images...")
        pages = convert_from_path(
            pdf_path,
            first_page=start_page,
            last_page=end_page,
            dpi=300,  # Higher DPI for better OCR results
            thread_count=max_workers
        )
        
        total_pages = len(pages)
        print(f"Successfully converted {total_pages} pages to images")
        
        # Extract text from each page using OCR with parallel processing
        all_text = []
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit OCR tasks for each page
            future_to_page = {
                executor.submit(
                    extract_text_from_page, 
                    page, 
                    i+1, 
                    total_pages,
                    start_page + i  # Calculate absolute page number
                ): i
                for i, page in enumerate(pages)
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_page):
                page_idx = future_to_page[future]
                try:
                    page_text = future.result()
                    # Store text with its page index for proper ordering
                    all_text.append((page_idx, page_text))
                except Exception as e:
                    print(f"\nError processing page {page_idx+1} in chunk: {e}")
        
        # Sort by page index and join text
        all_text.sort(key=lambda x: x[0])
        text_content = "".join(text for _, text in all_text)
        
        # Write to chunk output file
        with open(output_file, 'w', encoding='utf-8') as f:
            # Add header with page numbers
            f.write(f"--- Textbook Pages {start_page} to {end_page} ---\n\n")
            f.write(text_content)
        
        chunk_time = time.time() - chunk_start_time
        print(f"\nChunk processed in {chunk_time:.2f} seconds " +
              f"({total_pages / chunk_time:.2f} pages/sec)")
        print(f"Chunk saved to {output_file}")
        
        return True
    
    except Exception as e:
        print(f"Error processing chunk {start_page}-{end_page}: {e}")
        return False


def merge_chunks(output_dir, output_file):
    """Merge all chunk files into a single output file."""
    try:
        print(f"\nMerging chunks into {output_file}...")
        
        # Get all chunk files and sort them
        chunk_files = [f for f in os.listdir(output_dir) if f.startswith('chunk_') and f.endswith('.txt')]
        chunk_files.sort(key=lambda f: int(f.split('_')[1].split('-')[0]))
        
        # Merge files
        with open(output_file, 'w', encoding='utf-8') as outfile:
            outfile.write(f"--- Complete Textbook ---\n\n")
            
            for chunk_file in chunk_files:
                chunk_path = os.path.join(output_dir, chunk_file)
                with open(chunk_path, 'r', encoding='utf-8') as infile:
                    # Skip the first two lines (chunk header)
                    next(infile)
                    next(infile)
                    outfile.write(infile.read())
        
        print(f"All chunks merged into {output_file}")
        return True
    
    except Exception as e:
        print(f"Error merging chunks: {e}")
        return False


def main():
    """Parse command line arguments and process PDF in chunks."""
    parser = argparse.ArgumentParser(description="Process PDF textbook in chunks using OCR")
    
    parser.add_argument("pdf_file", help="Path to the PDF textbook")
    parser.add_argument("output_dir", help="Directory to save output chunks")
    parser.add_argument("--chunk-size", type=int, default=50, 
                      help="Number of pages per chunk (default: 50)")
    parser.add_argument("--start", type=int, default=1,
                      help="First page to process (default: 1)")
    parser.add_argument("--end", type=int, default=None,
                      help="Last page to process (default: all pages)")
    parser.add_argument("--max-workers", type=int, default=4,
                      help="Maximum number of parallel workers (default: 4)")
    parser.add_argument("--merge", action="store_true",
                      help="Merge all chunks into single file when done")
    
    args = parser.parse_args()
    
    # Ensure output directory exists
    os.makedirs(args.output_dir, exist_ok=True)
    
    start_time = time.time()
    
    try:
        # Determine the total number of pages in the PDF
        print(f"Checking PDF file: {args.pdf_file}")
        sample_pages = convert_from_path(args.pdf_file, first_page=1, last_page=1)
        print(f"PDF opened successfully")
        
        # If end page not specified, try to determine it
        if args.end is None:
            # This is a rough way to determine the page count
            # The proper way would be to use a PDF library, but we're sticking with 
            # what we already have installed
            print("Estimating total pages (this may take a moment)...")
            try:
                # Try to get the last page - this might be slow for large PDFs
                # and may not work for all PDFs
                last_pages = convert_from_path(args.pdf_file, first_page=10000, last_page=10001)
                print("PDF appears to have 10000+ pages, using end=10000")
                args.end = 10000
            except:
                # If that fails, try a more conservative estimate
                try:
                    last_pages = convert_from_path(args.pdf_file, first_page=1000, last_page=1001)
                    print("PDF appears to have 1000+ pages, using end=1000")
                    args.end = 1000
                except:
                    # Fall back to a very conservative estimate
                    print("Could not determine page count, using end=500")
                    args.end = 500
        
        # Calculate chunks
        start_page = args.start
        end_page = args.end
        chunk_size = args.chunk_size
        
        chunks = []
        current_start = start_page
        
        while current_start <= end_page:
            current_end = min(current_start + chunk_size - 1, end_page)
            chunks.append((current_start, current_end))
            current_start = current_end + 1
        
        print(f"Processing PDF from page {start_page} to {end_page} in {len(chunks)} chunks")
        
        # Process each chunk
        for i, (chunk_start, chunk_end) in enumerate(chunks):
            chunk_file = os.path.join(args.output_dir, f"chunk_{chunk_start}-{chunk_end}.txt")
            print(f"\nProcessing chunk {i+1}/{len(chunks)}: pages {chunk_start}-{chunk_end}")
            
            if os.path.exists(chunk_file):
                print(f"Chunk file {chunk_file} already exists, skipping...")
                continue
            
            success = process_chunk(
                args.pdf_file,
                chunk_file,
                chunk_start,
                chunk_end,
                args.max_workers
            )
            
            if not success:
                print(f"Error processing chunk {i+1}, continuing with next chunk...")
        
        # Merge chunks if requested
        if args.merge:
            merged_file = os.path.join(args.output_dir, "complete_textbook.txt")
            merge_chunks(args.output_dir, merged_file)
        
        total_time = time.time() - start_time
        print(f"\nTotal processing time: {total_time:.2f} seconds")
        print(f"All chunks saved to {args.output_dir}")
        
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main()) 