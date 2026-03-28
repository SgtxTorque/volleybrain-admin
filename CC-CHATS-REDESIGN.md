# CC-CHATS-REDESIGN.md
# Chats Page Redesign — The Fusion + Broadcast Desk Channel List

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `src/styles/v2-tokens.css`
4. `src/pages/chats/ChatsPage.jsx` (477 lines)
5. `src/pages/chats/ChatThread.jsx` (691 lines)
6. `src/pages/chats/MessageBubble.jsx` (175 lines)
7. `src/pages/chats/ChatPickers.jsx` (151 lines)
8. `src/pages/chats/NewChatModal.jsx` (158 lines)

## SCOPE
Redesign the Chats page into a 3-column layout: channel list on the left (from Broadcast Desk), conversation thread in the center (from The Fusion), and a contextual team/channel info panel on the right (from The Fusion). The chat functionality (send, receive, real-time, typing indicators, emoji, GIFs, replies) stays identical. This is a visual and layout transformation only.

**Design fusion:**
- **From The Fusion (Concept 1):** The center conversation area gets the premium treatment — upcoming match banner at the top of team chats, pinned coach message card, attendance check inline polls, quick reply chips at the bottom ("We'll be there", "Running late", "Can't make it"), message bubbles with proper avatar + timestamp layout. The RIGHT column shows team context: team logo, name, division, season, next event card, active roster preview.
- **From The Broadcast Desk (Concept 3):** The LEFT column is a proper channel list panel with search, filter tabs (All / Unread / Teams / DMs), channel items showing team avatar + name + last message preview + timestamp + unread badge + status pills (TEAM, UNREAD). Clean, scannable, scrollable.

**The result is a true 3-panel messaging hub** that feels premium and gives the admin full context without leaving the chat.

---

## ELEMENT PRESERVATION CONTRACT

**Every element below MUST survive. MOVED and RESTYLED = OK. REMOVED = NOT OK.**

### Channel List (left panel):
- **Channel list** with all channels loaded from Supabase
- **Search** (`searchQuery` / `setSearchQuery`) — filter channels by name
- **Filter tabs** (All / Teams / DMs) (`filterType` / `setFilterType`)
- **Unread badges** per channel (existing unread count logic)
- **Channel click** → selects channel, loads messages (`setSelectedChannel`)
- **New Message button** (`setShowNewChat`) — opens NewChatModal
- **COPPA consent gating** (existing CoppaConsentModal logic)

### Chat Thread (center panel):
- **Message list** with real-time subscription
- **Send message** (`sendMessage`) — text input + send button
- **Emoji picker** (`showEmojiPicker` / `setShowEmojiPicker`)
- **GIF picker** (existing ChatPickers)
- **Reply to message** (`replyingTo` / `setReplyingTo`) — quote reply
- **Typing indicators** (real-time presence via Supabase channel)
- **Attachment upload** (image/file) — existing upload logic
- **Message bubbles** with sender avatar, name, timestamp, read receipts
- **Channel header** showing channel name, type, member count, settings menu

### Modals:
1. `NewChatModal` — create new channel/DM
2. `CoppaConsentModal` — COPPA consent for parent chat access

### Data Functions (DO NOT MODIFY):
- `loadChannels()` — Supabase query for channels + members + last message
- `sendMessage()` — insert chat message
- Real-time subscription setup (message listener + typing presence)
- Unread count calculation logic
- Channel filtering logic
- All Supabase queries and mutations in ChatThread.jsx

---

## PHASE 1: Restructure ChatsPage into 3-Column Layout

**File:** `src/pages/chats/ChatsPage.jsx`
**Edit contract:** Restructure the layout from the current 2-panel split into a 3-column layout. Move existing elements. Do not change data loading or channel logic.

