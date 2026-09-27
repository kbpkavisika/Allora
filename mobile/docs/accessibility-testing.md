# Accessibility testing

A manual pass of the four accessibility preferences with real assistive tools. Run it on one physical Android device and one physical iPhone before each release that touches UI.

Turn each preference on in **Account → Accessibility**, then work through every screen group. Mark each cell ✅ pass, ❌ fail (log it below) or — not applicable.

## Setup

| Tool | Android | iOS |
|---|---|---|
| Screen reader | TalkBack (Settings → Accessibility → TalkBack) | VoiceOver (Settings → Accessibility → VoiceOver) |
| Dictation | Gboard voice typing (mic key on the keyboard) | Keyboard dictation (Settings → General → Keyboard → Enable Dictation) |
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
- Tapping the mic focuses the field, opens the keyboard and shows "Tap the microphone on your keyboard to start speaking" under the field. With a screen reader on, the hint is also announced.
- Dictated text lands in the field, and the form's validation messages work as if the text were typed.
- The hint disappears when you leave the field.

### Screen reader support
Run with TalkBack or VoiceOver on, with the preference both off and on, to confirm the extra cues only appear when it is on.
- On opening or returning to a screen, focus starts on the screen title.
- Swiping moves through the screen in visual order: top to bottom, left to right.
- Product tiles, order cards and seller product rows end with "item X of Y".
- Fields with helper text read that text as a hint.
- Every button, icon and toggle has a meaningful spoken label; nothing reads as "button" or "unlabelled".
- Form errors are announced when they appear.

## Results

| Screen group | Large text | High contrast | Dictation | Screen reader |
|---|---|---|---|---|
| Auth (sign in, sign up, create password) | | | | |
| Onboarding (personalize, role select) | | | | |
| Buyer: shop, product, reviews | | | | |
| Buyer: cart, checkout, payment | | | | |
| Buyer: orders, returns | | | | |
| Account (profile, address, accessibility, password) | | | | |
| Seller: dashboard, products, add/edit product | | | | |
| Seller: orders, store details | | | | |

Tested by: ______ · Date: ______ · Devices / OS versions: ______

## Issues found

| Screen | Preference | Device | What happened | Owner | Ticket |
|---|---|---|---|---|---|
| | | | | | |
