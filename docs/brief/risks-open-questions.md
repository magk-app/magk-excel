# Risks & Open Questions
**Key Risks**
* **Technical Risk (Novelty Engine):** The requirement for the engine to handle a *novel*, simple workflow live is the most significant risk. The generalized engine may not be robust enough to handle an unexpected request flawlessly within the one-week timeframe.
    * **Mitigation Strategy:** A pre-scripted backup workflow demo will be prepared as a contingency in case the live novel request fails during the presentation.
* **Technical Risk (Demo Magic):** The "real-time" Excel updates and semi-dynamic UI are technically complex. There's a risk they could consume a disproportionate amount of development time, jeopardizing the core automation workflow.
* **Timeline Risk:** The one-week timeline is extremely aggressive for the current scope and has no buffer for unexpected technical hurdles, debugging, or environment setup issues.
* **Dependency Risk:** The demo relies on the structure of third-party websites and PDF reports, which could change without notice and break the workflow right before the presentation.

**Areas Needing Further Research**
* The most reliable Python libraries for interacting with older Excel (`.xls`) formats.
* The most robust method for creating a standalone Python executable on Windows.
* A quick prototype to validate the feasibility of the "real-time" Excel update mechanism.
