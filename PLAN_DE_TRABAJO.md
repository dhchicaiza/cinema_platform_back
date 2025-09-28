# 🎬 Plan de Trabajo - Plataforma de Películas
**Proyecto Integrador I 2025-2 | 750018C**

## 📋 Información General del Proyecto

### Objetivo
Construir y publicar una plataforma web de streaming donde los usuarios puedan explorar, reproducir y valorar películas con experiencia accesible y responsiva.

### Stack Tecnológico
- **Frontend:** React + TypeScript + Vite + SASS
- **Backend:** Node.js + Express + TypeScript
- **Base de Datos:** MongoDB Atlas
- **Despliegue:** Vercel (Frontend) + Render (Backend)
- **Video Provider:** Cloudinary/Pexels
- **Autenticación:** JWT + bcrypt

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Carpetas
```
movies-platform/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   │   ├── common/      # Componentes generales (Header, Footer, etc.)
│   │   │   ├── forms/       # Formularios
│   │   │   ├── ui/          # Componentes UI (Button, Modal, etc.)
│   │   │   └── movies/      # Componentes específicos de películas
│   │   ├── pages/          # Páginas principales
│   │   │   ├── auth/        # Login, Register, RecoverPassword
│   │   │   ├── movies/      # Catalog, MovieDetail, Player
│   │   │   ├── user/        # Profile, Favorites
│   │   │   └── static/      # Home, About, Help
│   │   ├── hooks/          # Custom hooks (useAuth, useMovies, etc.)
│   │   ├── services/       # API calls (fetch)
│   │   ├── types/          # TypeScript interfaces y types
│   │   ├── styles/         # SASS files
│   │   │   ├── abstracts/   # Variables, mixins, functions
│   │   │   ├── base/        # Reset, typography, base
│   │   │   ├── components/  # Estilos por componente
│   │   │   └── layouts/     # Layouts y grid
│   │   ├── utils/          # Utilidades y helpers
│   │   └── constants/      # Constantes de la aplicación
│   ├── public/             # Assets estáticos
│   └── .env.local          # Variables de entorno
├── backend/                 # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/    # Controladores (auth, movies, users, etc.)
│   │   ├── models/         # Modelos MongoDB (User, Movie, Rating, etc.)
│   │   ├── routes/         # Rutas API
│   │   ├── middleware/     # Middleware (auth, validation, etc.)
│   │   ├── services/       # Lógica de negocio
│   │   ├── utils/          # Utilidades (email, encryption, etc.)
│   │   └── config/         # Configuraciones (database, cloudinary, etc.)
│   ├── tests/              # Tests unitarios
│   └── .env                # Variables de entorno
├── docs/                   # Documentación
│   ├── api/                # Documentación API
│   ├── user-manual/        # Manual de usuario
│   └── technical/          # Documentación técnica
└── README.md
```

### Colecciones MongoDB
```javascript
// users
{
  _id: ObjectId,
  firstName: string,
  lastName: string,
  email: string,
  password: string, // hasheado con bcrypt
  age: number,
  avatar?: string,
  createdAt: Date,
  updatedAt: Date
}

// movies
{
  _id: ObjectId,
  title: string,
  description: string,
  genre: string[],
  duration: number,
  poster: string,
  videoUrl: string,
  subtitles: {
    spanish?: string,
    english?: string
  },
  createdAt: Date
}

// favorites
{
  _id: ObjectId,
  userId: ObjectId,
  movieId: ObjectId,
  createdAt: Date
}

// ratings
{
  _id: ObjectId,
  userId: ObjectId,
  movieId: ObjectId,
  rating: number, // 1-5
  createdAt: Date,
  updatedAt: Date
}

// comments
{
  _id: ObjectId,
  userId: ObjectId,
  movieId: ObjectId,
  content: string,
  createdAt: Date,
  updatedAt: Date,
  edited: boolean
}
```

---

## 📅 Cronograma Detallado por Sprint

## **SPRINT 1: Gestión de Usuarios + Exploración y Reproducción**
**Duración:** 4 semanas | **Peso en evaluación:** Frontend 35%, Backend 30%, BD 10%, Git 5%, Pruebas 20%

### **Semana 1: Infraestructura y Setup**
#### Días 1-2: Configuración Base
- [x] Crear repositorio GitHub con workflow Git Flow
- [x] Setup inicial Vite + React + TypeScript + SASS
- [x] Setup Node.js + Express + TypeScript
- [x] Configuración MongoDB Atlas
- [x] Setup variables de entorno (.env)