### New Layout:
```
┌──────────────────────────────────────────────────────────────────┐
│  NO PageShell header — chats uses full height                     │
│  Breadcrumb: 🏠 › Chats (minimal, top-left)                      │
├──────────┬────────────────────────────────┬──────────────────────┤
│ LEFT     │  CENTER                        │ RIGHT                │
│ ~280px   │  flex-1                        │ ~300px               │
│          │                                │ (shows for team      │
│ [+ New]  │  Channel header bar            │  channels only)      │
│          │  ┌──────────────────────┐      │                      │
│ Search   │  │ Optional: match      │      │ Team avatar + name   │
│ [All]    │  │ banner / pinned msg  │      │ Division + season    │
│ [Unread] │  │ (for team channels)  │      │ Record badge         │
│ [Teams]  │  └──────────────────────┘      │                      │
│ [DMs]    │                                │ Next Event card      │
│          │  Message thread                │ (if upcoming)        │
│ Channel  │  (scrollable)                  │                      │
│ list     │                                │ Active Roster        │
│ items    │                                │ (player list)        │
│ with     │                                │                      │
│ unread   │  ┌──────────────────────┐      │ Quick Templates      │
│ badges   │  │ Quick reply chips    │      │ (if admin/coach)     │
│          │  │ [attachment][emoji]   │      │                      │
│          │  │ [Type a message...]  │      │                      │
│          │  └──────────────────────┘      │                      │
└──────────┴────────────────────────────────┴──────────────────────┘
```

### A. Full-height layout (no PageShell):
Chats should fill the viewport. Remove PageShell wrapper or set it to full height with no padding:
```jsx
<div className="flex h-[calc(100vh-var(--v2-topbar-height,56px))]" style={{ fontFamily: 'var(--v2-font)' }}>
  {/* Left: Channel list */}
  <div className={`w-[280px] shrink-0 flex flex-col border-r ${isDark ? 'border-white/[0.06] bg-[#0D1B2F]' : 'border-[#E8ECF2] bg-white'}`}>
    {/* ... */}
  </div>
  
  {/* Center: Chat thread */}
  <div className="flex-1 flex flex-col min-w-0">
    {/* ... */}
  </div>
  
  {/* Right: Team context (conditional) */}
  {selectedChannel?.channel_type !== 'dm' && (
    <div className={`w-[300px] shrink-0 flex flex-col border-l overflow-y-auto ${isDark ? 'border-white/[0.06] bg-[#0D1B2F]' : 'border-[#E8ECF2] bg-[#F5F6F8]'}`}>
      {/* ... */}
    </div>
  )}
</div>
```

### B. Left panel — Channel List (Broadcast Desk style):

