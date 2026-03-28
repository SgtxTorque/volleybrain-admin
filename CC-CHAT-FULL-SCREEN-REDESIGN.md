# CC-CHAT-FULL-SCREEN-REDESIGN.md
# Classification: EXECUTE
# Repo: SgtxTorque/volleybrain-admin
# Branch: main

---

## CRITICAL RULES

- **Change ONLY the files listed in each phase.**
- **Commit after each phase** with the exact commit message provided.
- If anything is unclear or a file doesn't match expected structure, STOP and report.

---

## OVERVIEW

The Chats page looks like a widget embedded in a card instead of a full-screen messaging experience. Issues:
1. Wrapped in a `rounded-[14px]` card with `h-[calc(100vh-180px)]` — needs to fill all available space
2. Left column is `w-[280px]` — too narrow, chat names are cut off
3. Visual style is generic, not Lynx branded

**Files touched:**
- `src/pages/chats/ChatsPage.jsx` (Phase 1 + Phase 2)

---

## PHASE 1 — Full Screen Layout + Wider Left Column

### File: `src/pages/chats/ChatsPage.jsx`

**Change 1: Remove the card wrapper and make it full height.**

Find the main container (around line 309-316):

```jsx
    <div
      className={`h-[calc(100vh-180px)] flex overflow-hidden rounded-[14px] border animate-fade-in ${
        isDark
          ? 'bg-[#132240] border-white/[0.06]'
          : 'bg-white border-[#E8ECF2] shadow-[0_2px_8px_rgba(16,40,76,0.06),0_8px_24px_rgba(16,40,76,0.05)]'
      }`}
      style={{ fontFamily: 'var(--v2-font)' }}
    >
```

Replace with:

```jsx
    <div
      className={`h-[calc(100vh-130px)] flex overflow-hidden animate-fade-in ${
        isDark
          ? 'bg-[#0B1628]'
          : 'bg-white'
      }`}
      style={{ fontFamily: 'var(--v2-font)' }}
    >
```

**What changed:** Removed `rounded-[14px]`, `border`, and `shadow`. Increased height from `100vh-180px` to `100vh-130px` (less gap at bottom). Background is the full page bg color, not a card.

**Change 2: Widen the left column.**

Find (around line 320):

```jsx
          className={`${isMobileView ? 'w-full' : 'w-[280px]'} shrink-0 flex flex-col border-r ${
            isDark ? 'border-white/[0.06] bg-[#0D1B2F]' : 'border-[#E8ECF2] bg-white'
          }`}
```

Replace with:

```jsx
          className={`${isMobileView ? 'w-full' : 'w-[340px]'} shrink-0 flex flex-col border-r ${
            isDark ? 'border-white/[0.06] bg-[#0B1628]' : 'border-[#E8ECF2] bg-[#F8F9FB]'
          }`}
```

**What changed:** Width from 280px to 340px. Light mode bg changed to subtle `#F8F9FB` to differentiate from the center column.

**Change 3: Update the "Chats" header to be more branded.**

Find the header section (around lines 325-336):

```jsx
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ letterSpacing: '-0.03em' }}>
                Chats
              </h1>
              <button
                onClick={() => setShowNewChat(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#4BB9EC] text-white hover:brightness-110 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
```

Replace with:

```jsx
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-base font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)', letterSpacing: '-0.02em' }}>
                  Messages
                </h1>
                <p className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {channels.length} conversation{channels.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowNewChat(true)}
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#10284C] text-white hover:brightness-125 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
```

**Change 4: Update the center column empty state.**

Find the empty state for no selected chat (around lines 427-442):

