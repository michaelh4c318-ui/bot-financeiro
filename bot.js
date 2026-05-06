// BOT FINANCEIRO COMPLETO PARA WHATSAPP // Funções: // - Entrada e saída diária // - Categorias // - Histórico // - Relatório mensal detalhado // - Geração de planilha (.csv)

const { Client, LocalAuth } = require('whatsapp-web.js'); const qrcode = require('qrcode-terminal'); const fs = require('fs'); const cron = require('node-cron');

const DB_FILE = 'dados.json';

let dados = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE)) : { entradas: [], saidas: [] };

function salvar() { fs.writeFileSync(DB_FILE, JSON.stringify(dados, null, 2)); }

function formatarData(d) { return new Date(d).toLocaleDateString('pt-BR'); }

function gerarRelatorioMensalDetalhado() { const agora = new Date(); const mes = agora.getMonth(); const ano = agora.getFullYear();

const registros = [];

dados.entradas.forEach(e => { const d = new Date(e.data); if (d.getMonth() === mes && d.getFullYear() === ano) { registros.push({ tipo: 'Entrada', ...e }); } });

dados.saidas.forEach(s => { const d = new Date(s.data); if (d.getMonth() === mes && d.getFullYear() === ano) { registros.push({ tipo: 'Saída', ...s }); } });

let texto = '📊 RELATÓRIO DETALHADO DO MÊS\n\n';

registros.forEach(r => { texto += ${r.tipo} | R$ ${r.valor} | ${r.categoria || '-'} | ${r.descricao} | ${formatarData(r.data)}\n; });

return texto; }

function gerarCSV() { let csv = 'Tipo,Valor,Categoria,Descricao,Data\n';

[...dados.entradas.map(e => ({ tipo: 'Entrada', ...e })), ...dados.saidas.map(s => ({ tipo: 'Saída', ...s }))] .forEach(r => { csv += ${r.tipo},${r.valor},${r.categoria || ''},${r.descricao},${formatarData(r.data)}\n; });

fs.writeFileSync('relatorio.csv', csv); }

const client = new Client({ authStrategy: new LocalAuth() });

client.on('qr', qr => { qrcode.generate(qr, { small: true }); });

client.on('ready', () => { console.log('Bot pronto!'); });

client.on('message', async msg => { const texto = msg.body.toLowerCase();

if (texto.startsWith('entrada')) { const partes = texto.split(' '); const valor = parseFloat(partes[1]); const descricao = partes.slice(2).join(' ');

dados.entradas.push({ valor, descricao, data: new Date() });
salvar();

msg.reply(`✅ Entrada registrada: R$ ${valor}`);

}

else if (texto.startsWith('saida') || texto.startsWith('saída')) { const partes = texto.split(' '); const valor = parseFloat(partes[1]); const categoria = partes[2] || 'outros'; const descricao = partes.slice(3).join(' ');

dados.saidas.push({ valor, categoria, descricao, data: new Date() });
salvar();

msg.reply(`📤 Saída registrada: R$ ${valor}`);

}

else if (texto === 'resumo') { const entradas = dados.entradas.reduce((a,b)=>a+b.valor,0); const saidas = dados.saidas.reduce((a,b)=>a+b.valor,0); const saldo = entradas - saidas;

msg.reply(`📊 Resumo:\nEntradas: R$ ${entradas}\nSaídas: R$ ${saidas}\nSaldo: R$ ${saldo}`);

}

else if (texto === 'relatorio') { msg.reply(gerarRelatorioMensalDetalhado()); }

else if (texto === 'planilha') { gerarCSV(); msg.reply('📁 Planilha gerada: relatorio.csv (na pasta do bot)'); }

else if (texto === 'limpar') { dados = { entradas: [], saidas: [] }; salvar(); msg.reply('❌ Dados apagados'); }

else if (texto === 'ajuda') { msg.reply(📌 Comandos:\n\nEntrada 1000 salario\nSaida 50 comida almoço\n\nResumo\nRelatorio\nPlanilha\nLimpar); } });

// Envio automático mensal cron.schedule('0 8 1 * *', async () => { const chats = await client.getChats(); const chat = chats.find(c => !c.isGroup);

if (chat) { chat.sendMessage(gerarRelatorioMensalDetalhado()); }

gerarCSV(); });

client.initialize();