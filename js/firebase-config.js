// Firebase Configuration
// Para usar este projeto, você precisará:
// 1. Criar um projeto no Firebase Console (https://console.firebase.google.com/)
// 2. Habilitar o Firestore Database
// 3. Copiar sua configuração do Firebase aqui

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// SUBSTITUIR pelas suas configurações do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAxMJnb5BCPsUK5PIKPx6LodnvsVEZZr8c",
  authDomain: "class-notifications-78b8e.firebaseapp.com",
  projectId: "class-notifications-78b8e",
  storageBucket: "class-notifications-78b8e.firebasestorage.app",
  messagingSenderId: "35030577337",
  appId: "1:35030577337:web:8dbf0b2d7ce2ad18012b68",
  measurementId: "G-BQ2ZG2HD2N",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Database collections
const COLLECTIONS = {
  AVISOS: "avisos",
  HISTORICO: "historico",
};

// Status constants
const STATUS = {
  ACTIVE: "active",
  HIDDEN: "hidden",
  EXPIRED: "expired"
};

// Database functions
class DatabaseManager {
  // Adicionar novo aviso
  static async addAviso(avisoData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.AVISOS), {
        ...avisoData,
        createdAt: Timestamp.now(),
        status: STATUS.ACTIVE,
        isActive: true // Manter compatibilidade
      });
      console.log("Aviso adicionado com ID: ", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Erro ao adicionar aviso: ", error);
      throw error;
    }
  }

  // Buscar todos os avisos ativos (para usuários)
  static async getAvisosAtivos(filters = {}) {
    try {
      let q = query(
        collection(db, COLLECTIONS.AVISOS),
        where("status", "==", STATUS.ACTIVE),
        where("isActive", "==", true)
      );

      const querySnapshot = await getDocs(q);
      let avisos = [];

      querySnapshot.forEach((doc) => {
        avisos.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Aplicar filtros no cliente se fornecidos
      if (filters.categoria) {
        avisos = avisos.filter(aviso => aviso.categoria === filters.categoria);
      }
      if (filters.urgencia) {
        avisos = avisos.filter(aviso => aviso.urgencia === filters.urgencia);
      }
      if (filters.materia) {
        avisos = avisos.filter(aviso => aviso.materia === filters.materia);
      }
      if (filters.dependencia !== undefined) {
        avisos = avisos.filter(aviso => aviso.dependencia === (filters.dependencia === 'true'));
      }

      return avisos;
    } catch (error) {
      console.error("Erro ao buscar avisos: ", error);
      throw error;
    }
  }

  // Buscar todos os avisos (para admin)
  static async getAllAvisos() {
    try {
      const q = query(collection(db, COLLECTIONS.AVISOS));
      const querySnapshot = await getDocs(q);
      let avisos = [];

      querySnapshot.forEach((doc) => {
        avisos.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Separar por status
      const active = avisos.filter(a => a.status === STATUS.ACTIVE);
      const hidden = avisos.filter(a => a.status === STATUS.HIDDEN);
      const expired = avisos.filter(a => a.status === STATUS.EXPIRED);

      return { active, hidden, expired, all: avisos };
    } catch (error) {
      console.error("Erro ao buscar todos os avisos: ", error);
      throw error;
    }
  }

  // Atualizar aviso
  static async updateAviso(avisoId, avisoData) {
    try {
      const avisoRef = doc(db, COLLECTIONS.AVISOS, avisoId);
      await updateDoc(avisoRef, {
        ...avisoData,
        updatedAt: Timestamp.now()
      });
      console.log("Aviso atualizado com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao atualizar aviso: ", error);
      throw error;
    }
  }

  // Ocultar aviso (mover para hidden)
  static async hideAviso(avisoId) {
    try {
      const avisoRef = doc(db, COLLECTIONS.AVISOS, avisoId);
      await updateDoc(avisoRef, {
        status: STATUS.HIDDEN,
        hiddenAt: Timestamp.now()
      });
      console.log("Aviso ocultado com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao ocultar aviso: ", error);
      throw error;
    }
  }

  // Restaurar aviso oculto
  static async restoreAviso(avisoId) {
    try {
      const avisoRef = doc(db, COLLECTIONS.AVISOS, avisoId);
      await updateDoc(avisoRef, {
        status: STATUS.ACTIVE,
        restoredAt: Timestamp.now()
      });
      console.log("Aviso restaurado com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao restaurar aviso: ", error);
      throw error;
    }
  }

  // Buscar histórico
  static async getHistorico() {
    try {
      // Consulta simples sem orderBy para evitar problemas de índice
      const q = query(collection(db, COLLECTIONS.HISTORICO));

      const querySnapshot = await getDocs(q);
      let historico = [];

      querySnapshot.forEach((doc) => {
        historico.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Ordenar no cliente por data de movimento para histórico
      historico.sort((a, b) => {
        const dateA = a.movedToHistoryAt?.toDate ? a.movedToHistoryAt.toDate() : new Date(a.movedToHistoryAt);
        const dateB = b.movedToHistoryAt?.toDate ? b.movedToHistoryAt.toDate() : new Date(b.movedToHistoryAt);
        return dateB - dateA; // Mais recente primeiro
      });

      return historico;
    } catch (error) {
      console.error("Erro ao buscar histórico: ", error);
      throw error;
    }
  }

  // Mover aviso para histórico (quando vence deadline)
  static async moveToHistory(avisoId, avisoData) {
    try {
      // Atualizar status para expired em vez de mover
      const avisoRef = doc(db, COLLECTIONS.AVISOS, avisoId);
      await updateDoc(avisoRef, {
        status: STATUS.EXPIRED,
        expiredAt: Timestamp.now(),
        isActive: false
      });
      
      console.log("Aviso movido para histórico");
    } catch (error) {
      console.error("Erro ao mover para histórico: ", error);
      throw error;
    }
  }

  // Verificar deadlines vencidos
  static async checkExpiredDeadlines() {
    try {
      const avisos = await this.getAvisosAtivos();
      const now = new Date();
      const expiredAvisos = [];

      for (const aviso of avisos) {
        if (aviso.deadline) {
          const deadline = aviso.deadline.toDate ? aviso.deadline.toDate() : new Date(aviso.deadline);
          if (deadline < now) {
            expiredAvisos.push(aviso);
            await this.moveToHistory(aviso.id, aviso);
          }
        }
      }

      return expiredAvisos;
    } catch (error) {
      console.error("Erro ao verificar deadlines: ", error);
      throw error;
    }
  }
}

// Authentication Manager
class AuthManager {
  // Login do admin
  static async loginAdmin(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Admin logado com sucesso");
      return userCredential.user;
    } catch (error) {
      console.error("Erro no login: ", error);
      throw error;
    }
  }

  // Logout
  static async logout() {
    try {
      await signOut(auth);
      console.log("Logout realizado com sucesso");
    } catch (error) {
      console.error("Erro no logout: ", error);
      throw error;
    }
  }

  // Verificar se usuário está logado
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Verificar se é admin (simplificado)
  static isAdmin(user) {
    if (!user) {
      console.log('AuthManager.isAdmin: Usuário não fornecido');
      return false;
    }
    
    // Lista de emails admin (configure conforme necessário)
    const adminEmails = [
      'docarmodanilo13@gmail.com',
      'professor@turma.com',
      'coordenacao@turma.com',
      // Adicione seu email aqui para ter acesso admin
      // 'seuemail@exemplo.com',
    ];
    
    console.log('AuthManager.isAdmin: Verificando email:', user.email);
    console.log('AuthManager.isAdmin: Lista de admins:', adminEmails);
    console.log('AuthManager.isAdmin: É admin?', adminEmails.includes(user.email));
    
    return adminEmails.includes(user.email);
  }

  // Get current user
  static getCurrentUser() {
    return auth.currentUser;
  }
}

// Utility functions
class Utils {
  // Calcular urgência baseada no deadline
  static calculateUrgencyByDeadline(deadline, originalUrgency) {
    if (!deadline) return originalUrgency;

    const now = new Date();
    const deadlineDate = deadline.toDate
      ? deadline.toDate()
      : new Date(deadline);
    const diffInHours = (deadlineDate - now) / (1000 * 60 * 60);

    // Se restam menos de 24 horas, upgrade da urgência
    if (diffInHours <= 24 && diffInHours > 0) {
      if (originalUrgency === "baixa") return "media";
      if (originalUrgency === "media") return "alta";
    }

    return originalUrgency;
  }

  // Formatar data para display
  static formatDate(timestamp) {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Verificar se deadline está próximo (menos de 48 horas)
  static isDeadlineNear(deadline) {
    if (!deadline) return false;

    const now = new Date();
    const deadlineDate = deadline.toDate
      ? deadline.toDate()
      : new Date(deadline);
    const diffInHours = (deadlineDate - now) / (1000 * 60 * 60);

    return diffInHours <= 48 && diffInHours > 0;
  }

  // Obter ícone da categoria
  static getCategoryIcon(categoria) {
    const icons = {
      provas: "fas fa-file-alt",
      trabalhos: "fas fa-tasks",
      comunicados: "fas fa-bullhorn",
      noticias: "fas fa-newspaper",
      divulgacao: "fas fa-share-alt",
    };
    return icons[categoria] || "fas fa-info-circle";
  }

  // Obter cor da urgência
  static getUrgencyColor(urgencia) {
    const colors = {
      alta: "text-red-600",
      media: "text-yellow-600",
      baixa: "text-green-600",
    };
    return colors[urgencia] || "text-gray-600";
  }

  // Obter texto da urgência
  static getUrgencyText(urgencia) {
    const texts = {
      alta: "Alta",
      media: "Média",
      baixa: "Baixa",
    };
    return texts[urgencia] || "Indefinida";
  }
}

// Exportar para uso como módulos
export { DatabaseManager, AuthManager, Utils, STATUS, db, auth };