#### Días 3-4: Configuración de Despliegue
- [x] Configurar despliegue automático Vercel (frontend)
- [x] Configurar despliegue automático Render (backend)
- [x] Setup CI/CD básico
- [x] Documentación inicial (README)

#### Días 5-7: Estructura Base
- [x] Arquitectura de carpetas frontend y backend
- [x] Configuración SASS (variables, mixins, base)
- [x] Setup básico de rutas React Router
- [x] Configuración Express routes básicas
- [x] Conexión MongoDB Atlas

### **Semana 2: Sistema de Autenticación**
#### **HU-001: Registro de Usuario** (Días 1-2)
```typescript
// Criterios implementación:
- Formulario con validaciones (firstName, lastName, age ≥13, email, password)
- Contraseña: ≥8 chars, mayúscula, minúscula, número
- Confirmar contraseña matching
- Email único en sistema
- Password hasheado bcrypt (10 salt rounds)
- Response HTTP 201 con user ID
- Mensaje confirmación UI
```

#### **HU-002: Inicio de Sesión** (Días 3-4)
```typescript
// Criterios implementación:
- Login form con email/password
- Link "¿Olvidaste tu contraseña?"
- Validación en tiempo real
- JWT token en response HTTP 200
- Redirección a /dashboard ≤500ms
- Manejo errores 401 Unauthorized
```

#### **HU-003: Cierre de Sesión** (Día 5)
```typescript
// Criterios implementación:
- Botón "Cerrar sesión" visible
- Invalidar JWT token
- Limpiar estado usuario frontend
- Redirección automática a home
- Guards de protección rutas privadas
```

#### **HU-004: Recuperación de Contraseña** (Días 6-7)
```typescript
// Criterios implementación:
- Form solicitud email
- Token temporal (1 hora validez)
- Servicio envío email
- Form nueva contraseña con validaciones
- Hash bcrypt nueva password
- Invalidar token tras uso
- Mensaje confirmación + redirect /login
```

### **Semana 3: Gestión de Perfil + Navegación**
#### **HU-005: Navegación Principal** (Días 1-2)
```typescript
// Criterios implementación:
- Header responsive con menú hamburguesa
- Páginas: Home, About, Catálogo, Perfil
- Footer con mapa del sitio
- Navegación accesible (WCAG)
- Estados activos en menú
```

#### **HU-006: Edición de Perfil** (Días 3-4)
```typescript
// Criterios implementación:
- Form pre-poblado con datos actuales
- Validación email único
- Actualización en tiempo real
- Response HTTP 200 con datos actualizados
- Manejo conflictos 409 Conflict
```

#### **HU-007: Eliminar Cuenta** (Días 5-6)
```typescript
// Criterios implementación:
- Modal confirmación doble validación
- Verificación password actual
- Eliminación cascada datos relacionados
- Response HTTP 204 No Content
- Redirección home + limpieza sesión
```

#### **Día 7: Heurísticas UX Sprint 1**
- [x] **Heurística 1 - Visibilidad del estado del sistema**
  - Loading states en formularios
  - Mensajes confirmación registro/login
  - Feedback visual acciones (toast notifications)

- [x] **Heurística 4 - Consistencia y estándares**
  - Design system coherente (botones, forms, colores)
  - Nomenclatura consistente
  - Patrones UI familiares

- [x] **Heurística 8 - Diseño estético minimalista**
  - Interfaces limpias sin elementos innecesarios
  - Jerarquía visual clara
  - Espaciado consistente

### **Semana 4: Catálogo + Reproductor**
#### **HU-008: Explorar Catálogo** (Días 1-3)
```typescript
// Criterios implementación:
- Grid responsive películas (poster, título, descripción)
- Búsqueda por título
- Filtros por género
- Lazy loading imágenes
- Paginación o scroll infinito
- Vista detallada película
- Estado vacío con mensaje apropiado
```

#### **HU-009: Reproductor de Video** (Días 4-6)
```typescript
// Criterios implementación:
- Controles básicos: play, pause, stop
- Compatible móviles y desktop
- Integración proveedor externo (Cloudinary/Pexels)
- Manejo errores carga video
- Estados loading y buffer
- Responsive en todos dispositivos
```

#### **Día 7: Testing e Integración**
- [x] Testing funcionalidades Sprint 1
- [x] **WCAG Sprint 1** (2 pautas):
  - **Operable:** Navegación por teclado, tiempo suficiente
  - **Comprensible:** Instrucciones claras, mensajes error específicos
- [x] Video prueba usuario Sprint 1
- [x] Deploy final Sprint 1

