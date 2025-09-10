import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logo from './assets/logo.png';

import AbaGestaoVendas from './components/AbaGestaoVendas';
import AbaGestaoCompras from './components/AbaGestaoCompras';
import ConfirmacaoPagamento from './components/ConfirmacaoPagamento';
import AbaChat from './components/AbaChat';
import AbaProdutos from './components/AbaProdutos';
import AbaCarrinho from './components/AbaCarrinho';
import PainelFBI from './pages/FBI/PainelFBI';

// ==================== HEADER ====================
export function Header() {
  return (
    <header className="flex items-center gap-4 p-4 bg-green-800 text-white shadow">
      <img src={logo} alt="Logo MercadoYangue" className="w-36 h-auto" />
      <h1 className="text-3xl font-bold">MercadoYangue</h1>
    </header>
  );
}

// ==================== ABA QUEM SOMOS ====================
function AbaQuemSomos() {
  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow text-gray-800 space-y-4 leading-relaxed">
      <h2 className="text-3xl font-extrabold text-green-700 text-center mb-4">
        Bem-vindo ao MercadoYangue
      </h2>
      <p>
        O <strong>MercadoYangue</strong>, concebido por Venâncio Elavoco Cassova Martins, é uma plataforma digital angolana dedicada a impulsionar o comércio local e nacional, promovendo uma ligação directa e segura entre clientes e vendedores, produtores ou agricultores em todo o território nacional.
      </p>
      <p>
        Com sistema de <strong>registo segmentado</strong> por perfis (cliente ou vendedor/agricultor), garantimos um ambiente funcional. Para vendedores/agricultores, é exigido aceite do <strong>Contrato Digital</strong>.
      </p>
      <h3 className="text-2xl font-bold text-green-600 mt-6">Missão, Visão e Valores</h3>
      <p><strong>Missão:</strong> Conectar angolanos via plataforma digital valorizando produtos locais e promovendo sustentabilidade económica.</p>
      <p><strong>Visão:</strong> Ser o maior mercado digital confiável de Angola, fomentando empreendedorismo e inclusão financeira.</p>
      <p><strong>Valores:</strong> Verdade, Transparência, Pontualidade, Responsabilidade, Sustentabilidade, Justiça, Inovação.</p>
      <h3 className="text-2xl font-bold text-green-600 mt-6">Abas e Funcionalidades</h3>
      <ul className="list-disc list-inside">
        <li><strong>Aba Login:</strong> acesso seguro e personalizado.</li>
        <li><strong>Aba Quem Somos:</strong> origem, missão, visão e valores.</li>
        <li><strong>Aba Produtos:</strong> navegação eficiente por categorias e localização.</li>
        <li><strong>Aba Carrinho:</strong> gestão personalizada de compras.</li>
        <li><strong>Aba Bate-Papo:</strong> comunicação directa com histórico e notificações.</li>
        <li><strong>Aba Gestão de Vendas:</strong> relatórios e análises para vendedores/agricultores.</li>
        <li><strong>Aba Gestão de Compras:</strong> relatórios e análises para clientes.</li>
        <li><strong>Aba Cadastrar Produtos:</strong> registo de novos produtos com localização e imagens.</li>
      </ul>
      <p>
        Pagamentos são realizados <strong>diretamente entre comprador e vendedor</strong> via IBAN, Multicaixa Express, ou outros métodos adaptados.
      </p>
      <h3 className="text-2xl font-bold text-green-600 mt-6">Contato</h3>
      <p>Email: <a href="mailto:contato@mercadoyangue.co.ao" className="text-blue-600">contato@mercadoyangue.co.ao</a></p>
      <p>WhatsApp & Call Center: <a href="tel:+244920000000" className="text-blue-600">+244 920 000 000</a></p>
      <p className="text-center text-sm text-gray-500 mt-6">
        © {new Date().getFullYear()} MercadoYangue — Criado por angolanos, para angolanos.
      </p>
    </div>
  );
}

// ==================== CAMPOS DE PAGAMENTO ====================
const bancosAngola = [
  "Banco de Poupança e Crédito (BPC)",
  "Banco Angolano de Investimentos (BAI)",
  "Banco Millennium Atlântico",
  "Banco Sol",
  "Banco Keve",
  "Banco Fomento Angola (BFA)",
  "Banco Económico",
  "Banco BIC",
  "Banco Caixa Geral Angola (BCGA)",
  "Banco Popular de Angola (BPA)",
  "Banco de Desenvolvimento de Angola (BDA)",
  "Banco Privado Atlântico (BPA)",
  "Banco Prestígio",
  "Banco Eurobic Angola",
  "Banco Mais",
  "Banco Comercial Angolano (BCA)",
  "Banco Comercial e de Investimentos (BCI)",
  "Banco Yetu",
  "Banco BAI Microfinanças",
];

