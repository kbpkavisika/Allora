# Accessibility testing

A manual pass of the five accessibility preferences with real assistive tools. Run it on one physical Android device and one physical iPhone before each release that touches UI.

Turn each preference on in **Account → Accessibility**, then work through every screen group. Mark each cell ✅ pass, ❌ fail (log it below) or — not applicable.

## Setup

| Tool | Android | iOS |
|---|---|---|
| Screen reader | TalkBack (Settings → Accessibility → TalkBack) | VoiceOver (Settings → Accessibility → VoiceOver) |
| Dictation | System speech recognition dialog; keyboard mic as fallback | Keyboard dictation (Settings → General → Keyboard → Enable Dictation) |
| Contrast audit | Accessibility Scanner (Play Store) | Xcode → Open Developer Tool → Accessibility Inspector → Audit |
| System text size | Settings → Display → Font size at max | Settings → Accessibility → Display & Text Size → Larger Text at max |

## What to check

### Large text
- Every label, price and input value is one step bigger than with the preference off.
- With the system font size also at max, nothing is clipped, truncated mid-word or overlapping.
- Buttons and rows grow to fit and stay tappable.

### High contrast
- Borders on cards, inputs and dividers are clearly visible.
- Body text is darker than with the preference off.
- The contrast audit reports no text or control contrast failures, in both light and dark mode.

### Dictation
- With the preference **off**, no field shows a microphone button.
- With it **on**, text fields show a microphone button. Number, password and price fields do not.
- On Android, tapping a field mic opens the system speech recognition dialog without opening the keyboard. On iOS, it focuses the field, opens the keyboard and shows "Tap the microphone on your keyboard to start speaking". With a screen reader on, the keyboard hint is also announced.
- Dictated text appends to existing text, respects the field’s maximum length, and uses normal form validation.
- Cancel the Android dialog: the field’s text stays unchanged, and the keyboard stays closed.
- Tap the mic repeatedly: only one dialog opens.
- Test English, Sinhala and Tamil app languages on devices whose speech service supports them.
- Disable or remove the Android speech service: the keyboard opens, and a localized explanation is shown and announced.
- Leave the screen while dictation is pending: late results do not change another field or screen.
- In AlloraAI, dictation fills the message input; the user must tap Send explicitly.
- iOS still opens the keyboard, and secure-field reveal controls remain unchanged.
- The hint disappears when you leave the field.

### Screen reader support
Run with TalkBack or VoiceOver on. Screen reader support is always enabled.
- In Account → Accessibility and onboarding, the option is checked, uses disabled colors and cannot be turned off.
- Existing accounts that previously saved the preference off still receive the spoken cues below.
- On opening or returning to a screen, focus starts on the screen title.
- Swiping moves through the screen in visual order: top to bottom, left to right.
- Product tiles, order cards and seller product rows end with "item X of Y".
- Fields with helper text read that text as a hint.
- Every button, icon and toggle has a meaningful spoken label; nothing reads as "button" or "unlabelled".
- Form errors are announced when they appear.

### Reduce motion
- With the app preference on and the device setting off, screen transitions, modal fades, splash fades, image crossfades and button scaling are disabled; toggle knobs move instantly.
- With the app preference off and the device setting on, the same effects remain disabled.
- With both off, normal effects return.
- Change the device setting while Allora is open and check that the next interaction follows it.
- Restart with the app preference on and check that startup and subsequent navigation have no fades or slides.

### Navigation and saved preferences
- After startup finishes, opening screens, going back and returning to Account never show the splash again.
- Change each accessibility preference, return to Account, reopen Accessibility and restart the app; each saved setting remains selected.
- If a save fails, the switch returns to its saved value and a save error appears.

## Results

| Screen group | Large text | High contrast | Dictation | Screen reader | Reduce motion |
|---|---|---|---|---|---|
| Auth (sign in, sign up, create password) | | | | | |
| Onboarding (personalize, role select) | | | | | |
| Buyer: shop, product, reviews | | | | | |
| Buyer: cart, checkout, payment | | | | | |
| Buyer: orders, returns | | | | | |
| Account (profile, address, accessibility, password) | | | | | |
| Seller: dashboard, products, add/edit product | | | | | |
| Seller: orders, store details | | | | | |

Tested by: ______ · Date: ______ · Devices / OS versions: ______

## Issues found

| Screen | Preference | Device | What happened | Owner | Ticket |
|---|---|---|---|---|---|
| | | | | | |
