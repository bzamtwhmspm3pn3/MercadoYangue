import React, { useState, useEffect } from 'react';
import logo from './assets/logo.png';
import axios from 'axios';

import AbaGestaoVendas from './components/AbaGestaoVendas';
import AbaGestaoCompras from "./components/AbaGestaoCompras";
import ConfirmacaoPagamento from "./components/ConfirmacaoPagamento";
import AbaChat from './components/AbaChat';
import AbaProdutos from "./components/AbaProdutos";
import AbaCarrinho from './components/AbaCarrinho';
import PainelFBI from "./pages/FBI/PainelFBI";


export function Header() {
  return (
    <header>
      <h1>MercadoYangue</h1>
    </header>
  );
}



// Componente AbaQuemSomos
function AbaQuemSomos() {
  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow text-gray-800 space-y-4 leading-relaxed">
      <h2 className="text-3xl font-extrabold text-green-700 text-center mb-4">Bem-vindo ao MercadoYangue</h2>

      <p>
        O <strong>MercadoYangue</strong>, concebido por Venâncio Elavoco Cassova Martins, é uma plataforma digital angolana dedicada a impulsionar o comércio local e nacional, promovendo uma ligação directa e segura entre clientes e vendedores, produtores ou agricultores em todo o território nacional.
      </p>

      <p>
        Com um sistema de <strong>registo de utilizadores</strong> segmentado por perfis (cliente ou vendedor/agricultor), garantimos um ambiente personalizado e funcional. Para os vendedores/agricultores, é exigido o aceite de um <strong>Contrato Digital</strong>, o qual reforça os princípios de responsabilidade, compromisso e integridade nas transacções comerciais.
      </p>

      <h3 className="text-2xl font-bold text-green-600 mt-6">Missão, Visão e Valores</h3>
      <p><strong>Missão:</strong> Conectar os angolanos através de uma plataforma digital que valoriza os produtos locais e promove a sustentabilidade económica.</p>
      <p><strong>Visão:</strong> Ser o maior e mais confiável mercado digital de Angola, com forte presença nas zonas urbanas e rurais, fomentando o empreendedorismo e a inclusão financeira.</p>
      <p><strong>Valores:</strong> Verdade, Transparência, Pontualidade, Responsabilidade, Sustentabilidade, Justiça e Inovação.</p>

      <h3 className="text-2xl font-bold text-green-600 mt-6">Abas e Funcionalidades</h3>
      <ul className="list-disc list-inside">
        <li><strong>Aba Login</strong>: acesso seguro com validação de perfil individual para clientes e vendedores/agricultores.</li>
        <li><strong>Aba Quem Somos</strong>: descreve a origem, missão, visão e os valores que orientam o MercadoYangue.</li>
        <li><strong>Aba Produtos</strong>: navegação eficiente por categoria, província, município e locais populares.</li>
                <li><strong>Aba Carrinho</strong>: controlo personalizado de compras com gestão de quantidades e método de pagamento.</li>
        <li><strong>Aba Batepapo</strong>: canal de comunicação directa, com histórico de mensagens visível e notificações activas.</li>
        <li><strong>Aba Gestão de Vendas</strong>: exclusiva para vendedores/agricultores, inclui relatórios, análises, gráficos, impressão de documentos e recomendações automáticas.</li>
 <li><strong>Aba Gestão de Compras</strong>: exclusiva para Compradores/Clientes, inclui relatórios, análises, gráficos, impressão de documentos e recomendações automáticas.</li>

        <li><strong>Aba Cadastrar Produtos</strong>: ferramenta intuitiva para registo de novos produtos com localização específica e imagens.</li>
      </ul>

      <p>
        Os pagamentos são realizados <strong>directamente entre comprador e vendedor</strong>, utilizando métodos como IBAN, número de conta bancária, Multicaixa Express ou outras soluções adaptadas à realidade angolana.
      </p>

      <h3 className="text-2xl font-bold text-green-600 mt-6">Compromisso e Contrato Digital</h3>
      <p>
        Ao aceitar o <strong>Contrato Digital do Vendedor/Agricultor</strong>, o utilizador compromete-se com:
      </p>
      <ul className="list-disc list-inside">
        <li>Veracidade das informações fornecidas.</li>
        <li>Cumprimento rigoroso dos prazos de entrega.</li>
        <li>Manutenção de comunicação clara, cortês e responsável.</li>
        <li>Pagamento de 0,5% de comissão sobre cada venda à plataforma, conforme indicado:</li>
      </ul>
      <p>
        <strong>Domicílio Bancário:</strong> BAI – Agência Huambo Centro<br />
        <strong>Nome da Conta:</strong> Mercado Yangue Serviços Digitais<br />
        <strong>IBAN:</strong> AO06 0000 0000 1234 5678 9012 3456 7<br />
        <strong>Número da Conta:</strong> 1234567890
      </p>
      <p>
        O repasse da comissão é responsabilidade do vendedor/agricultor e deverá ser feito no prazo máximo de 5 dias úteis após a entrega e confirmação da transacção.
      </p>
      <p>
        O MercadoYangue rege-se pela <strong>boa-fé, legalidade, responsabilidade e respeito ao consumidor</strong>, em conformidade com a Lei nº 15/03 da Defesa do Consumidor e outras normativas aplicáveis.
      </p>
      <p>
        É <strong>proibida</strong> a utilização da plataforma para práticas ilícitas, fraudulentas ou enganosas, sob pena de sanções legais e expulsão definitiva do sistema.
      </p>
      <p>
        Cada vendedor/agricultor é responsável pelo cumprimento das normas sanitárias, comerciais e ambientais, assumindo integralmente os riscos decorrentes da má qualidade, defeito ou vencimento dos produtos.
      </p>
      <p>
        Ao registar-se, o utilizador declara que <strong>leu e concorda integralmente</strong> com todas as cláusulas deste contrato, obrigando-se ao seu fiel cumprimento.
      </p>

      <h3 className="text-2xl font-bold text-green-600 mt-6">Futuro e Crescimento</h3>
      <ul className="list-disc list-inside">
        <li>Integração com pagamentos móveis e terminais POS.</li>
        <li>Versões móveis para Microsoft Store, App Store e Play Store.</li>
        <li>Parcerias com cooperativas, administrações locais e iniciativas juvenis.</li>
        <li>Expansão digital para zonas rurais com acesso simplificado.</li>
        <li>Adição de línguas nacionais: Kimbundu, Umbundu, Kikongo, Tchokwe, e outras em fases futuras.</li>
      </ul>

      <div className="border-t pt-4 mt-6">
        <h3 className="text-xl font-bold">Contacte-nos</h3>
        <p><strong>Email:</strong></p>
        <ul className="list-disc list-inside ml-6">
          <li><a href="mailto:contato@mercadoyangue.co.ao" className="text-blue-600">contato@mercadoyangue.co.ao</a></li>
          <li><a href="mailto:suporte@mercadoyangue.co.ao" className="text-blue-600">suporte@mercadoyangue.co.ao</a></li>
          <li><a href="mailto:info@mercadoyangue.co.ao" className="text-blue-600">info@mercadoyangue.co.ao</a></li>
          <li><a href="mailto:atendimento@mercadoyangue.co.ao" className="text-blue-600">atendimento@mercadoyangue.co.ao</a></li>
        </ul>
        <p className="mt-2"><strong>WhatsApp & Call Center:</strong> <a href="tel:+244920000000" className="text-blue-600">+244 920 000 000</a></p>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        © {new Date().getFullYear()} MercadoYangue Serviços Digitais — Criado por angolanos, para angolanos.
      </p>
    </div>
  );
}

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

      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="w-full p-2 border rounded mb-3"
      >
        <option value="iban">IBAN + Banco</option>
        <option value="numConta">Número de Conta + Banco</option>
        <option value="outras">Outras (Ex: Multicaixa)</option>
      </select>

      {tipo === "iban" && (
        <>
          <input
            type="text"
            placeholder="IBAN"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            className="w-full p-2 border rounded mb-3"
          />
          <select
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
            className="w-full p-2 border rounded mb-3"
          >
            <option value="">Selecione um Banco</option>
            {bancosDisponiveis.map((bancoItem, index) => (
              <option key={index} value={bancoItem}>
                {bancoItem}
              </option>
            ))}
          </select>
        </>
      )}

      {tipo === "numConta" && (
        <>
          <input
            type="text"
            placeholder="Número de Conta"
            value={numConta}
            onChange={(e) => setNumConta(e.target.value)}
            className="w-full p-2 border rounded mb-3"
          />
          <select
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
            className="w-full p-2 border rounded mb-3"
          >
            <option value="">Selecione um Banco</option>
            {bancosDisponiveis.map((bancoItem, index) => (
              <option key={index} value={bancoItem}>
                {bancoItem}
              </option>
            ))}
          </select>
        </>
      )}

      {tipo === "outras" && (
        <>
          <select
            value={opcao}
            onChange={(e) => setOpcao(e.target.value)}
            className="w-full p-2 border rounded mb-3"
          >
            <option value="multicaixa">Multicaixa Express</option>
            <option value="dinheiro">Dinheiro (na entrega)</option>
            <option value="outros">Outro</option>
          </select>

          {opcao === "multicaixa" && (
            <input
              type="tel"
              placeholder="Telefone (Multicaixa)"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full p-2 border rounded mb-3"
            />
          )}
        </>
      )}
    </div>
  );
}



