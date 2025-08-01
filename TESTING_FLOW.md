# 🗳️ Flujo Completo de Pruebas - Sistema de Elecciones

## 📋 Preparación Inicial

### 1. **Configurar el Entorno**
```bash
# 1. Copiar variables de entorno
cp .env.example .env

# 2. Editar .env con tus configuraciones
# MONGODB_URI=mongodb://localhost:27017/election_db
# JWT_SECRET=tu_clave_secreta_muy_segura_aqui_2024
# PORT=3000

# 3. Instalar dependencias (si no está hecho)
npm install

# 4. Iniciar el servidor
npm run dev
```

### 2. **Verificar que la API esté funcionando**
```http
GET http://localhost:3000/api/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "2025-08-01T...",
  "version": "1.0.0"
}
```

---

## 🚀 FLUJO COMPLETO DE PRUEBAS

### **PASO 1: Registrar Usuario Administrador**

**Request:**
```http
POST http://localhost:3000/api/users/register
Content-Type: application/json

{
  "name": "Administrador Electoral",
  "email": "admin@elecciones.com",
  "password": "AdminPass123!",
  "role": "admin"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": "USER_ID_AQUI",
    "name": "Administrador Electoral",
    "email": "admin@elecciones.com",
    "role": "admin"
  }
}
```

### **PASO 2: Iniciar Sesión**

**Request:**
```http
POST http://localhost:3000/api/users/login
Content-Type: application/json

{
  "email": "admin@elecciones.com",
  "password": "AdminPass123!"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "USER_ID",
      "name": "Administrador Electoral",
      "email": "admin@elecciones.com",
      "role": "admin"
    }
  }
}
```

**⚠️ IMPORTANTE:** Guarda el `token` para usarlo en las siguientes requests.

---

### **PASO 3: Crear una Elección**

**Request:**
```http
POST http://localhost:3000/api/elections
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI

{
  "name": "Elecciones Estudiantiles 2024",
  "description": "Elección de representantes estudiantiles",
  "startDate": "2024-12-15T08:00:00Z",
  "endDate": "2024-12-15T18:00:00Z",
  "qr_code": "https://elecciones.com/qr/estudiantiles2024",
  "isByParty": true
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Elección creada exitosamente",
  "data": {
    "_id": "ELECTION_ID_AQUI",
    "name": "Elecciones Estudiantiles 2024",
    "description": "Elección de representantes estudiantiles",
    "startDate": "2024-12-15T08:00:00.000Z",
    "endDate": "2024-12-15T18:00:00.000Z",
    "qr_code": "https://elecciones.com/qr/estudiantiles2024",
    "isByParty": true,
    "createdBy": "USER_ID"
  }
}
```

**⚠️ IMPORTANTE:** Guarda el `_id` de la elección (ELECTION_ID).

---

### **PASO 4: Crear Partidos Políticos**

**Request 1 - Primer Partido:**
```http
POST http://localhost:3000/api/parties
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI

{
  "electionId": "ELECTION_ID_AQUI",
  "name": "Partido Estudiantil Progresista",
  "description": "Enfocados en la innovación y tecnología",
  "logo_url": "https://ejemplo.com/logos/pep.png"
}
```

**Request 2 - Segundo Partido:**
```http
POST http://localhost:3000/api/parties
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI

{
  "electionId": "ELECTION_ID_AQUI",
  "name": "Movimiento Estudiantil Unido",
  "description": "Por la unión y el bienestar estudiantil",
  "logo_url": "https://ejemplo.com/logos/meu.png"
}
```

**⚠️ IMPORTANTE:** Guarda los IDs de los partidos creados.

---

### **PASO 5: Agregar Candidatos**

**Request 1 - Candidato del Primer Partido:**
```http
POST http://localhost:3000/api/candidates
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI

{
  "electionId": "ELECTION_ID_AQUI",
  "name": "Ana García",
  "description": "Candidata a Presidenta Estudiantil",
  "partyId": "PARTY_ID_1"
}
```

