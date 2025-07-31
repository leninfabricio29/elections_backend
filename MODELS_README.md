# Modelos del Sistema de Votaciones

Este documento describe los modelos de datos implementados para el sistema de votaciones electrónicas.

## Arquitectura de Modelos

### 1. **User Schema** (`user.schema.ts`)
Modelo base para todos los usuarios del sistema con discriminadores para diferentes roles.

#### Campos Base:
- `username`: Nombre de usuario único
- `password`: Contraseña hasheada
- `email`: Correo electrónico único
- `full_name`: Nombre completo
- `dateOfBirth`: Fecha de nacimiento (validación +18 años)
- `nationalId`: Cédula de identidad única
- `address`: Dirección completa
- `phone`: Número de teléfono
- `isActive`: Estado activo/inactivo
- `emailVerified`: Verificación de email

#### Discriminadores:
- **AdminModel**: Administradores con niveles y permisos
- **VoterModel**: Votantes con historial de votación
- **CandidateModel**: Candidatos con información de campaña

### 2. **Election Schema** (`election.schema.ts`)
Maneja las elecciones del sistema.

#### Características:
- Validación de fechas
- Estados de elección (pending, active, completed, cancelled)
- Tipos de elección (general, local, primary)
- Registro de votantes habilitados

### 3. **Partido Schema** (`match.schema.ts`)
Gestiona los partidos políticos.

#### Características:
- Información básica del partido
- Ideología política
- Líder y candidatos asociados
- Redes sociales y sitio web
- Estado activo/inactivo

### 4. **Results Schema** (`results.schema.ts`)
Maneja votos y resultados electorales.

#### Modelos incluidos:
- **VoteModel**: Votos individuales con validaciones
- **ElectionResultModel**: Resultados agregados por elección

#### Características:
- Un voto por votante por elección
- Resultados por candidato y partido
- Cálculo de porcentajes
- Votos válidos/inválidos

### 5. **Campaign Schema** (`campaign.schema.ts`)
Gestiona actividades de campaña.

#### Modelos incluidos:
- **CampaignEventModel**: Eventos de campaña
- **CampaignProposalModel**: Propuestas políticas
- **CampaignDonationModel**: Donaciones de campaña

### 6. **System Schema** (`system.schema.ts`)
Funcionalidades del sistema.

#### Modelos incluidos:
- **AuditLogModel**: Logs de auditoría
- **UserSessionModel**: Sesiones de usuario
- **SystemConfigModel**: Configuración del sistema

## Relaciones entre Modelos

```
User (base)
├── AdminModel (discriminator)
├── VoterModel (discriminator)
└── CandidateModel (discriminator)
    └── belongs to → Partido

Election
├── has many → Partido
├── has many → Candidate (User)
└── has one → ElectionResult

Vote
├── belongs to → User (voter)
├── belongs to → Election
├── belongs to → User (candidate)
└── belongs to → Partido

CampaignEvent
├── belongs to → User (candidate)
└── belongs to → Partido

AuditLog
├── belongs to → User
└── tracks → any Entity
```

## Validaciones Implementadas

### Seguridad:
- Emails únicos y válidos
- Usernames únicos (3-50 caracteres)
- Contraseñas mínimo 6 caracteres
- Cédulas únicas
- Edad mínima 18 años

### Integridad Electoral:
- Un voto por votante por elección
- Fechas de elección validadas
- Estados de elección controlados
- Candidatos aprobados por administradores

### Auditoría:
- Timestamps en todas las operaciones
- Logs de auditoría para acciones críticas
- Seguimiento de sesiones de usuario
- Historial de cambios

## Índices de Rendimiento

Cada schema incluye índices optimizados para consultas frecuentes:
- Búsquedas por usuario
- Consultas por fecha
- Filtros por estado
- Agregaciones de votos

## Uso Recomendado

```typescript
import { 
    UserModel, 
    VoterModel, 
    ElectionModel, 
    VoteModel 
} from './schemas';

// Crear un votante
const voter = new VoterModel({
    username: 'juan123',
    email: 'juan@email.com',
    // ... otros campos
});

// Registrar un voto
const vote = new VoteModel({
    voter: voterId,
    election: electionId,
    candidate: candidateId,
    party: partyId
});
```

## Consideraciones de Seguridad

1. **Encriptación**: Las contraseñas deben hashearse antes del almacenamiento
2. **Validación**: Todos los inputs deben validarse en el backend
3. **Auditoría**: Todas las acciones críticas se registran automáticamente
4. **Sesiones**: Control de sesiones con TTL automático
5. **Permisos**: Sistema de permisos granular para administradores
