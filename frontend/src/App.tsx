import { useCallback, useEffect, useState } from "react";
import {
  CONTRACT_ID,
  Idea,
  getCount,
  getLastIdea,
  kit,
  postIdea,
  truncate,
} from "./stellar";

export default function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [lastIdea, setLastIdea] = useState<Idea | null>(null);
  const [loadingState, setLoadingState] = useState(false);

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---- Leer estado del contrato ---- */
  const refresh = useCallback(async () => {
    if (!CONTRACT_ID) return;
    setLoadingState(true);
    try {
      const [c, l] = await Promise.all([getCount(), getLastIdea()]);
      setCount(c);
      setLastIdea(l);
    } catch (e: any) {
      setError(`Error leyendo el contrato: ${e.message ?? e}`);
    } finally {
      setLoadingState(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* ---- Wallet ---- */
  const connect = async () => {
    setError(null);
    try {
      await kit.openModal({
        onWalletSelected: async (option) => {
          kit.setWallet(option.id);
          const { address } = await kit.getAddress();
          setAddress(address);
        },
      });
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
  };

  const disconnect = async () => {
    try {
      await kit.disconnect();
    } catch {
      /* algunas wallets no implementan disconnect */
    }
    setAddress(null);
    setTxHash(null);
  };

  /* ---- Enviar idea ---- */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !message.trim()) return;
    setSending(true);
    setError(null);
    setTxHash(null);
    try {
      const hash = await postIdea(address, message.trim());
      setTxHash(hash);
      setMessage("");
      await refresh();
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex justify-center px-4 py-10">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🚀 Stellar Build Lab</h1>
            <p className="text-sm text-slate-400">Muro de Ideas · Testnet</p>
          </div>

          {address ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-sm text-emerald-400">
                {truncate(address)}
              </span>
              <button
                onClick={disconnect}
                className="rounded-lg border border-slate-700 px-3 py-1 text-sm hover:bg-slate-800"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500"
            >
              Conectar Wallet
            </button>
          )}
        </header>

        {!CONTRACT_ID && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
            Falta <code>VITE_CONTRACT_ID</code>. Copia <code>.env.example</code>{" "}
            a <code>.env</code> y pega tu Contract ID.
          </div>
        )}

        {/* Tarjeta de estado */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Estado del contrato</h2>
            <button
              onClick={refresh}
              disabled={loadingState}
              className="text-xs text-indigo-400 hover:underline disabled:opacity-50"
            >
              {loadingState ? "Actualizando..." : "↻ Actualizar"}
            </button>
          </div>

          <div className="mb-4">
            <p className="text-xs uppercase text-slate-500">Ideas registradas</p>
            <p className="text-4xl font-bold">{count ?? "—"}</p>
          </div>

          <div>
            <p className="text-xs uppercase text-slate-500">Última idea</p>
            {lastIdea ? (
              <div className="mt-1 rounded-lg bg-slate-800 p-3">
                <p className="break-words">“{lastIdea.message}”</p>
                <p className="mt-1 font-mono text-xs text-slate-400">
                  por {truncate(lastIdea.author)}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-500">
                Aún no hay ideas. ¡Sé el primero!
              </p>
            )}
          </div>
        </section>

        {/* Formulario */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 font-semibold">Publicar una idea</h2>
          <form onSubmit={submit} className="space-y-3">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={120}
              placeholder="Escribe tu idea (máx. 120 caracteres)"
              disabled={!address || sending}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!address || sending || !message.trim()}
              className="w-full rounded-lg bg-indigo-600 py-2 font-semibold hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending
                ? "Firmando y enviando..."
                : address
                ? "Enviar a Stellar"
                : "Conecta tu wallet primero"}
            </button>
          </form>

          {txHash && (
            <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
              <p className="text-emerald-300">✅ Transacción confirmada</p>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="break-all font-mono text-xs text-indigo-300 underline"
              >
                {txHash}
              </a>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </section>

        <footer className="text-center text-xs text-slate-600">
          Red: Stellar Testnet · Contrato: {CONTRACT_ID ? truncate(CONTRACT_ID) : "—"}
        </footer>
      </div>
    </div>
  );
}
