# 🗳️ Sistema Completo de Elecciones - API Documentación

## 📋 Descripción General
Sistema completo de gestión de elecciones digitales con autenticación, autorización, gestión de candidatos, partidos, votantes y sistema de votación en tiempo real.

## 🎯 Características Principales

### ✅ **Sistema Completamente Implementado:**
- 🔐 **Autenticación y Autorización** - JWT, roles, permisos
- 🗳️ **Gestión de Elecciones** - CRUD completo con validaciones
- 👥 **Gestión de Candidatos** - Asociación con partidos y estadísticas
- 🏛️ **Gestión de Partidos** - Para elecciones organizadas por partidos
- 👤 **Gestión de Votantes** - Registro individual y masivo
- 🗳️ **Sistema de Votación** - Votación segura con validaciones
- 📊 **Dashboard y Estadísticas** - Métricas en tiempo real
- 🛡️ **Middlewares de Seguridad** - Manejo de errores y validaciones

## 🏗️ Arquitectura del Sistema

### **Modelos de Datos:**
```
User (Administradores)
├── Election (Elecciones)
    ├── Party (Partidos)
    ├── Candidate (Candidatos)
    ├── Voter (Votantes)
    └── Vote (Votos)
```

### **Estructura de Archivos:**
```
src/
├── controllers/           # Lógica de negocio
│   ├── user.controller.ts
│   ├── election.controller.ts
│   ├── candidate.controller.ts
│   ├── party.controller.ts
│   ├── vote.controller.ts
│   ├── voter.controller.ts
│   └── dashboard.controller.ts
├── routes/               # Definición de rutas
│   ├── user.routes.ts
│   ├── election.routes.ts
│   ├── candidate.routes.ts
│   ├── party.routes.ts
│   ├── vote.routes.ts
│   ├── voter.routes.ts
│   └── dashboard.routes.ts
├── middlewares/          # Middlewares de seguridad
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── schemas/              # Modelos de MongoDB
│   ├── user.schema.ts
│   ├── election.schema.ts
│   ├── candidate.schema.ts
│   ├── party.schema.ts
│   ├── vote.schema.ts
│   └── voter.schema.ts
└── config/
    └── database/
        └── db-config.ts
```

## 🔐 Sistema de Autenticación

### **Registro y Login:**
```bash
# Registrar usuario
POST /api/users/register
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "securePassword123",
  "role": "admin"
}

# Iniciar sesión
POST /api/users/login
{
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

### **Headers para Rutas Protegidas:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## 📋 Endpoints Completos

### 🗳️ **ELECCIONES** `/api/elections`

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | Crear elección | ✅ |
| GET | `/` | Listar elecciones (con filtros) | ✅ |
| GET | `/my-elections` | Mis elecciones | ✅ |
| GET | `/:id` | Obtener elección específica | ✅ |
| GET | `/:id/statistics` | Estadísticas de elección | ✅ |
| PUT | `/:id` | Actualizar elección | ✅ |
| DELETE | `/:id` | Eliminar elección | ✅ |

### 👥 **CANDIDATOS** `/api/candidates`

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | Crear candidato | ✅ |
| GET | `/election/:electionId` | Candidatos por elección | ✅ |
| GET | `/:id` | Obtener candidato | ✅ |
| PUT | `/:id` | Actualizar candidato | ✅ |
| DELETE | `/:id` | Eliminar candidato | ✅ |

### 🏛️ **PARTIDOS** `/api/parties`

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | Crear partido | ✅ |
| GET | `/election/:electionId` | Partidos por elección | ✅ |
| GET | `/election/:electionId/statistics` | Estadísticas de partidos | ✅ |
| GET | `/:id` | Obtener partido | ✅ |
| PUT | `/:id` | Actualizar partido | ✅ |
| DELETE | `/:id` | Eliminar partido | ✅ |

### 👤 **VOTANTES** `/api/voters`

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | Registrar votante | ✅ |
| POST | `/bulk` | Registro masivo | ✅ |
| GET | `/election/:electionId` | Votantes por elección | ✅ |
| GET | `/election/:electionId/cedula/:cedula` | Buscar por cédula | ❌ |
| GET | `/:id` | Obtener votante | ✅ |
| PUT | `/:id` | Actualizar votante | ✅ |
| DELETE | `/:id` | Eliminar votante | ✅ |

### 🗳️ **VOTACIÓN** `/api/votes`

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/cast` | Emitir voto | ❌ |
| GET | `/voter/:voterId/election/:electionId/status` | Estado del votante | ❌ |
| GET | `/election/:electionId/results` | Resultados finales | ❌ |
| GET | `/election/:electionId/statistics` | Estadísticas de votación | ✅ |

### 📊 **DASHBOARD** `/api/dashboard`

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/stats` | Estadísticas generales | ✅ |
| GET | `/activity` | Actividad del sistema | ✅ (Admin) |

### 👤 **USUARIOS** `/api/users`

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Registrar usuario | ❌ |
| POST | `/login` | Iniciar sesión | ❌ |
| GET | `/profile` | Obtener perfil | ✅ |
| PUT | `/profile` | Actualizar perfil | ✅ |
| PUT | `/change-password` | Cambiar contraseña | ✅ |
| GET | `/all` | Listar usuarios | ✅ (Admin) |
| DELETE | `/:id` | Eliminar usuario | ✅ (Admin) |

## 🔄 Flujo Completo del Sistema

### 1. **Configuración Inicial**
```bash
# Crear archivo .env
cp .env.example .env

