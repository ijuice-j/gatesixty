# Gate60

A landscape **flip-clock for Android tablets** that turns your day into a glanceable display. It reads your **Google Calendar** and shows the current activity, time remaining, and what's next — with a full-day agenda and a chime on every transition.

## Features

- Split-flap **flip clock** (12/24-hour, tap to toggle), locked landscape, immersive fullscreen, screen kept awake.
- **Now tag** + **Next pill** driven by your Google Calendar primary calendar (`until <end> · <time left>`).
- Tap the tag for the **today agenda** overlay.
- **1-up chime** on every tag swap (native `MediaPlayer`).
- Sign in once — the session **persists** (silent restore); a **Skip** option uses the bare clock.
- Auto-refreshes the calendar every 10 minutes and on resume.

## Stack

- **Flutter** (Dart), **Riverpod** (code-gen) for state, **go_router** for navigation.
- **google_sign_in** v7 + **googleapis** (Calendar v3) for the schedule data.
- Feature-first / clean architecture: `lib/src/features/{auth,clock,schedule,settings}` split into `data` / `domain` / `presentation`, plus `lib/src/core` and `lib/src/app`.

## Getting started

```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs   # generate Riverpod code
flutter run
```

### Google Calendar setup

In Google Cloud Console: enable the **Calendar API**, configure the OAuth consent screen (add your account as a test user, scope `calendar.readonly`), and create an **Android** OAuth client (matching the app's package name + SHA-1) and a **Web** OAuth client. Put the Web client ID in `lib/src/core/config/app_config.dart` (`googleServerClientId`).
