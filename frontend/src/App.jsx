import React, { useState, useEffect } from 'react';
import axios from 'axios';

import AbaGestaoVendas from './components/AbaGestaoVendas';
import AbaGestaoCompras from "./components/AbaGestaoCompras";
import AbaChat from './components/AbaChat';
import AbaProdutos from "./components/AbaProdutos";
import AbaCarrinho from './components/AbaCarrinho';
import AbaAjuda from "./components/AbaAjuda";
import AbaGuiaUtilizacao from "./components/AbaGuiaUtilizacao";
import FooterMercadoYangue from "./components/FooterMercadoYangue";
import AbaPrevisoesAgro from './components/AbaPrevisoesAgro';
import AbaRastreamento from './components/AbaRastreamento';
import AbaLogistica from './components/AbaLogistica';
import AbaEntregador from './components/AbaEntregador';
import WhatsAppButton from './components/WhatsAppButton';
import venancioImg from './assets/equipa/Venâncio.png';
import iracelmaImg from './assets/equipa/Iracelma.png';
import joseImg from './assets/equipa/Jose.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const WHATSAPP_NUMBER = "+244928565837";

const bancosAngola = ["BAI", "BPC", "Millennium Atlântico", "Banco Sol", "BFA", "BIC", "Keve"];

function FormaPagamentoCampo({ formaPagamento, setFormaPagamento, bancosDisponiveis = [] }) {
  const [tipo, setTipo] = useState(formaPagamento?.tipo || "iban");
  const [iban, setIban] = useState(formaPagamento?.iban || "");
  const [banco, setBanco] = useState(formaPagamento?.banco || "");

  useEffect(() => {
    setFormaPagamento({ tipo, iban, banco });
  }, [tipo, iban, banco]);

  return (
    <div className="border border-gray-200 p-4 rounded-xl bg-gray-50 space-y-3">
      <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input-field">
        <option value="iban">Transferência Bancária (IBAN)</option>
        <option value="numConta">Número de Conta</option>
        <option value="dinheiro">Dinheiro na Entrega</option>
      </select>
      {tipo === "iban" && (
        <>
          <input type="text" placeholder="IBAN" value={iban} onChange={(e) => setIban(e.target.value)} className="input-field" />
          <select value={banco} onChange={(e) => setBanco(e.target.value)} className="input-field">
            <option value="">Selecione o Banco</option>
            {bancosDisponiveis.map((b, i) => <option key={i} value={b}>{b}</option>)}
          </select>
        </>
      )}
    </div>
  );
}

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
          alert('Para vender, cadastre-se como Vendedor/Agricultor');
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
          alert('Para comprar, cadastre-se como Cliente');
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
          alert('Para ser entregador, cadastre-se como Entregador');
          setAbaAtiva('login');
        }
      } else {
        setAbaAtiva('login');
      }
    }
  };

  return (
    <div className="container-page">
      <div className="relative rounded-2xl overflow-hidden mb-12 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-agro-900/85 to-agro-700/85 z-10"></div>
        <div className="relative h-[420px] md:h-[520px] bg-[url('https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center">
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
            <div className="text-center max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Mercado Yangue</h1>
              <p className="text-lg md:text-xl text-green-100 leading-relaxed mb-8 max-w-2xl mx-auto">
                A Infraestrutura Inteligente para o Agronegócio Angolano. Conectamos produtores e compradores, 
                eliminamos perdas e geramos previsibilidade através do JIAM Preditivo.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button onClick={() => handleAction('vender')} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg">
                  Quero Vender
                </button>
                <button onClick={() => handleAction('comprar')} className="bg-white hover:bg-gray-100 text-green-800 px-6 py-3 rounded-lg font-semibold transition shadow-lg">
                  Quero Comprar
                </button>
                <button onClick={() => handleAction('entregador')} className="border-2 border-white/60 hover:bg-white/10 text-white px-6 py-3 rounded-lg font-semibold transition">
                  Ser Entregador
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {estatisticas.map((stat, idx) => (
          <div key={idx} className="card p-5 text-center border-b-4 border-agro-500">
            <div className="text-2xl md:text-3xl font-bold text-agro-700">{stat.valor}</div>
            <div className="font-semibold text-gray-800 text-sm">{stat.label}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.desc}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="card p-6">
          <div className="w-12 h-12 bg-agro-100 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-agro-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-2">Missão</h3>
          <p className="text-gray-600 text-sm leading-relaxed">Conectar produtores e compradores globais, valorizando a produção agrícola local e promovendo a segurança alimentar.</p>
        </div>
        <div className="card p-6">
          <div className="w-12 h-12 bg-harvest-100 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-harvest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-2">Visão</h3>
          <p className="text-gray-600 text-sm leading-relaxed">Ser a maior plataforma de comércio agrícola de África, reconhecida pela transparência e inovação.</p>
        </div>
        <div className="card p-6">
          <div className="w-12 h-12 bg-agro-100 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-agro-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-2">Valores</h3>
          <p className="text-gray-600 text-sm leading-relaxed">Transparência, Inovação, Sustentabilidade e Compromisso com o desenvolvimento do setor agrícola.</p>
        </div>
      </div>

      <div className="flex justify-center mb-10">
        <button onClick={() => setAbaAtiva('previsoes')} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 shadow-lg text-center hover:shadow-xl transition transform hover:scale-105 border border-green-200 w-full max-w-md">
          <img src="/logmercadoyangue.png" alt="Mercado Yangue" className="h-12 mx-auto mb-2" />
          <h3 className="font-bold text-green-800">JIAM Preditivo</h3>
          <p className="text-xs text-gray-500">Clique para aceder ao dashboard de análises</p>
        </button>
      </div>

      <div className="card p-8 mb-12">
        <h2 className="section-title text-center mb-8">Nossa Equipa</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {equipa.map((membro, idx) => (
            <div key={idx} className="text-center group">
              <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 border-4 border-agro-200 group-hover:border-agro-500 transition-colors shadow-md">
                <img src={membro.imagem} alt={membro.nome} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{membro.nome}</h3>
              <p className="text-agro-600 text-sm font-medium">{membro.cargo}</p>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{membro.descricao}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-700 to-green-800 rounded-2xl p-8 text-white text-center shadow-xl">
        <p className="text-lg mb-2">📞 {WHATSAPP_NUMBER} | ✉️ mercadoyangueservicosdigitais@gmail.com</p>
        <p className="text-sm text-green-200">© {new Date().getFullYear()} Mercado Yangue — Criado por angolanos</p>
      </div>
    </div>
  );
}

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
      alert("Erro no login. Verifique a conexão.");
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
      alert("Cadastro realizado com sucesso! Faça login.");
      setModo("login");
    } catch (error) {
      alert("Erro no cadastro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const TermosModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-lg max-h-[80vh] overflow-y-auto mx-4 shadow-2xl">
        <h3 className="text-xl font-bold text-agro-700 mb-4">Termos de Uso</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <p><strong>1.</strong> Ao cadastrar-se, concorda com os termos da plataforma.</p>
          <p><strong>2.</strong> Os seus dados são usados exclusivamente para operar a plataforma.</p>
          <p><strong>3.</strong> Vendedores pagam 0.5% de comissão sobre cada venda.</p>
          <p><strong>4.</strong> Os vendedores são responsáveis pela qualidade dos produtos.</p>
          <p><strong>5.</strong> Não compartilhamos os seus dados com terceiros.</p>
        </div>
        <button onClick={() => { setAceitouTermos(true); setMostrarTermos(false); }} className="btn-primary w-full mt-6">Aceito os Termos</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-8">
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setModo("login")} className={`flex-1 py-2.5 rounded-md font-semibold text-sm transition-all ${modo === "login" ? "bg-white text-agro-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Entrar</button>
          <button onClick={() => setModo("cadastro")} className={`flex-1 py-2.5 rounded-md font-semibold text-sm transition-all ${modo === "cadastro" ? "bg-white text-agro-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Criar Conta</button>
        </div>

        {modo === "login" ? (
          <div className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} className="input-field" />
            <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} className="input-field" />
            <button onClick={handleLogin} disabled={loading} className="btn-primary w-full">
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input type="text" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} className="input-field" />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
            <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="input-field" />
            <select value={tipoCadastro} onChange={(e) => setTipoCadastro(e.target.value)} className="input-field">
              <option value="cliente">Cliente</option>
              <option value="vendedor">Vendedor</option>
              <option value="entregador">Entregador</option>
            </select>
            {tipoCadastro !== "cliente" && (
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Província" value={provincia} onChange={(e) => setProvincia(e.target.value)} className="input-field" />
                <input type="text" placeholder="Município" value={municipio} onChange={(e) => setMunicipio(e.target.value)} className="input-field" />
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={aceitouTermos} onChange={() => setMostrarTermos(true)} className="w-4 h-4 rounded border-gray-300 text-agro-600 focus:ring-agro-500" />
              <span className="text-sm text-gray-600">Aceito os <button type="button" onClick={() => setMostrarTermos(true)} className="text-agro-600 underline font-medium">Termos de Uso</button></span>
            </label>
            <button onClick={handleCadastro} disabled={loading} className="btn-primary w-full">
              {loading ? "Cadastrando..." : "Criar Conta"}
            </button>
          </div>
        )}
        {mostrarTermos && <TermosModal />}
      </div>
    </div>
  );
}

export default function App() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [usuario, setUsuario] = useState(() => JSON.parse(localStorage.getItem("usuario")));
  const [abaAtiva, setAbaAtiva] = useState("produtos");
  const [menuAberto, setMenuAberto] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState({ tipo: "iban", iban: "", banco: "" });

  useEffect(() => {
    axios.get(`${API_URL}/produtos`).then(res => setProdutos(res.data || [])).catch(err => console.error(err));
  }, []);

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
  const podeVerGestao = usuario && (usuario.tipo === 'vendedor' || usuario.tipo === 'agricultor');
  const podeVerEntregador = usuario && usuario.tipo === 'entregador';

  const menuItems = [
    { id: 'produtos', label: 'Produtos', mostrar: true },
    { id: 'carrinho', label: 'Carrinho', mostrar: usuario?.tipo === 'cliente' },
    { id: 'gestao', label: 'Vendas', mostrar: podeVerGestao },
    { id: 'gestao-compras', label: 'Compras', mostrar: usuario?.tipo === 'cliente' },
    { id: 'chat', label: 'Chat', mostrar: !!usuario },
    { id: 'cadastrar', label: 'Cadastrar', mostrar: podeVerGestao },
    { id: 'previsoes', label: 'JIAM Agro', mostrar: podeVerJIAM },
    { id: 'rastreamento', label: 'Rastrear', mostrar: !!usuario },
    { id: 'entregador', label: 'Entregas', mostrar: podeVerEntregador },
    { id: 'logistica', label: 'Logística', mostrar: true },
    { id: 'quemSomos', label: 'Sobre', mostrar: true },
    { id: 'ajuda', label: 'Ajuda', mostrar: true },
    { id: 'guia', label: 'Guia', mostrar: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <WhatsAppButton telefone={WHATSAPP_NUMBER} />

      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAbaAtiva('produtos')}>
              <img src="/logmercadoyangue.png" alt="Mercado Yangue" className="h-10" />
              <h1 className="text-lg font-bold text-gray-900">Mercado Yangue</h1>
            </div>

            <div className="hidden lg:flex items-center gap-1">
              {menuItems.filter(item => item.mostrar).slice(0, 7).map(item => (
                <button
                  key={item.id}
                  onClick={() => setAbaAtiva(item.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    abaAtiva === item.id
                      ? 'bg-agro-50 text-agro-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {menuItems.filter(item => item.mostrar).length > 7 && (
                <div className="relative">
                  <button onClick={() => setMenuAberto(!menuAberto)} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                    Mais
                    <svg className="w-4 h-4 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {menuAberto && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 min-w-[180px]">
                      {menuItems.filter(item => item.mostrar).slice(7).map(item => (
                        <button key={item.id} onClick={() => { setAbaAtiva(item.id); setMenuAberto(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-agro-50 hover:text-agro-700">
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!usuario ? (
                <button onClick={() => setAbaAtiva('login')} className="btn-primary text-sm py-2 px-4">
                  Entrar
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">{usuario.nome?.split(' ')[0]}</span>
                  <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors">
                    Sair
                  </button>
                </div>
              )}
              <button onClick={() => setMenuAberto(!menuAberto)} className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {menuAberto && (
        <div className="lg:hidden fixed top-16 left-0 right-0 bg-white shadow-lg border-t border-gray-100 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-3 space-y-0.5">
            {menuItems.filter(item => item.mostrar).map(item => (
              <button key={item.id} onClick={() => { setAbaAtiva(item.id); setMenuAberto(false); }} className={`block w-full text-left px-4 py-3 rounded-lg text-sm ${abaAtiva === item.id ? 'bg-agro-50 text-agro-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                {item.label}
              </button>
            ))}
            {!usuario && (
              <button onClick={() => { setAbaAtiva('login'); setMenuAberto(false); }} className="block w-full text-left px-4 py-3 rounded-lg text-sm text-agro-700 font-semibold hover:bg-agro-50 border-t border-gray-100 mt-2 pt-3">
                Entrar / Criar Conta
              </button>
            )}
          </div>
        </div>
      )}

      <main className="py-6">
        {abaAtiva === 'produtos' && (
          <AbaProdutos produtos={produtos} setProdutos={setProdutos} setProdutoSelecionado={setProdutoSelecionado} adicionarNoCarrinho={adicionarAoCarrinho} usuario={usuario} setAbaAtiva={setAbaAtiva} />
        )}
        {abaAtiva === 'carrinho' && <AbaCarrinho carrinho={carrinho} setCarrinho={setCarrinho} usuario={usuario} setAbaAtiva={setAbaAtiva} />}
        {abaAtiva === 'login' && !usuario && <AbaLoginCadastro setUsuario={setUsuario} setAbaAtiva={setAbaAtiva} />}
        {abaAtiva === 'gestao' && podeVerGestao && <AbaGestaoVendas usuario={usuario} produtos={produtos} setProdutos={setProdutos} />}
        {abaAtiva === 'gestao-compras' && usuario?.tipo === 'cliente' && <AbaGestaoCompras usuario={usuario} produtos={produtos} setProdutos={setProdutos} />}
        {abaAtiva === 'chat' && usuario && <AbaChat usuario={usuario} />}
        {abaAtiva === 'previsoes' && podeVerJIAM && <AbaPrevisoesAgro usuario={usuario} />}
        {abaAtiva === 'rastreamento' && !!usuario && (produtoSelecionado ? <AbaRastreamento usuario={usuario} produtoId={produtoSelecionado._id} produto={produtoSelecionado} /> : <div className="container-page"><div className="card p-12 text-center"><p className="text-gray-500 mb-4">Selecione um produto para rastrear</p><button onClick={() => setAbaAtiva('produtos')} className="btn-primary">Ver Produtos</button></div></div>)}
        {abaAtiva === 'entregador' && podeVerEntregador && <AbaEntregador usuario={usuario} />}
        {abaAtiva === 'logistica' && <AbaLogistica usuario={usuario} setAbaAtiva={setAbaAtiva} />}
        {abaAtiva === 'quemSomos' && <AbaQuemSomos setAbaAtiva={setAbaAtiva} />}
        {abaAtiva === 'ajuda' && <AbaAjuda />}
        {abaAtiva === 'guia' && <AbaGuiaUtilizacao />}

        {abaAtiva === 'cadastrar' && usuario && (usuario.tipo === 'vendedor' || usuario.tipo === 'agricultor') && (
          <div className="container-page">
            <div className="max-w-3xl mx-auto card p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Cadastrar Produto</h2>
              <div className="bg-agro-50 border border-agro-200 p-4 rounded-xl mb-6 text-sm text-agro-800">
                Seja claro sobre o ponto de retirada e as condições de entrega.
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target;
                const formData = new FormData(form);
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
                    alert('Erro: ' + (erro.message || JSON.stringify(erro)));
                  }
                } catch (error) {
                  alert('Erro de rede: ' + error.message);
                }
              }} encType="multipart/form-data" className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                    <input type="text" name="nome" required placeholder="Ex: Milho Branco" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço (Kz)</label>
                    <input type="number" name="preco" step="0.01" required placeholder="0.00" className="input-field" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                    <input type="number" name="quantidade" required placeholder="0" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                    <select name="unidade" required className="input-field">
                      <option value="kg">Kg</option>
                      <option value="l">Litro</option>
                      <option value="un">Unidade</option>
                      <option value="caixa">Caixa</option>
                      <option value="saco">Saco</option>
                      <option value="ton">Tonelada</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do Produto</label>
                  <input type="file" name="imagem" accept="image/*" required className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-agro-50 file:text-agro-700 hover:file:bg-agro-100" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Província</label>
                    <input type="text" name="provincia" placeholder="Ex: Luanda" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Município</label>
                    <input type="text" name="municipio" placeholder="Ex: Viana" className="input-field" />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                  <h3 className="font-semibold text-gray-800 mb-4">Formas de Pagamento</h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-agro-300">
                      <input type="radio" name="tipoPagamento" value="iban" defaultChecked className="text-agro-600 focus:ring-agro-500" />
                      <div>
                        <span className="font-medium text-gray-800">Transferência Bancária (IBAN)</span>
                        <p className="text-xs text-gray-500">Receba por transferência</p>
                      </div>
                    </label>
                    <div className="ml-8 space-y-3">
                      <input type="text" name="iban" placeholder="IBAN" className="input-field" />
                      <select name="banco" className="input-field">
                        <option value="">Selecione o Banco</option>
                        {bancosAngola.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>

                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-agro-300">
                      <input type="radio" name="tipoPagamento" value="express" className="text-agro-600 focus:ring-agro-500" />
                      <div>
                        <span className="font-medium text-gray-800">Multicaixa Express</span>
                        <p className="text-xs text-gray-500">Pagamento móvel</p>
                      </div>
                    </label>
                    <div className="ml-8">
                      <input type="tel" name="telefoneExpress" placeholder="Número de telefone" className="input-field" />
                    </div>

                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-agro-300">
                      <input type="radio" name="tipoPagamento" value="dinheiro" className="text-agro-600 focus:ring-agro-500" />
                      <div>
                        <span className="font-medium text-gray-800">Dinheiro na Entrega</span>
                        <p className="text-xs text-gray-500">Pague ao receber</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contactos</label>
                  <input type="text" name="contactos" placeholder="Ex: +244 923 000 000" className="input-field" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea name="descricao" rows="4" placeholder="Descreva o produto, origem, qualidade, prazos..." className="input-field resize-none"></textarea>
                </div>

                <button type="submit" className="btn-primary w-full text-base py-3">
                  Cadastrar Produto
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <FooterMercadoYangue setAbaAtiva={setAbaAtiva} />
    </div>
  );
}
