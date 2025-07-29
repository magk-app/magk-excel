# Security and Performance

- **Security:** Communication is over HTTPS. The API Gateway will be secured using API Keys for the MVP. Files uploaded to S3 will have a short-lived lifecycle policy (e.g., deleted after 1 hour) to ensure no user data is retained.
- **Performance:** The UI remains responsive by offloading heavy processing to the backend. AWS Lambda can scale automatically. For the demo, Provisioned Concurrency (set to 1) will be used to keep one function instance "warm," mitigating cold start delays.
