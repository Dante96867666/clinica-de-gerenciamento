# Schema Prisma - Clínica Feliz Gestor

## Visão Geral

Este schema Prisma foi criado com base na análise completa do código-fonte do sistema "Clínica Feliz Gestor", contemplando todas as entidades e relacionamentos necessários para o funcionamento da aplicação.

## Tabelas Principais

### 1. **Users** (Usuários)
- **Propósito**: Autenticação e controle de acesso ao sistema
- **Campos principais**: email, password, full_name
- **Relacionamentos**: Profile, UserRole, Professional

### 2. **Profiles** (Perfis)
- **Propósito**: Informações adicionais dos usuários
- **Campos principais**: phone, avatar_url
- **Relacionamento**: User (1:1)

### 3. **UserRoles** (Roles de Usuário)
- **Propósito**: Definir permissões de acesso
- **Roles disponíveis**: admin, profissional, recepcionista
- **Relacionamento**: User (N:N)

### 4. **Patients** (Pacientes)
- **Propósito**: Cadastro de pacientes da clínica
- **Campos principais**: full_name, cpf, date_of_birth, gender, phone, email, address, insurance
- **Relacionamentos**: Appointments, Sessions

### 5. **Professionals** (Profissionais)
- **Propósito**: Cadastro de profissionais de saúde
- **Campos principais**: full_name, specialty, crm, phone, email, active
- **Relacionamentos**: User (opcional), Appointments, Sessions

### 6. **Appointments** (Agendamentos)
- **Propósito**: Gerenciamento de consultas agendadas
- **Campos principais**: patient_id, professional_id, date, time_start, time_end, type, status
- **Tipos**: consulta, retorno, exame, procedimento
- **Status**: agendado, confirmado, cancelado, concluído
- **Relacionamentos**: Patient, Professional, Sessions

### 7. **Sessions** (Sessões Clínicas)
- **Propósito**: Registro de sessões realizadas
- **Campos principais**: appointment_id, patient_id, professional_id, date, duration_minutes, clinical_notes, status
- **Status**: realizada, cancelada, faltou
- **Relacionamentos**: Appointment (opcional), Patient, Professional

## Tabelas Auxiliares

### 8. **Settings** (Configurações)
- **Propósito**: Configurações do sistema
- **Campos principais**: key, value, description

### 9. **AuditLog** (Logs de Auditoria)
- **Propósito**: Rastrear alterações no sistema
- **Campos principais**: user_id, action, table_name, old_values, new_values

## Relacionamentos

```
User (1) → (1) Profile
User (1) → (N) UserRole
User (1) → (0..1) Professional

Patient (1) → (N) Appointment
Patient (1) → (N) Session

Professional (1) → (N) Appointment
Professional (1) → (N) Session

Appointment (1) → (0..1) Session
```

## Enums

### AppRole
- `admin`: Administrador do sistema
- `profissional`: Profissional de saúde
- `recepcionista`: Recepcionista

## Validações e Constraints

- **CPF**: Único por paciente
- **CRM**: Único por profissional
- **Email**: Único por usuário
- **Datas**: Automáticas com `@default(now())` e `@updatedAt`
- **Relacionamentos**: Configurados com `onDelete` apropriado

## Mapeamento para MySQL

Todas as tabelas usam `@@map` para garantir nomes consistentes no banco MySQL, seguindo o padrão `snake_case`.

## Compatibilidade com o Frontend

O schema foi projetado para ser 100% compatível com as interfaces e APIs existentes no frontend:

- **Types TypeScript**: Correspondem exatamente aos tipos definidos nos componentes
- **API Endpoints**: Suportam todas as operações CRUD implementadas
- **Formulários**: Todos os campos dos formulários são mapeados
- **Validações**: Respeitam as validações existentes no frontend

## Próximos Passos

1. **Instalar Prisma**: `npm install prisma @prisma/client`
2. **Configurar Database URL**: Adicionar `DATABASE_URL` no `.env`
3. **Gerar Client**: `npx prisma generate`
4. **Criar Migração**: `npx prisma migrate dev --name init`
5. **Popular Dados**: `npx prisma db seed` (opcional)

## Considerações de Performance

- Índices automáticos em chaves primárias e estrangeiras
- Índices únicos em campos de negócio (CPF, CRM, email)
- Tipos de dados otimizados para MySQL
- Relacionamentos configurados para performance
