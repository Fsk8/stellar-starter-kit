# 💡 Guía: de la plantilla a TU idea

⏱️ Tiempo sugerido: 50 minutos. Ya tienes el flujo completo funcionando (contrato → wallet → frontend). Ahora lo vas a cambiar para que haga **lo tuyo**.

---

## Paso 1: Define tu idea (10 min)

Responde esto en un papel o en un archivo de texto. Si no puedes contestarlo en una línea, tu idea es demasiado grande para 3 horas.

| Pregunta | Ejemplo (Muro de Ideas) | Tu respuesta |
|---|---|---|
| ¿Qué problema resuelve? | Recoger ideas de la comunidad | |
| ¿Quién la usa? | Participantes del taller | |
| ¿Qué **dato** guarda en la blockchain? | Un mensaje + su autor | |
| ¿Qué **acción** hace el usuario? (escribe) | Publicar una idea | |
| ¿Qué quiere **ver** el usuario? (lee) | Contador y última idea | |
| ¿Quién debe **autorizar** cada acción? | El autor de la idea | |

**Regla de oro:** la blockchain guarda pocos datos y reglas que nadie pueda alterar. Todo lo demás (colores, textos, imágenes) va en el frontend.

### Ejemplos de ideas viables en 3 horas
- **Libro de visitas / muro:** guardar todos los mensajes, no solo el último.
- **Votaciones:** propuestas y un voto por persona.
- **Registro de certificados:** guardar el hash de un documento con su fecha y autor.
- **Propinas / donaciones:** enviar XLM a un creador con un mensaje.
- **Lista de tareas compartida:** crear y marcar tareas como hechas.
- **Reputación:** dar "puntos" a otras direcciones.

---

## Paso 2: Traduce tu idea al contrato (10 min)

Piensa en tres cosas:

1. **Datos:** qué estructura guardas (`struct`) y bajo qué clave (`DataKey`).
2. **Funciones de escritura:** cambian el estado y llevan `usuario.require_auth()`.
3. **Funciones de lectura:** solo devuelven datos, no necesitan firma ni cuestan fee.

Ejemplo para "votaciones":

```
Datos:      Propuesta { autor, texto, votos }
Escritura:  crear_propuesta(usuario, texto)   → requiere firma
            votar(usuario, id)                → requiere firma, 1 voto por persona
Lectura:    obtener_propuesta(id)
            total_propuestas()
```

---

## Paso 3: El ciclo de trabajo (se repite muchas veces)

```
Editar lib.rs → cargo test → stellar contract build → deploy → nuevo ID en .env → probar en el frontend
```

Comandos (desde la carpeta `contract`):

```bash
cargo test
stellar contract build
stellar contract deploy \
  --wasm target/wasm32v1-none/release/build_lab_contract.wasm \
  --source alice --network testnet --alias mi_idea
```

(Windows: todo en una sola línea. Usa la ruta del `.wasm` que encontraste antes.)

> ⚠️ **Cada deploy genera un contrato NUEVO con un ID nuevo y datos vacíos.** Después de cada deploy, actualiza `VITE_CONTRACT_ID` en `frontend/.env` y **reinicia `npm run dev`**.

Prueba siempre primero desde la terminal, antes de tocar el frontend:

```bash
stellar contract invoke --id mi_idea --source alice --network testnet -- nombre_funcion --parametro valor
```

---

## Paso 4: Ejemplo completo — historial de ideas con votos

Este ejemplo guarda **todas** las ideas y permite **un voto por persona**. Reemplaza el contenido de `contract/src/lib.rs`:

