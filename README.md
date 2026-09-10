# TrustPay

Premium Android-first USDT → INR exchange interface.

## Included
- Premium dark/gold TrustPay visual system
- 12-word recovery-phrase onboarding demo
- USDT → INR calculator at ₹107 / USDT
- 500 USDT minimum exchange rule
- Deposit network selector: BNB Smart Chain, TRON, Arbitrum, Bitcoin, Solana
- UPI and IMPS withdrawal UI
- Order/processing state with ~15 minute target
- Responsive mobile-first layout

## Important
This repository is a **UI prototype**. Deposit addresses are intentionally placeholders and no real blockchain custody, transaction verification, payout, KYC/AML, or authentication backend is connected yet.

For production, recovery phrases must be generated securely on-device and never stored server-side in plaintext. Real deposits must be independently verified on-chain before crediting funds, and withdrawals must be authorized through a secure backend.

## Run
```bash
npm install
npm run dev
```
