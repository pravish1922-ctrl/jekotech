# Enable Email OTP in Supabase

The signup flow uses **email OTP** (6-digit code sent to inbox) instead of phone/SMS.

## Supabase Dashboard Steps

1. Go to **Authentication → Providers → Email**
2. Ensure **Enable Email Provider** is ON
3. Set **Confirm email** to ON (required for OTP flow)
4. Under **Email OTP**, set expiry to **600 seconds** (10 min) or longer if needed

## Email Templates (optional)

Go to **Authentication → Email Templates → Confirm signup**

Customize the subject and body. The default template already includes `{{ .Token }}` which renders the 6-digit code.

Example subject: `Your Jekotech verification code`

Example body:
```
Your verification code is: {{ .Token }}

It expires in 10 minutes. Do not share this code.
```

## How the Flow Works

1. User fills name, email, password on `/signup`
2. App calls `supabase.auth.signUp({ email, password, options: { data: { name } } })`
3. Supabase sends a 6-digit code to the email address
4. User is redirected to `/otp?email=[email]&type=email`
5. User enters the code; app calls `supabase.auth.verifyOtp({ email, token, type: 'email' })`
6. On success, app inserts a row into `public.clients` and redirects to `/home`

## Notes

- No Twilio or phone numbers required
- The `clients` row is only inserted **after** email verification succeeds
- If a user signs up but never verifies, they have no `clients` row — login will redirect them back to `/signup`
- Duplicate inserts are safe: Postgres error code `23505` (unique_violation) is silently ignored
