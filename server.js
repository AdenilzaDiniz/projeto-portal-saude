const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { Parser } = require('json2csv');
const path = require('path');

const app = express();

// Conexão com MongoDB
mongoose.connect('mongodb://localhost:27017/portalSaude', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use(session({
  secret: 'segredo-super-seguro',
  resave: false,
  saveUninitialized: false
}));

// Middleware de autenticação
function authRequired(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.status(401).send('Acesso não autorizado');
  }
}

// MODELOS
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  tipo: String
});
const User = mongoose.model('User', UserSchema);

const AgendamentoSchema = new mongoose.Schema({
  paciente: String,
  servico: String,
  data: Date
});
const Agendamento = mongoose.model('Agendamento', AgendamentoSchema);

const DocumentoSchema = new mongoose.Schema({
  nome: String,
  caminho: String,
  enviadoPor: String,
  data: { type: Date, default: Date.now }
});
const Documento = mongoose.model('Documento', DocumentoSchema);

// ROTAS

// Agendamentos
app.get('/api/agendamentos', authRequired, async (req, res) => {
  const lista = await Agendamento.find().sort({ data: -1 });
  res.json(lista);
});

// Lista de pacientes
app.get('/api/pacientes', authRequired, async (req, res) => {
  const pacientes = await User.find({ tipo: { $ne: 'admin' } }, 'username tipo');
  const lista = pacientes.map(p => ({
    nome: p.username,
    tipo: p.tipo,
    email: `${p.username}@exemplo.com`
  }));
  res.json(lista);
});

// Upload de documentos
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

// Exportação CSV
app.get('/api/relatorio/csv', authRequired, async (req, res) => {
  const atendimentos = await Agendamento.find();
  const fields = ['paciente', 'servico', 'data'];
  const parser = new Parser({ fields });
  const csv = parser.parse(atendimentos);

  res.header('Content-Type', 'text/csv');
  res.attachment('relatorio-atendimentos.csv');
  res.send(csv);
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
app.get('/painel.html', authRequired, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'painel.html'));
});
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});
app.get('/api/usuario', authRequired, (req, res) => {
  res.json({ nome: req.session.user.nome, tipo: req.session.user.tipo });
});
