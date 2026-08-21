# AI Shopping Assistant & Chat Enhancements Plan

We will enhance both the standard support chat and the AI voice assistant with better interactivity, real-time feedback, and deeper data integration.

## User-facing changes
- **Typing Indicators**: Buyers and Admins will see when the other person is typing in support chats.
- **Improved AI Assistant**:
  - **Hindi & English Support**: Consistent multi-language detection and responses.
  - **Live Website Data**: The assistant will use up-to-date products, categories, and pricing from the store.
  - **Smart Fallbacks**: Helpful replies when items aren't found, including follow-up questions.
  - **UI Polish**: Typing/loading indicators in the voice chat to show the AI is processing.
  - **Feedback System**: Thumbs up/down buttons on AI replies to help improve future responses.

## Technical details

### 1. Support Chat Typing Indicators
- **Broadcast Channel**: Use Supabase Realtime Broadcast to send `typing` events.
- **Frontend Sync**: Update `ChatInterface.tsx` and `AdminChat.tsx` to listen for these events and display a "typing..." status.

### 2. AI Voice Assistant (`VoiceAssistant.tsx`)
- **Language Detection**: Enhance `isHindi` logic and ensure `respond` uses the detected language for both text and speech synthesis.
- **Live Data Fetching**: Ensure the assistant uses the `productsRef` and `categoriesRef` (already fetching in `useEffect`) for all queries.
- **Feedback UI**: Add thumbs up/down icons to each assistant message and store feedback in a new `assistant_feedback` table (or log it).
- **Loading State**: Improve the visual `thinking` state with a more prominent typing animation.
- **Edge Function**: Implement/Update the `assistant-chat` Edge Function to use the provided site data context.

### 3. Database Updates
- **New Table**: Create `assistant_feedback` to store user ratings.
```sql
CREATE TABLE public.assistant_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    message_text TEXT,
    response_text TEXT,
    rating INTEGER, -- 1 for up, -1 for down
    created_at TIMESTAMPTZ DEFAULT now()
);
GRANT INSERT ON public.assistant_feedback TO authenticated;
ALTER TABLE public.assistant_feedback ENABLE ROW LEVEL SECURITY;
```