function AbaLoginCadastro({ setUsuario }) {
  const [modo, setModo] = React.useState("login");
  const [tipoCadastro, setTipoCadastro] = React.useState("cliente");

  const [email, setEmail] = React.useState("");
  const [senha, setSenha] = React.useState("");
  const [nome, setNome] = React.useState("");
const [produtosFiltrados, setProdutosFiltrados] = useState([]);

  const [provincia, setProvincia] = React.useState("");
  const [municipio, setMunicipio] = React.useState("");
  const [localizacaoEspecifica, setLocalizacaoEspecifica] = React.useState("");

  const [aceitouContrato, setAceitouContrato] = React.useState(false);

  const limparCampos = () => {
    setEmail("");
    setSenha("");
    setNome("");
    setProvincia("");
    setMunicipio("");
    setLocalizacaoEspecifica("");
    setAceitouContrato(false);
  };

const handleLogin = async () => {
  if (!email || !senha) {
    alert("Preencha email e senha.");
    return;
  }

  try {
    console.log("🔹 Enviando requisição de login...");

    const res = await fetch("https://mercadoyangue-i3in.onrender.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    console.log("🔹 Resposta recebida:", res);

    const data = await res.json(); // só uma vez
    console.log("🔹 JSON parseado:", data);

    if (!res.ok) {
      alert(data.msg || "Erro no login");
      return;
    }

    if (!data.token || !data.usuario || !data.usuario.nome || !data.usuario.tipo) {
      alert("Dados incompletos recebidos do servidor.");
      return;
    }

    const usuarioLogado = {
      nome: data.usuario.nome,
      email: data.usuario.email || email,
      tipo: data.usuario.tipo,
    };

    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(usuarioLogado));

    setUsuario(usuarioLogado);
    alert(`Bem-vindo(a), ${usuarioLogado.nome}!`);

    console.log("✅ Usuário logado com sucesso:", usuarioLogado);

    // 🔹 Testar se limparCampos() existe
    try {
      console.log("🔹 Limpando campos...");
      limparCampos();
    } catch (e) {
      console.error("⚠️ Erro em limparCampos():", e);
    }

    // 🔹 Testar se mudar aba funciona
    try {
      console.log("🔹 Redirecionando para aba produtos...");
      setAbaAtiva("produtos");
    } catch (e) {
      console.error("⚠️ Erro em setAbaAtiva:", e);
    }

  } catch (error) {
    console.error("❌ Erro inesperado no handleLogin:", error);
    alert("Erro inesperado no login. Veja o console.");
  }
};




  const handleCadastro = async () => {
  if (!email || !senha || !nome) {
    alert("Preencha nome, email e senha.");
    return;
  }

  if (tipoCadastro !== "cliente") {
    if (!provincia || !municipio || !localizacaoEspecifica) {
      alert("Preencha todos os campos para vendedor/agricultor.");
      return;
    }

    if (!aceitouContrato) {
      alert("Você deve aceitar o contrato digital para continuar.");
      return;
    }
  }

  const novoUsuario = {
    nome,
    email,
    senha,
    tipo: tipoCadastro,
    ...(tipoCadastro !== "cliente" && {
      provincia,
      municipio,
      localizacaoEspecifica,
      aceitouContrato: true,
    }),
  };

  try {
    const res = await fetch("https://mercadoyangue-i3in.onrender.com/api/auth/cadastro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoUsuario),
    });

    const texto = await res.text();
    console.log("Resposta do servidor (raw):", texto);

    let data;
    try {
      data = JSON.parse(texto);
    } catch {
      alert("Erro inesperado no servidor. Resposta inválida.");
      return;
    }

    if (!res.ok) {
      alert(data?.msg || "Erro no cadastro");
      return;
    }

    alert("Cadastro realizado com sucesso!");
    setModo("login");
    limparCampos();

  } catch (error) {
    console.error("Erro no cadastro:", error);
    alert("Erro ao conectar com o servidor.");
  }
};


  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow-md border border-green-200">
      {/* Modo de Login/Cadastro */}
      <div className="mb-6 flex justify-center space-x-4">
        <button
          onClick={() => setModo("login")}
          className={`px-4 py-2 rounded font-semibold ${
            modo === "login"
              ? "bg-green-700 text-white"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setModo("cadastro")}
          className={`px-4 py-2 rounded font-semibold ${
            modo === "cadastro"
              ? "bg-green-700 text-white"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          Cadastro
        </button>
      </div>

      {modo === "login" && (
        <>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-3 w-full border p-2 rounded"
          />
          <input
  type="password"
  placeholder="Senha"
  value={senha}
  onChange={(e) => setSenha(e.target.value)}
  className="mb-3 w-full border p-2 rounded"
  onKeyDown={(e) => e.key === "Enter" && handleLogin()} // 🔹 Login com Enter
/>

          <button
            onClick={handleLogin}
            className="w-full bg-green-700 text-white py-3 rounded font-semibold hover:bg-green-800"
          >
            Entrar
          </button>
        </>
      )}

      {modo === "cadastro" && (
        <>
          <input
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mb-3 w-full border p-2 rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-3 w-full border p-2 rounded"
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mb-3 w-full border p-2 rounded"
          />

          <div className="mb-3">
            <label className="block mb-1 font-semibold">Tipo de Cadastro</label>
            <select
              value={tipoCadastro}
              onChange={(e) => setTipoCadastro(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="cliente">Cliente</option>
              <option value="vendedor">Vendedor/Agricultor</option>
            </select>
          </div>

          {tipoCadastro !== "cliente" && (
            <>
              <input
                type="text"
                placeholder="Província"
                value={provincia}
                onChange={(e) => setProvincia(e.target.value)}
                className="mb-3 w-full border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Município"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                className="mb-3 w-full border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Localização específica"
                value={localizacaoEspecifica}
                onChange={(e) => setLocalizacaoEspecifica(e.target.value)}
                className="mb-3 w-full border p-2 rounded"
              />
              {(tipoCadastro === "vendedor" || tipoCadastro === "agricultor") && (
                <>
                  <div
  className="mb-4 p-4 border border-green-300 rounded bg-green-50 max-h-60 overflow-y-auto text-sm text-gray-800"
  id="contrato-digital"
>
  <h2 className="text-lg font-bold mb-4 text-green-800 text-center">
    Contrato Digital do Vendedor/Agricultor – MercadoYangue
  </h2>

  <p>
    Ao efectuar o registo como vendedor ou agricultor na plataforma Mercado Yangue, o utilizador compromete-se a fornecer unicamente informações verdadeiras e actualizadas, garantindo a veracidade dos dados pessoais e comerciais submetidos, bem como a qualidade e origem dos produtos anunciados.
  </p>

  <p>
    O utilizador declara que cumprirá rigorosamente os prazos acordados para a entrega dos produtos vendidos, bem como manterá uma comunicação clara, cortês e responsável com os compradores, zelando pela satisfação e confiança em todas as transacções realizadas através da plataforma.
  </p>

  <p>
    Fica estabelecido que sobre cada produto vendido será aplicada uma comissão de 0,5% (zero virgula cinco por cento) sobre o valor total da venda, destinada à manutenção e desenvolvimento da plataforma Mercado Yangue.
  O pagamento da comissão devida à plataforma Mercado Yangue será realizado por iniciativa e responsabilidade exclusiva do vendedor ou agricultor, através das coordenadas bancárias abaixo indicadas:  
  <br />
  <strong>Domicílio Bancário:</strong> Banco Angolano de Investimeot (BAI) – Agência Huambo Centro  
  <br />
  <strong>Nome da Conta:</strong> Mercado Yangue Serviços Digitais  
  <br />
  <strong>IBAN:</strong> AO06 0000 0000 1234 5678 9012 3456 7  
  <br />
  <strong>Número da Conta:</strong> 1234567890  
</p>

<p>
  Ressalta-se que a comissão será automaticamente estimada no momento da transação, porém o repasse do valor correspondente ao vendedor/agricultor será efetuado pelo próprio, observando as condições estabelecidas nesta plataforma.
</p>

<p>
  O prazo máximo para o repasse do valor líquido devido a Plataforma, é de 5 (cinco) dias úteis contados a partir da confirmação da transacção e da entrega do produto ao comprador, salvo ocorrência de impedimentos devidamente justificados e comunicados previamente à plataforma.
</p>

  <p>
    O uso da plataforma rege-se pelos princípios da boa-fé, honestidade, transparência e respeito às normas legais vigentes na República de Angola, incluindo, mas não se limitando, à Lei nº 15/03 sobre a Defesa do Consumidor e demais legislação aplicável ao comércio electrónico e protecção de dados pessoais.
  </p>

  <p>
    É expressamente proibida a utilização da plataforma para fins ilícitos, fraudulentos, enganosos ou que violem direitos de terceiros. O incumprimento destas disposições poderá resultar na suspensão temporária ou cancelamento definitivo do acesso do utilizador, sem prejuízo das medidas legais cabíveis, incluindo responsabilização civil e criminal.
  </p>

  <p>
    O vendedor/agricultor compromete-se a respeitar as normas sanitárias, ambientais e comerciais aplicáveis, respondendo integralmente por eventuais danos ou prejuízos causados por produtos defeituosos, vencidos ou em desacordo com as especificações anunciadas.
  </p>

  <p>
    Ao assinalar a opção de aceite do presente contrato, o utilizador declara, para todos os efeitos legais, que leu, compreendeu, aceitou e concordou integralmente com todos os termos e condições ora estabelecidos, obrigando-se ao seu fiel cumprimento.
  </p>
</div>

                  {/* Botão para imprimir o contrato */}
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        const conteudo = document.getElementById("contrato-digital");
                        if (!conteudo) return;
                        const printWindow = window.open("", "Print", "width=600,height=600");
                        printWindow.document.write(`<html><head><title>Contrato Digital</title></head><body>${conteudo.innerHTML}</body></html>`);
                        printWindow.document.close();
                        printWindow.focus();
                        printWindow.print();
                        printWindow.close();
                      }}
                      className="text-green-700 underline mb-2"
                    >
                      Imprimir Contrato
                    </button>
                  </div>

                  <label className="inline-flex items-center mb-6 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aceitouContrato}
                      onChange={(e) => setAceitouContrato(e.target.checked)}
                      className="form-checkbox h-5 w-5 text-green-600"
                    />
                    <span className="ml-2 text-gray-700">
                      Li e aceito o{" "}
                      <a
                        href="#contrato-digital"
                        className="text-green-600 underline"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById("contrato-digital")?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        contrato digital
                      </a>
                      .
                    </span>
                  </label>
                </>
              )}
            </>
          )}

          <button
            onClick={handleCadastro}
            className="w-full bg-green-700 text-white py-3 rounded font-semibold hover:bg-green-800"
          >
            Cadastrar
          </button>
        </>
      )}
    </div>
  );
}

