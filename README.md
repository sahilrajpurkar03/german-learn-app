# Sprechen — Learn German

## App features

- Everyday German practice from A1 to B1.
- Listening, speaking, typing, sentence-building, and multiple-choice exercises.
- Spaced-repetition reviews to help you remember what you learn.
- Starting-level assessment and weekly check-ins.

## New version (preview)

A redesigned Sprechen is being rolled out. It has a structured A1 course (10 units: greetings, numbers, café, shopping, home, travel, health, offices, work, free time), a natural German voice, one clear next step each day, a streak with freezes, and progress saved to your account. Try the first lesson without an account at [/demo](https://app-dusky-nine-52.vercel.app/demo). Invited testers can open [/today?v2=1](https://app-dusky-nine-52.vercel.app/today?v2=1) after signing in, and `?v2=0` switches back. The steps below describe the current version. See [Sprechen v2](docs/SPRECHEN-V2.md) for details and status.

## How to use the app

### Get started

1. Open [Sprechen](https://app-dusky-nine-52.vercel.app) and create an account, or log in to your existing account. Use the eye button to show or hide your password. If needed, select **Forgot password?** to request a reset link.
2. Take the starting skills assessment and choose your daily goal. Answer without looking things up so the result reflects what you can currently recall. The result is a practice starting point, not an official language certificate.
3. Open **My day** to see your roadmap, current situation, and daily practice. Resume unfinished work or start the next available activity.

To explore without an account, open the [preview](https://app-dusky-nine-52.vercel.app/preview). Its personal-chapter example is a demonstration, not live AI generation.

### Follow a daily practice routine

1. Start with the daily practice on **My day**. It brings back responses due for review and introduces new material when appropriate.
2. Open **Real-life practice** (**Practice** on mobile) to choose an everyday situation. Listen to the German, then select an answer, arrange words, type, or speak as the exercise requests.
3. Try answering before revealing translations or other help. Check your answer, read the feedback, and continue. Using help is fine, but it is recorded differently from unaided recall.
4. Save useful phrases with the bookmark control. Open **My phrases** (**Phrases** on mobile) to revisit them.
5. Check **My progress** (**Progress** on mobile) for completed work and recall evidence. Return on later days: replaying immediately is useful practice, but does not demonstrate long-term retention.

Your roadmap distinguishes explored situations from material recalled across days. You can revisit completed chapters; saved daily rounds and unfinished chapters resume from their recorded checkpoint on the same browser.

### Create a personal AI chapter

1. Sign in and open **My chapters** (**Chapters** on mobile).
2. Write a short recap, record yourself, or select a supported audio file. Audio is limited to **3 minutes and 10 MB**. Only submit material you have permission to share; do not upload someone else's conversation without permission.
3. For audio, wait for transcription, then correct the text and remove private details. Redacting afterward cannot undo the provider's earlier receipt of the recording.
4. Choose your communication goal, **A1**, **A2**, or **B1** level, and formal (**Sie**) or informal (**du**) address. Review the consent information and confirm before generating.
5. Practise the saved chapter's original situation and its variation. Add useful targets to review, or export/delete the chapter from your library. Replaying a saved chapter does not generate it again.

Personal AI chapters are a limited beta. Each account has **two generation attempts and two transcription attempts per UTC day**; failed attempts count. Shared app/provider limits may also apply. Daily allowances reset at **00:00 UTC**, not local midnight. If capacity is exhausted, use the built-in chapters and return later.

Creation is enabled, but successful live generation and transcription are still being verified. Treat AI output as practice material that can contain mistakes. See [Personal Chapters](docs/PERSONAL-CHAPTERS.md) for current verification status and limits.

### Use the microphone

- In a reply exercise, select **Speak my reply**, allow microphone access, and wait for **Listening...** before speaking. Select **Stop recording** when finished, then review and correct the recognized text before submitting.
- Use the audio replay control to hear the German again. Playback and speech recognition depend on your browser, device, and available voices; they do not grade pronunciation.
- If speech input fails, check browser microphone permission and your selected input device. Try the app in your phone's browser or a supported desktop browser rather than an embedded browser. You can always type your reply.
- Recording a recap in **My chapters** is a separate workflow: it uploads permitted audio for AI transcription. Ordinary reply dictation uses the browser's speech-recognition service.

### Keep your progress safe

- Detailed built-in practice checkpoints, recall history, and saved phrases are browser-local. Use the same browser/profile to resume; clearing site data or switching devices can lose that local progress.
- Personal chapters and their associated progress are stored in your signed-in account. Do not assume all built-in practice history is synchronized across devices.
- On shared devices, signing out does not clear browser-local learning data. Full account export/deletion and a complete local-data clearing workflow are not yet implemented.

## Install on your phone

Open [Sprechen](https://app-dusky-nine-52.vercel.app), or scan the QR code below.

- **Android:** Open the website in Chrome → **Install app**.
- **iPhone:** Open the website in Safari → **Share** → **Add to Home Screen**.

## QR code

![QR code to open Sprechen](docs/qr-code.png)
