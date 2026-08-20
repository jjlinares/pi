---
name: grilling
description: A design interview that reaches shared understanding by asking only consequential, high-cost-to-reverse questions.
disable-model-invocation: true
---

Interview the user until reaching a shared understanding of the goal, success criteria, and consequential constraints.

Build a **design tree** internally, but do not exhaustively question every branch. Ask only when the expected cost of a wrong assumption exceeds the cost of interrupting.

Ask when at least one of these applies:

- A wrong assumption would be expensive to reverse.
- Plausible answers would materially change the architecture, public interface, data model, product behavior, or project direction.
- Proceeding could cause destructive, public, financial, security-sensitive, privacy-sensitive, or otherwise irreversible consequences requiring authorization.
- The desired outcome or acceptance criteria are fundamentally ambiguous.
- Requirements conflict and resolving them requires product prioritization.
- Essential information is inaccessible and no safe default exists.

Finding discoverable facts is the agent's responsibility. Explore independent questions in parallel, including in the background. Treat pending research as an unsettled prerequisite: defer only questions that depend on it while continuing every independent exploration and user question.

Work consequential questions in **rounds**. Ask the currently unblocked, independent questions together; defer any question that depends on an unanswered one. Number each question and include a recommended answer with brief rationale. Wait for the answers, update the tree, and repeat.

Finish when no consequential uncertainty remains. Summarize the shared understanding: goal, success criteria, constraints, decisions, assumptions, and unresolved risks. Ask the user to confirm or correct the summary.
