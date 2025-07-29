# Data Models

### WorkflowConfig (API & Internal Model)

**Purpose:** To represent a user's defined workflow. This object is saved in the local JSON library and sent to the backend API for execution.

**Python Dataclass (Illustrative):**

Python

```python
from dataclasses import dataclass
from typing import List, Literal, Dict

@dataclass
class WorkflowConfig:
  id: str # Unique ID for the workflow
  name: str # User-defined name
  sourceType: Literal['web', 'pdf']
  sourceUri: str # URL or a fileId from an S3 upload
  dataIdentifier: str # e.g., table ID or text to find
  uiControls: List[Dict[str, str]] # e.g., [{'type': 'date-range', 'label': 'Select Dates'}]

```
