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

// NOVOS COMPONENTES JIAM
import AbaPrevisoes from './components/AbaPrevisoes';
import AbaRastreamento from './components/AbaRastreamento';
import AbaLogistica from './components/AbaLogistica';
import WhatsAppButton from './components/WhatsAppButton';

// Importação de imagens locais (certifique-se que os arquivos existem)
import logojiam from './assets/logojiam.png';
import venancioImg from './assets/equipa/Venâncio.png';
import iracelmaImg from './assets/equipa/Iracelma.png';
import joseImg from './assets/equipa/Jose.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ============ ABA QUEM SOMOS - DESIGN PROFISSIONAL COM IMAGENS DA EQUIPA ============
function AbaQuemSomos({ setAbaAtiva }) {
  const estatisticas = [
    { valor: "-40%", label: "Redução de Perdas", desc: "Produção que chega ao mercado" },
    { valor: "+47T", label: "Capacidade Operacional", desc: "Toneladas comprovadas" },
    { valor: "100%", label: "Rastreabilidade", desc: "Origem garantida" },
    { valor: "24/7", label: "Suporte Ativo", desc: "Sempre disponível" }
  ];

  const funcionalidades = [
    { icone: "🛒", titulo: "Compre Direto", desc: "Do produtor para você, sem intermediários" },
    { icone: "📊", titulo: "JIAM Preditivo", desc: "Previsões de demanda com IA" },
    { icone: "🗺️", titulo: "Rastreabilidade", desc: "Saiba a origem exata do produto" },
    { icone: "💬", titulo: "Chat Integrado", desc: "Comunique-se diretamente" },
    { icone: "📦", titulo: "Logística Eficiente", desc: "Entrega em todas províncias" },
    { icone: "🔒", titulo: "Pagamento Seguro", desc: "Múltiplos métodos" }
  ];

  const equipa = [
    { 
      nome: "Venâncio Martins", 
      cargo: "Gestor Estratégico & Lead Developer", 
      descricao: "Visão tecnológica e liderança estratégica",
      imagem: venancioImg 
    },
    { 
      nome: "Iracelma Muhangueno", 
      cargo: "Secretária", 
      descricao: "Gestão Administrativa e sustentabilidade operacional",
      imagem: iracelmaImg 
    },
    { 
      nome: "José Cossengue", 
      cargo: "Gestor de Operação", 
      descricao: "Execução operacional e coordenação de campo",
      imagem: joseImg 
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section com Carrossel de Imagens do Campo */}
      <div className="relative rounded-2xl overflow-hidden mb-12 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-green-700/80 z-10"></div>
        <div className="relative h-[500px] overflow-hidden">
          <div className="absolute inset-0 flex animate-slide">
            <div className="min-w-full h-full bg-[url('https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center"></div>
            <div className="min-w-full h-full bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center"></div>
            <div className="min-w-full h-full bg-[url('https://images.unsplash.com/photo-1523348837708-15d4a6b8b5b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center"></div>
            <div className="min-w-full h-full bg-[url('https://images.unsplash.com/photo-1592417817032-6072b0b4605b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center"></div>
          </div>
        </div>
        <div className="absolute inset-0 z-20 flex items-center justify-center p-8 md:p-16">
          <div className="text-center max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Mercado Yangue</h1>
            <p className="text-lg md:text-xl text-green-100 leading-relaxed mb-8">
              A Infraestrutura Inteligente para o Agronegócio Angolano. 
              Conectamos produtores e compradores, eliminamos perdas e geramos previsibilidade.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button 
                onClick={() => {
                  if (localStorage.getItem("token")) {
                    setAbaAtiva('cadastrar');
                  } else {
                    setAbaAtiva('login');
                  }
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg"
              >
                Começar Agora
              </button>
              <button 
                onClick={() => setAbaAtiva('produtos')}
                className="border-2 border-white hover:bg-white hover:text-green-800 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Ver Produtos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {estatisticas.map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl shadow-lg text-center border-b-4 border-green-500">
            <div className="text-2xl md:text-3xl font-bold text-green-700">{stat.valor}</div>
            <div className="font-semibold text-gray-800 text-sm md:text-base">{stat.label}</div>
            <div className="text-xs text-gray-500">{stat.desc}</div>
          </div>
        ))}
      </div>

      {/* Logo JIAM Preditivo */}
      <div className="flex justify-center mb-12">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 shadow-lg text-center max-w-md">
          {logojiam ? (
            <img src={logojiam} alt="JIAM Preditivo" className="h-20 mx-auto mb-3" />
          ) : (
            <div className="text-5xl mb-3">📊</div>
          )}
          <h3 className="text-xl font-bold text-green-800">JIAM Preditivo</h3>
          <p className="text-gray-600 text-sm">Inteligência de dados e previsão de procura para apoio à decisão agrícola</p>
        </div>
      </div>

      {/* Missão Visão Valores */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
          <div className="text-4xl mb-3">🌱</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Missão</h3>
          <p className="text-gray-600">Conectar os angolanos através de uma plataforma digital que valoriza os produtos locais e promove a sustentabilidade económica.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
          <div className="text-4xl mb-3">👁️</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Visão</h3>
          <p className="text-gray-600">Ser o maior e mais confiável mercado digital de Angola, com forte presença nas zonas urbanas e rurais.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
          <div className="text-4xl mb-3">⭐</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Valores</h3>
          <p className="text-gray-600">Verdade, Transparência, Pontualidade, Responsabilidade, Sustentabilidade, Justiça e Inovação.</p>
        </div>
      </div>

      {/* Funcionalidades */}
      <div className="bg-gray-50 rounded-2xl p-8 mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8">Plataforma Completa para o Agronegócio</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {funcionalidades.map((func, idx) => (
            <div key={idx} className="text-center group cursor-pointer">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 group-hover:bg-green-200 transition">
                {func.icone}
              </div>
              <h4 className="font-bold text-gray-800">{func.titulo}</h4>
              <p className="text-sm text-gray-600 mt-1">{func.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Nossa Equipa */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">👥 Nossa Equipa</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {equipa.map((membro, idx) => (
            <div key={idx} className="text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 border-4 border-green-500 shadow-lg bg-gray-100 flex items-center justify-center">
                {membro.imagem ? (
                  <img src={membro.imagem} alt={membro.nome} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-green-600">{membro.nome.charAt(0)}</span>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-800">{membro.nome}</h3>
              <p className="text-green-600 font-semibold text-sm">{membro.cargo}</p>
              <p className="text-sm text-gray-500 mt-2">{membro.descricao}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 rounded-xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-2">Pronto para transformar seu negócio?</h3>
        <p className="text-green-100 mb-4">Junte-se aos milhares de produtores e compradores que já utilizam o Mercado Yangue</p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button 
            onClick={() => {
              if (localStorage.getItem("token")) {
                setAbaAtiva('cadastrar');
              } else {
                setAbaAtiva('login');
              }
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-6 py-2 rounded-lg font-semibold transition"
          >
            Quero Vender
          </button>
          <button 
            onClick={() => setAbaAtiva('produtos')}
            className="border-2 border-white hover:bg-white hover:text-green-800 px-6 py-2 rounded-lg font-semibold transition"
          >
            Quero Comprar
          </button>
        </div>
        <div className="mt-6 text-sm text-green-200">
          <p>📞 WhatsApp: +244 920 000 000 | ✉️ mercadoyangueservicosdigitais@gmail.com</p>
        </div>
      </div>

      <div className="text-center text-gray-500 text-xs mt-6 pb-4">
        © {new Date().getFullYear()} MercadoYangue Serviços Digitais — Criado por angolanos, para angolanos.
      </div>

      <style jsx>{`
        @keyframes slide {
          0% { transform: translateX(0); }
          25% { transform: translateX(0); }
          30% { transform: translateX(-100%); }
          50% { transform: translateX(-100%); }
          55% { transform: translateX(-200%); }
          75% { transform: translateX(-200%); }
          80% { transform: translateX(-300%); }
          100% { transform: translateX(-300%); }
        }
        .animate-slide {
          animation: slide 20s ease-in-out infinite;
          width: 400%;
          display: flex;
        }
      `}</style>
    </div>
  );
}

// ============ BANCOS DE ANGOLA ============
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
  "Banco de Desenvolvimento de Angola (BDA)",
  "Banco Prestígio",
  "Banco Eurobic Angola",
  "Banco Mais",
  "Banco Yetu",
];

// ============ FORMA PAGAMENTO CAMPO ============
function FormaPagamentoCampo({ formaPagamento, setFormaPagamento, bancosDisponiveis = [] }) {
  const [tipo, setTipo] = useState(formaPagamento?.tipo || "iban");
  const [iban, setIban] = useState(formaPagamento?.iban || "");
  const [numConta, setNumConta] = useState(formaPagamento?.numConta || "");
  const [banco, setBanco] = useState(formaPagamento?.banco || "");
  const [opcao, setOpcao] = useState(formaPagamento?.opcao || "multicaixa");
  const [telefone, setTelefone] = useState(formaPagamento?.telefone || "");

  useEffect(() => {
    const dados = { tipo };
    if (tipo === "iban") {
      dados.iban = iban;
      dados.banco = banco;
    } else if (tipo === "numConta") {
      dados.numConta = numConta;
      dados.banco = banco;
    } else if (tipo === "outras") {
      dados.opcao = opcao;
      if (opcao === "multicaixa") dados.telefone = telefone;
    }
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
            {bancosDisponiveis.map((bancoItem, index) => (<option key={index} value={bancoItem}>{bancoItem}</option>))}
          </select>
        </>
      )}
      {tipo === "numConta" && (
        <>
          <input type="text" placeholder="Número de Conta" value={numConta} onChange={(e) => setNumConta(e.target.value)} className="w-full p-2 border rounded mb-3" />
          <select value={banco} onChange={(e) => setBanco(e.target.value)} className="w-full p-2 border rounded mb-3">
            <option value="">Selecione um Banco</option>
            {bancosDisponiveis.map((bancoItem, index) => (<option key={index} value={bancoItem}>{bancoItem}</option>))}
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

// ============ LOGIN/CADASTRO ============
function AbaLoginCadastro({ setUsuario, setAbaAtiva }) {
  const [modo, setModo] = useState("login");
  const [tipoCadastro, setTipoCadastro] = useState("cliente");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [provincia, setProvincia] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [localizacaoEspecifica, setLocalizacaoEspecifica] = useState("");
  const [aceitouContrato, setAceitouContrato] = useState(false);
  const [loading, setLoading] = useState(false);

  const limparCampos = () => {
    setEmail(""); setSenha(""); setNome("");
    setProvincia(""); setMunicipio(""); setLocalizacaoEspecifica("");
    setAceitouContrato(false);
  };

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
      if (!data?.token || !data?.usuario?.nome || !data?.usuario?.tipo) {
        return alert("Dados incompletos recebidos do servidor.");
      }
      const usuarioLogado = {
        nome: data.usuario.nome,
        email: data.usuario.email || email,
        tipo: data.usuario.tipo,
        id: data.usuario._id
      };
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(usuarioLogado));
      setUsuario(usuarioLogado);
      alert(`Bem-vindo(a), ${usuarioLogado.nome}!`);
      limparCampos();
      setAbaAtiva?.("produtos");
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Erro inesperado no login.");
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async () => {
    if (!email || !senha || !nome) return alert("Preencha nome, email e senha.");
    if (tipoCadastro !== "cliente" && (!provincia || !municipio || !localizacaoEspecifica)) {
      return alert("Preencha todos os campos para vendedor/agricultor.");
    }
    if (tipoCadastro !== "cliente" && !aceitouContrato) {
      return alert("Você deve aceitar o contrato digital.");
    }
    setLoading(true);
    try {
      const novoUsuario = {
        nome, email, senha, tipo: tipoCadastro,
        ...(tipoCadastro !== "cliente" && { provincia, municipio, localizacaoEspecifica, aceitouContrato: true })
      };
      const res = await fetch(`${API_URL}/auth/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoUsuario),
      });
      const data = await res.json();
      if (!res.ok) return alert(data?.msg || "Erro no cadastro");
      alert("Cadastro realizado com sucesso! Faça login.");
      setModo("login");
      limparCampos();
    } catch (error) {
      console.error("Erro no cadastro:", error);
      alert("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleEsqueciSenha = async () => {
    if (!email) return alert("Digite seu email para redefinir a senha.");
    try {
      const res = await fetch(`${API_URL}/auth/esqueci-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.msg || "Erro ao enviar email.");
      alert("Se o email estiver cadastrado, você receberá instruções.");
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro inesperado.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border border-green-100">
      <div className="flex gap-3 mb-6">
        <button onClick={() => setModo("login")} className={`flex-1 py-2 rounded-lg font-semibold transition ${modo === "login" ? "bg-green-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Login</button>
        <button onClick={() => setModo("cadastro")} className={`flex-1 py-2 rounded-lg font-semibold transition ${modo === "cadastro" ? "bg-green-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Cadastro</button>
      </div>

      {modo === "login" && (
        <>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-3 w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
          <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="mb-4 w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          <button onClick={handleLogin} disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50">Entrar</button>
          <button onClick={handleEsqueciSenha} className="w-full mt-2 text-sm text-green-600 hover:text-green-800 transition">Esqueci minha senha</button>
        </>
      )}

      {modo === "cadastro" && (
        <>
          <input type="text" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} className="mb-3 w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-3 w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
          <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="mb-3 w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
          <select value={tipoCadastro} onChange={(e) => setTipoCadastro(e.target.value)} className="mb-3 w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
            <option value="cliente">Cliente</option>
            <option value="vendedor">Vendedor/Agricultor</option>
          </select>
          {tipoCadastro !== "cliente" && (
            <>
              <input type="text" placeholder="Província" value={provincia} onChange={(e) => setProvincia(e.target.value)} className="mb-3 w-full border p-3 rounded-lg" />
              <input type="text" placeholder="Município" value={municipio} onChange={(e) => setMunicipio(e.target.value)} className="mb-3 w-full border p-3 rounded-lg" />
              <input type="text" placeholder="Localização específica" value={localizacaoEspecifica} onChange={(e) => setLocalizacaoEspecifica(e.target.value)} className="mb-3 w-full border p-3 rounded-lg" />
              <div className="text-xs text-gray-500 bg-green-50 p-3 rounded-lg mb-3 max-h-32 overflow-y-auto">
                <p className="font-bold">📜 Contrato Digital</p>
                <p>Ao se cadastrar como vendedor, você concorda com os termos da plataforma e pagamento de 0.5% de comissão sobre cada venda.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input type="checkbox" checked={aceitouContrato} onChange={(e) => setAceitouContrato(e.target.checked)} className="w-4 h-4 text-green-600" />
                <span className="text-sm">Li e aceito o contrato digital</span>
              </label>
            </>
          )}
          <button onClick={handleCadastro} disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50">Cadastrar</button>
        </>
      )}
    </div>
  );
}

// ============ COMPONENTE PRINCIPAL APP ============
const usuarioInicial = null;

export default function App() {
  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [usuario, setUsuario] = useState(() => {
    const usuarioSalvo = localStorage.getItem("usuario");
    return usuarioSalvo ? JSON.parse(usuarioSalvo) : usuarioInicial;
  });
  const [abaAtiva, setAbaAtiva] = useState(() => "produtos");
  const [mostrarPainelFBI, setMostrarPainelFBI] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState({
    tipo: "iban", iban: "", numConta: "", banco: "", opcao: "multicaixa", telefone: ""
  });

  // Efeitos
  useEffect(() => { localStorage.setItem("abaAtiva", abaAtiva); }, [abaAtiva]);
  useEffect(() => { localStorage.setItem("carrinho", JSON.stringify(carrinho)); }, [carrinho]);
  useEffect(() => {
    const salvo = localStorage.getItem("carrinho");
    if (salvo) setCarrinho(JSON.parse(salvo));
  }, []);
  useEffect(() => {
    axios.get(`${API_URL}/produtos`)
      .then((response) => {
        const dados = response.data;
        if (Array.isArray(dados)) {
          setProdutos(dados);
          setProdutosFiltrados(dados);
        } else {
          setProdutos([]);
          setProdutosFiltrados([]);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar produtos:", error);
        setProdutos([]);
        setProdutosFiltrados([]);
      });
  }, []);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "y" && usuario?.email === "venanciomartinse@gmail.com") {
        setMostrarPainelFBI((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [usuario]);

  // Funções principais
  const navigateToChat = (comprador, vendedor, mensagem) => {
    localStorage.setItem("mensagemPreChat", JSON.stringify({ vendedor, mensagem, de: comprador }));
    setAbaAtiva("chat");
  };
  const enviarMensagemChat = (vendedor, mensagem) => {
    if (!vendedor || !mensagem) return;
    const chatKey = `chat_${vendedor}`;
    const mensagensAnteriores = JSON.parse(localStorage.getItem(chatKey)) || [];
    const novaMensagem = { texto: mensagem, data: new Date().toISOString(), de: 'cliente' };
    localStorage.setItem(chatKey, JSON.stringify([...mensagensAnteriores, novaMensagem]));
  };
  const adicionarNoCarrinho = (produto) => {
    if (!usuario || usuario.tipo !== 'cliente') {
      alert('Você precisa estar logado como cliente para adicionar ao carrinho.');
      setAbaAtiva('login');
      return;
    }
    setCarrinho((prev) => {
      const existe = prev.find((item) => item._id === produto._id);
      if (existe) {
        return prev.map((item) => item._id === produto._id ? { ...item, quantidade: item.quantidade + 1 } : item);
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
    setProdutos((prev) => prev.map((item) => item._id === produto._id && item.quantidade > 0 ? { ...item, quantidade: item.quantidade - 1 } : item));
    setProdutosFiltrados((prev) => prev.map((item) => item._id === produto._id && item.quantidade > 0 ? { ...item, quantidade: item.quantidade - 1 } : item));
    setAbaAtiva('carrinho');
  };

  const logout = () => {
    setUsuario(null);
    setCarrinho([]);
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    setAbaAtiva('produtos');
  };

  if (mostrarPainelFBI && usuario?.email === "venanciomartinse@gmail.com") {
    return <PainelFBI usuario={usuario} />;
  }

  const podeVerJIAM = usuario && (usuario.tipo === 'vendedor' || usuario.tipo === 'agricultor');

  return (
    <div className="min-h-screen bg-gray-50">
      <WhatsAppButton />
      
      {/* Header Profissional */}
      <header className="bg-gradient-to-r from-green-800 to-green-700 text-white sticky top-0 z-50 shadow-xl">
        <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <img src="/logmercadoyangue.png" alt="Logo MercadoYangue" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Mercado Yangue</h1>
              <p className="text-xs text-green-200">Inteligência para o Agronegócio Angolano</p>
            </div>
          </div>
          <div>
            {!usuario ? (
              <button onClick={() => setAbaAtiva('login')} className="bg-white text-green-700 px-6 py-2 rounded-full font-semibold shadow-md hover:shadow-lg transition">
                Iniciar Sessão
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-green-900/30 px-4 py-1 rounded-full">
                <span className="text-sm font-medium">Olá, {usuario.nome}</span>
                <button onClick={logout} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-full text-sm transition">Sair</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navegação Moderna */}
      <nav className="bg-white border-b shadow-sm sticky top-[73px] md:top-[85px] z-40 overflow-x-auto">
        <div className="container mx-auto px-6 py-3 flex gap-2">
          {[
            { id: 'produtos', label: '🛒 Produtos', mostrar: true },
            { id: 'carrinho', label: '🛍️ Carrinho', mostrar: usuario?.tipo === 'cliente' },
            { id: 'gestao', label: '📊 Vendas', mostrar: usuario?.tipo === 'vendedor' || usuario?.tipo === 'agricultor' },
            { id: 'gestao-compras', label: '📋 Compras', mostrar: usuario?.tipo === 'cliente' },
            { id: 'chat', label: '💬 Chat', mostrar: !!usuario },
            { id: 'cadastrar', label: '➕ Cadastrar', mostrar: usuario?.tipo === 'vendedor' || usuario?.tipo === 'agricultor' },
            { id: 'previsoes', label: '📊 JIAM', mostrar: podeVerJIAM },
            { id: 'rastreamento', label: '🗺️ Rastrear', mostrar: podeVerJIAM },
            { id: 'logistica', label: '📦 Entregas', mostrar: true },
            { id: 'quemSomos', label: '🌍 Quem Somos', mostrar: true },
          ].map(item => item.mostrar && (
            <button
              key={item.id}
              onClick={() => setAbaAtiva(item.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                abaAtiva === item.id 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-6 py-8">
        {abaAtiva === 'produtos' && (
          <AbaProdutos
            produtos={produtos}
            setProdutos={setProdutos}
            setProdutoSelecionado={setProdutoSelecionado}
            adicionarNoCarrinho={adicionarNoCarrinho}
            usuario={usuario}
            setAbaAtiva={setAbaAtiva}
          />
        )}
        {abaAtiva === 'carrinho' && (
          <AbaCarrinho
            carrinho={carrinho}
            setCarrinho={setCarrinho}
            usuario={usuario}
            enviarMensagemChat={enviarMensagemChat}
            navigateToChat={navigateToChat}
            setAbaAtiva={setAbaAtiva}
          />
        )}
        {abaAtiva === 'login' && !usuario && (
          <AbaLoginCadastro setUsuario={setUsuario} setAbaAtiva={setAbaAtiva} />
        )}
        {abaAtiva === 'gestao' && usuario && (usuario.tipo === 'vendedor' || usuario.tipo === 'agricultor') && (
          <AbaGestaoVendas usuario={usuario} produtos={produtos} setProdutos={setProdutos} />
        )}
        {abaAtiva === 'gestao-compras' && usuario?.tipo === 'cliente' && (
          <AbaGestaoCompras usuario={usuario} produtos={produtos} setProdutos={setProdutos} />
        )}
        {abaAtiva === 'chat' && usuario && <AbaChat usuario={usuario} />}
        {abaAtiva === 'previsoes' && podeVerJIAM && <AbaPrevisoes usuario={usuario} />}
        {abaAtiva === 'rastreamento' && podeVerJIAM && (
          produtoSelecionado ? (
            <AbaRastreamento usuario={usuario} produtoId={produtoSelecionado._id} produto={produtoSelecionado} />
          ) : (
            <div className="text-center p-8 bg-white rounded-xl shadow">
              <p className="text-gray-500">Selecione um produto na aba Produtos primeiro</p>
              <button onClick={() => setAbaAtiva('produtos')} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg">Ver Produtos</button>
            </div>
          )
        )}
        {abaAtiva === 'logistica' && <AbaLogistica />}
        {abaAtiva === 'quemSomos' && <AbaQuemSomos setAbaAtiva={setAbaAtiva} />}
        {abaAtiva === "ajuda" && <AbaAjuda />}
        {abaAtiva === "guia" && <AbaGuiaUtilizacao />}
        {abaAtiva === 'confirmarPagamento' && (
          <ConfirmacaoPagamento comprador={usuario?.nome} carrinho={carrinho} navigateToChat={navigateToChat} />
        )}

        {/* Cadastrar Produto */}
        {abaAtiva === 'cadastrar' && usuario && (usuario.tipo === 'vendedor' || usuario.tipo === 'agricultor') && (
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-lg">
            <div className="bg-green-100 p-3 rounded-lg mb-4 text-sm text-green-800 flex items-center gap-2">
              <span className="text-lg">💡</span> Dica: Seja claro sobre o ponto de retirada ou como a entrega será feita. Isso aumenta a confiança do comprador!
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const formData = new FormData(form);
              const nome = formData.get('nome');
              const preco = parseFloat(formData.get('preco'));
              const quantidade = parseInt(formData.get('quantidade'), 10);
              const unidade = formData.get('unidade');
              const imagem = formData.get('imagem');
              const provincia = formData.get('provincia');
              const municipio = formData.get('municipio');
              const localizacaoDetalhada = formData.get('localizacaoDetalhada');
              const contactos = formData.get('contactos');
              const descricao = formData.get('descricao');
              const nomeVendedor = usuario.nome;

              if (!nome || isNaN(preco) || preco <= 0 || isNaN(quantidade) || quantidade < 0 || !imagem) {
                alert('Preencha todos os campos obrigatórios corretamente.');
                return;
              }

              const termosBanidos = ["carro","carros","automóvel","moto","motorizada","casa","apartamento","roupa","calça","camisa","tênis","sapato","telefone","smartphone","computador","tv","geladeira","sofá","cadeira","relógio","perfume"];
              const textoCompleto = `${nome} ${descricao}`.toLowerCase();
              const contemTermoBanido = termosBanidos.some(termo => textoCompleto.includes(termo));

              if (contemTermoBanido) {
                alert("O produto não está alinhado com a essência do Mercado Yangue. Apenas produtos ligados à agricultura, pesca, criação ou natureza do campo são permitidos.");
                return;
              }

              const envio = new FormData();
              envio.append('nome', nome);
              envio.append('preco', preco);
              envio.append('quantidade', quantidade);
              envio.append('unidade', unidade);
              envio.append('imagem', imagem);
              envio.append('provincia', provincia);
              envio.append('municipio', municipio);
              envio.append('localizacaoDetalhada', localizacaoDetalhada);
              envio.append('contactos', contactos);
              envio.append('descricao', descricao);
              envio.append('nomeVendedor', nomeVendedor);
              envio.append('formaPagamento', JSON.stringify(formaPagamento));

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
                  alert('Erro ao cadastrar produto:\n' + (erro.message || JSON.stringify(erro)));
                }
              } catch (error) {
                alert('Erro de rede ou servidor: ' + error.message);
              }
            }} className="flex flex-col gap-4" encType="multipart/form-data">
              <input type="text" name="nome" required placeholder="Ex: Feijão Catete, Banana da Terra" className="border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              <div className="grid md:grid-cols-2 gap-4">
                <input type="number" name="preco" step="0.01" min="0" required placeholder="Preço (Kz)" className="border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                <div className="flex gap-2">
                  <input type="number" name="quantidade" min="0" required placeholder="Quantidade" className="flex-1 border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                  <select name="unidade" required className="border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                    <option value="kg">Kg</option><option value="l">Litro</option><option value="un">Unidade</option>
                    <option value="caixa">Caixa</option><option value="saco">Saco</option><option value="dúzia">Dúzia</option>
                  </select>
                </div>
              </div>
              <input type="file" name="imagem" accept="image/*" required className="border p-2 rounded-lg" />
              <div className="grid md:grid-cols-2 gap-4">
                <input type="text" name="provincia" placeholder="Província" className="border p-3 rounded-lg" />
                <input type="text" name="municipio" placeholder="Município" className="border p-3 rounded-lg" />
              </div>
              <textarea name="localizacaoDetalhada" rows="2" placeholder="Localização detalhada (bairro, estrada, referência)" className="border p-3 rounded-lg"></textarea>
              <input type="text" name="contactos" placeholder="Contactos (Ex: +244 923 000 000)" className="border p-3 rounded-lg" />
              <FormaPagamentoCampo formaPagamento={formaPagamento} setFormaPagamento={setFormaPagamento} bancosDisponiveis={bancosAngola} />
              <textarea name="descricao" rows="3" placeholder="Descrição detalhada do produto..." className="border p-3 rounded-lg"></textarea>
              <button type="submit" className="bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition shadow-md">Cadastrar Produto</button>
            </form>
          </div>
        )}
      </main>

      <FooterMercadoYangue setAbaAtiva={setAbaAtiva} />
    </div>
  );
}