const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { Parser } = require('json2csv');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use(session({
  secret: 'segredo-super-seguro',
  resave: false,
  saveUninitialized: false
}));

mongoose.connect('mongodb://localhost:27017/portalSaude');

// MODELOS
const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  password: String,
  tipo: String
}));

const EntradaDiario = mongoose.model('EntradaDiario', new mongoose.Schema({
  usuario: String,
  humor: String,
  nota: String,
  data: { type: Date, default: Date.now }
}));

const Agendamento = mongoose.model('Agendamento', new mongoose.Schema({
  paciente: String,
  servico: String,
  data: Date
}));

const Documento = mongoose.model('Documento', new mongoose.Schema({
  nome: String,
  caminho: String,
  enviadoPor: String,
  data: { type: Date, default: Date.now }
}));

// MIDDLEWARE
function authRequired(req, res, next) {
  if (req.session.user) return next();
  res.status(401).send('Acesso restrito');
}

// ROTAS DE USUÁRIO
app.post('/cadastro', async (req, res) => {
  const { username, password, tipo } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  const user = new User({ username, password: hash, tipo });
  await user.save();
  res.redirect('/login.html');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = { nome: user.username, tipo: user.tipo };
    res.redirect(user.tipo === 'editor' || user.tipo === 'admin' ? '/profissional.html' : '/painel.html');
  } else {
    res.send('Login inválido');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/index.html');
});

app.get('/api/session', (req, res) => {
  if (req.session.user) {
    res.json({ logado: true, nome: req.session.user.nome, tipo: req.session.user.tipo });
  } else {
    res.json({ logado: false });
  }
});

// DIÁRIO DE HUMOR
app.post('/api/diario', authRequired, async (req, res) => {
  const { humor, nota } = req.body;
  const entrada = new EntradaDiario({
    usuario: req.session.user.nome,
    humor,
    nota
  });
  await entrada.save();
  res.send('Entrada salva com sucesso!');
});

app.get('/api/diario', authRequired, async (req, res) => {
  const entradas = await EntradaDiario.find({ usuario: req.session.user.nome }).sort({ data: -1 });
  res.json(entradas);
});

// AGENDAMENTOS
app.post('/api/agendar', authRequired, async (req, res) => {
  const { servico, data } = req.body;
  const novo = new Agendamento({
    paciente: req.session.user.nome,
    servico,
    data: new Date(data)
  });
  await novo.save();
  res.send('Agendamento realizado com sucesso!');
});

app.get('/api/agendamentos', authRequired, async (req, res) => {
  const lista = await Agendamento.find().sort({ data: -1 });
  res.json(lista);
});

// PACIENTES
app.get('/api/pacientes', authRequired, async (req, res) => {
  const pacientes = await User.find({ tipo: { $ne: 'admin' } }, 'username tipo');
  const lista = pacientes.map(p => ({
    nome: p.username,
    tipo: p.tipo,
    email: `${p.username}@exemplo.com`
  }));
  res.json(lista);
});

// DOCUMENTOS
const docStorage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const docUpload = multer({ storage: docStorage });

app.post('/api/documentos', authRequired, docUpload.single('documento'), async (req, res) => {
  const doc = new Documento({
    nome: req.file.originalname,
    caminho: `/uploads/${req.file.filename}`,
    enviadoPor: req.session.user.nome
  });
  await doc.save();
  res.send('Documento enviado com sucesso!');
});

app.get('/api/documentos', authRequired, async (req, res) => {
  const docs = await Documento.find().sort({ data: -1 });
  res.json(docs);
});

// RELATÓRIO CSV
app.get('/api/relatorio/csv', authRequired, async (req, res) => {
  const atendimentos = await Agendamento.find();
  const fields = ['paciente', 'servico', 'data'];
  const parser = new Parser({ fields });
  const csv = parser.parse(atendimentos);

  res.header('Content-Type', 'text/csv');
  res.attachment('relatorio-atendimentos.csv');
  res.send(csv);
});

// INICIAR SERVIDOR
app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
