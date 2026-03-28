# CC-CHAT-SPORT-FILTER-INVESTIGATION.md
# Chat Sport Filter Bug — Investigation
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## PURPOSE

This is an **investigation-only** spec. Do NOT modify any files. The sport filter on the Chats page does not work — selecting a sport (e.g., Basketball) still shows conversations from all sports. We need to understand how the filter is wired (or not wired) so a fix spec can be written.

---

## BUG DESCRIPTION

On the Chats page (`/chats`), there is a sport selector dropdown in the header area (e.g., "All Seasons" + sport picker showing "Basketball"). When the user selects a specific sport, the conversation list does NOT filter — it continues to show all conversations across all sports.

---

## INVESTIGATION TASKS

### 1. ChatsPage Component

Open and read `src/pages/chats/ChatsPage.jsx` completely.

**Report:**
- How is the sport filter state managed? (Local state? Context? Props from MainApp?)
- Is there a `selectedSport` or equivalent variable?
- Where does the conversation list data come from? (Supabase query? Context? Props?)
- Is the sport filter value passed into the data fetch/query?
- Is there any client-side filtering logic that uses the selected sport?
- If the sport filter exists in the UI but isn't connected to the data, say so explicitly.

### 2. Header/Filter Components

The screenshot shows "All Seasons" and a sport selector (Basketball icon + label) in the header area above the conversation list.

**Report:**
- What component renders these filters? (HeaderComponents? Inline in ChatsPage? PageShell actions?)
- Where does the selected sport value live after the user picks one?
- Is there an onChange handler that updates state when the sport is changed?
- Does the season filter work, or is it also disconnected?

### 3. Conversation Data Model

**Report:**
- What table/view do conversations come from? (e.g., `channels`, `conversations`, `chats`)
- Do conversations have a sport column or a relationship to a sport (e.g., via team → sport)?
- What is the join path from a conversation to a sport? (e.g., channel → team → team.sport_id, or channel has a direct sport field)
- Show the relevant column names and relationships.

### 4. Data Fetching Logic

**Report:**
- Find the Supabase query (or queries) that load the conversation list.
- Copy the query code (under 20 lines).
- Does the query accept a sport parameter or filter?
- If not, what would need to change to add sport filtering? (e.g., add a `.eq('sport_id', selectedSport)` or filter on a joined table)

### 5. Other Filters on ChatsPage

The screenshot shows filter tabs: ALL, UNREAD, TEAMS, DMS.

**Report:**
- Do these filters work correctly?
- How are they implemented? (Client-side array filter? Separate queries?)
- Is there a pattern here we can follow for adding sport filtering?

### 6. Season Filter

**Report:**
- Does the season filter on the Chats page actually work?
- If yes, how is it wired? (This pattern could be copied for the sport filter)
- If no, note that it's also broken.

---

## OUTPUT FORMAT

```
## INVESTIGATION REPORT — Chat Sport Filter Bug

### 1. ChatsPage Component
[findings]

### 2. Header/Filter Components
[findings]

### 3. Conversation Data Model
[findings]

### 4. Data Fetching Logic
[findings — include query code snippet]

### 5. Other Filters on ChatsPage
[findings]

### 6. Season Filter
[findings]
```

Include exact file paths, line numbers, and short code snippets (under 20 lines) showing the relevant filter logic (or lack thereof).

---

## REMINDER

**Do NOT modify any files.** Read only. Report back.