```rust
#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Count,              // total de ideas
    Idea(u32),          // idea número N
    Voted(u32, Address) // ¿esta dirección ya votó la idea N?
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Idea {
    pub author: Address,
    pub message: String,
    pub votes: u32,
}

#[contract]
pub struct BuildLabContract;

#[contractimpl]
impl BuildLabContract {
    /// Publica una idea y devuelve su id (1, 2, 3...)
    pub fn post_idea(env: Env, usuario: Address, message: String) -> u32 {
        usuario.require_auth();

        let id: u32 = env.storage().instance().get(&DataKey::Count).unwrap_or(0) + 1;
        env.storage().instance().set(&DataKey::Count, &id);

        let idea = Idea { author: usuario, message, votes: 0 };
        let key = DataKey::Idea(id);
        env.storage().persistent().set(&key, &idea);
        env.storage().persistent().extend_ttl(&key, 100_000, 500_000);
        id
    }

    /// Vota por una idea (un voto por dirección)
    pub fn vote(env: Env, usuario: Address, id: u32) -> u32 {
        usuario.require_auth();

        let voted_key = DataKey::Voted(id, usuario);
        if env.storage().persistent().has(&voted_key) {
            panic!("ya votaste esta idea");
        }

        let idea_key = DataKey::Idea(id);
        let mut idea: Idea = env
            .storage()
            .persistent()
            .get(&idea_key)
            .expect("la idea no existe");

        idea.votes += 1;
        env.storage().persistent().set(&idea_key, &idea);
        env.storage().persistent().set(&voted_key, &true);
        idea.votes
    }

    pub fn get_idea(env: Env, id: u32) -> Option<Idea> {
        env.storage().persistent().get(&DataKey::Idea(id))
    }

    pub fn get_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Count).unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
```

Como cambiaste la estructura, **actualiza o borra** `contract/src/test.rs` (usaba `get_last_idea`). Un test mínimo nuevo:

```rust
#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn post_and_vote() {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register(BuildLabContract, ());
    let client = BuildLabContractClient::new(&env, &id);
    let user = Address::generate(&env);

    let n = client.post_idea(&user, &String::from_str(&env, "Hola"));
    assert_eq!(n, 1);
    assert_eq!(client.vote(&user, &1), 1);
    assert_eq!(client.get_idea(&1).unwrap().votes, 1);
}
```

Después: `cargo test`, build, deploy y nuevo ID en `.env`.

---

## Paso 5: Conecta el frontend

### 5.1 En `frontend/src/stellar.ts`: una función de escritura genérica

Hoy `postIdea` solo sirve para una función. Conviene generalizarla. Añade `xdr` al import de `@stellar/stellar-sdk` y reemplaza `postIdea` por:

```ts
export async function sendTx(
  userAddress: string,
  method: string,
  args: xdr.ScVal[]
): Promise<string> {
  const account = await server.getAccount(userAddress);
  const built = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(CONTRACT_ID).call(method, ...args))
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(built);
  const { signedTxXdr } = await kit.signTransaction(prepared.toXDR(), {
    address: userAddress,
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  const signed = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);

  const sent = await server.sendTransaction(signed);
  if (sent.status === "ERROR") throw new Error("La red rechazó la transacción");

  for (let i = 0; i < 30; i++) {
    const res = await server.getTransaction(sent.hash);
    if (res.status === rpc.Api.GetTransactionStatus.SUCCESS) return sent.hash;
    if (res.status === rpc.Api.GetTransactionStatus.FAILED)
      throw new Error("La transacción falló en la red");
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Tiempo de espera agotado");
}

export const postIdea = (user: string, message: string) =>
  sendTx(user, "post_idea", [
    new Address(user).toScVal(),
    nativeToScVal(message, { type: "string" }),
  ]);

export const vote = (user: string, id: number) =>
  sendTx(user, "vote", [
    new Address(user).toScVal(),
    nativeToScVal(id, { type: "u32" }),
  ]);

export type Idea = { author: string; message: string; votes: number };
export const getIdea = async (id: number): Promise<Idea | null> =>
  (await simulateRead<Idea | undefined>("get_idea", nativeToScVal(id, { type: "u32" }))) ?? null;
```

Borra `getLastIdea`, que ya no existe en el contrato.

### 5.2 En `frontend/src/App.tsx`
- Para mostrar el historial: `getCount()` y luego un bucle con `getIdea(1..count)`.
- Para cada idea, un botón **"👍 Votar"** que llame a `vote(address, id)` y luego `refresh()`.

