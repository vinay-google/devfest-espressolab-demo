# Workspace MCP + EGM Dual-Sync Rule


Whenever you create or update any EGM artifact in this project, you MUST keep both the local Markdown file (for stateless Goldfish subagents) AND a formatted Google Doc in Google Drive (via the Google Workspace Docs/Drive MCP tools) in sync:


1. `/egm:egm-brainstorm` (`concepts_brief.md`) -> Create or update a formatted Google Doc titled "RFC Brief: Espresso Simulator" via Workspace MCP and share the clickable Google Doc URL in chat.
2. `/egm:egm-draft` (`design_draft.md` and `docs/designs/espresso_simulator.md`) -> Create a formatted Google Doc titled "PRD: Espresso Simulator" via Workspace MCP and append/update each approved section (Overview & Goals, Technical Plan, Alternatives Considered, Detailed Implementation Plan) live in the Google Doc as we step through the approval gates. Always include the Google Doc link in chat.
3. `/egm:egm-review` (`consolidated_review_report.md` / stage reports) -> Publish the synthesized Goldfish findings to a formatted Google Doc titled "Goldfish Audit: Espresso Simulator" via Workspace MCP and share the link in chat.
4. `/egm:egm-resolve` (`goldfish_review_report.md` and `docs/designs/espresso_simulator.md`) -> When applying approved fixes to `docs/designs/espresso_simulator.md`, immediately sync the updated specification to the "PRD: Espresso Simulator" Google Doc via Workspace MCP so the Drive document is 100% up to date.
