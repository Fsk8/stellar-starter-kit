# 🚀 Stellar Build Lab: Starter Kit

Muro de Ideas en Stellar Testnet: Smart Contract (Soroban/Rust) + Frontend (React + Vite + TS + Tailwind) con multi-wallet.

## Requisitos
- Rust + target wasm: `rustup target add wasm32-unknown-unknown`
- Stellar CLI: `cargo install --locked stellar-cli`
- Node.js 18+

## 1. Contrato
```bash
cd contract
cargo test
stellar contract build
stellar keys generate alice --network testnet --fund
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/build_lab_contract.wasm \
  --source alice --network testnet --alias build_lab
```
Copia el ID `C...` que devuelve el deploy.

## 2. Frontend
```bash
cd frontend
cp .env.example .env     # pega tu VITE_CONTRACT_ID
npm install
npm run dev
```

## 3. Wallet
Tu cuenta debe existir y tener fondos en Testnet: https://lab.stellar.org/account/create
Albedo es la más rápida (sin extensión). xBull/Rabet/Freighter requieren extensión.

## Dónde modificar
- Lógica on-chain: `contract/src/lib.rs` (después, vuelve a desplegar y actualiza `.env`)
- Llamadas al contrato: `frontend/src/stellar.ts`
- Interfaz: `frontend/src/App.tsx`

## Notas
- Se usa `@creit.tech/stellar-wallets-kit` v1.x (API con `new StellarWalletsKit`). La v2 cambió la API.
- Si aparece `Buffer is not defined`: `npm i -D vite-plugin-node-polyfills` y agrégalo en `vite.config.ts`.
