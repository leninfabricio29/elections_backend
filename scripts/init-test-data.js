#!/usr/bin/env node

/**
 * Script para inicializar datos de prueba en el sistema de elecciones
 * Ejecutar con: node scripts/init-test-data.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let electionId = '';
let candidateIds = [];
let partyIds = [];
let voterIds = [];

// Configuración de datos de prueba
const testData = {
  admin: {
    name: "Administrador Electoral",
    email: "admin@elecciones.com",
    password: "AdminPass123!",
    role: "admin"
  },
  election: {
    name: "Elecciones Estudiantiles 2024",
    description: "Elección de representantes estudiantiles para el período 2024-2025",
    startDate: "2024-12-15T08:00:00Z",
    endDate: "2024-12-15T18:00:00Z",
    qr_code: "https://elecciones.com/qr/estudiantiles2024",
    isByParty: true
  },
  parties: [
    {
      name: "Partido Estudiantil Progresista",
      description: "Enfocados en la innovación y tecnología educativa",
      logo_url: "https://ejemplo.com/logos/pep.png"
    },
    {
      name: "Movimiento Estudiantil Unido",
      description: "Por la unión y el bienestar de todos los estudiantes",
      logo_url: "https://ejemplo.com/logos/meu.png"
    }
  ],
  candidates: [
    {
      name: "Ana García",
      description: "Candidata a Presidenta Estudiantil - PEP",
      partyIndex: 0
    },
    {
      name: "Carlos Mendoza",
      description: "Candidato a Presidente Estudiantil - MEU",
      partyIndex: 1
    },
    {
      name: "María López",
      description: "Candidata Independiente a Presidenta Estudiantil",
      partyIndex: null
    }
  ],
  voters: [
    { cedula: "1234567890", face_url: "https://ejemplo.com/fotos/ana_votante.jpg" },
    { cedula: "0987654321", face_url: "https://ejemplo.com/fotos/carlos_votante.jpg" },
    { cedula: "1122334455", face_url: "https://ejemplo.com/fotos/maria_votante.jpg" },
    { cedula: "5566778899", face_url: "https://ejemplo.com/fotos/jose_votante.jpg" },
    { cedula: "9988776655", face_url: "https://ejemplo.com/fotos/lucia_votante.jpg" }
  ]
};

// Funciones de utilidad
const makeRequest = async (method, endpoint, data = null, useAuth = false) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(useAuth && authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      ...(data ? { data } : {})
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error en ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Funciones principales
async function step1_checkHealth() {
  console.log('🔍 Verificando estado de la API...');
  const health = await makeRequest('GET', '/api/health');
  console.log('✅ API funcionando:', health.message);
}

async function step2_registerAdmin() {
  console.log('👤 Registrando administrador...');
  
  try {
    const response = await makeRequest('POST', '/api/users/register', testData.admin);
    console.log('✅ Administrador registrado:', response.data.name);
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️  Administrador ya existe, continuando...');
    } else {
      throw error;
    }
  }
}

async function step3_login() {
  console.log('🔑 Iniciando sesión...');
  
  const loginData = {
    email: testData.admin.email,
    password: testData.admin.password
  };
  
  const response = await makeRequest('POST', '/api/users/login', loginData);
  authToken = response.data.token;
  console.log('✅ Sesión iniciada correctamente');
}

async function step4_createElection() {
  console.log('🗳️  Creando elección...');
  
  const response = await makeRequest('POST', '/api/elections', testData.election, true);
  electionId = response.data._id;
  console.log('✅ Elección creada:', response.data.name);
}

async function step5_createParties() {
  console.log('🏛️  Creando partidos políticos...');
  
  for (const party of testData.parties) {
    const partyData = { ...party, electionId };
    const response = await makeRequest('POST', '/api/parties', partyData, true);
    partyIds.push(response.data._id);
    console.log('✅ Partido creado:', response.data.name);
    await delay(100);
  }
}

async function step6_createCandidates() {
  console.log('👥 Creando candidatos...');
  
  for (const candidate of testData.candidates) {
    const candidateData = {
      ...candidate,
      electionId,
      partyId: candidate.partyIndex !== null ? partyIds[candidate.partyIndex] : undefined
    };
    delete candidateData.partyIndex;
    
    const response = await makeRequest('POST', '/api/candidates', candidateData, true);
    candidateIds.push(response.data._id);
    console.log('✅ Candidato creado:', response.data.name);
    await delay(100);
  }
}

async function step7_registerVoters() {
  console.log('👤 Registrando votantes...');
  
  // Registro individual del primer votante
  const firstVoter = { ...testData.voters[0], electionId };
  const firstResponse = await makeRequest('POST', '/api/voters', firstVoter, true);
  voterIds.push(firstResponse.data._id);
  console.log('✅ Primer votante registrado individualmente');
  
  // Registro masivo del resto
  if (testData.voters.length > 1) {
    const bulkData = {
      electionId,
      voters: testData.voters.slice(1)
    };
    
    const bulkResponse = await makeRequest('POST', '/api/voters/bulk', bulkData, true);
    bulkResponse.data.successful.forEach(voter => voterIds.push(voter._id));
    console.log(`✅ ${bulkResponse.data.successful.length} votantes registrados masivamente`);
  }
}

async function step8_simulateVoting() {
  console.log('🗳️  Simulando proceso de votación...');
  
  // Simular 3 votos
  const votesToCast = [
    { voterIndex: 0, candidateIndex: 0 }, // Ana García
    { voterIndex: 1, candidateIndex: 1 }, // Carlos Mendoza  
    { voterIndex: 2, candidateIndex: 0 }, // Ana García
  ];
  
  for (const vote of votesToCast) {
    const voteData = {
      voterId: voterIds[vote.voterIndex],
      electionId,
      candidateId: candidateIds[vote.candidateIndex]
    };
    
    await makeRequest('POST', '/api/votes/cast', voteData);
    console.log(`✅ Voto registrado para candidato ${vote.candidateIndex + 1}`);
    await delay(200);
  }
}

async function step9_showResults() {
  console.log('📊 Obteniendo resultados...');
  
  // Dashboard stats
  const dashboardStats = await makeRequest('GET', '/api/dashboard/stats', null, true);
  console.log('📈 Estadísticas del dashboard obtenidas');
  
  // Election results
  const results = await makeRequest('GET', `/api/votes/election/${electionId}/results`);
  console.log('🏆 Resultados de la elección:');
  
  results.data.results.forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.candidateName}: ${result.voteCount} votos (${result.percentage.toFixed(1)}%)`);
  });
  
  console.log(`📊 Participación: ${results.data.summary.participationRate.toFixed(1)}%`);
}

async function showSummary() {
  console.log('\n🎉 ¡DATOS DE PRUEBA INICIALIZADOS EXITOSAMENTE!');
  console.log('═══════════════════════════════════════════════');
  console.log(`🗳️  Elección ID: ${electionId}`);
  console.log(`🏛️  Partidos creados: ${partyIds.length}`);
  console.log(`👥 Candidatos creados: ${candidateIds.length}`);
  console.log(`👤 Votantes registrados: ${voterIds.length}`);
  console.log(`🗳️  Votos emitidos: 3`);
  console.log('');
  console.log('🔗 URLs útiles para probar:');
  console.log(`   Health: ${BASE_URL}/api/health`);
  console.log(`   Dashboard: ${BASE_URL}/api/dashboard/stats`);
  console.log(`   Resultados: ${BASE_URL}/api/votes/election/${electionId}/results`);
  console.log('');
  console.log('🔑 Credenciales de administrador:');
  console.log(`   Email: ${testData.admin.email}`);
  console.log(`   Password: ${testData.admin.password}`);
  console.log(`   Token: ${authToken.substring(0, 20)}...`);
  console.log('');
  console.log('💡 Puedes importar la colección de Postman desde:');
  console.log('   Election_API_Postman_Collection.json');
}

// Función principal
async function initializeTestData() {
  console.log('🚀 INICIALIZANDO DATOS DE PRUEBA');
  console.log('═══════════════════════════════════════════════');
  
  try {
    await step1_checkHealth();
    await step2_registerAdmin();
    await step3_login();
    await step4_createElection();
    await step5_createParties();
    await step6_createCandidates();
    await step7_registerVoters();
    await step8_simulateVoting();
    await step9_showResults();
    await showSummary();
    
  } catch (error) {
    console.error('\n❌ Error durante la inicialización:', error.message);
    console.log('\n💡 Asegúrate de que:');
    console.log('   - El servidor esté ejecutándose (npm run dev)');
    console.log('   - MongoDB esté conectado');
    console.log('   - El puerto 3000 esté disponible');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  initializeTestData();
}

module.exports = {
  initializeTestData,
  testData
};
