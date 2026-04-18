const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const initDb = require('./data/initDb');
const examTemplateRoutes = require('./routes/examTemplateRoutes');
const examRoutes = require('./routes/examRoutes');
const examAutoRoutes = require('./routes/examAutoRoutes');
const examSessionRoutes = require('./routes/examSessionRoutes');
const examResultRoutes = require('./routes/examResultRoutes');
const questionRoutes = require('./routes/questionRoutes');
const userRoutes = require('./routes/userRoutes');
const systemLogRoutes = require('./routes/systemLogRoutes');
const sessionParticipantRoutes = require('./routes/sessionParticipantRoutes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/exam-templates', examTemplateRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/exams', examAutoRoutes); // /api/exams/auto-generate
app.use('/api/exam-sessions', examSessionRoutes);
app.use('/api/exam-results', examResultRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);

app.use('/api/session-participants', sessionParticipantRoutes);
app.use('/api/system-logs', systemLogRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const port = process.env.PORT || 3001;

initDb()
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`Backend server is running on http://localhost:${port}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please stop the process using it or set a different PORT in your .env file.`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
