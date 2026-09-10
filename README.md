# TrustPay

Premium Android-first USDT → INR exchange application.

## Current build
- Premium dark/gold fintech UI
- Secure BIP-39 12-word recovery phrase generation and local verifier
- Wallet restore flow with local phrase validation
- Fixed exchange rate: **₹107 / 1 USDT**
- Minimum exchange/deposit: **500 USDT**
- Deposit networks: BNB Smart Chain, TRON, Arbitrum, Bitcoin, Solana
- Supplied deposit addresses loaded into the app
- QR generated from the active wallet address, plus admin QR upload UI
- Transaction-hash deposit submission and pending/verified/rejected workflow
- UPI and IMPS withdrawal UI
- Admin operations console for wallet addresses and deposit review
- Supabase SQL schema + Edge Functions for production backend integration
- Capacitor Android configuration and GitHub Actions APK build

## Supplied wallet addresses
| Network | Standard | Address |
|---|---|---|
| BNB Smart Chain | BEP-20 | `0xdc114586391B39216c8CD17B3bdDb02dF3CC5F0A` |
| TRON | TRC-20 | `TMVhrv1qfySpPfsuUghb19TuZvjzXukD9K` |
| Arbitrum | Arbitrum One | `0xdc114586391B39216c8CD17B3bdDb02dF3CC5F0A` |
| Bitcoin | BTC | `bc1qxny7h6hpkuw47sgmqn228m46k2zmvhexpcns0h` |
| Solana | SPL | `7rV7Bkz4sjxYDZmhCQPR6WpueXYnZYw35NUFkj6mfGde` |

## Backend setup
1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Deploy the functions under `supabase/functions/`.
4. Create an authenticated admin user and insert that user's UUID into `public.admin_users`.
5. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the frontend.
6. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.

The verification function is intentionally a controlled verification boundary: deposits should not be credited merely because a user supplied a transaction hash. A production chain adapter must independently confirm the transaction, recipient address, USDT token, amount, network, and required confirmations before marking a deposit verified.

## Android
```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

For a debug APK:
```bash
npm run android:apk
```

A GitHub Actions workflow also builds the debug APK on pushes to `main` and uploads it as an artifact.

## Security requirements
- Never store recovery phrases or private keys on the server.
- The frontend creates a one-way SHA-256 verifier only after local BIP-39 validation.
- Never place service-role keys in `VITE_*` variables.
- Do not credit deposits until independent on-chain verification succeeds.
- Withdrawals must be authorized by a protected backend and audited.
- Add applicable KYC/AML, sanctions, consumer-protection, tax, and money-transmission/compliance controls before operating the exchange in production.
- The `~15 minute` processing language is a target, not an unconditional guarantee.

## Development
```bash
npm install
npm run dev
```
