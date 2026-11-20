# 🚀 Stellar Build Lab: Starter Kit

Muro de Ideas en **Stellar Testnet**: Smart Contract (Soroban/Rust) + Frontend (React + Vite + TypeScript + Tailwind) con multi-wallet.

> **Antes del taller:** completa la Parte A (instalación) y verifica con el checklist. Es lo único que necesitas traer listo. La Parte B se hace juntos en clase.

---

# PARTE A: Preparación (hazla antes del taller)

⏱️ Tiempo estimado: 30-45 minutos. La mayor parte es esperar descargas.

## A.1 Qué vas a instalar

| Herramienta | Para qué sirve |
|---|---|
| **VS Code** | Editor de código |
| **Git** | Descargar el proyecto |
| **Node.js** | Ejecutar el frontend |
| **Rust** | Compilar el smart contract |
| **Stellar CLI** | Desplegar el contrato en la red |
| **Una wallet** | Firmar transacciones desde la app |

Elige tu sistema operativo y sigue **solo** esa sección.

---

## A.2 macOS

Abre la app **Terminal** (Cmd + Espacio, escribe "Terminal").

**1. Herramientas de desarrollo de Apple (incluye Git)**
```bash
xcode-select --install
```
Acepta la ventana que aparece y espera. Si dice que ya están instaladas, continúa.

**2. Node.js**
Descarga la versión **LTS** desde https://nodejs.org e instálala como cualquier app.

**3. Rust**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
Cuando pregunte, presiona **Enter** para la instalación por defecto. Al terminar, **cierra la Terminal y ábrela de nuevo**.

**4. Soporte WebAssembly para Rust**
```bash
rustup target add wasm32-unknown-unknown
rustup target add wasm32v1-none
```

**5. Stellar CLI**

Opción rápida (si tienes Homebrew, https://brew.sh):
```bash
brew install stellar-cli
```
Si no tienes Homebrew:
```bash
cargo install --locked stellar-cli
```
La segunda opción tarda 10-15 minutos. Es normal, no la interrumpas.

**6. VS Code:** https://code.visualstudio.com

---

## A.3 Windows

Usa **PowerShell** (menú Inicio → escribe "PowerShell").

**1. Git:** descarga e instala desde https://git-scm.com/download/win (todo por defecto).

**2. Node.js:** versión **LTS** desde https://nodejs.org

**3. Visual Studio Build Tools** (Rust lo necesita en Windows)
- Descarga desde https://visualstudio.microsoft.com/visual-cpp-build-tools/
- En el instalador marca **"Desktop development with C++"** e instala (son varios GB).

**4. Rust:** descarga `rustup-init.exe` desde https://rustup.rs, ejecútalo y elige la opción 1 (por defecto). Después **cierra y abre PowerShell**.

**5. Soporte WebAssembly para Rust**
```powershell
rustup target add wasm32-unknown-unknown
rustup target add wasm32v1-none
```

**6. Stellar CLI**
```powershell
winget install --id Stellar.StellarCLI
```
Si `winget` no funciona:
```powershell
cargo install --locked stellar-cli
```
(tarda 10-15 minutos). Cierra y abre PowerShell al terminar.

**7. VS Code:** https://code.visualstudio.com

> 💡 En Windows, los comandos largos con `\` al final de línea **no funcionan** en PowerShell. En esta guía, los comandos de Windows se muestran en una sola línea.

---

## A.4 Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y git build-essential pkg-config libssl-dev libdbus-1-dev libudev-dev curl
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
Cierra y abre la terminal, y luego:
```bash
rustup target add wasm32-unknown-unknown
rustup target add wasm32v1-none
cargo install --locked stellar-cli
```

---

## A.5 Verifica la instalación

Cierra y abre la terminal, y ejecuta:

```bash
git --version
node -v
npm -v
rustc --version
cargo --version
stellar --version
rustup target list --installed
```

### ✅ Checklist

- [ ] `node -v` muestra **v18 o superior**
- [ ] `rustc --version` y `cargo --version` muestran una versión
- [ ] `stellar --version` muestra una versión
- [ ] `rustup target list --installed` incluye `wasm32-unknown-unknown` (y `wasm32v1-none` si lo pudiste añadir)
- [ ] `git --version` muestra una versión

Si un comando dice `command not found` o `no se reconoce`, **cierra y abre la terminal** y reinténtalo. Si persiste, esa herramienta no se instaló bien: repite su paso.

---

## A.6 Instala una wallet

Elige **una**. Todas deben estar en **Testnet**.

| Wallet | Instalación | Recomendación |
|---|---|---|
| **Albedo** | No requiere instalar nada: https://albedo.link | La más fácil para empezar |
| **xBull** | Extensión del navegador: https://xbull.app | Buena opción |
| **Rabet** | Extensión del navegador: https://rabet.io | Alternativa |
| **Freighter** | Extensión: https://freighter.app | Puede tener restricciones regionales |

**Pasos:**
1. Crea una cuenta nueva en la wallet. **Guarda tu frase secreta** en un lugar seguro.
2. Cambia la red a **Testnet** (en los ajustes de la wallet).
3. Copia tu dirección pública (empieza con `G...`).

⚠️ **Usa solo cuentas de Testnet.** Nunca uses una cuenta con dinero real en el taller.

## A.7 Fondea tu cuenta (obligatorio)

Una cuenta nueva **no existe** en Stellar hasta que recibe fondos. Sin esto la app dirá "not found".

1. Entra a https://lab.stellar.org/account/create
2. Arriba a la derecha selecciona **Testnet**.
3. Pega tu dirección `G...` y pulsa **Fund account** (Friendbot).

Recibirás 10,000 XLM de prueba, que no tienen valor real.

---

# PARTE B: Proyecto (se hace en el taller)

## B.1 Descargar el proyecto

```bash
git clone https://github.com/Fsk8/stellar-starter-kit.git
cd stellar-starter-kit
code .
```
(`code .` abre la carpeta en VS Code. Luego abre la terminal integrada con **Ctrl + `**.)

