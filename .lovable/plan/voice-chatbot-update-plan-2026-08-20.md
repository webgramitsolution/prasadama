# Voice Chatbot Update Plan

Update the AI Voice Assistant (chatbot) icon, design, and functionality to match the provided reference.

## User Review Required

> [!IMPORTANT]
> The "Shopping Assistant" UI design (dark header, mic button, and quick chips) is being implemented in `VoiceAssistant.tsx`.

## Proposed Changes

### Assets
- Update the chatbot trigger icon to use: `https://ik.imagekit.io/houskase/robot%20Ai.png?updatedAt=1785927669469`.

### VoiceAssistant Component
- Update the chatbot UI header to match the reference image (dark background, "Shopping Assistant" title, "Online" status, and a close icon).
- Ensure voice support for both Hindi and English is properly initialized and used.
- Add quick action chips (Categories, Find Product, My Cart, Track Order, RFQ / Quote) to the initial welcome screen as seen in the reference.
- Refine the chat interface colors (e.g., dark `#1a1a1a` header) to match the provided screenshot.
- Ensure the assistant picks data from the website (already partly implemented via Supabase queries in `VoiceAssistant.tsx`).

### ChatInterface Component
- The user mentioned changing the "help chat icon". While `VoiceAssistant` is the primary AI chatbot, `ChatInterface` is the live support UI. I will check if the user also wants the trigger icon for the live support chat updated if it's separate. (In this app, `VoiceAssistant` is the floating one, while `ChatInterface` is embedded in pages).

## Technical Details

- **Icon Update**: Replace `Sparkles` icon with an `img` tag in the trigger button.
- **UI Structure**: Modify `VoiceAssistant.tsx` to include the dark header and quick reply buttons in the message list area.
- **Hindi/English Support**: Verify `SpeechRecognition` language settings and `speechSynthesis` voice selection for Indian accents.
- **Data Source**: The component already fetches categories and products; I will ensure the `assistant-chat` edge function call is optimized for retrieving relevant site data if missing.
