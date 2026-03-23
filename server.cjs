const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'clinica-feliz-secret';

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  console.error('Erro não capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Promise rejeitada:', err);
});

app.use(cors());
app.use(express.json());

// Log de todas as requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// ========== AUTH ==========
app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log('Signup recebido:', req.body);
    const { email, password, full_name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, full_name }
    });
    
    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (error) {
    console.error('Erro no signup:', error);
    res.status(400).json({ message: 'Erro ao criar usuário', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, full_name: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    // TODO: Implementar envio de email de recuperação
    res.json({ message: 'Email de recuperação enviado' });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao enviar email de recuperação' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    // TODO: Implementar validação de token e redefinição de senha
    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao redefinir senha' });
  }
});

// ========== PATIENTS ==========
app.get('/api/patients', authenticateToken, async (req, res) => {
  try {
    const patients = await prisma.patient.findMany();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pacientes' });
  }
});

app.post('/api/patients', authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.date_of_birth && data.date_of_birth !== '') {
      data.date_of_birth = new Date(data.date_of_birth);
    }
    const patient = await prisma.patient.create({ data });
    res.status(201).json(patient);
  } catch (error) {
    console.error('Erro ao criar paciente:', error);
    res.status(400).json({ message: 'Erro ao criar paciente', error: error.message });
  }
});

app.put('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    // Remover campos que não devem ser atualizados
    const { id, created_at, updated_at, appointments, sessions, ...rawData } = req.body;
    
    // Converter date_of_birth para Date se existir
    const data = { ...rawData };
    if (data.date_of_birth && data.date_of_birth !== '') {
      data.date_of_birth = new Date(data.date_of_birth);
    } else if (data.date_of_birth === '' || data.date_of_birth === null) {
      data.date_of_birth = null;
    }
    
    console.log('=== DEBUG UPDATE PATIENT ===');
    console.log('ID:', req.params.id);
    console.log('Dados processados:', data);
    
    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data
    });
    console.log('Paciente atualizado com sucesso');
    res.json(patient);
  } catch (error) {
    console.error('=== ERRO AO ATUALIZAR PACIENTE ===');
    console.error('Mensagem:', error.message);
    console.error('Código:', error.code);
    res.status(400).json({ message: 'Erro ao atualizar paciente', error: error.message, code: error.code });
  }
});

app.delete('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.patient.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: 'Erro ao deletar paciente' });
  }
});

// ========== PROFESSIONALS ==========
app.get('/api/professionals', authenticateToken, async (req, res) => {
  try {
    const professionals = await prisma.professional.findMany({
      where: req.query.active ? { active: true } : undefined
    });
    res.json(professionals);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar profissionais' });
  }
});

app.post('/api/professionals', authenticateToken, async (req, res) => {
  try {
    const professional = await prisma.professional.create({ data: req.body });
    res.status(201).json(professional);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar profissional' });
  }
});

app.put('/api/professionals/:id', authenticateToken, async (req, res) => {
  try {
    const professional = await prisma.professional.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(professional);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar profissional' });
  }
});

app.delete('/api/professionals/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.professional.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: 'Erro ao deletar profissional' });
  }
});

// ========== APPOINTMENTS ==========
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const { date, date_from, date_to } = req.query;
    const appointments = await prisma.appointment.findMany({
      where: {
        ...(date ? { date: new Date(date) } : {}),
        ...(date_from && date_to ? {
          date: { gte: new Date(date_from), lte: new Date(date_to) }
        } : {})
      },
      include: { patient: true, professional: true }
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar agendamentos' });
  }
});

app.get('/api/appointments/count', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    const count = await prisma.appointment.count({
      where: date ? { date: new Date(date) } : {}
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao contar agendamentos' });
  }
});

app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const { patient_id, professional_id, date, time_start, time_end, type, status, notes } = req.body;
    
    // Validação de campos obrigatórios
    if (!patient_id || !professional_id || !date || !time_start || !type || !status) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios faltando', 
        required: ['patient_id', 'professional_id', 'date', 'time_start', 'type', 'status'] 
      });
    }
    
    const data = {
      patient_id,
      professional_id,
      date: new Date(date),
      time_start,
      time_end,
      type,
      status,
      notes
    };
    
    const appointment = await prisma.appointment.create({ data });
    res.status(201).json(appointment);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(400).json({ message: 'Erro ao criar agendamento', error: error.message });
  }
});

app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(appointment);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar agendamento' });
  }
});

app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: 'Erro ao deletar agendamento' });
  }
});

// ========== SESSIONS ==========
app.get('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      include: { patient: true, professional: true }
    });
    const sessionsWithNames = sessions.map(s => ({
      ...s,
      patient_name: s.patient?.full_name ?? null,
      professional_name: s.professional?.full_name ?? null,
    }));
    res.json(sessionsWithNames);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar sessões' });
  }
});

app.get('/api/sessions/count', authenticateToken, async (req, res) => {
  try {
    const count = await prisma.session.count();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao contar sessões' });
  }
});

app.post('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    if (data.date) {
      data.date = new Date(data.date + 'T00:00:00');
    }
    const session = await prisma.session.create({ data });
    res.status(201).json(session);
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    res.status(400).json({ message: 'Erro ao criar sessão', error: error.message });
  }
});

app.put('/api/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(session);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar sessão' });
  }
});

app.delete('/api/sessions/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.session.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: 'Erro ao deletar sessão' });
  }
});

// ========== DASHBOARD ==========
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    const [todayAppointments, totalPatients, totalSessions, todayList] = await Promise.all([
      prisma.appointment.count({ where: { date: targetDate } }),
      prisma.patient.count(),
      prisma.session.count(),
      prisma.appointment.findMany({
        where: { date: targetDate },
        include: { patient: true, professional: true }
      })
    ]);
    
    res.json({ todayAppointments, totalPatients, totalSessions, todayList });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