```jsx
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 ${
                  isDark ? 'bg-white/[0.04]' : 'bg-[#F5F6F8]'
                }`}
              >
                <span className="text-4xl">💬</span>
              </div>
              <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ letterSpacing: '-0.03em' }}>
                Select a Conversation
              </h2>
              <p className={`mt-2 text-sm ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
                Choose a chat from the list to start messaging
              </p>
            </div>
```

Replace with:

```jsx
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
              <span className="text-5xl mb-4">💬</span>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                Select a Conversation
              </h2>
              <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Choose a chat from the list to start messaging
              </p>
            </div>
```

### Commit message
```
refactor(chats): full screen layout, wider channel list, Lynx branded header
```

---

## PHASE 2 — Update Conversation Items + Right Panel

### File: `src/pages/chats/ChatsPage.jsx`

**Change 1: Update ConversationItem for better readability at wider width.**

Find the ConversationItem component (around line 477). Replace the entire component:

```jsx
function ConversationItem({ channel, isSelected, onClick, formatTime, isDark, index }) {
  const getChannelIcon = () => {
    if (channel.channel_type === 'team_chat') return '👥'
    if (channel.channel_type === 'player_chat') return '🏐'
    if (channel.channel_type === 'dm') return '💬'
    return '📢'
  }

  const getLastMessagePreview = () => {
    if (!channel.last_message) return 'No messages yet'
    if (channel.last_message.message_type === 'image') return '📷 Photo'
    if (channel.last_message.message_type === 'gif') return '🎬 GIF'
    return channel.last_message.content?.slice(0, 60) + (channel.last_message.content?.length > 60 ? '...' : '')
  }

  const teamColor = channel.teams?.color

  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2.5 flex items-center gap-3 transition-all duration-150 ${
        isSelected
          ? (isDark ? 'bg-[#4BB9EC]/10 border-l-3 border-[#4BB9EC]' : 'bg-[#10284C]/[0.05] border-l-3 border-[#10284C]')
          : isDark
            ? 'border-l-3 border-transparent hover:bg-white/[0.03]'
            : 'border-l-3 border-transparent hover:bg-slate-50'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
            isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-500'
          }`}
          style={teamColor ? { backgroundColor: `${teamColor}15`, color: teamColor } : undefined}
        >
          {getChannelIcon()}
        </div>
        {channel.unread_count > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-bold text-white bg-[#4BB9EC] flex items-center justify-center">
            {channel.unread_count > 9 ? '9+' : channel.unread_count}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-bold text-sm truncate ${
            channel.unread_count > 0
              ? (isDark ? 'text-white' : 'text-[#10284C]')
              : (isDark ? 'text-slate-300' : 'text-slate-700')
          }`}>
            {channel.name}
          </span>
          <span className={`text-[10px] flex-shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            {formatTime(channel.last_message?.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {channel.channel_type === 'team_chat' && (
            <span className="px-1 py-0 rounded text-[8px] font-black uppercase bg-[#10284C] text-white leading-tight">Team</span>
          )}
          {channel.channel_type === 'player_chat' && (
            <span className="px-1 py-0 rounded text-[8px] font-black uppercase bg-[#4BB9EC]/20 text-[#4BB9EC] leading-tight">Player</span>
          )}
          <p className={`text-[11px] truncate ${
            channel.unread_count > 0
              ? (isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium')
              : (isDark ? 'text-slate-500' : 'text-slate-400')
          }`}>
            {getLastMessagePreview()}
          </p>
        </div>
      </div>
    </button>
  )
}
```

**What changed:**
- Removed `rounded-xl mb-1` from each item (no card per item, just rows)
- Changed `border-l-2` to `border-l-3` for a slightly more visible selection indicator
- Selected state: navy tint on light mode instead of sky blue
- Preview text increased from 40 chars to 60 chars (wider column)
- Type badge moved inline with preview text (saves vertical space)
- Unread channels get bolder name and message preview
- Team color dot removed (redundant with the tinted avatar)
- Avatar reduced from `w-12 h-12` to `w-10 h-10` (cleaner)
- Padding reduced slightly (`py-2.5` instead of `p-3`)

**Change 2: Update the filter tabs.**

Find the filter tabs (around line 352-376). Find the tab container class:

```jsx
            <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-[#F5F6F8]'}`}>
```

Replace with:

```jsx
            <div className={`flex gap-0.5 p-1 rounded-lg ${isDark ? 'bg-white/[0.03]' : 'bg-white'}`}>
```

And find the individual tab button class. Look for `bg-[#10284C] text-white shadow-sm` in the active state. Change the inactive text from `text-slate-400 hover:text-slate-600` to keep it but just verify it looks clean.

**Change 3: Update the right context panel background.**

Find (around line 449):

```jsx
          isDark ? 'border-white/[0.06] bg-[#0D1B2F]' : 'border-[#E8ECF2] bg-[#F5F6F8]'
```

Replace with:

```jsx
          isDark ? 'border-white/[0.06] bg-[#0B1628]' : 'border-[#E8ECF2] bg-[#F8F9FB]'
```

### Verification

- Chat page fills available height, no rounded card wrapper
- Left column is 340px wide, chat names are fully visible
- Header shows "Messages" with conversation count
- Conversation items are compact rows without card styling
- Selected conversation has navy-tinted highlight
- Unread conversations have bolder text
- Right context panel matches the branded style
- Empty state is clean and simple

### Commit message
```
refactor(chats): compact conversation items, branded style, updated filter tabs
```

---

## POST-EXECUTION QA CHECKLIST

1. **Full screen:** No rounded card wrapper. Chat fills from header to bottom of viewport.
2. **Left column width:** 340px. Full chat names visible (e.g., "Black Hornets Kickers - Player Chat" should be readable, not truncated to "Black Hornets Kick...").
3. **Header:** "Messages" with conversation count. Navy "+" button.
4. **Conversation items:** Compact rows. Type badge inline with preview. Unread names are bold.
5. **Selected state:** Navy-tinted bg on light mode, sky-tinted on dark mode.
6. **Filter tabs:** All/Unread/Teams/DMs still functional.
7. **Center column:** Thread still renders correctly when a chat is selected.
8. **Right panel:** Context panel visible at 1100px+ width with matching brand colors.
9. **Mobile:** Channel list takes full width when no chat selected.
10. **Empty state:** "Select a Conversation" placeholder is clean.