**Request 2 - Candidato del Segundo Partido:**
```http
POST http://localhost:3000/api/candidates
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI

{
  "electionId": "ELECTION_ID_AQUI",
  "name": "Carlos Mendoza",
  "description": "Candidato a Presidente Estudiantil",
  "partyId": "PARTY_ID_2"
}
```

**Request 3 - Candidato Independiente:**
```http
POST http://localhost:3000/api/candidates
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI

{
  "electionId": "ELECTION_ID_AQUI",
  "name": "María López",
  "description": "Candidata Independiente a Presidenta"
}
```

---

### **PASO 6: Registrar Votantes**

**Request 1 - Votante Individual:**
```http
POST http://localhost:3000/api/voters
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI

{
  "electionId": "ELECTION_ID_AQUI",
  "cedula": "1234567890",
  "face_url": "https://ejemplo.com/fotos/votante1.jpg"
}
```

**Request 2 - Registro Masivo:**
```http
POST http://localhost:3000/api/voters/bulk
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI

{
  "electionId": "ELECTION_ID_AQUI",
  "voters": [
    {
      "cedula": "0987654321",
      "face_url": "https://ejemplo.com/fotos/votante2.jpg"
    },
    {
      "cedula": "1122334455",
      "face_url": "https://ejemplo.com/fotos/votante3.jpg"
    },
    {
      "cedula": "5566778899",
      "face_url": "https://ejemplo.com/fotos/votante4.jpg"
    }
  ]
}
```

---

### **PASO 7: Verificar la Configuración**

**Request 1 - Ver la elección completa:**
```http
GET http://localhost:3000/api/elections/ELECTION_ID_AQUI
Authorization: Bearer TU_TOKEN_AQUI
```

**Request 2 - Ver candidatos:**
```http
GET http://localhost:3000/api/candidates/election/ELECTION_ID_AQUI
Authorization: Bearer TU_TOKEN_AQUI
```

**Request 3 - Ver partidos:**
```http
GET http://localhost:3000/api/parties/election/ELECTION_ID_AQUI
Authorization: Bearer TU_TOKEN_AQUI
```

**Request 4 - Ver votantes:**
```http
GET http://localhost:3000/api/voters/election/ELECTION_ID_AQUI
Authorization: Bearer TU_TOKEN_AQUI
```

---

### **PASO 8: Simular Proceso de Votación**

**Request 1 - Buscar votante por cédula (SIN TOKEN):**
```http
GET http://localhost:3000/api/voters/election/ELECTION_ID_AQUI/cedula/1234567890
```

**Request 2 - Verificar estado del votante (SIN TOKEN):**
```http
GET http://localhost:3000/api/votes/voter/VOTER_ID/election/ELECTION_ID_AQUI/status
```

**Request 3 - Emitir voto (SIN TOKEN):**
```http
POST http://localhost:3000/api/votes/cast
Content-Type: application/json

{
  "voterId": "VOTER_ID_AQUI",
  "electionId": "ELECTION_ID_AQUI",
  "candidateId": "CANDIDATE_ID_AQUI"
}
```

**⚠️ NOTA:** Repite el proceso de votación con diferentes votantes y candidatos.

---

### **PASO 9: Ver Resultados y Estadísticas**

**Request 1 - Estadísticas del Dashboard:**
```http
GET http://localhost:3000/api/dashboard/stats
Authorization: Bearer TU_TOKEN_AQUI
```

**Request 2 - Estadísticas de la Elección:**
```http
GET http://localhost:3000/api/elections/ELECTION_ID_AQUI/statistics
Authorization: Bearer TU_TOKEN_AQUI
```

**Request 3 - Resultados Finales (SIN TOKEN):**
```http
GET http://localhost:3000/api/votes/election/ELECTION_ID_AQUI/results
```

