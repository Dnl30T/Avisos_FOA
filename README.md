# Sistema de Avisos da Turma - Painel Administrativo

## Visão Geral
O sistema foi transformado em uma plataforma completa de comunicação para turmas, com interface de usuário para visualização e painel administrativo para gerenciamento completo dos avisos.

## Estrutura do Projeto

### Páginas
- **index.html**: Página principal para visualização de avisos pelos alunos
- **admin.html**: Painel administrativo com login seguro e CRUD completo

### Scripts JavaScript
- **js/firebase-config.js**: Configuração do Firebase e classes de gerenciamento
- **js/app.js**: Lógica da página principal
- **js/admin.js**: Lógica do painel administrativo
- **js/utils.js**: Utilitários globais (notificações, validações, etc.)

## Sistema de Autenticação

### Configuração de Administradores
Para configurar administradores, edite a lista em `js/firebase-config.js`:

```javascript
static isAdmin(user) {
    const adminEmails = [
        'admin@escola.com',
        'coordenacao@escola.com',
        // Adicione outros emails admin aqui
    ];
    return adminEmails.includes(user.email);
}
```

### Login Administrativo
1. Acesse `/admin.html`
2. Faça login com email e senha de administrador
3. O sistema verifica se o email está na lista de administradores

## Funcionalidades do Painel Admin

### 1. Criação de Avisos
- Formulário completo com todos os campos
- Validação em tempo real
- Suporte a deadlines opcionais
- Categorização e classificação por urgência

### 2. Gerenciamento de Avisos
#### Avisos Ativos
- Visualizar todos os avisos ativos
- Editar informações
- Ocultar avisos (sem deletar)

#### Avisos Ocultos
- Visualizar avisos ocultados
- Restaurar avisos para ativo

#### Avisos Vencidos
- Visualizar avisos com deadline vencido
- Sistema automático de movimentação por deadline

### 3. Sistema de Status
O sistema usa status em vez de exclusão física:
- **ACTIVE**: Aviso visível para os usuários
- **HIDDEN**: Aviso ocultado pelo admin
- **EXPIRED**: Aviso com deadline vencido

## Recursos Técnicos

### Segurança
- Autenticação obrigatória para acesso admin
- Verificação de email em lista de administradores
- Logout automático em caso de acesso negado

### Interface
- Design responsivo com Tailwind CSS
- Navegação por abas intuitiva
- Modais para edição
- Sistema de notificações

### Performance
- Queries otimizadas no Firestore
- Filtros client-side para evitar índices complexos
- Loading states em todas as operações

## Configuração do Firebase

### Firestore Collections
```
avisos/
├── id (auto-generated)
├── titulo (string)
├── descricao (string)
├── categoria (string)
├── urgencia (string)
├── materia (string)
├── dependencia (boolean)
├── deadline (timestamp, optional)
├── informacoesAdicionais (string, optional)
├── status (string: 'active', 'hidden', 'expired')
├── createdAt (timestamp)
├── updatedAt (timestamp)
├── hiddenAt (timestamp, optional)
├── restoredAt (timestamp, optional)
└── expiredAt (timestamp, optional)
```

### Authentication
Configure o Firebase Authentication para permitir login por email/senha.

### Security Rules (Sugestão)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /avisos/{document} {
      allow read: if true; // Todos podem ler
      allow write: if request.auth != null && 
        request.auth.token.email in [
          'admin@escola.com',
          'coordenacao@escola.com'
        ]; // Apenas admins podem escrever
    }
  }
}
```

## Como Usar

### Para Alunos/Usuários
1. Acesse a página principal
2. Visualize avisos ativos
3. Use filtros para encontrar avisos específicos
4. Veja o histórico de avisos vencidos

### Para Administradores
1. Acesse `/admin.html`
2. Faça login com credenciais de administrador
3. Use as abas para navegar entre funções:
   - **Criar**: Adicionar novos avisos
   - **Ativos**: Gerenciar avisos visíveis
   - **Ocultos**: Visualizar e restaurar avisos ocultados
   - **Vencidos**: Ver avisos com deadline vencido

## Manutenção

### Adicionar Novos Administradores
1. Edite `js/firebase-config.js`
2. Adicione o email na lista `adminEmails`
3. O usuário poderá fazer login no painel admin

### Backup de Dados
- Configure backup automático do Firestore
- Considere exportação periódica dos dados

### Monitoramento
- Monitore logs do Firebase Console
- Acompanhe uso de quotas do Firestore

## Troubleshooting

### Problemas Comuns
1. **Erro de Login**: Verificar se email está na lista de admins
2. **Avisos não aparecendo**: Verificar status e filtros
3. **Erro de índice**: Sistema otimizado para evitar índices complexos

### Logs
Verifique o console do navegador para logs detalhados de todas as operações.

---

**Versão**: 2.0  
**Última atualização**: Janeiro 2025