**Header:**
```jsx
<div className="p-4">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-extrabold">Chats</h2>
    <button onClick={() => setShowNewChat(true)} className="w-8 h-8 rounded-lg bg-[#4BB9EC] text-white flex items-center justify-center">
      <Plus className="w-4 h-4" />
    </button>
  </div>
  {/* Search */}
  <div className="relative mb-3">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
      placeholder="Search conversations..."
      className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm ${isDark ? 'bg-white/[0.06] text-white border border-white/[0.06]' : 'bg-[#F5F6F8] text-[#10284C]'}`} />
  </div>
  {/* Filter pills */}
  <div className="flex gap-1">
    {['all', 'unread', 'teams', 'dms'].map(type => (
      <button key={type} onClick={() => setFilterType(type)}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
          filterType === type
            ? 'bg-[#10284C] text-white'
            : (isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-[#10284C]')
        }`}>{type === 'all' ? 'All' : type === 'unread' ? 'Unread' : type === 'teams' ? 'Teams' : 'DMs'}</button>
    ))}
  </div>
</div>
```

**Channel items:**
```jsx
<div onClick={() => setSelectedChannel(ch)}
  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${
    isActive
      ? (isDark ? 'bg-[#4BB9EC]/10 border-l-3 border-l-[#4BB9EC]' : 'bg-[#4BB9EC]/[0.06] border-l-3 border-l-[#10284C]')
      : (isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-[#F5F6F8]')
  }`}>
  {/* Channel avatar */}
  <div className="w-10 h-10 rounded-full bg-[#10284C] flex items-center justify-center text-white text-xs font-bold shrink-0">
    {initials}
  </div>
  <div className="flex-1 min-w-0">
    <div className="flex items-center justify-between">
      <span className="font-bold text-sm truncate">{ch.name}</span>
      <span className="text-[10px] text-slate-400 shrink-0">{timeAgo}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 truncate">{lastMessagePreview}</span>
    </div>
    {/* Type + unread badges */}
    <div className="flex items-center gap-1.5 mt-1">
      {ch.channel_type === 'team_chat' && <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-[#10284C] text-white">Team</span>}
      {unreadCount > 0 && <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-red-500 text-white">Unread</span>}
    </div>
  </div>
  {/* Unread count circle */}
  {unreadCount > 0 && (
    <span className="w-5 h-5 rounded-full bg-[#4BB9EC] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
      {unreadCount}
    </span>
  )}
</div>
```

### Commit:
```bash
git add src/pages/chats/ChatsPage.jsx
git commit -m "Phase 1: Chats 3-column layout with Broadcast Desk channel list"
```

---

## PHASE 2: Restyle Chat Thread — The Fusion Treatment

**File:** `src/pages/chats/ChatThread.jsx` + `src/pages/chats/MessageBubble.jsx`
**Edit contract:** Restyle the message thread area. Keep all send/receive/reply/emoji/typing logic.

### Changes:

**A. Channel header bar:**
```jsx
<div className={`flex items-center gap-3 px-5 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
  <div className="w-9 h-9 rounded-full bg-[#10284C] flex items-center justify-center text-white text-xs font-bold">
    {initials}
  </div>
  <div className="flex-1">
    <div className="font-bold text-sm">{channel.name}</div>
    <div className="text-xs text-[#4BB9EC] uppercase font-bold">{channelType} · {memberCount} Members</div>
  </div>
  <button className="p-2 rounded-lg hover:bg-slate-100"><Search className="w-4 h-4" /></button>
  <button className="p-2 rounded-lg hover:bg-slate-100"><MoreVertical className="w-4 h-4" /></button>
</div>
```

**B. Message bubbles (from The Fusion):**
- Incoming messages: left-aligned, light bg, sender avatar on left, sender name bold above message, timestamp small below
- Outgoing messages: right-aligned, dark navy bg (#10284C) with white text, no avatar (just the bubble)
- Pinned messages: gold/amber tinted card with pin icon and "COACH'S PINNED MESSAGE" label
- System messages (attendance checks, announcements): styled as inline cards, not bubbles
- Read receipts: "Seen by 28" with double-check icon below outgoing messages

**C. Quick reply chips** (The Fusion addition — for team channels):
Above the message input, show contextual quick-reply chips based on the channel context:
```jsx
{channel.channel_type === 'team_chat' && (
  <div className="flex gap-2 px-5 py-2 overflow-x-auto">
    {['We\'ll be there', 'Running late', 'Can\'t make it'].map(chip => (
      <button key={chip} onClick={() => quickSend(chip)}
        className="px-4 py-1.5 rounded-full text-xs font-bold border border-[#E8ECF2] text-slate-500 hover:bg-[#F5F6F8] whitespace-nowrap">
        {chip}
      </button>
    ))}
  </div>
)}
```

**D. Message input bar:**
```jsx
<div className={`flex items-center gap-2 px-4 py-3 border-t ${isDark ? 'border-white/[0.06] bg-[#0D1B2F]' : 'border-[#E8ECF2] bg-white'}`}>
  <button className="p-2 rounded-lg hover:bg-slate-100"><Paperclip className="w-4 h-4 text-slate-400" /></button>
  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 rounded-lg hover:bg-slate-100">
    <Smile className="w-4 h-4 text-slate-400" />
  </button>
  <input value={message} onChange={handleInput} onKeyDown={handleKeyDown}
    placeholder="Type a message..."
    className={`flex-1 px-4 py-2.5 rounded-xl text-sm ${isDark ? 'bg-white/[0.06] text-white' : 'bg-[#F5F6F8] text-[#10284C]'}`} />
  <button onClick={sendMessage} disabled={!message.trim()}
    className="w-9 h-9 rounded-full bg-[#10284C] text-white flex items-center justify-center disabled:opacity-30">
    <Send className="w-4 h-4" />
  </button>
</div>
```

### Commit:
```bash
git add src/pages/chats/ChatThread.jsx src/pages/chats/MessageBubble.jsx
git commit -m "Phase 2: Chat thread with Fusion-style bubbles, quick replies, styled input"
```

---

## PHASE 3: Build Right-Side Team Context Panel

**File:** `src/pages/chats/ChatContextPanel.jsx` (NEW)
**Edit contract:** New file. Receives channel and team data as props.

### Panel sections (from The Fusion mockup):

**A. Team header:**
```
Team avatar (large, 64px) + Team name (extrabold) + Division + Season
Record badges: [RANK #2] [12-2 RECORD]
```

**B. Next Event card** (if team has an upcoming event):
```
MATCH DAY badge + event title + location + time
RSVP avatar stack + "Going" count
```
Data: load next event from schedule_events for this team's id. Simple single query OR pass from parent if already available.

**C. Active Roster preview:**
```
ACTIVE ROSTER header + "VIEW ALL" link
3-4 player rows: avatar + name + position + jersey #
Online indicator dot (green = active in chat)
```

**D. Quick Templates** (for admin/coach channels):
```
QUICK TEMPLATES header
Template cards: "Weather Delay", "Fee Reminder", "New Uniforms"
Click → inserts template text into message input
```
These are hardcoded convenience templates. Clicking one calls a callback that sets the message input to the template text.

**E. For DM channels:** Show the other person's profile card instead of team info (name, role, email, phone).

### Commit:
```bash
git add src/pages/chats/ChatContextPanel.jsx
git commit -m "Phase 3: ChatContextPanel — team info, next event, roster, templates"
```

---

## PHASE 4: Wire Context Panel + Final Integration

**File:** `src/pages/chats/ChatsPage.jsx`
**Edit contract:** Import ChatContextPanel, pass data, verify all interactions.

### Changes:
- Import and render ChatContextPanel in the right column
- Pass channel data, team data (if available), and callbacks
- Wire quick template click to populate message input in ChatThread
- Responsive: hide right panel below 1100px, hide left panel below 768px (show channel switcher button instead)

### Verification:
- [ ] Build passes
- [ ] 3-column layout renders (channel list | thread | context panel)
- [ ] Channel list shows all channels with correct avatars, names, previews
- [ ] Unread badges display correctly
- [ ] Filter tabs (All/Unread/Teams/DMs) filter correctly
- [ ] Search filters channels
- [ ] Clicking a channel loads the conversation
- [ ] Messages display with correct sender/receiver alignment
- [ ] Outgoing messages have navy background
- [ ] Send message works (text input + enter/click)
- [ ] Emoji picker opens and inserts emoji
- [ ] Reply to message works (quote reply)
- [ ] Typing indicators display
- [ ] Quick reply chips appear for team channels
- [ ] Quick reply chips send messages
- [ ] Right panel shows team info for team channels
- [ ] Right panel shows next event card
- [ ] Right panel shows roster preview
- [ ] Right panel hides for DM channels (or shows contact card)
- [ ] Quick templates insert text into input
- [ ] New Message button opens NewChatModal
- [ ] COPPA consent modal works for parent access
- [ ] Real-time message delivery works
- [ ] Dark mode on all elements
- [ ] Responsive: panels collapse at breakpoints

### Commit:
```bash
git add src/pages/chats/ChatsPage.jsx src/pages/chats/ChatThread.jsx src/pages/chats/ChatContextPanel.jsx
git commit -m "Phase 4: Wire context panel, quick templates, final integration"
```

---

## FINAL PUSH

After ALL phases pass:
```bash
git push origin main
```

## FINAL REPORT
```
## Chats Redesign Report
- Phases completed: X/4
- New files: ChatContextPanel.jsx
- Files modified: ChatsPage.jsx, ChatThread.jsx, MessageBubble.jsx
- Total lines: +X / -Y
- Build status: PASS/FAIL
- 3-column layout: YES/NO
- Channel list (Broadcast Desk): YES/NO
- Message thread (Fusion): YES/NO
- Context panel: YES/NO
- Quick reply chips: YES/NO
- Quick templates: YES/NO
- All chat functions work: YES/NO
- Dark mode: YES/NO
```
