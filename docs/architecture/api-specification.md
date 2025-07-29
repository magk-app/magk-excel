# API Specification

The REST API is simplified to two main endpoints.

- **POST /uploads**
    - **Purpose:** To get a pre-signed URL for uploading a source file (like a PDF).
    - **Request Body:** `{ "fileName": "alibaba-report.pdf" }`
    - **Response:** `{ "uploadUrl": "<https://s3>...", "fileId": "..." }`
- **POST /execute-workflow**
    - **Purpose:** To trigger the data extraction workflow.
    - **Request Body:** The `WorkflowConfig` object in JSON format. If a file was uploaded, `sourceUri` will contain the `fileId`.
    - **Response:** `{ "outputUrl": "<https://s3>..." }` (A pre-signed URL to download the generated Excel file).