// COMPONENTE PRINCIPAL

// Antes do componente App
const usuarioInicial = null;

export default function App() {
  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  // 🔹 Estado do usuário (busca no localStorage se já existe)
  const [usuario, setUsuario] = useState(() => {
    const usuarioSalvo = localStorage.getItem("usuario");
    return usuarioSalvo ? JSON.parse(usuarioSalvo) : usuarioInicial;
  });

  // 🔹 Estado da aba ativa (sempre começa em "produtos")
  const [abaAtiva, setAbaAtiva] = useState(() => {
    return "produtos";
  });

  const [mostrarPainelFBI, setMostrarPainelFBI] = useState(false);
 const [formaPagamento, setFormaPagamento] = useState({
  tipo: "iban", // ou "" vazio, para forçar escolha do usuário
  iban: "",
  numConta: "",
  banco: "",
  opcao: "multicaixa",
  telefone: "",
});

useEffect(() => {
  localStorage.setItem("abaAtiva", abaAtiva);
}, [abaAtiva]);


useEffect(() => {
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
}, [carrinho]);

useEffect(() => {
  const salvo = localStorage.getItem("carrinho");
  if (salvo) setCarrinho(JSON.parse(salvo));
}, []);



useEffect(() => {
  axios
    .get("https://mercadoyangue-i3in.onrender.com/api/produtos")
    .then((response) => {
      const dados = response.data;
      if (Array.isArray(dados)) {
        setProdutos(dados);
        setProdutosFiltrados(dados);
      } else {
        console.warn("Resposta da API não é um array:", dados);
        setProdutos([]);
        setProdutosFiltrados([]);
      }
    })
    .catch((error) => {
      console.error("Erro ao buscar produtos:", error.response?.data?.msg || error.message);
      setProdutos([]);
      setProdutosFiltrados([]);
    });
}, []);


useEffect(() => {
  const handleKeyDown = (e) => {
    if (
      e.ctrlKey &&
      e.shiftKey &&
      e.key.toLowerCase() === "y" &&
      usuario?.email === "venanciomartinse@gmail.com"
    ) {
      setMostrarPainelFBI((prev) => !prev);
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [usuario]);


const navigateToChat = (comprador, vendedor, mensagem) => {
  localStorage.setItem("mensagemPreChat", JSON.stringify({
    vendedor,
    mensagem,
    de: comprador
  }));
  setAbaAtiva("chat");
};


const enviarMensagemChat = (vendedor, mensagem) => {
  if (!vendedor || !mensagem) {
    console.warn("Vendedor ou mensagem não informados para envio de chat");
    return;
  }

  // Exemplo simples: armazenar mensagem no localStorage, na chave específica do vendedor
  const chatKey = `chat_${vendedor}`;
  const mensagensAnteriores = JSON.parse(localStorage.getItem(chatKey)) || [];

  const novaMensagem = {
    texto: mensagem,
    data: new Date().toISOString(),
    de: 'cliente', // ou 'sistema', pode adaptar conforme necessidade
  };

  localStorage.setItem(chatKey, JSON.stringify([...mensagensAnteriores, novaMensagem]));

  console.log(`Mensagem enviada para ${vendedor}: ${mensagem}`);
};


const adicionarNoCarrinho = (produto) => {
  if (!usuario || usuario.tipo !== 'cliente') {
    alert('Você precisa estar logado como cliente para adicionar ao carrinho.');
    setAbaAtiva('login');
    return;
  }

  // Atualizar carrinho
  setCarrinho((prev) => {
    const existe = prev.find((item) => item._id === produto._id);
    if (existe) {
      return prev.map((item) =>
        item._id === produto._id ? { ...item, quantidade: item.quantidade + 1 } : item
      );
    }
    return [...prev, { ...produto, quantidade: 1 }];
  });

  // Atualizar estoque de produtos localmente
  setProdutos((prev) =>
    prev.map((item) =>
      item._id === produto._id && item.quantidade > 0
        ? { ...item, quantidade: item.quantidade - 1 }
        : item
    )
  );

  setProdutosFiltrados((prev) =>
    prev.map((item) =>
      item._id === produto._id && item.quantidade > 0
        ? { ...item, quantidade: item.quantidade - 1 }
        : item
    )
  );

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

  const removerDoCarrinho = (produtoId) => {
    const produtoNoCarrinho = carrinho.find(p => p._id === produtoId);
    if (!produtoNoCarrinho) return;

    setCarrinho(prev => prev.filter(p => p._id !== produtoId));

    // restaurar estoque local
    setProdutos(prev =>
      prev.map(item =>
        item._id === produtoId
          ? { ...item, quantidade: item.quantidade + produtoNoCarrinho.quantidade }
          : item
      )
    );
    setProdutosFiltrados(prev =>
      prev.map(item =>
        item._id === produtoId
          ? { ...item, quantidade: item.quantidade + produtoNoCarrinho.quantidade }
          : item
      )
    );
  };                                                    


  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-green-800 py-4 shadow-lg text-white flex justify-between items-center px-6">
        <h1 className="text-3xl font-bold">MercadoYangue</h1>
        <div>
          {!usuario ? (
            <button
              onClick={() => setAbaAtiva('login')}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition"
            >
              Login/Cadastro
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <span>Olá, {usuario.nome}</span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <nav className="bg-green-200 py-2 px-6 flex gap-6 text-green-900 font-semibold">
        <button
          onClick={() => setAbaAtiva('produtos')}
          className={`hover:underline ${abaAtiva === 'produtos' ? 'underline' : ''}`}
        >
          Produtos
        </button>

        {usuario?.tipo === 'cliente' && (
          <button
            onClick={() => setAbaAtiva('carrinho')}
            className={`hover:underline ${abaAtiva === 'carrinho' ? 'underline' : ''}`}
          >
            Carrinho
          </button>
        )}

{(usuario?.tipo === 'vendedor' || usuario?.tipo === 'agricultor') && (
  <button
    onClick={() => setAbaAtiva('gestao')}
    className={`hover:underline ${abaAtiva === 'gestao' ? 'underline' : ''}`}
  >
    Gestão de Vendas
  </button>
)}

{usuario?.tipo === 'cliente' && (
  <button
    onClick={() => setAbaAtiva('gestao-compras')}
    className={`hover:underline ${abaAtiva === 'gestao-compras' ? 'underline' : ''}`}
  >
    Gestão de Compras
  </button>
)}


{usuario && (
  <button
    onClick={() => setAbaAtiva('chat')}
    className={`hover:underline ${abaAtiva === 'chat' ? 'underline' : ''}`}
  >
    Bate-Papo
  </button>
)}

        {(usuario?.tipo === 'vendedor' || usuario?.tipo === 'agricultor') && (
          <button
            onClick={() => setAbaAtiva('cadastrar')}
            className={`hover:underline ${abaAtiva === 'cadastrar' ? 'underline' : ''}`}
          >
            Cadastrar Produto
          </button>
        )}

        <button
          onClick={() => setAbaAtiva('quemSomos')}
          className={`hover:underline ${abaAtiva === 'quemSomos' ? 'underline' : ''}`}
        >
          Quem Somos
        </button>
      </nav>

      <main className="p-6">
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
  navigateToChat={navigateToChat} // 
/>

)}


{abaAtiva === 'confirmarPagamento' && (
  <AuthProvider>
    <ConfirmacaoPagamentoProtegido
      comprador={usuario?.nome}
      carrinho={carrinho}
      navigateToChat={navigateToChat}
    />
  </AuthProvider>
)}

        {abaAtiva === 'login' && !usuario && (
  <AbaLoginCadastro 
    setUsuario={setUsuario} 
    setAbaAtiva={setAbaAtiva} 
  />
)}


{abaAtiva === 'gestao' &&
  usuario &&
  (usuario.tipo === 'vendedor' || usuario.tipo === 'agricultor') && (
    <AbaGestaoVendas
      usuario={usuario}
      produtos={produtos}
      setProdutos={setProdutos}
    />
)}

{abaAtiva === 'gestao-compras' &&
  usuario?.tipo === 'cliente' && (
    <AbaGestaoCompras
      usuario={usuario}
      produtos={produtos}
      setProdutos={setProdutos}
    />
)}

{abaAtiva === 'chat' && usuario && (
  <AbaChat usuario={usuario} />
)}



        {abaAtiva === 'quemSomos' && <AbaQuemSomos />}

        {produtoSelecionado && (
          <AbaDetalhesProduto
            produto={produtoSelecionado}
            setProdutoSelecionado={setProdutoSelecionado}
            adicionarNoCarrinho={adicionarNoCarrinho}
          />
        )}

        {abaAtiva === 'cadastrar' && usuario && (usuario.tipo === 'vendedor' || usuario.tipo === 'agricultor') && (
  <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow text-gray-800">
    <h2 className="text-2xl font-bold mb-4">Cadastrar Produto</h2>


{abaAtiva === 'cadastrar' && usuario && (usuario.tipo === 'vendedor' || usuario.tipo === 'agricultor') && (
  <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow text-gray-800">
    <h2 className="text-2xl font-bold mb-4">Cadastrar Produto</h2>

<div className="container mx-auto p-4">
<form
  onSubmit={async (e) => {
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
      alert('Por favor, preencha todos os campos obrigatórios corretamente.');
      return;
    }

const termosBanidos = [
  "carro", "carros", "automóvel", "moto", "motorizada", "casa", "apartamento", "roupa", "calça", "camisa", "tênis", "sapato", "telefone", "smartphone", "computador", "tv", "geladeira", "sofá", "cadeira", "relógio", "perfume"
];

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
 // ✅ modo novo

    try {
      const token = localStorage.getItem('token');

      const response = await fetch("https://mercadoyangue-i3in.onrender.com/api/produtos", {
        method: 'POST',
        body: envio,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Produto cadastrado com sucesso!');
        form.reset();
      } else {
        const erro = await response.json();
        console.error('Erro detalhado:', erro);
alert('Erro ao cadastrar produto:\n' + (erro.message || JSON.stringify(erro)));

      }
    } catch (error) {
      alert('Erro de rede ou servidor: ' + error.message);
    }
  }}
  className="flex flex-col gap-4"
>
  <label className="flex flex-col">
    Nome do Produto:
    <input
      type="text"
      name="nome"
      required
      className="border border-gray-300 p-2 rounded"
    />
  </label>

  <label className="flex flex-col">
    Preço:
    <input
      type="number"
      name="preco"
      step="0.01"
      min="0"
      required
      className="border border-gray-300 p-2 rounded"
    />
  </label>

  <label className="flex flex-col">
  Quantidade:
  <div className="flex gap-2">
    <input
      type="number"
      name="quantidade"
      min="0"
      required
      className="border border-gray-300 p-2 rounded flex-1"
    />
    <select
      name="unidade"
      required
      className="border border-gray-300 p-2 rounded"
    >
      <option value="">Selecionar unidade</option>
      {/* Agricultura */}
      <option value="kg">Kg</option>
      <option value="g">g</option>
      <option value="t">Tonelada</option>
      <option value="l">Litro</option>
      <option value="ml">Mililitro</option>
      <option value="m²">Metro²</option>
      <option value="ha">Hectare</option>
      <option value="un">Unidade</option>
      <option value="caixa">Caixa</option>
      <option value="saco">Saco</option>
      <option value="dúzia">Dúzia</option>
      {/* Pecuária */}
      <option value="cabeça">Cabeça (gado)</option>
      {/* Silvicultura */}
      <option value="m³">Metro cúbico</option>
      <option value="tronco">Tronco</option>
      <option value="lenha">Lenha</option>
      <option value="pedaço">Pedaço</option>
      <option value="rede">Rede</option>
      {/* Pesca */}
      <option value="outra">Outra</option>
    </select>
  </div>
</label>

  <label className="flex flex-col">
    Imagem:
    <input
      type="file"
      name="imagem"
      accept="image/*"
      required
      className="border border-gray-300 p-2 rounded"
    />
  </label>

  <label className="flex flex-col">
    Província:
    <input
      type="text"
      name="provincia"
      className="border border-gray-300 p-2 rounded"
    />
  </label>

  <label className="flex flex-col">
    Município:
    <input
      type="text"
      name="municipio"
      className="border border-gray-300 p-2 rounded"
    />
  </label>

  <label className="flex flex-col">
    Localização Detalhada:
    <textarea
      name="localizacaoDetalhada"
      rows="3"
      className="border border-gray-300 p-2 rounded"
    ></textarea>
  </label>

  <label className="flex flex-col">
    Contactos:
    <input
      type="text"
      name="contactos"
      className="border border-gray-300 p-2 rounded"
    />
  </label>

  <label className="flex flex-col">
    Forma de Pagamento:
    <FormaPagamentoCampo
      formaPagamento={formaPagamento}
      setFormaPagamento={setFormaPagamento}
      bancosDisponiveis={bancosAngola}
    />
  </label>

  <label className="flex flex-col">
    Descrição:
    <textarea
      name="descricao"
      rows="3"
      className="border border-gray-300 p-2 rounded"
    ></textarea>
  </label>

  <label className="flex flex-col">
    Nome do Vendedor:
    <input
      type="text"
      name="nomeVendedor"
      value={usuario.nome}
      readOnly
      className="border border-gray-300 p-2 rounded bg-gray-100 cursor-not-allowed"
    />
  </label>

  <button
    type="submit"
    className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
  >
    Cadastrar Produto
  </button>
</form>    
  </div>
)}

</main>
</div>
);
}