function FormaPagamentoCampo({ formaPagamento, setFormaPagamento }) {
  const [tipo, setTipo] = useState(formaPagamento?.tipo || "iban");
  const [iban, setIban] = useState(formaPagamento?.iban || "");
  const [numConta, setNumConta] = useState(formaPagamento?.numConta || "");
  const [banco, setBanco] = useState(formaPagamento?.banco || "");
  const [opcao, setOpcao] = useState(formaPagamento?.opcao || "multicaixa");
  const [telefone, setTelefone] = useState(formaPagamento?.telefone || "");

  useEffect(() => {
    const dados = { tipo };
    if (tipo === "iban") { dados.iban = iban; dados.banco = banco; }
    else if (tipo === "numConta") { dados.numConta = numConta; dados.banco = banco; }
    else if (tipo === "outras") { dados.opcao = opcao; if (opcao === "multicaixa") dados.telefone = telefone; }
    setFormaPagamento(dados);
  }, [tipo, iban, numConta, banco, opcao, telefone, setFormaPagamento]);

  return (
    <div className="border p-4 rounded mb-4 bg-green-50">
      <h3 className="font-semibold mb-2 text-green-700">Forma de Pagamento</h3>
      <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full p-2 border rounded mb-3">
        <option value="iban">IBAN + Banco</option>
        <option value="numConta">Número de Conta + Banco</option>
        <option value="outras">Outras (Ex: Multicaixa)</option>
      </select>

      {tipo === "iban" && (
        <>
          <input type="text" placeholder="IBAN" value={iban} onChange={(e) => setIban(e.target.value)} className="w-full p-2 border rounded mb-3" />
          <select value={banco} onChange={(e) => setBanco(e.target.value)} className="w-full p-2 border rounded mb-3">
            <option value="">Selecione um Banco</option>
            {bancosAngola.map((bancoItem, idx) => <option key={idx} value={bancoItem}>{bancoItem}</option>)}
          </select>
        </>
      )}

      {tipo === "numConta" && (
        <>
          <input type="text" placeholder="Número de Conta" value={numConta} onChange={(e) => setNumConta(e.target.value)} className="w-full p-2 border rounded mb-3" />
          <select value={banco} onChange={(e) => setBanco(e.target.value)} className="w-full p-2 border rounded mb-3">
            <option value="">Selecione um Banco</option>
            {bancosAngola.map((bancoItem, idx) => <option key={idx} value={bancoItem}>{bancoItem}</option>)}
          </select>
        </>
      )}

      {tipo === "outras" && (
        <>
          <select value={opcao} onChange={(e) => setOpcao(e.target.value)} className="w-full p-2 border rounded mb-3">
            <option value="multicaixa">Multicaixa Express</option>
            <option value="dinheiro">Dinheiro (na entrega)</option>
            <option value="outros">Outro</option>
          </select>
          {opcao === "multicaixa" && (
            <input type="tel" placeholder="Telefone (Multicaixa)" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full p-2 border rounded mb-3" />
          )}
        </>
      )}
    </div>
  );
}