---

## Paso 6: Cómo pasar tipos entre Rust y TypeScript

| Rust | Al **enviar** desde TS | Al **leer** en TS |
|---|---|---|
| `u32` | `nativeToScVal(5, { type: "u32" })` | `number` |
| `i128` (montos) | `nativeToScVal(100n, { type: "i128" })` | `bigint` (usa `Number(x)` o `x.toString()`) |
| `String` | `nativeToScVal("hola", { type: "string" })` | `string` |
| `Address` | `new Address("G...").toScVal()` | `string` (`G...`) |
| `bool` | `nativeToScVal(true, { type: "bool" })` | `boolean` |
| `struct` | (se arma campo a campo) | objeto `{ campo: valor }` |
| `Option<T>` | — | el valor o `undefined` |

---

## Paso 7: Errores típicos al modificar

| Síntoma | Causa probable |
|---|---|
| La app lee `0` o datos viejos | Olvidaste actualizar `VITE_CONTRACT_ID` o reiniciar `npm run dev` |
| `function not found` | El nombre en TS no coincide **exactamente** con el de Rust |
| `Error(Contract, #...)` o `panic` | Una condición de tu contrato falló (por ejemplo "ya votaste"); es esperado |
| `missing argument` / error de tipos | Los argumentos de `.call(...)` no están en el mismo orden y tipo que en Rust |
| `HostError: UnreachableCodeReached` | Un `panic!`/`expect` se activó o hubo un desbordamiento |
| El contrato no compila: `no_std` | En Soroban no existe `std`: usa `String`, `Vec`, `Map` de `soroban_sdk`, no los de Rust estándar |
| Los datos desaparecen tras un tiempo | El almacenamiento tiene vencimiento (TTL). Para el taller no importa; en producción se renueva con `extend_ttl` |

---

## Paso 8: Qué almacenamiento usar

| Tipo | Úsalo para | En este kit |
|---|---|---|
| `instance()` | Pocos datos globales (contadores, admin, configuración) | `Count` |
| `persistent()` | Datos por usuario o por elemento que crecen (ideas, balances, votos) | `Idea(id)`, `Voted(...)` |

Si guardas una lista que puede crecer, **no** la metas en un solo valor de `instance()`. Usa una clave por elemento, como en el ejemplo.

---

## Paso 9: Lista de entrega (últimos 10 min)

- [ ] `cargo test` pasa
- [ ] El contrato está desplegado en Testnet y tengo su ID
- [ ] El frontend lee datos del contrato
- [ ] Puedo firmar una transacción con mi wallet y ver el hash en Stellar Expert
- [ ] Puedo explicar en 30 segundos: **qué guarda mi contrato y quién puede modificarlo**

### Demo (1-2 min por persona)
1. Qué problema resuelve tu idea.
2. Muestra la app: conecta la wallet, ejecuta una acción, abre el hash en Stellar Expert.
3. Di qué agregarías con más tiempo.

---

## 🤖 Usar una IA como copiloto

Puedes pedir ayuda a Claude, ChatGPT u otra IA. Dale contexto, o te devolverá código que no compila. Plantilla:

```
Estoy usando soroban-sdk 22 y @stellar/stellar-sdk 14 (frontend React + TypeScript).
Mi contrato actual es: [pega lib.rs]
Mi idea es: [describe]
Quiero añadir: [función concreta]
Dame el cambio en lib.rs, el test y la función correspondiente en stellar.ts.
Usa require_auth en las funciones de escritura y #![no_std].
```

Pide **un cambio pequeño cada vez** y pruébalo antes de seguir. Si algo falla, pega el error **completo**.

---

## Ideas para ir más lejos
- Solo un **admin** puede borrar o moderar: guarda su dirección en `instance()` en un `init`.
- Mostrar el historial leyendo los **eventos** del contrato.
- Enviar **XLM o un token** con el contrato (módulo `token` de `soroban_sdk`).
- Desplegar el frontend gratis en **Vercel** o **Netlify**.