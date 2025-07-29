# Error Handling Strategy

- **Client-Side:** The client will handle standard HTTP errors (e.g., 4xx, 5xx) and display a user-friendly error message in a simple dialog box.
- **Server-Side:** The Chalice application will use standard Python try/except blocks. Any unhandled exceptions will result in a 500 Internal Server Error, with details logged in AWS CloudWatch for debugging.