// ==================== LOGIN / CADASTRO ====================
function AbaLoginCadastro({ setUsuario }) {
  const [modo, setModo] = useState("login");
  const [tipoCadastro, setTipoCadastro] = useState("cliente");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [provincia, setProvincia] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [localizacaoEspecifica, setLocalizacaoEspecifica] = useState("");
  const [aceitouContrato, setAceitouContrato] = useState(false);

  const limparCampos = () => { setEmail(""); setSenha(""); setNome(""); setProvincia(""); setMunicipio(""); setLocalizacaoEspecifica(""); setAceitouContrato(false); };

  const handleLogin = async () => {
    if (!email || !senha) return alert("Preencha email e senha.");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.msg || "Erro no login");
      if (!data.token || !data.usuario?.nome || !data.usuario?.tipo) return alert("Dados incompletos recebidos.");
      const usuarioLogado = { nome: data.usuario.nome, email: data.usuario.email || email, tipo: data.usuario.tipo };
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(usuarioLogado));
      setUsuario(usuarioLogado);
      alert(`Bem-vindo(a), ${usuarioLogado.nome}!`);
      limparCampos();
    } catch (err) {
      console.error(err); alert("Erro ao conectar com o servidor.");
    }
  };

  const handleCadastro = async () => {
    if (!email || !senha || !nome) return alert("Preencha nome, email e senha.");
    if (tipoCadastro !== "cliente" && (!provincia || !municipio || !localizacaoEspecifica)) return alert("Preencha todos os campos.");
    if (tipoCadastro !== "cliente" && !aceitouContrato) return alert("Aceite o contrato digital.");

    const novoUsuario = { nome, email, senha, tipo: tipoCadastro, ...(tipoCadastro !== "cliente" && { provincia, municipio, localizacaoEspecifica, aceitouContrato: true }) };

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoUsuario),
      });
      const texto = await res.text();
      let data;
      try { data = JSON.parse(texto); } catch { alert("Resposta inválida do servidor."); return; }
      if (!res.ok) return alert(data.msg || "Erro no cadastro");
      alert("Cadastro realizado com sucesso!"); setModo("login"); limparCampos();
    } catch (err) { console.error(err); alert("Erro ao conectar com o servidor."); }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow-md border border-green-200">
      <div className="mb-6 flex justify-center space-x-4">
        <button onClick={() => setModo("login")} className={`px-4 py-2 rounded font-semibold ${modo === "login" ? "bg-green-700 text-white" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>Login</button>
        <button onClick={() => setModo("cadastro")} className={`px-4 py-2 rounded font-semibold ${modo === "cadastro" ? "bg-green-700 text-white" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>Cadastro</button>
      </div>

      {modo === "login" && (
        <>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-3 w-full border p-2 rounded" />
          <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="mb-3 w-full border p-2 rounded" />
          <button onClick={handleLogin} className="w-full bg-green-700 text-white py-3 rounded font-semibold hover:bg-green-800">Entrar</button>
        </>
      )}

      {modo === "cadastro" && (
        <>
          <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="mb-3 w-full border p-2 rounded" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-3 w-full border p-2 rounded" />
          <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="mb-3 w-full border p-2 rounded" />

          <div className="mb-3">
            <label className="block mb-1 font-semibold">Tipo de Cadastro</label>
            <select value={tipoCadastro} onChange={(e) => setTipoCadastro(e.target.value)} className="w-full border p-2 rounded">
              <option value="cliente">Cliente</option>
              <option value="vendedor">Vendedor/Agricultor</option>
            </select>
          </div>

          {tipoCadastro !== "cliente" && (
            <>
              <input type="text" placeholder="Província" value={provincia} onChange={(e) => setProvincia(e.target.value)} className="mb-3 w-full border p-2 rounded" />
              <input type="text" placeholder="Município" value={municipio} onChange={(e) => setMunicipio(e.target.value)} className="mb-3 w-full border p-2 rounded" />
              <input type="text" placeholder="Localização específica" value={localizacaoEspecifica} onChange={(e) => setLocalizacaoEspecifica(e.target.value)} className="mb-3 w-full border p-2 rounded" />
              <label className="inline-flex items-center mb-6 cursor-pointer">
                <input type="checkbox" checked={aceitouContrato} onChange={(e) => setAceitouContrato(e.target.checked)} className="form-checkbox h-5 w-5 text-green-600" />
                <span className="ml-2 text-gray-700">Li e aceito o contrato digital.</span>
              </label>
            </>
          )}

          <button onClick={handleCadastro} className="w-full bg-green-700 text-white py-3 rounded font-semibold hover:bg-green-800">Cadastrar</button>
        </>
      )}
    </div>
  );
}