---

## **SPRINT 2: Favoritos y Calificaciones**
**Duración:** 3 semanas | **Peso en evaluación:** Frontend 35%, Backend 30%, BD 10%, Git 5%, Pruebas 20%

### **Semana 5: Sistema de Favoritos**
#### **HU-010: Añadir Favoritos** (Días 1-2)
```typescript
// Criterios implementación:
- Botón corazón en cada película
- POST request al backend
- Feedback visual inmediato
- Persistencia en MongoDB
- Prevención duplicados
```

#### **HU-011: Ver Favoritos** (Días 2-3)
```typescript
// Criterios implementación:
- Página "Mis Favoritos" accesible desde menú
- GET favoritos por usuario
- Grid responsive favoritos
- Estado vacío con mensaje
- Carga optimizada
```

#### **HU-012: Editar Favoritos** (Días 4-5)
```typescript
// Criterios implementación:
- Botón editar en favoritos propios
- Form inline editing
- PUT request para actualizar
- Validaciones campos requeridos
- Actualización sin reload
```

#### **HU-013: Eliminar Favoritos** (Días 5-6)
```typescript
// Criterios implementación:
- Botón eliminar con confirmación
- DELETE request
- Actualización inmediata lista
- Manejo estado vacío
```

#### **Día 7: Heurísticas UX Adicionales**
- [x] **Heurística 5 - Prevención de errores**
  - Validaciones preventivas en formularios
  - Confirmaciones acciones destructivas
  - Estados deshabilitados cuando corresponde

### **Semana 6: Sistema de Calificaciones**
#### **HU-014: Calificar Películas** (Días 1-2)
```typescript
// Criterios implementación:
- Sistema estrellas 1-5 interactivo
- Solo usuarios autenticados
- POST calificación a BD
- Validación autorización backend
- Feedback visual inmediato
```

#### **HU-015: Ver Calificaciones** (Días 3-4)
```typescript
// Criterios implementación:
- Promedio calificaciones visible
- Número total calificaciones
- Visible en catálogo y detalle película
- Cálculo optimizado en BD
```

#### **HU-016: Editar Calificación** (Días 4-5)
```typescript
// Criterios implementación:
- Solo autor puede editar
- Botón "Editar calificación" visible
- Form pre-poblado calificación actual
- PUT request actualización
- Recálculo automático promedio
```

#### **HU-017: Eliminar Calificación** (Días 5-6)
```typescript
// Criterios implementación:
- Solo autor puede eliminar
- Modal confirmación
- DELETE request
- Recálculo promedio y contador
- Actualización inmediata UI
```

#### **Día 7: Heurísticas UX Adicionales**
- [x] **Heurística 2 - Correspondencia sistema-mundo real**
  - Colores semánticos (rojo=peligro, verde=éxito, amarillo=advertencia)
  - Iconografía universalmente reconocida
  - Metáforas familiares (estrellas para calificaciones)

- [x] **Heurística 6 - Minimizar carga memoria usuarios**
  - Forms pre-poblados con datos actuales
  - Historial reciente de películas vistas
  - Estados persistentes durante sesión

### **Semana 7: UX/UI + Testing Sprint 2**
#### **Días 1-3: Mejoras UX/UI**
- [x] **WCAG Sprint 2** (3 pautas):
  - **Operable:** Foco visible, no límites tiempo estrictos
  - **Comprensible:** Idioma página identificado, entrada predecible
  - **Perceptible:** Contraste colores adecuado

#### **Días 4-5: Testing Integral**
- [x] Testing funcionalidades Sprint 1 + 2
- [x] Testing responsive 320px, 768px, 1024px
- [x] Testing cross-browser (Chrome, Firefox, Safari)

#### **Días 6-7: Video Pruebas + Deploy**
- [x] Video pruebas usuario Sprint 2
- [x] Informe pruebas Sprint 1 + 2
- [x] Deploy final Sprint 2

---

## **SPRINT 3: Comentarios, Subtítulos y Finalización**
**Duración:** 3 semanas | **Peso en evaluación:** Frontend 30%, Backend 30%, BD 10%, Git 10%, Pruebas 20%

### **Semana 8: Sistema de Comentarios**
#### **HU-018: Crear Comentarios** (Días 1-2)
```typescript
// Criterios implementación:
- Sección comentarios en página película
- Form comentario solo usuarios logueados
- POST comentario a BD
- Asociación user + movie
- Timestamp automático
```

