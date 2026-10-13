# AlloraAI experiment

AlloraAI replaces Saved in the buyer bottom navigation. It searches in-stock product names, returns up to six results sorted by price, and adds the selected result through the existing cart provider. Chat history stays in memory. Payment is unavailable.

## Try it

Run `npm start` from `mobile/`, sign in as a buyer, and open AlloraAI. Ask for a product that exists in the catalog, optionally with a budget: “Find milk under 500 rupees”. After results appear, tap the product’s Add to cart button to add one without another AI invocation. You can also say “I like the first one” or “Add two of the second one”; interpreting those messages uses one invocation. Open Cart to verify the item and quantity.

For voice input on Android, tap the microphone inside the input to open the phone’s speech recognition dialog. On iOS, tap the input microphone, then use the keyboard microphone. Recognized text fills the input; review it and tap the send icon. If Android speech input is unavailable, the keyboard opens instead. Dictation does not send messages automatically.

## Server setup

The app calls the `shopping-assistant` Supabase Edge Function. The client checks the session and refreshes it when close to expiry before invoking. The function independently verifies the user session and sends up to 12 chat messages (at most 16,000 characters) and the current result IDs, names, prices, and stock to Groq. The model returns one search, add, or reply action. Products and prices come from Supabase; cart success is reported only after the existing cart accepts the addition.

Keep `GROQ_API_KEY` in Supabase secrets, never in an `EXPO_PUBLIC_` variable. For local setup, copy `supabase/.env.example` to the ignored `supabase/.env.local` and provide the key. The default model is `openai/gpt-oss-120b`; `GROQ_MODEL` can select another Groq model that supports strict structured output.

From `mobile/`, deploy updates with:

```powershell
npx supabase secrets set --env-file supabase/.env.local
npx supabase functions deploy shopping-assistant
```

The function handles user authentication itself with `auth.getUser`; gateway JWT verification is disabled to support the project’s key setup. Provider rate limits are shown as chat errors. Requests are not automatically retried; provider errors and rate limits impose a short client cooldown, while model generation failures can be resent immediately. Search supports a product-name keyword or browsing across all categories, with an optional maximum price. Budget-only requests such as “What else can I buy for 2000rs” browse in-stock products at or below LKR 2,000; alternative requests exclude the current results. This is not semantic catalog search.

## Checks

```powershell
node --test scripts/shopping-assistant.test.cjs scripts/button-motion.test.cjs scripts/profile-preferences.test.cjs
npx tsc --noEmit
```

## Invocation budget and diagnostics

Each submitted chat message uses at most one Edge Function invocation and one Groq request. Search results are fetched within that same invocation. Direct Add to cart buttons use the existing cart provider and zero assistant invocations. Failed messages are restored to the input without adding failed attempts to the model history. The tests stub authentication, catalog access, and Groq, so running them uses zero hosted invocations.

Supabase currently includes 500,000 monthly Edge Function invocations on Free and 2 million on Pro/Team. Failed invocations count; OPTIONS preflight requests do not. Paid overage is $2 per million, rounded up in million-invocation packages. Groq’s model/token rate limits are separate. See [Supabase usage](https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations).

Deploy the updated function before expecting the new logs. In Supabase Dashboard → Edge Functions → shopping-assistant → Logs, filter by the response’s requestId or x-request-id header. The app console emits shopping_assistant_failed with that same ID. Log events identify auth, validation, catalog_context, provider, provider_response, and catalog_search stages; request_completed records status, durationMs, and providerCalls. provider_completed includes model token usage when supplied. Tokens, API keys, user prompts, catalog text, and raw provider error bodies are excluded from custom logs.

| Response | Meaning / next check |
| --- | --- |
| 401 unauthorized | Missing or rejected user access token. Sign in again. |
| 401 without our requestId or request_started log | The handler may not have run. Check Invocations/platform logs and deployed JWT verification. The repository sets verify_jwt = false and still validates users with auth.getUser. |
| 503 provider_configuration | Groq rejected the key (401/403), model (404), or request format (400/413/422). Check provider_failed.providerStatus/providerErrorCode and server secrets; custom models must support strict structured output. |
| 502 provider_generation_failed | Groq 400 tool_use_failed / json_validate_failed: the model produced an unusable answer. No client cooldown; resend the message. |
| 429 rate_limited | Groq per-minute limit hit (free tier: 8,000 tokens/minute, about 8 messages). Respect retryAfter / Retry-After. |
| 429 daily_limit_reached | Groq daily limit hit (free tier: 1,000 requests or 200K tokens per day). |
| 502 provider_unavailable | Groq returned an upstream error or could not be reached. |
| 502 invalid_provider_response | Provider output failed parsing or action validation. |
| 503 auth_unavailable / dependency_unavailable | Authentication or catalog service failed; this is not treated as an expired session. |
| 504 request_timeout | The request exceeded its dependency deadline. |
| 409 stale_products / insufficient_stock | Refresh results or choose an available quantity. |

The function pins its Supabase SDK in its own deno.json, limits incoming bodies to 64 KiB while reading, and bounds network requests with a shared 40-second deadline and a 30-second provider timeout. The client invocation timeout is 45 seconds. No deployed production root cause is inferred from a generic status alone.

Product results include their first photo through ProductThumbnail, with the existing missing-photo fallback. Results stay attached to the assistant reply that produced them; earlier results remain visible after a new search. Cart buttons on earlier results still use the cart service’s current stock checks. UI-only product snapshots are excluded from messages sent to the model.

For old deployed functions or gateway failures that omit an error code/request ID, the client records unclassified_http_error or non_json_http_error, plus x-request-id and Supabase gateway request IDs when present. If CLI deployment reports “Access token not provided”, run `npx supabase login` before deploying from mobile/.