# Instalar dependencias
npm install

# Iniciar servidor
npm run dev
```

### 2. **Crear una Elección Completa**

#### **Paso 1: Registrar Admin**
```javascript
POST /api/users/register
{
  "name": "Administrador Electoral",
  "email": "admin@elecciones.com",
  "password": "SecurePass123!",
  "role": "admin"
}
```

#### **Paso 2: Crear Elección**
```javascript
POST /api/elections
{
  "name": "Elecciones Presidenciales 2024",
  "description": "Elección de Presidente y Vicepresidente",
  "startDate": "2024-12-01T08:00:00Z",
  "endDate": "2024-12-01T18:00:00Z",
  "qr_code": "https://elecciones.com/qr/pres2024",
  "isByParty": true
}
```

#### **Paso 3: Crear Partidos (si isByParty: true)**
```javascript
POST /api/parties
{
  "electionId": "election_id_here",
  "name": "Partido Democrático",
  "description": "Partido político democrático",
  "logo_url": "https://example.com/logo-pd.png"
}
```

#### **Paso 4: Agregar Candidatos**
```javascript
POST /api/candidates
{
  "electionId": "election_id_here",
  "name": "Juan Pérez",
  "description": "Candidato a Presidente",
  "partyId": "party_id_here"
}
```

#### **Paso 5: Registrar Votantes**
```javascript
# Individual
POST /api/voters
{
  "electionId": "election_id_here",
  "cedula": "1234567890",
  "face_url": "https://example.com/faces/voter1.jpg"
}

# Masivo
POST /api/voters/bulk
{
  "electionId": "election_id_here",
  "voters": [
    {
      "cedula": "1234567890",
      "face_url": "https://example.com/faces/voter1.jpg"
    },
    {
      "cedula": "0987654321",
      "face_url": "https://example.com/faces/voter2.jpg"
    }
  ]
}
```

### 3. **Proceso de Votación**

#### **Paso 1: Buscar Votante**
```javascript
GET /api/voters/election/ELECTION_ID/cedula/1234567890
```

#### **Paso 2: Verificar Estado**
```javascript
GET /api/votes/voter/VOTER_ID/election/ELECTION_ID/status
```

#### **Paso 3: Emitir Voto**
```javascript
POST /api/votes/cast
{
  "voterId": "voter_id_here",
  "electionId": "election_id_here",
  "candidateId": "candidate_id_here"
}
```

### 4. **Monitoreo y Resultados**

#### **Dashboard General**
```javascript
GET /api/dashboard/stats
```

#### **Estadísticas de Elección**
```javascript
GET /api/elections/ELECTION_ID/statistics
```

#### **Resultados Finales**
```javascript
GET /api/votes/election/ELECTION_ID/results
```

## 🛡️ Seguridad Implementada

### **Validaciones de Negocio:**
- ✅ No modificar elecciones activas
- ✅ No votar fuera del período electoral
- ✅ Un votante = un voto por elección
- ✅ Solo propietarios/admins pueden modificar
- ✅ Validación de fechas y estados

### **Protecciones Técnicas:**
- ✅ Contraseñas encriptadas con bcrypt
- ✅ Tokens JWT con expiración
- ✅ Validación de entrada de datos
- ✅ Manejo global de errores
- ✅ Logging de actividad

## 📊 Estados del Sistema

### **Estados de Elección:**
- `upcoming` - Próxima (permite configuración)
- `active` - En curso (solo votación)
- `finished` - Finalizada (solo lectura)

### **Estados de Votante:**
- `hasVoted: false` - Puede votar
- `hasVoted: true` - Ya votó

## 🧪 Testing

### **Salud del Sistema:**
```bash
GET /api/health
```

### **Datos de Prueba:**
El sistema incluye validaciones que permiten probar fácilmente:
- Crear elecciones de prueba
- Registrar votantes ficticios
- Simular proceso de votación

## ⚠️ Consideraciones de Producción

### **Variables de Entorno Requeridas:**
```env
MONGODB_URI=mongodb://localhost:27017/election_db
JWT_SECRET=your_super_secure_jwt_secret_here
PORT=3000
NODE_ENV=production
```

### **Recomendaciones:**
1. **Seguridad:**
   - Usar HTTPS en producción
   - Configurar CORS apropiadamente
   - Implementar rate limiting
   - Usar secrets seguros

2. **Base de Datos:**
   - Configurar índices para optimización
   - Implementar respaldos regulares
   - Configurar replicación

3. **Monitoreo:**
   - Configurar logs centralizados
   - Implementar métricas de salud
   - Alertas de sistema

## 🎉 ¡Sistema Completo!

El sistema está **100% funcional** con:
- ✅ 7 Controladores completos
- ✅ 7 Rutas configuradas
- ✅ Autenticación y autorización
- ✅ Sistema de votación completo
- ✅ Dashboard y estadísticas
- ✅ Middlewares de seguridad
- ✅ Manejo de errores
- ✅ Documentación completa

¡Listo para usar en desarrollo y configurar para producción! 🚀