#### **HU-019: Ver Comentarios** (Días 2-3)
```typescript
// Criterios implementación:
- Lista comentarios visible para todos
- Paginación optimizada
- Mostrar autor y fecha
- Estado vacío apropiado
```

#### **HU-020: Editar Comentarios** (Días 4-5)
```typescript
// Criterios implementación:
- Solo autor puede editar
- Form inline editing
- PUT request actualización
- Indicador "editado" en comentario
```

#### **HU-021: Eliminar Comentarios** (Días 5-6)
```typescript
// Criterios implementación:
- Solo autor puede eliminar
- Confirmación modal
- DELETE request
- Actualización inmediata lista
```

#### **Día 7: Heurísticas UX Finales**
- [x] **Heurística 3 - Control y libertad usuario**
  - Función "Deshacer" eliminaciones importantes
  - Salidas claras de procesos
  - Cancelación operaciones en progreso

- [x] **Heurística 7 - Flexibilidad y eficiencia**
  - Modo oscuro/claro
  - Filtros avanzados búsqueda
  - Atajos teclado usuarios expertos

### **Semana 9: Subtítulos + UX Final**
#### **HU-022: Subtítulos Español** (Días 1-2)
```typescript
// Criterios implementación:
- Archivos subtítulos .vtt español
- Controles activar/desactivar
- Sincronización con video
- Posicionamiento legible
```

#### **HU-023: Subtítulos Inglés** (Días 3-4)
```typescript
// Criterios implementación:
- Archivos subtítulos .vtt inglés
- Selector idioma subtítulos
- Cambio dinámico durante reproducción
- Fallbacks apropiados
```

#### **Días 5-6: Heurísticas UX Finales**
- [x] **Heurística 9 - Ayudar reconocer/corregir errores**
  - Mensajes error específicos y accionables
  - Validaciones en tiempo real con feedback claro
  - Sugerencias corrección automáticas

#### **Día 7: Manual de Usuario**
- [x] Documentación completa funcionalidades
- [x] Guías paso a paso con screenshots
- [x] FAQ y solución problemas comunes

### **Semana 10: Testing Final + Entrega**
#### **Días 1-2: WCAG Final**
- [x] **WCAG Sprint 3** (4 pautas completas):
  - **Operable:** Todas funciones accesibles por teclado
  - **Comprensible:** Funcionamiento predecible
  - **Perceptible:** Información presentada de múltiples formas
  - **Robusto:** Compatible con tecnologías asistivas

#### **Días 3-4: Testing Integral Final**
- [x] Testing end-to-end completo
- [x] Testing performance y carga
- [x] Testing seguridad básico
- [x] Testing accesibilidad automatizado

#### **Día 5: Heurística Final**
- [x] **Heurística 10 - Ayuda y documentación**
  - Página FAQ completa
  - Documentación contextual
  - Sistema help integrado

#### **Días 6-7: Entrega Final**
- [x] Videos pruebas usuario (3 sprints)
- [x] Informes técnicos completos
- [x] Deploy final con todos los features
- [x] Preparación sustentación
- [x] Pull Request final con tag `sprint-3-release`

---

## 📊 Distribución de Heurísticas por Sprint

### **Sprint 1: Base UX (3 heurísticas)**
1. **Visibilidad del estado del sistema** ✅
   - Loading states y feedback acciones
   - Mensajes confirmación
   - Estados de formularios

4. **Consistencia y estándares** ✅
   - Design system coherente
   - Patrones UI familiares
   - Nomenclatura consistente

8. **Diseño estético minimalista** ✅
   - Interfaces limpias
   - Jerarquía visual clara
   - Sin elementos innecesarios

### **Sprint 2: UX Intermedio (+3 heurísticas = 6 total)**
2. **Correspondencia sistema-mundo real** ✅
   - Colores semánticos (rojo=peligro, verde=éxito)
   - Iconografía universalmente reconocida
   - Metáforas familiares

5. **Prevención de errores** ✅
   - Validaciones preventivas
   - Confirmaciones acciones destructivas
   - Estados deshabilitados apropiados

6. **Minimizar carga memoria usuarios** ✅
   - Forms pre-poblados
   - Persistencia estados
   - Historial reciente

### **Sprint 3: UX Avanzado (+4 heurísticas = 10 total)**
3. **Control y libertad usuario** ✅
   - Función deshacer
   - Salidas claras de procesos
   - Cancelación operaciones

7. **Flexibilidad y eficiencia** ✅
   - Modo oscuro/claro
   - Filtros avanzados
   - Atajos teclado

