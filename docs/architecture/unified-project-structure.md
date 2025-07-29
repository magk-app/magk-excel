# Unified Project Structure

```
magk-demo/
├── apps/
│   ├── client/           # The desktop client application
│   │   ├── src/
│   │   │   ├── ui/       # PyQt UI components
│   │   │   ├── api/      # Client-side logic for calling the backend
│   │   │   ├── workflows/ # Logic for managing the local workflow library
│   │   │   └── main.py   # Client entry point
│   │   └── tests/
│   └── server/           # The serverless backend
│       ├── app.py        # Chalice app definition (routes, logic)
│       ├── chalicelib/   # Shared code for the backend (e.g., automation modules)
│       └── requirements.txt
├── docs/
│   ├── prd.md
│   └── architecture.md
└── README.md
```