### ¿Te atascaste con el contrato?
Usa el contrato de ejemplo y salta directo a **B.3**:

```
VITE_CONTRACT_ID=CCYNBF2VN7LYU6NZPBHIENJODRX2L3LVWYCKC3FEJCYKX7FAE5PPUMY3
```

## B.2 Contrato

```bash
cd contract
cargo test
stellar contract build
```

Busca dónde quedó el archivo `.wasm`:

- Mac/Linux: `ls target/*/release/*.wasm`
- Windows: `dir target\*\release\*.wasm`

Crea tu identidad de pruebas (se fondea sola):
```bash
stellar keys generate alice --network testnet --fund
```

Despliega (usa la ruta que encontraste; puede ser `wasm32v1-none` o `wasm32-unknown-unknown`).

Mac/Linux:
```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/build_lab_contract.wasm \
  --source alice --network testnet --alias build_lab
```

Windows (una sola línea):
```powershell
stellar contract deploy --wasm target/wasm32v1-none/release/build_lab_contract.wasm --source alice --network testnet --alias build_lab
```

Al final imprime un ID que empieza con `C` (56 caracteres). **Cópialo.**

Prueba desde la terminal (una sola línea, sirve en todos los sistemas):
```bash
stellar contract invoke --id build_lab --source alice --network testnet -- post_idea --usuario alice --message "Hola"
stellar contract invoke --id build_lab --source alice --network testnet -- get_count
```
El segundo comando debe devolver `1`.

## B.3 Frontend

```bash
cd ../frontend
```
(si vienes de la raíz del proyecto: `cd frontend`)

Crea tu archivo de configuración:

- Mac/Linux: `cp .env.example .env`
- Windows: `copy .env.example .env`

Abre `frontend/.env` en VS Code y pega tu ID:
```
VITE_CONTRACT_ID=C...tu_id_aqui
```

Instala y arranca:
```bash
npm install
npm run dev
```

Abre http://localhost:5173

## B.4 Usar la app

1. Pulsa **Conectar Wallet** y elige tu wallet.
2. Escribe una idea y pulsa **Enviar a Stellar**.
3. Aprueba la firma en la wallet.
4. Verás el hash de la transacción con un enlace a Stellar Expert, y el contador subirá.

---

# Dónde modificar para tu idea

| Qué | Archivo |
|---|---|
| Lógica on-chain | `contract/src/lib.rs` (luego redespliega y actualiza `.env`) |
| Llamadas al contrato | `frontend/src/stellar.ts` |
| Interfaz | `frontend/src/App.tsx` |

---

# Problemas comunes

| Error | Solución |
|---|---|
| `command not found` / `no se reconoce` | Cierra y abre la terminal. Si sigue, reinstala esa herramienta |
| `linker 'link.exe' not found` (Windows) | Falta Visual Studio Build Tools con "Desktop development with C++" |
| `Account not found` / `not found` en la app | Fondea tu cuenta (sección A.7) |
| Falla la firma en la wallet | La wallet está en Mainnet; cámbiala a **Testnet** |
| `Bad union switch: 4` | Debe usarse `@stellar/stellar-sdk` 14.x (ya incluido); haz `npm install` |
| El `.wasm` no existe en la ruta | Puede ser `wasm32v1-none` o `wasm32-unknown-unknown`; búscalo con el comando de B.2 |
| `invoke` pide `--source-account` | Añade `--source alice` también en las lecturas |
| `cargo test` falla con `ed25519-dalek` | Usa el `Cargo.lock` del repo; si persiste: `cargo update -p ed25519-dalek@3.0.0 --precise 2.2.0` |
| La app dice "Falta VITE_CONTRACT_ID" | El archivo debe llamarse `.env` (no `.env.example`); reinicia `npm run dev` |
| `Buffer is not defined` | `npm i -D vite-plugin-node-polyfills` y añádelo a `vite.config.ts` |
| Puerto 5173 ocupado | Cierra el otro `npm run dev` o usa el puerto que indique Vite |

⚠️ **No ejecutes `npm audit fix --force`:** puede actualizar el kit de wallets a la v2, que cambia la API y rompe el código.

---

## Recursos
- Documentación de Stellar: https://developers.stellar.org
- Soroban: https://developers.stellar.org/docs/build/smart-contracts
- Explorador (Testnet): https://stellar.expert/explorer/testnet
- Stellar Lab: https://lab.stellar.org

👉 Siguiente: [GUIA_TU_IDEA.md](GUIA_TU_IDEA.md)