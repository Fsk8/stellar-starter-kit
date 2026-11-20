import {
  Account,
  Address,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  rpc,
} from "@stellar/stellar-sdk";
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  XBULL_ID,
} from "@creit.tech/stellar-wallets-kit";
import {
  WalletConnectModule,
  WalletConnectAllowedMethods,
} from "@creit.tech/stellar-wallets-kit/modules/walletconnect.module";

/* ---------- Configuración de red ---------- */
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET; // "Test SDF Network ; September 2015"
export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID as string;

export const server = new rpc.Server(RPC_URL);

/* ---------- Wallets Kit ---------- */
// allowAllModules(): Freighter, xBull, Albedo, Rabet, Lobstr, Hana, etc.
const modules = allowAllModules();

// WalletConnect solo se activa si hay Project ID
const wcProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as
  | string
  | undefined;

if (wcProjectId) {
  modules.push(
    new WalletConnectModule({
      url: window.location.origin,
      projectId: wcProjectId,
      method: WalletConnectAllowedMethods.SIGN,
      description: "Stellar Build Lab",
      name: "Stellar Build Lab",
      icons: [],
      network: WalletNetwork.TESTNET,
    })
  );
}

export const kit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  selectedWalletId: XBULL_ID,
  modules,
});

/* ---------- Lecturas (simulación, no cuestan fee ni requieren firma) ---------- */
async function simulateRead<T>(method: string, ...args: any[]): Promise<T> {
  // Para simular basta con cualquier cuenta con formato válido
  const dummy = new Account(Keypair.random().publicKey(), "0");
  const tx = new TransactionBuilder(dummy, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(CONTRACT_ID).call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }
  const retval = (sim as rpc.Api.SimulateTransactionSuccessResponse).result
    ?.retval;
  return (retval ? scValToNative(retval) : undefined) as T;
}

export const getCount = () => simulateRead<number>("get_count");

export type Idea = { author: string; message: string };
export const getLastIdea = async (): Promise<Idea | null> =>
  (await simulateRead<Idea | undefined>("get_last_idea")) ?? null;

/* ---------- Escritura (construir -> firmar -> enviar -> esperar) ---------- */
export async function postIdea(
  userAddress: string,
  message: string
): Promise<string> {
  // 1. Construir
  const account = await server.getAccount(userAddress);
  const built = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      new Contract(CONTRACT_ID).call(
        "post_idea",
        new Address(userAddress).toScVal(),
        nativeToScVal(message, { type: "string" })
      )
    )
    .setTimeout(60)
    .build();

  // 2. Simular y ensamblar (agrega footprint, auth y fee de recursos)
  const prepared = await server.prepareTransaction(built);

  // 3. Firmar con la wallet elegida
  const { signedTxXdr } = await kit.signTransaction(prepared.toXDR(), {
    address: userAddress,
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  const signed = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);

  // 4. Enviar
  const sent = await server.sendTransaction(signed);
  if (sent.status === "ERROR") {
    throw new Error("La red rechazó la transacción");
  }

  // 5. Esperar confirmación (polling)
  for (let i = 0; i < 30; i++) {
    const res = await server.getTransaction(sent.hash);
    if (res.status === rpc.Api.GetTransactionStatus.SUCCESS) return sent.hash;
    if (res.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error("La transacción falló en la red");
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Tiempo de espera agotado");
}

export const truncate = (addr: string) =>
  `${addr.slice(0, 4)}...${addr.slice(-4)}`;
