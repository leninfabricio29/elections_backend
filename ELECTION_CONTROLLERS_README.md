# Controladores de Elecciones y Candidatos - API de Elecciones

## Descripción
Este documento describe los controladores implementados para la gestión de elecciones y candidatos con funcionalidades completas de CRUD, estadísticas y validaciones de seguridad.

## Características Implementadas

### 🗳️ **Gestión de Elecciones**
- Crear, leer, actualizar y eliminar elecciones
- Control de acceso basado en propietario/admin
- Validaciones de fechas y estados
- Estadísticas completas de votación
- Paginación en listados

### 👥 **Gestión de Candidatos**
- CRUD completo de candidatos
- Asociación con partidos políticos
- Validaciones de integridad
- Estadísticas de votos por candidato

### 🛡️ **Seguridad y Validaciones**
- Control de permisos por propietario/admin
- Protección contra modificaciones durante elección activa
- Validación de fechas y estados
- Prevención de eliminación con datos relacionados

## 📋 Endpoints de Elecciones

### **POST /api/elections**
Crear una nueva elección
```json
{
  "name": "Elecciones Presidenciales 2024",
  "description": "Elecciones para presidente y vicepresidente",
  "startDate": "2024-12-01T09:00:00Z",
  "endDate": "2024-12-01T18:00:00Z",
  "qr_code": "https://example.com/qr/election-123",
  "isByParty": true
}
```

### **GET /api/elections**
Obtener todas las elecciones con paginación y filtros
- Query params: `status` (upcoming/active/finished), `limit`, `page`

### **GET /api/elections/my-elections**
Obtener elecciones creadas por el usuario autenticado

### **GET /api/elections/:electionId**
Obtener una elección específica con candidatos y estadísticas

### **GET /api/elections/:electionId/statistics**
Obtener estadísticas completas de una elección
- Votos por candidato
- Votos por partido (si aplica)
- Porcentajes y participación

### **PUT /api/elections/:electionId**
Actualizar una elección (solo antes de que inicie)

### **DELETE /api/elections/:electionId**
Eliminar una elección (solo antes de que inicie y sin votos)

## 📋 Endpoints de Candidatos

### **POST /api/candidates**
Crear un nuevo candidato
```json
{
  "electionId": "64f123...",
  "name": "Juan Pérez",
  "description": "Candidato a Presidente",
  "partyId": "64f456..." // opcional
}
```

### **GET /api/candidates/election/:electionId**
Obtener todos los candidatos de una elección con estadísticas

### **GET /api/candidates/:candidateId**
Obtener un candidato específico con estadísticas

### **PUT /api/candidates/:candidateId**
Actualizar un candidato (solo antes de que inicie la elección)

### **DELETE /api/candidates/:candidateId**
Eliminar un candidato (solo antes de que inicie y sin votos)

## 🔐 Autenticación y Autorización

### Headers Requeridos
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Niveles de Acceso

#### **Usuario Autenticado**
- Ver todas las elecciones
- Ver candidatos y estadísticas
- Crear elecciones
- Gestionar sus propias elecciones

#### **Creador de Elección**
- Modificar/eliminar su elección
- Gestionar candidatos de su elección
- Ver estadísticas detalladas

#### **Administrador**
- Acceso completo a todas las elecciones
- Modificar/eliminar cualquier elección
- Gestionar cualquier candidato

## 📊 Funcionalidades de Estadísticas

### Estadísticas Generales
- Total de votos
- Total de candidatos
- Total de partidos
- Estado de la elección
- Tasa de participación

### Estadísticas por Candidato
- Número de votos
- Porcentaje de votos
- Ranking por votos

### Estadísticas por Partido (si aplica)
- Votos totales del partido
- Porcentaje del total
- Candidatos del partido

## ⚡ Estados de Elección

### **upcoming** (Próxima)
- Fecha de inicio en el futuro
- Permite modificaciones
- Permite agregar/eliminar candidatos

### **active** (Activa)
- Entre fecha de inicio y fin
- No permite modificaciones
- Solo lectura y votación

### **finished** (Finalizada)
- Fecha de fin en el pasado
- Solo lectura
- Disponibles todas las estadísticas

## 🚨 Validaciones Implementadas

### Validaciones de Fecha
- Fecha de inicio debe ser futura
- Fecha de inicio < fecha de fin
- No modificar elecciones iniciadas

### Validaciones de Integridad
- No eliminar elecciones con votos
- No eliminar candidatos con votos
- Verificar existencia de partidos

### Validaciones de Permisos
- Solo propietario/admin puede modificar
- Control de acceso por endpoint
- Validación de tokens JWT

## 📁 Estructura de Respuestas

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { /* datos */ },
  "count": 10, // opcional
  "pagination": { /* info paginación */ } // opcional
}
```

### Respuesta de Error
```json
{
  "success": false,
  "message": "Descripción del error"
}
```

## 🛠️ Archivos Creados

```
src/
├── controllers/
│   ├── election.controller.ts      # Controladores de elecciones
│   └── candidate.controller.ts     # Controladores de candidatos
├── routes/
│   ├── election.routes.ts          # Rutas de elecciones
│   └── candidate.routes.ts         # Rutas de candidatos
└── app.ts                          # Configuración actualizada
```

## 🔄 Flujo de Trabajo Recomendado

1. **Crear Elección**
   ```bash
   POST /api/elections
   ```

2. **Agregar Candidatos**
   ```bash
   POST /api/candidates
   ```

3. **Configurar Partidos** (si es necesario)
   ```bash
   # Usar controladores de party cuando estén disponibles
   ```

4. **Monitorear Estadísticas**
   ```bash
   GET /api/elections/:id/statistics
   ```

5. **Finalizar Elección**
   ```bash
   # Automático por fechas, no requiere acción
   ```

## ⚠️ Consideraciones Importantes

- Las elecciones no se pueden modificar una vez iniciadas
- Solo se pueden eliminar elecciones sin votos
- Los candidatos requieren una elección válida
- Las estadísticas son calculadas en tiempo real
- Usar paginación para listas grandes
- Verificar permisos antes de operaciones sensibles

## 🧪 Endpoints de Prueba

Todos los endpoints están protegidos excepto las rutas de health:
```bash
GET /api/health  # Verificar estado de la API
```