**Request 4 - Estadísticas de Votación:**
```http
GET http://localhost:3000/api/votes/election/ELECTION_ID_AQUI/statistics
Authorization: Bearer TU_TOKEN_AQUI
```

**Request 5 - Estadísticas de Partidos:**
```http
GET http://localhost:3000/api/parties/election/ELECTION_ID_AQUI/statistics
Authorization: Bearer TU_TOKEN_AQUI
```

---

## 🧪 **PRUEBAS ADICIONALES**

### **Validaciones de Seguridad:**

**1. Intentar votar dos veces con el mismo votante:**
```http
POST http://localhost:3000/api/votes/cast
Content-Type: application/json

{
  "voterId": "VOTER_ID_QUE_YA_VOTO",
  "electionId": "ELECTION_ID_AQUI",
  "candidateId": "CANDIDATE_ID_AQUI"
}
```

**2. Intentar modificar elección activa:**
```http
PUT http://localhost:3000/api/elections/ELECTION_ID_AQUI
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI

{
  "name": "Nuevo Nombre"
}
```

**3. Intentar acceder sin token:**
```http
GET http://localhost:3000/api/elections
```

### **Filtros y Paginación:**

**1. Elecciones con filtros:**
```http
GET http://localhost:3000/api/elections?status=upcoming&limit=5&page=1
Authorization: Bearer TU_TOKEN_AQUI
```

**2. Votantes con filtros:**
```http
GET http://localhost:3000/api/voters/election/ELECTION_ID_AQUI?hasVoted=true&limit=10
Authorization: Bearer TU_TOKEN_AQUI
```

---

## 📊 **RESPUESTAS ESPERADAS**

### **Dashboard Stats:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalElections": 1,
      "totalCandidates": 3,
      "totalParties": 2,
      "totalVoters": 4,
      "totalVotes": 2,
      "avgParticipation": 50.0
    },
    "electionStates": {
      "upcoming": 1,
      "active": 0,
      "finished": 0
    }
  }
}
```

### **Resultados de Elección:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "candidateId": "...",
        "candidateName": "Ana García",
        "voteCount": 2,
        "percentage": 66.67,
        "position": 1
      },
      {
        "candidateId": "...",
        "candidateName": "Carlos Mendoza",
        "voteCount": 1,
        "percentage": 33.33,
        "position": 2
      }
    ],
    "summary": {
      "totalVotes": 3,
      "participationRate": 75.0
    }
  }
}
```

---

## 🛠️ **HERRAMIENTAS RECOMENDADAS**

### **Postman Collection:**
1. Crea una nueva colección llamada "Election API"
2. Agrega una variable de entorno `{{baseUrl}}` = `http://localhost:3000`
3. Agrega una variable `{{token}}` para el JWT
4. Crea carpetas para cada módulo (Users, Elections, Candidates, etc.)

### **Variables de Entorno en Postman:**
```
baseUrl: http://localhost:3000
token: (se actualizará después del login)
electionId: (se actualizará después de crear elección)
```

### **Script Pre-request en Postman (para el login):**
```javascript
// En el request de login, agregar en "Tests":
if (pm.response.to.have.status(200)) {
    const response = pm.response.json();
    pm.environment.set("token", response.data.token);
}
```

---

## ✅ **CHECKLIST DE PRUEBAS**

- [ ] ✅ API responde en `/api/health`
- [ ] ✅ Registro de usuario funciona
- [ ] ✅ Login devuelve token válido
- [ ] ✅ Crear elección con token
- [ ] ✅ Crear partidos
- [ ] ✅ Agregar candidatos
- [ ] ✅ Registrar votantes
- [ ] ✅ Proceso de votación completo
- [ ] ✅ Verificar estadísticas
- [ ] ✅ Probar validaciones de seguridad
- [ ] ✅ Verificar paginación
- [ ] ✅ Revisar filtros

¡Sigue este flujo paso a paso y tendrás todo el sistema funcionando! 🎉