// ==================== APP PRINCIPAL ====================
export default function App() {
  const [usuario, setUsuario] = useState(() => {
    const usuarioSalvo = localStorage.getItem("usuario");
    return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  });
  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('produtos');
  const [mostrarPainelFBI, setMostrarPainelFBI] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState({ tipo: "iban", iban: "", numConta: "", banco: "", opcao: "multicaixa", telefone: "" });

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/produtos`)
      .then(res => {
        const dados = res.data;
        if (Array.isArray(dados)) { setProdutos(dados); setProdutosFiltrados(dados); }
        else { console.warn("Resposta não é array:", dados); setProdutos([]); setProdutosFiltrados([]); }
      })
      .catch(err => { console.error(err); setProdutos([]); setProdutosFiltrados([]); });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "y" && usuario?.email === "venanciomartinse@gmail.com") {
        setMostrarPainelFBI(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [usuario]);

  const logout = () => { setUsuario(null); setCarrinho([]); localStorage.removeItem("usuario"); localStorage.removeItem("token"); setAbaAtiva('produtos'); };

  const adicionarNoCarrinho = (produto) => {
    if (!usuario || usuario.tipo !== 'cliente') { alert('Login como cliente necessário.'); setAbaAtiva('login'); return; }
    setCarrinho(prev => {
      const existe = prev.find(p => p._id === produto._id);
      if (existe) return prev.map(p => p._id === produto._id ? { ...p, quantidade: p.quantidade + 1 } : p);
      return [...prev, { ...produto, quantidade: 1 }];
    });
    setProdutos(prev => prev.map(p => p._id === produto._id && p.quantidade > 0 ? { ...p, quantidade: p.quantidade - 1 } : p));
    setProdutosFiltrados(prev => prev.map(p => p._id === produto._id && p.quantidade > 0 ? { ...p, quantidade: p.quantidade - 1 } : p));
    setAbaAtiva('carrinho');
  };

  const removerDoCarrinho = (produtoId) => {
    const produtoNoCarrinho = carrinho.find(p => p._id === produtoId);
    if (!produtoNoCarrinho) return;
    setCarrinho(prev => prev.filter(p => p._id !== produtoId));
    setProdutos(prev => prev.map(p => p._id === produtoId ? { ...p, quantidade: p.quantidade + produtoNoCarrinho.quantidade } : p));
    setProdutosFiltrados(prev => prev.map(p => p._id === produtoId ? { ...p, quantidade: p.quantidade + produtoNoCarrinho.quantidade } : p));
  };

  const enviarMensagemChat = (vendedor, mensagem) => {
    if (!vendedor || !mensagem) return console.warn("Vendedor ou mensagem não informado.");
    const chatKey = `chat_${vendedor}`;
    const mensagens = JSON.parse(localStorage.getItem(chatKey)) || [];
    mensagens.push({ texto: mensagem, data: new Date().toISOString(), de: 'cliente' });
    localStorage.setItem(chatKey, JSON.stringify(mensagens));
    console.log(`Mensagem enviada para ${vendedor}: ${mensagem}`);
  };

  const navigateToChat = (comprador, vendedor, mensagem) => {
    localStorage.setItem("mensagemPreChat", JSON.stringify({ vendedor, mensagem, de: comprador }));
    setAbaAtiva("chat");
  };

  if (mostrarPainelFBI && usuario?.email === "venanciomartinse@gmail.com") return <PainelFBI usuario={usuario} />;

  return (
    <div className="min-h-screen bg-green-50">
      <Header />
      <nav className="bg-green-200 py-2 px-6 flex gap-6 text-green-900 font-semibold">
        <button onClick={() => setAbaAtiva('produtos')} className={abaAtiva === 'produtos' ? 'underline' : 'hover:underline'}>Produtos</button>
        {usuario?.tipo === 'cliente' && <button onClick={() => setAbaAtiva('carrinho')} className={abaAtiva === 'carrinho' ? 'underline' : 'hover:underline'}>Carrinho</button>}
        {(usuario?.tipo === 'vendedor' || usuario?.tipo === 'agricultor') && <button onClick={() => setAbaAtiva('gestao')} className={abaAtiva === 'gestao' ? 'underline' : 'hover:underline'}>Gestão de Vendas</button>}
        {usuario?.tipo === 'cliente' && <button onClick={() => setAbaAtiva('gestao-compras')} className={abaAtiva === 'gestao-compras' ? 'underline' : 'hover:underline'}>Gestão de Compras</button>}
        {usuario && <button onClick={() => setAbaAtiva('chat')} className={abaAtiva === 'chat' ? 'underline' : 'hover:underline'}>Bate-Papo</button>}
        {(usuario?.tipo === 'vendedor' || usuario?.tipo === 'agricultor') && <button onClick={() => setAbaAtiva('cadastrar')} className={abaAtiva === 'cadastrar' ? 'underline' : 'hover:underline'}>Cadastrar Produto</button>}
        <button onClick={() => setAbaAtiva('quemSomos')} className={abaAtiva === 'quemSomos' ? 'underline' : 'hover:underline'}>Quem Somos</button>
      </nav>

      <main className="p-6">
        {abaAtiva === 'produtos' && <AbaProdutos produtos={produtos} setProdutos={setProdutos} setProdutoSelecionado={setProdutoSelecionado} adicionarNoCarrinho={adicionarNoCarrinho} usuario={usuario} setAbaAtiva={setAbaAtiva} />}
        {abaAtiva === 'carrinho' && <AbaCarrinho carrinho={carrinho} setCarrinho={setCarrinho} usuario={usuario} enviarMensagemChat={enviarMensagemChat} navigateToChat={navigateToChat} />}
        {abaAtiva === 'login' && !usuario && <AbaLoginCadastro setUsuario={setUsuario} />}
        {abaAtiva === 'gestao' && (usuario?.tipo === 'vendedor' || usuario?.tipo === 'agricultor') && <AbaGestaoVendas usuario={usuario} produtos={produtos} setProdutos={setProdutos} />}
        {abaAtiva === 'gestao-compras' && usuario?.tipo === 'cliente' && <AbaGestaoCompras usuario={usuario} produtos={produtos} setProdutos={setProdutos} />}
        {abaAtiva === 'chat' && usuario && <AbaChat usuario={usuario} />}
        {abaAtiva === 'quemSomos' && <AbaQuemSomos />}
      </main>
    </div>
  );
}
