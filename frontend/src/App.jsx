import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componentes existentes
import AbaGestaoVendas from './components/AbaGestaoVendas';
import AbaGestaoCompras from "./components/AbaGestaoCompras";
import ConfirmacaoPagamento from "./components/ConfirmacaoPagamento";
import AbaChat from './components/AbaChat';
import AbaProdutos from "./components/AbaProdutos";
import AbaCarrinho from './components/AbaCarrinho';
import PainelFBI from "./pages/dados/dados";
import AbaAjuda from "./components/AbaAjuda";
import AbaGuiaUtilizacao from "./components/AbaGuiaUtilizacao";
import FooterMercadoYangue from "./components/FooterMercadoYangue";

// NOVOS COMPONENTES
import AbaPrevisoesAgro from './components/AbaPrevisoesAgro';
import AbaRastreamento from './components/AbaRastreamento';
import AbaLogistica from './components/AbaLogistica';
import AbaEntregador from './components/AbaEntregador';
import WhatsAppButton from './components/WhatsAppButton';

// Importação de imagens
import logojiam from './assets/logojiam.png';
import venancioImg from './assets/equipa/Venâncio.png';
import iracelmaImg from './assets/equipa/Iracelma.png';
import joseImg from './assets/equipa/Jose.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const WHATSAPP_NUMBER = "+244928565837";

// ============ BANCOS DE ANGOLA ============
const bancosAngola = ["BAI", "BPC", "Millennium Atlântico", "Banco Sol", "BFA", "BIC", "Keve"];

// ============ FORMA PAGAMENTO CAMPO ============
function FormaPagamentoCampo({ formaPagamento, setFormaPagamento, bancosDisponiveis = [] }) {
  const [tipo, setTipo] = useState(formaPagamento?.tipo || "iban");
  const [iban, setIban] = useState(formaPagamento?.iban || "");
  const [banco, setBanco] = useState(formaPagamento?.banco || "");

  useEffect(() => {
    setFormaPagamento({ tipo, iban, banco });
  }, [tipo, iban, banco]);

  return (
    <div className="border p-3 rounded-lg bg-green-50">
      <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full p-2 border rounded mb-2">
        <option value="iban">IBAN + Banco</option>
        <option value="numConta">Número de Conta</option>
        <option value="dinheiro">Dinheiro na Entrega</option>
      </select>
      {tipo === "iban" && (
        <>
          <input type="text" placeholder="IBAN" value={iban} onChange={(e) => setIban(e.target.value)} className="w-full p-2 border rounded mb-2" />
          <select value={banco} onChange={(e) => setBanco(e.target.value)} className="w-full p-2 border rounded">
            <option value="">Selecione o Banco</option>
            {bancosDisponiveis.map((b, i) => <option key={i} value={b}>{b}</option>)}
          </select>
        </>
      )}
    </div>
  );
}

