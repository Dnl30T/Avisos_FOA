# 🔐 Configuração de Usuário Administrador

## Passo a Passo para Criar sua Conta Admin

### 1️⃣ **Configure seu email na lista de administradores**

Abra o arquivo `js/firebase-config.js` e adicione seu email na lista:

```javascript
const adminEmails = [
  'admin@turma.com',
  'professor@turma.com',
  'coordenacao@turma.com',
  'seuemail@exemplo.com', // ← Adicione seu email aqui
];
```

### 2️⃣ **Crie sua conta usando uma dessas opções:**

#### **Opção A: Firebase Console (Recomendado)**
1. Acesse https://console.firebase.google.com
2. Selecione seu projeto
3. Vá em **Authentication > Users**
4. Clique em **"Add user"**
5. Digite seu email e senha
6. Clique em **"Add user"**

#### **Opção B: Página de Registro Temporária**
1. Acesse `registro-admin.html` no seu navegador
2. Digite seu email (que deve estar na lista de admins)
3. Digite uma senha segura (mínimo 6 caracteres)
4. Confirme a senha
5. Clique em **"Criar Conta Admin"**

### 3️⃣ **Faça login no painel administrativo**
1. Acesse `admin.html`
2. Digite seu email e senha
3. O sistema verificará se você é administrador
4. Você será direcionado para o painel admin

## ⚠️ **Importante:**

- **Segurança**: Após criar sua conta, você pode deletar o arquivo `registro-admin.html` por segurança
- **Email**: Certifique-se de que seu email está exatamente igual na lista de administradores
- **Senha**: Use uma senha forte (recomendado: 8+ caracteres, com números e símbolos)

## 🔧 **Troubleshooting:**

### "Acesso negado. Usuário não é administrador"
- Verifique se seu email está na lista `adminEmails` em `firebase-config.js`
- Certifique-se de que não há espaços ou diferenças de maiúscula/minúscula

### "Usuário não encontrado"
- Crie a conta primeiro no Firebase Console ou usando `registro-admin.html`

### "Senha incorreta"
- Verifique a senha digitada
- Se esqueceu, use a opção "Esqueci minha senha" no Firebase Console

## 📝 **Exemplo de Configuração:**

Se seu email é `joao@escola.com`, edite assim:

```javascript
const adminEmails = [
  'admin@turma.com',
  'professor@turma.com',
  'coordenacao@turma.com',
  'joao@escola.com', // Seu email aqui
];
```

Depois crie a conta com email `joao@escola.com` e sua senha escolhida.

---

**Após configurar, você terá acesso total ao painel administrativo! 🚀**