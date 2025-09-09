// src/pages/FBI/PainelFBI.jsx
import React, { useEffect, useState } from "react";

export default function PainelFBI({ usuario }) {
  const [vendas, setVendas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [logs, setLogs] = useState([]);
  const [cache, setCache] = useState([]);
  const [backupStatus, setBackupStatus] = useState(null);


  useEffect(() => {
    if (usuario?.email !== "venanciomartinse@gmail.com") return;

    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/api/vendas", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Erro nas vendas: " + (await res.text()));
        return res.json();
      })
      .then(setVendas)
      .catch((err) => console.error("Erro ao buscar vendas:", err.message));

    fetch("http://localhost:5000/api/usuarios", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Erro nos usuários: " + (await res.text()));
        return res.json();
      })
      .then(setUsuarios)
      .catch((err) => console.error("Erro ao buscar usuários:", err.message));

    fetch("http://localhost:5000/api/logs", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Erro nos logs: " + (await res.text()));
        return res.json();
      })
      .then(setLogs)
      .catch((err) => console.error("Erro ao buscar logs:", err.message));

    fetch("http://localhost:5000/api/cache", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Erro no cache: " + (await res.text()));
        return res.json();
      })
      .then(setCache)
      .catch((err) => console.error("Erro ao buscar cache:", err.message));

    fetch("http://localhost:5000/api/backup/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Erro no backup: " + (await res.text()));
        return res.json();
      })
      .then(setBackupStatus)
      .catch((err) => console.error("Erro ao buscar status do backup:", err.message));
  }, [usuario]);

  if (usuario?.email !== "venanciomartinse@gmail.com") {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-black text-green-400 font-mono min-h-screen">
      <h1 className="text-3xl mb-6">🕵️ Painel FBI de Auditoria Interna</h1>

      <section className="mb-10">
        <h2 className="text-xl underline mb-2">Transações Suspeitas</h2>
        <ul className="bg-gray-900 p-4 rounded shadow-inner">
          {vendas.map((v, idx) => (
            <li key={idx} className="border-b border-green-800 py-3">
              🛒 {v.produtos?.map((p) => p.nome).join(", ") || "[N/D]"} <br />
              💰 {v.totalGeral?.toLocaleString("pt-AO")} Kz <br />
              👤 Comprador: {v.compradorId?.nome || "?"} — Vendedor: {v.vendedorId?.nome || "?"}
              <br />
              <button
                onClick={() => eliminarVenda(v._id)}
                className="text-red-400 hover:text-red-700 mt-2 text-sm"
              >
                ❌ Eliminar Venda
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl underline mb-2">Usuários Cadastrados</h2>
        <ul className="bg-gray-900 p-4 rounded shadow-inner max-h-96 overflow-y-auto">
          {usuarios.map((u, idx) => (
            <li key={idx} className="border-b border-green-800 py-2">
              👤 <strong>{u.nome}</strong> — {u.email} [{u.tipo}]
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl underline mb-2">📜 Logs do Sistema</h2>
        <ul className="bg-gray-900 p-4 rounded shadow-inner max-h-60 overflow-y-auto">
          {logs.map((log, idx) => (
            <li key={idx} className="text-sm border-b border-green-800 py-1">
              [{log.data}] {log.mensagem}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl underline mb-2">📦 Cache de Sessão</h2>
        <ul className="bg-gray-900 p-4 rounded shadow-inner max-h-60 overflow-y-auto">
          {cache.map((item, idx) => (
            <li key={idx} className="text-sm border-b border-green-800 py-1">
              {item.chave}: {JSON.stringify(item.valor)}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl underline mb-2">💾 Status de Backup</h2>
        <div className="bg-gray-900 p-4 rounded">
          {backupStatus ? (
            <p className="text-green-300">
              Último Backup: {new Date(backupStatus.ultimoBackup).toLocaleString("pt-AO")}<br />
              Status: {backupStatus.status}
            </p>
          ) : (
            <p className="text-red-400">⚠️ Nenhum status de backup disponível.</p>
          )}
        </div>
      </section>
    </div>
  );

  async function eliminarVenda(id) {
    const token = localStorage.getItem("token");
    const confirmar = confirm("Tem certeza que deseja eliminar esta venda?");
    if (!confirmar) return;

    try {
      const res = await fetch(`http://localhost:5000/api/vendas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Erro ao eliminar venda: " + (await res.text()));

      setVendas((prev) => prev.filter((v) => v._id !== id));
      alert("Venda eliminada com sucesso.");
    } catch (err) {
      console.error(err.message);
      alert("Erro ao eliminar venda: " + err.message);
    }
  }
}