// ============ ABA QUEM SOMOS ============
function AbaQuemSomos({ setAbaAtiva }) {
  const estatisticas = [
    { valor: "-40%", label: "Redução de Perdas", desc: "Produção que chega ao mercado" },
    { valor: "+47T", label: "Capacidade Operacional", desc: "Toneladas comprovadas" },
    { valor: "100%", label: "Rastreabilidade", desc: "Origem garantida" },
    { valor: "24/7", label: "Suporte Ativo", desc: "Sempre disponível" }
  ];

  const equipa = [
    { nome: "Venâncio Martins", cargo: "Gestor Estratégico & Lead Developer", descricao: "Visão tecnológica e liderança estratégica", imagem: venancioImg },
    { nome: "Iracelma Muhangueno", cargo: "Administração & Controlo Operacional", descricao: "Responsável pelo suporte administrativo, organização operacional e estrutura de controlo interno.", imagem: iracelmaImg },
    { nome: "José Cossengue", cargo: "Gestor de Operação", descricao: "Execução operacional e coordenação de campo", imagem: joseImg }
  ];

  const handleAction = (acao) => {
    if (acao === 'vender') {
      if (localStorage.getItem("token")) {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        if (usuario?.tipo === 'vendedor' || usuario?.tipo === 'agricultor') {
          setAbaAtiva('cadastrar');
        } else {
          alert('Para vender, você precisa se cadastrar como Vendedor/Agricultor');
          setAbaAtiva('login');
        }
      } else {
        setAbaAtiva('login');
      }
    } else if (acao === 'comprar') {
      if (localStorage.getItem("token")) {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        if (usuario?.tipo === 'cliente') {
          setAbaAtiva('produtos');
        } else {
          alert('Para comprar, você precisa se cadastrar como Cliente');
          setAbaAtiva('login');
        }
      } else {
        setAbaAtiva('login');
      }
    } else if (acao === 'entregador') {
      if (localStorage.getItem("token")) {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        if (usuario?.tipo === 'entregador') {
          setAbaAtiva('entregador');
        } else {
          alert('Para ser entregador, você precisa se cadastrar como Entregador');
          setAbaAtiva('login');
        }
      } else {
        setAbaAtiva('login');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="relative rounded-2xl overflow-hidden mb-12 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-green-700/80 z-10"></div>
        <div className="relative h-[400px] md:h-[500px] bg-[url('https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center">
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
            <div className="text-center max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Mercado Yangue</h1>
              <p className="text-base md:text-lg text-green-100 leading-relaxed mb-6">
                A Infraestrutura Inteligente para o Agronegócio Angolano. Conectamos produtores e compradores, 
                eliminamos perdas e geramos previsibilidade através do JIAM Preditivo.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => handleAction('vender')} className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg font-semibold transition">Quero Vender</button>
                <button onClick={() => handleAction('comprar')} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold transition">Quero Comprar</button>
                <button onClick={() => handleAction('entregador')} className="border-2 border-white hover:bg-white hover:text-green-800 text-white px-5 py-2 rounded-lg font-semibold transition">Quero ser Entregador</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {estatisticas.map((stat, idx) => (
          <div key={idx} className="bg-white p-3 rounded-xl shadow-lg text-center border-b-4 border-green-500">
            <div className="text-xl md:text-2xl font-bold text-green-700">{stat.valor}</div>
            <div className="font-semibold text-gray-800 text-xs md:text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mb-10">
        <a href="https://jiampreditivo.netlify.app/" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 shadow-lg text-center hover:shadow-xl transition transform hover:scale-105">
          <img src={logojiam} alt="JIAM Preditivo" className="h-16 mx-auto mb-2" />
          <h3 className="font-bold text-green-800">JIAM Preditivo</h3>
          <p className="text-xs text-gray-500">Clique para conhecer</p>
        </a>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <div className="bg-white p-5 rounded-xl shadow-lg">
          <div className="text-3xl mb-2">🌱</div>
          <h3 className="font-bold text-gray-800">Missão</h3>
          <p className="text-sm text-gray-600">Conectar os angolanos valorizando produtos locais</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-lg">
          <div className="text-3xl mb-2">👁️</div>
          <h3 className="font-bold text-gray-800">Visão</h3>
          <p className="text-sm text-gray-600">Ser o maior mercado digital de Angola</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-lg">
          <div className="text-3xl mb-2">⭐</div>
          <h3 className="font-bold text-gray-800">Valores</h3>
          <p className="text-sm text-gray-600">Transparência, Inovação e Sustentabilidade</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-10">
        <h2 className="text-xl font-bold text-center mb-6">👥 Nossa Equipa</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {equipa.map((membro, idx) => (
            <div key={idx} className="text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 border-4 border-green-500">
                <img src={membro.imagem} alt={membro.nome} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-gray-800">{membro.nome}</h3>
              <p className="text-green-600 text-sm">{membro.cargo}</p>
              <p className="text-xs text-gray-500 mt-1">{membro.descricao}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-700 to-green-800 rounded-xl p-6 text-white text-center">
        <p className="text-sm">📞 WhatsApp: {WHATSAPP_NUMBER} | ✉️ mercadoyangueservicosdigitais@gmail.com</p>
        <p className="text-xs text-green-200 mt-2">© {new Date().getFullYear()} MercadoYangue — Criado por angolanos</p>
      </div>
    </div>
  );
}

// ============ LOGIN/CADASTRO COM TEcla ENTER ============
function AbaLoginCadastro({ setUsuario, setAbaAtiva }) {
  const [modo, setModo] = useState("login");
  const [tipoCadastro, setTipoCadastro] = useState("cliente");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [provincia, setProvincia] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [loading, setLoading] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [mostrarTermos, setMostrarTermos] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) return alert("Preencha email e senha.");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data?.msg || "Erro no login");
      const usuarioLogado = { nome: data.usuario.nome, email: data.usuario.email, tipo: data.usuario.tipo, id: data.usuario._id };
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(usuarioLogado));
      setUsuario(usuarioLogado);
      alert(`Bem-vindo, ${usuarioLogado.nome}!`);
      setAbaAtiva("produtos");
    } catch (error) {
      alert("Erro no login");
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async () => {
    if (!nome || !email || !senha) return alert("Preencha todos os campos");
    if (tipoCadastro !== "cliente" && (!provincia || !municipio)) {
      return alert("Preencha província e município");
    }
    if (!aceitouTermos) return alert("Aceite os Termos de Uso");
    
    setLoading(true);
    try {
      await fetch(`${API_URL}/auth/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, tipo: tipoCadastro, provincia, municipio, aceitouContrato: true, aceitouTermos: true }),
      });
      alert("Cadastro realizado! Faça login.");
      setModo("login");
    } catch (error) {
      alert("Erro no cadastro");
    } finally {
      setLoading(false);
    }
  };

  const TermosModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto mx-4">
        <h3 className="text-xl font-bold text-green-700 mb-4">📜 Termos de Uso</h3>
        <div className="space-y-3 text-sm">
          <p><strong>1.</strong> Ao se cadastrar, você concorda com os termos da plataforma.</p>
          <p><strong>2.</strong> Seus dados são usados exclusivamente para operar a plataforma.</p>
          <p><strong>3.</strong> Vendedores pagam 0.5% de comissão sobre cada venda.</p>
          <p><strong>4.</strong> Os vendedores são responsáveis pela qualidade dos produtos.</p>
          <p><strong>5.</strong> Não compartilhamos seus dados com terceiros.</p>
        </div>
        <button onClick={() => { setAceitouTermos(true); setMostrarTermos(false); }} className="mt-6 w-full bg-green-600 text-white py-2 rounded-lg">Aceito</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-lg">
      <div className="flex gap-3 mb-6">
        <button onClick={() => setModo("login")} className={`flex-1 py-2 rounded-lg font-semibold ${modo === "login" ? "bg-green-600 text-white" : "bg-gray-100"}`}>Login</button>
        <button onClick={() => setModo("cadastro")} className={`flex-1 py-2 rounded-lg font-semibold ${modo === "cadastro" ? "bg-green-600 text-white" : "bg-gray-100"}`}>Cadastro</button>
      </div>

      {modo === "login" ? (
        <>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-green-500 outline-none" 
          />
          <input 
            type="password" 
            placeholder="Senha" 
            value={senha} 
            onChange={(e) => setSenha(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-green-500 outline-none" 
          />
          <button onClick={handleLogin} disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition">Entrar</button>
        </>
      ) : (
        <>
          <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full p-3 border rounded-lg mb-3" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-lg mb-3" />
          <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full p-3 border rounded-lg mb-3" />
          <select value={tipoCadastro} onChange={(e) => setTipoCadastro(e.target.value)} className="w-full p-3 border rounded-lg mb-3">
            <option value="cliente">Cliente</option>
            <option value="vendedor">Vendedor</option>
            <option value="entregador">Entregador</option>
          </select>
          {tipoCadastro !== "cliente" && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="text" placeholder="Província" value={provincia} onChange={(e) => setProvincia(e.target.value)} className="w-full p-3 border rounded-lg" />
              <input type="text" placeholder="Município" value={municipio} onChange={(e) => setMunicipio(e.target.value)} className="w-full p-3 border rounded-lg" />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer mb-4">
            <input type="checkbox" checked={aceitouTermos} onChange={() => setMostrarTermos(true)} className="w-4 h-4" />
            <span className="text-sm">Aceito os <button type="button" onClick={() => setMostrarTermos(true)} className="text-green-600 underline">Termos de Uso</button></span>
          </label>
          <button onClick={handleCadastro} disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold">Cadastrar</button>
        </>
      )}
      {mostrarTermos && <TermosModal />}
    </div>
  );
}

// ============ COMPONENTE PRINCIPAL APP ============
export default function App() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [usuario, setUsuario] = useState(() => JSON.parse(localStorage.getItem("usuario")));
  const [abaAtiva, setAbaAtiva] = useState("produtos");
  const [menuAberto, setMenuAberto] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState({ tipo: "iban", iban: "", banco: "" });

  // Carregar produtos
  useEffect(() => {
    axios.get(`${API_URL}/produtos`).then(res => setProdutos(res.data || [])).catch(err => console.error(err));
  }, []);

  // Persistir carrinho
  useEffect(() => {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
  }, [carrinho]);

  useEffect(() => {
    const salvo = localStorage.getItem("carrinho");
    if (salvo) setCarrinho(JSON.parse(salvo));
  }, []);

  const adicionarAoCarrinho = (produto) => {
    if (!usuario || usuario.tipo !== 'cliente') {
      alert('Faça login como cliente');
      setAbaAtiva('login');
      return;
    }
    setCarrinho(prev => {
      const existe = prev.find(item => item._id === produto._id);
      return existe ? prev.map(item => item._id === produto._id ? { ...item, quantidade: item.quantidade + 1 } : item) : [...prev, { ...produto, quantidade: 1 }];
    });
    setAbaAtiva('carrinho');
  };

  const logout = () => {
    setUsuario(null);
    setCarrinho([]);
    localStorage.clear();
    setAbaAtiva('produtos');
  };

  const podeVerJIAM = usuario && (usuario.tipo === 'vendedor' || usuario.tipo === 'agricultor');
  const podeVerEntregador = usuario && usuario.tipo === 'entregador';
  const podeVerGestao = usuario && (usuario.tipo === 'vendedor' || usuario.tipo === 'agricultor');

  const menuItems = [
    { id: 'produtos', label: '🛒 Produtos', mostrar: true },
    { id: 'carrinho', label: '🛍️ Carrinho', mostrar: usuario?.tipo === 'cliente' },
    { id: 'gestao', label: '📊 Vendas', mostrar: podeVerGestao },
    { id: 'gestao-compras', label: '📋 Compras', mostrar: usuario?.tipo === 'cliente' },
    { id: 'chat', label: '💬 Chat', mostrar: !!usuario },
    { id: 'cadastrar', label: '➕ Cadastrar', mostrar: podeVerGestao },
    { id: 'previsoes', label: '📊 JIAM Agro', mostrar: podeVerJIAM },
    { id: 'rastreamento', label: '🗺️ Rastrear', mostrar: podeVerJIAM },
    { id: 'entregador', label: '🚚 Entregas', mostrar: podeVerEntregador },
    { id: 'logistica', label: '📦 Logística', mostrar: true },
    { id: 'quemSomos', label: '🌍 Sobre', mostrar: true },
    { id: 'ajuda', label: '❓ Ajuda', mostrar: true },
    { id: 'guia', label: '📖 Guia', mostrar: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <WhatsAppButton telefone={WHATSAPP_NUMBER} />
      
      <header className="bg-gradient-to-r from-green-800 to-green-700 text-white sticky top-0 z-50 shadow-lg">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAbaAtiva('produtos')}>
            <img src="/logmercadoyangue.png" alt="Logo" className="h-10" />
            <h1 className="text-lg font-bold">Mercado Yangue</h1>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {menuItems.filter(item => item.mostrar).slice(0, 6).map(item => (
              <button key={item.id} onClick={() => setAbaAtiva(item.id)} className={`px-3 py-1.5 rounded-lg text-sm transition ${abaAtiva === item.id ? 'bg-white text-green-700' : 'hover:bg-green-600'}`}>
                {item.label}
              </button>
            ))}
            {menuItems.filter(item => item.mostrar).length > 6 && (
              <div className="relative">
                <button onClick={() => setMenuAberto(!menuAberto)} className="px-3 py-1.5 rounded-lg text-sm hover:bg-green-600">Mais ▼</button>
                {menuAberto && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-2 z-50 min-w-[150px]">
                    {menuItems.filter(item => item.mostrar).slice(6).map(item => (
                      <button key={item.id} onClick={() => { setAbaAtiva(item.id); setMenuAberto(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50">
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!usuario ? (
              <button onClick={() => setAbaAtiva('login')} className="bg-white text-green-700 px-4 py-1.5 rounded-lg text-sm font-semibold ml-2">Entrar</button>
            ) : (
              <div className="flex items-center gap-2 ml-2 bg-green-900/30 px-3 py-1 rounded-full">
                <span className="text-sm">👤 {usuario.nome?.split(' ')[0]}</span>
                <button onClick={logout} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-xs">Sair</button>
              </div>
            )}
          </div>
          <div className="md:hidden flex items-center gap-2">
            {!usuario ? (
              <button onClick={() => setAbaAtiva('login')} className="bg-white text-green-700 px-3 py-1 rounded-lg text-sm">Entrar</button>
            ) : (
              <button onClick={logout} className="bg-red-600 px-3 py-1 rounded-lg text-sm">Sair</button>
            )}
            <button onClick={() => setMenuAberto(!menuAberto)} className="p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </header>

      {menuAberto && (
        <div className="md:hidden fixed top-[57px] left-0 right-0 bg-white shadow-lg z-50 max-h-80 overflow-y-auto border-t">
          <div className="p-2">
            {menuItems.filter(item => item.mostrar).map(item => (
              <button key={item.id} onClick={() => { setAbaAtiva(item.id); setMenuAberto(false); }} className={`block w-full text-left px-4 py-2 rounded-lg text-sm ${abaAtiva === item.id ? 'bg-green-100 text-green-700 font-semibold' : 'text-gray-700'}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
        {abaAtiva === 'produtos' && <AbaProdutos produtos={produtos} setProdutos={setProdutos} setProdutoSelecionado={setProdutoSelecionado} adicionarNoCarrinho={adicionarAoCarrinho} usuario={usuario} setAbaAtiva={setAbaAtiva} />}
        {abaAtiva === 'carrinho' && <AbaCarrinho carrinho={carrinho} setCarrinho={setCarrinho} usuario={usuario} setAbaAtiva={setAbaAtiva} />}
        {abaAtiva === 'login' && !usuario && <AbaLoginCadastro setUsuario={setUsuario} setAbaAtiva={setAbaAtiva} />}
        {abaAtiva === 'gestao' && podeVerGestao && <AbaGestaoVendas usuario={usuario} produtos={produtos} setProdutos={setProdutos} />}
        {abaAtiva === 'gestao-compras' && usuario?.tipo === 'cliente' && <AbaGestaoCompras usuario={usuario} produtos={produtos} setProdutos={setProdutos} />}
        {abaAtiva === 'chat' && usuario && <AbaChat usuario={usuario} />}
        {abaAtiva === 'previsoes' && podeVerJIAM && <AbaPrevisoesAgro usuario={usuario} />}
        {abaAtiva === 'rastreamento' && podeVerJIAM && (produtoSelecionado ? <AbaRastreamento usuario={usuario} produtoId={produtoSelecionado._id} produto={produtoSelecionado} /> : <div className="text-center p-8 bg-white rounded-xl shadow"><p>Selecione um produto primeiro</p><button onClick={() => setAbaAtiva('produtos')} className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg">Ver Produtos</button></div>)}
        {abaAtiva === 'entregador' && podeVerEntregador && <AbaEntregador usuario={usuario} />}
        {abaAtiva === 'logistica' && <AbaLogistica usuario={usuario} />}
        {abaAtiva === 'quemSomos' && <AbaQuemSomos setAbaAtiva={setAbaAtiva} />}
        {abaAtiva === 'ajuda' && <AbaAjuda />}
        {abaAtiva === 'guia' && <AbaGuiaUtilizacao />}

        {/* FORMULÁRIO DE CADASTRO DE PRODUTO */}
        {abaAtiva === 'cadastrar' && usuario && (usuario.tipo === 'vendedor' || usuario.tipo === 'agricultor') && (
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4">🌾 Cadastrar Produto</h2>
            <div className="bg-green-100 p-3 rounded-lg mb-4 text-sm text-green-800">
              💡 Dica: Seja claro sobre o ponto de retirada ou como a entrega será feita.
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const formData = new FormData(form);
              
              // Validar forma de pagamento
              const tipoPagamento = formData.get('tipoPagamento') || 'iban';
              const iban = formData.get('iban');
              const telefoneExpress = formData.get('telefoneExpress');
              
              if (tipoPagamento === 'iban' && !iban) {
                alert('Por favor, insira o IBAN para pagamento');
                return;
              }
              
              const formaPagamentoData = {
                tipo: tipoPagamento,
                iban: tipoPagamento === 'iban' ? iban : null,
                telefone: tipoPagamento === 'express' ? telefoneExpress : null,
                banco: formData.get('banco') || null
              };
              
              const envio = new FormData();
              envio.append('nome', formData.get('nome'));
              envio.append('preco', formData.get('preco'));
              envio.append('quantidade', formData.get('quantidade'));
              envio.append('unidade', formData.get('unidade'));
              envio.append('imagem', formData.get('imagem'));
              envio.append('provincia', formData.get('provincia'));
              envio.append('municipio', formData.get('municipio'));
              envio.append('descricao', formData.get('descricao'));
              envio.append('nomeVendedor', usuario.nome);
              envio.append('formaPagamento', JSON.stringify(formaPagamentoData));
              envio.append('contactos', formData.get('contactos'));

              try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/produtos`, {
                  method: 'POST',
                  body: envio,
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                  alert('Produto cadastrado com sucesso!');
                  form.reset();
                } else {
                  const erro = await response.json();
                  alert('Erro ao cadastrar: ' + (erro.message || JSON.stringify(erro)));
                }
              } catch (error) {
                alert('Erro de rede: ' + error.message);
              }
            }} encType="multipart/form-data" className="space-y-4">
              <input type="text" name="nome" required placeholder="Nome do produto" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              <div className="grid md:grid-cols-2 gap-4">
                <input type="number" name="preco" step="0.01" required placeholder="Preço (Kz)" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                <div className="flex gap-2">
                  <input type="number" name="quantidade" required placeholder="Quantidade" className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                  <select name="unidade" required className="p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                    <option value="kg">Kg</option><option value="l">Litro</option><option value="un">Unidade</option>
                    <option value="caixa">Caixa</option><option value="saco">Saco</option>
                  </select>
                </div>
              </div>
              <input type="file" name="imagem" accept="image/*" required className="w-full p-2 border rounded-lg" />
              <div className="grid md:grid-cols-2 gap-4">
                <input type="text" name="provincia" placeholder="Província" className="w-full p-3 border rounded-lg" />
                <input type="text" name="municipio" placeholder="Município" className="w-full p-3 border rounded-lg" />
              </div>
              
              {/* Forma de Pagamento Melhorada */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">💰 Formas de Pagamento Aceitas</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="tipoPagamento" value="iban" defaultChecked /> 
                    <span>💳 Transferência Bancária (IBAN)</span>
                  </label>
                  <div className="ml-6">
                    <input type="text" name="iban" placeholder="IBAN" className="w-full p-2 border rounded" />
                    <select name="banco" className="w-full p-2 border rounded mt-2">
                      <option value="">Selecione o Banco</option>
                      {bancosAngola.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  
                  <label className="flex items-center gap-2">
                    <input type="radio" name="tipoPagamento" value="express" /> 
                    <span>📱 Multicaixa Express</span>
                  </label>
                  <div className="ml-6">
                    <input type="tel" name="telefoneExpress" placeholder="Número de telefone (Multicaixa)" className="w-full p-2 border rounded" />
                    <p className="text-xs text-gray-500 mt-1">O comprador pagará diretamente via Multicaixa Express</p>
                  </div>
                  
                  <label className="flex items-center gap-2">
                    <input type="radio" name="tipoPagamento" value="dinheiro" /> 
                    <span>💵 Dinheiro na Entrega</span>
                  </label>
                </div>
              </div>
              
              <input type="text" name="contactos" placeholder="Contactos (Ex: +244 923 000 000)" className="w-full p-3 border rounded-lg" />
              <textarea name="descricao" rows="3" placeholder="Descrição do produto" className="w-full p-3 border rounded-lg"></textarea>
              
              <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition">Cadastrar Produto</button>
            </form>
          </div>
        )}
      </main>

      <FooterMercadoYangue setAbaAtiva={setAbaAtiva} />
    </div>
  );
}