9. **Reconocer/corregir errores** ✅
   - Mensajes error específicos
   - Validaciones tiempo real
   - Sugerencias corrección

10. **Ayuda y documentación** ✅
    - FAQ completa
    - Manual usuario
    - Help contextual

---

## 🛡️ Pautas WCAG por Sprint

### **Sprint 1: Fundamentos Accesibilidad (2 pautas)**
- **Operable:** Navegación teclado, tiempo suficiente
- **Comprensible:** Instrucciones claras, mensajes error

### **Sprint 2: Accesibilidad Intermedia (+1 pauta = 3 total)**
- **Perceptible:** Contraste colores, texto alternativo

### **Sprint 3: Accesibilidad Completa (+1 pauta = 4 total)**
- **Robusto:** Compatibilidad tecnologías asistivas

---

## ⚠️ Riesgos y Mitigaciones

### **Alto Riesgo:**
- **Integración API externa videos**
  - Mitigación: Seleccionar y configurar provider (Cloudinary) en Semana 1
  - Backup: Tener URLs videos de prueba locales

- **Despliegue continuo Render/Vercel**
  - Mitigación: Setup CI/CD desde Semana 1
  - Backup: Deploy manual como fallback

- **Performance calificaciones/comentarios**
  - Mitigación: Optimizar queries MongoDB con índices
  - Backup: Paginación agresiva como fallback

### **Medio Riesgo:**
- **Complejidad autenticación JWT**
  - Mitigación: Implementar middleware robusto temprano
  - Testing exhaustivo sesiones

- **Responsive design móviles**
  - Mitigación: Testing continuo dispositivos reales
  - Mobile-first approach

### **Bajo Riesgo:**
- **Integración subtítulos**
  - Mitigación: Usar estándar WebVTT
  - Testing cross-browser

---

## 📝 Criterios de Evaluación

### **Frontend (30-35% cada sprint)**
- ✅ Despliegue funcional Vercel
- ✅ Funcionalidades completas según HU
- ✅ Responsive 320px, 768px, 1024px
- ✅ Heurísticas UX progresivas (3→6→10)
- ✅ WCAG progresivo (2→3→4)
- ✅ Solo Vite + React + SASS + TypeScript
- ✅ Fetch API exclusivamente
- ✅ Variables entorno
- ✅ Código estilo inglés + JSDoc

### **Backend (30% cada sprint)**
- ✅ Despliegue funcional Render
- ✅ Node.js + Express + TypeScript
- ✅ API REST completa (GET/POST/PUT/DELETE)
- ✅ Integración proveedor videos externo
- ✅ Variables entorno
- ✅ Código estilo + JSDoc inglés

### **Base de Datos (10% cada sprint)**
- ✅ MongoDB Atlas operacional
- ✅ CRUD completo usuarios y películas
- ✅ Esquemas apropiados
- ✅ Relaciones correctas entre colecciones

### **Git + Gestión (5-10% cada sprint)**
- ✅ Sprints cerrados en Taiga
- ✅ Ramas por desarrollador
- ✅ Commits pequeños descriptivos
- ✅ Pull Requests con tag `sprint-X-release`

### **Pruebas (20% cada sprint)**
- ✅ Videos pruebas usuario por sprint
- ✅ Informes técnicos PDF
- ✅ Testing funcional completo

---

## 🎯 Entregables Finales

### **Código**
- [ ] Repositorio GitHub completo
- [ ] Deploy Vercel (frontend) funcional
- [ ] Deploy Render (backend) funcional
- [ ] Pull Request final con tag `sprint-3-release`

### **Documentación**
- [ ] Manual de usuario completo
- [ ] Documentación técnica API
- [ ] JSDoc completo en código
- [ ] README detallado proyecto

### **Pruebas**
- [ ] 3 videos pruebas usuario (uno por sprint)
- [ ] 3 informes técnicos PDF
- [ ] Evidencias testing cross-browser

### **Sustentación**
- [ ] Presentación técnica
- [ ] Demo funcionalidades completas
- [ ] Explicación decisiones arquitectónicas
- [ ] Q&A con profesor

---

**Última actualización:** 28 Septiembre 2025
**Estado:** ✅ Plan aprobado - Listo para implementación

---

## 📞 Contacto y Recursos

- **Repositorio:** [GitHub - movies-platform](https://github.com/team/movies-platform)
- **Taiga Project:** [Taiga Board](https://taiga.io/project/movies-platform)
- **Deploy Frontend:** [Vercel App](https://movies-platform.vercel.app)
- **Deploy Backend:** [Render API](https://movies-platform-api.render.com)