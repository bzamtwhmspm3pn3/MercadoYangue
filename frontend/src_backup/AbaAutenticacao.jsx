import React, { useState } from 'react';

const AbaAutenticacao = ({ onLoginSucesso }) => {
  const [modo, setModo] = useState('login'); // 'login' ou 'registro'
  const [tipoUsuario, setTipoUsuario] = useState('cliente'); // para registro

  // Dados login
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  // Dados registro
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const limparCampos = () => {
    setUsuario('');
    setSenha('');
    setNome('');
    setEmail('');
    setErro('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const res = await fetch('https://sua-api.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.mensagem || 'Erro no login');
        setLoading(false);
        return;
      }
      onLoginSucesso(data);
    } catch {
      setErro('Erro de conexão.');
      setLoading(false);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const res = await fetch('https://sua-api.com/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, tipoUsuario }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.mensagem || 'Erro no registro');
        setLoading(false);
        return;
      }
      // Após registro, pode fazer login automático ou pedir login
      alert('Registro realizado com sucesso! Faça login.');
      setModo('login');
      limparCampos();
      setLoading(false);
    } catch {
      setErro('Erro de conexão.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-100 rounded shadow">
      <div className="flex justify-center mb-6 space-x-4">
        <button
          className={`px-4 py-2 rounded ${modo === 'login' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}
          onClick={() => { setModo('login'); limparCampos(); }}
        >
          Login
        </button>
        <button
          className={`px-4 py-2 rounded ${modo === 'registro' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}
          onClick={() => { setModo('registro'); limparCampos(); }}
        >
          Registro
        </button>
      </div>

      {erro && <p className="text-red-600 mb-4">{erro}</p>}

      {modo === 'login' && (
        <form onSubmit={handleLogin}>
          <label className="block mb-2 font-semibold">Usuário ou Email</label>
          <input
            type="text"
            value={usuario}
            onChange={e => setUsuario(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
            placeholder="Usuário ou email"
            disabled={loading}
          />
          <label className="block mb-2 font-semibold">Senha</label>
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            className="w-full p-2 mb-6 border rounded"
            placeholder="Senha"
            disabled={loading}
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      )}

      {modo === 'registro' && (
        <form onSubmit={handleRegistro}>
          <label className="block mb-2 font-semibold">Nome Completo</label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
            placeholder="Seu nome"
            disabled={loading}
          />

          <label className="block mb-2 font-semibold">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
            placeholder="Seu email"
            disabled={loading}
          />

          <label className="block mb-2 font-semibold">Senha</label>
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
            placeholder="Senha"
            disabled={loading}
          />

          <label className="block mb-2 font-semibold">Tipo de Usuário</label>
          <select
            value={tipoUsuario}
            onChange={e => setTipoUsuario(e.target.value)}
            className="w-full p-2 mb-6 border rounded"
            disabled={loading}
          >
            <option value="cliente">Cliente / Comprador</option>
            <option value="vendedor">Vendedor / Agricultor</option>
          </select>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
        </form>
      )}
    </div>
  );
};

export default AbaAutenticacao;
