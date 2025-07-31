import app from './app';

const PORT = process.env.PORT || 5020;

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
