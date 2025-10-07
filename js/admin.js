// JavaScript para a página de administração
import { DatabaseManager, AuthManager, Utils, STATUS } from './firebase-config.js';

$(document).ready(function() {
    let currentUser = null;
    let currentTab = 'criar';
    let editingAvisoId = null;

    // Verificar estado de autenticação
    AuthManager.onAuthStateChanged((user) => {
        if (user && AuthManager.isAdmin(user)) {
            currentUser = user;
            showAdminDashboard();
            loadAdminInfo();
            loadTabContent();
        } else {
            showLoginModal();
        }
    });

    // Setup event listeners
    setupEventListeners();

    function setupEventListeners() {
        // Login form
        $('#loginForm').submit(handleLogin);
        
        // Logout button
        $('#logoutBtn').click(handleLogout);
        
        // Tab navigation
        $('.admin-nav-item').click(handleTabClick);
        
        // Aviso form
        $('#avisoForm').submit(handleAvisoSubmit);
        $('#clearForm').click(clearAvisoForm);
        
        // Deadline toggle
        $('#hasDeadline').change(toggleDeadlineFields);
        
        // Edit modal
        $('#closeEditModal, #cancelEdit').click(closeEditModal);
        $('#editForm').submit(handleEditSubmit);
    }

    async function handleLogin(e) {
        e.preventDefault();
        
        try {
            showLoading(true);
            
            const email = $('#email').val();
            const password = $('#password').val();
            
            const user = await AuthManager.loginAdmin(email, password);
            
            if (!AuthManager.isAdmin(user)) {
                throw new Error('Acesso negado. Usuário não é administrador.');
            }
            
            showSuccess('Login realizado com sucesso!');
            
        } catch (error) {
            console.error('Erro no login:', error);
            let message = 'Erro no login. Verifique suas credenciais.';
            
            if (error.code === 'auth/user-not-found') {
                message = 'Usuário não encontrado.';
            } else if (error.code === 'auth/wrong-password') {
                message = 'Senha incorreta.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Email inválido.';
            } else if (error.message.includes('Acesso negado')) {
                message = error.message;
            }
            
            showError(message);
        } finally {
            showLoading(false);
        }
    }

    async function handleLogout() {
        try {
            await AuthManager.logout();
            showLoginModal();
            showSuccess('Logout realizado com sucesso!');
        } catch (error) {
            console.error('Erro no logout:', error);
            showError('Erro ao fazer logout.');
        }
    }

    function handleTabClick(e) {
        const tab = $(e.currentTarget).data('tab');
        switchTab(tab);
    }

    function switchTab(tab) {
        // Update navigation
        $('.admin-nav-item').removeClass('active');
        $(`.admin-nav-item[data-tab="${tab}"]`).addClass('active');
        
        // Update content
        $('.tab-content').addClass('hidden');
        $(`#tab-${tab}`).removeClass('hidden');
        
        currentTab = tab;
        loadTabContent();
    }

    async function loadTabContent() {
        if (!currentUser) return;
        
        try {
            showLoading(true);
            
            switch (currentTab) {
                case 'ativos':
                    await loadAvisosAtivos();
                    break;
                case 'ocultos':
                    await loadAvisosOcultos();
                    break;
                case 'vencidos':
                    await loadAvisosVencidos();
                    break;
            }
        } catch (error) {
            console.error('Erro ao carregar conteúdo:', error);
            showError('Erro ao carregar dados.');
        } finally {
            showLoading(false);
        }
    }

    async function loadAvisosAtivos() {
        const data = await DatabaseManager.getAllAvisos();
        renderAvisosList(data.active, '#avisoAtivesList', 'active');
    }

    async function loadAvisosOcultos() {
        const data = await DatabaseManager.getAllAvisos();
        renderAvisosList(data.hidden, '#avisoOcultosList', 'hidden');
    }

    async function loadAvisosVencidos() {
        const data = await DatabaseManager.getAllAvisos();
        renderAvisosList(data.expired, '#avisoVencidosList', 'expired');
    }

    function renderAvisosList(avisos, container, type) {
        const $container = $(container);
        $container.empty();

        if (avisos.length === 0) {
            $container.html(`
                <div class="text-center py-12">
                    <i class="material-icons text-gray-400 text-6xl mb-4">inbox</i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhum aviso encontrado</h3>
                    <p class="text-gray-500">Não há avisos nesta categoria.</p>
                </div>
            `);
            return;
        }

        // Ordenar avisos
        avisos.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });

        avisos.forEach(aviso => {
            const card = createAdminAvisoCard(aviso, type);
            $container.append(card);
        });
    }

    function createAdminAvisoCard(aviso, type) {
        const statusClass = `status-${type}`;
        const statusText = {
            'active': 'Ativo',
            'hidden': 'Oculto',
            'expired': 'Vencido'
        };

        const actions = createActionButtons(aviso, type);
        
        const deadlineDisplay = aviso.deadline ? 
            `<div class="text-sm text-gray-600 mt-2">
                <i class="material-icons mr-1">schedule</i>
                Deadline: ${Utils.formatDate(aviso.deadline)}
            </div>` : '';

        return $(`
            <div class="bg-white rounded-lg shadow border ${statusClass} p-6">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h3 class="text-lg font-semibold text-gray-900">${aviso.titulo}</h3>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(type)}">
                                ${statusText[type]}
                            </span>
                        </div>
                        
                        <div class="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <span class="capitalize">${aviso.categoria}</span>
                            <span class="${Utils.getUrgencyColor(aviso.urgencia)} font-medium">
                                ${Utils.getUrgencyText(aviso.urgencia)}
                            </span>
                            <span>${aviso.materia}</span>
                            ${aviso.dependencia ? '<span class="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">Dependência</span>' : ''}
                        </div>
                        
                        <p class="text-gray-700 mb-3">${aviso.descricao}</p>
                        
                        ${aviso.informacoesAdicionais ? `<div class="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                            <p class="text-blue-700 text-sm">${aviso.informacoesAdicionais}</p>
                        </div>` : ''}
                        
                        <div class="text-sm text-gray-500">
                            Criado em: ${Utils.formatDate(aviso.createdAt)}
                            ${deadlineDisplay}
                        </div>
                    </div>
                    
                    <div class="flex space-x-2 ml-4">
                        ${actions}
                    </div>
                </div>
            </div>
        `);
    }

    function createActionButtons(aviso, type) {
        let buttons = '';
        
        if (type === 'active') {
            buttons += `
                <button class="edit-btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm" data-id="${aviso.id}">
                    <i class="material-icons">edit</i>
                </button>
                <button class="hide-btn bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm" data-id="${aviso.id}">
                    <i class="material-icons">visibility_off</i>
                </button>
            `;
        } else if (type === 'hidden') {
            buttons += `
                <button class="restore-btn bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm" data-id="${aviso.id}">
                    <i class="material-icons">visibility</i>
                </button>
            `;
        }
        
        return buttons;
    }

    function getStatusBadgeClass(type) {
        const classes = {
            'active': 'bg-green-100 text-green-800',
            'hidden': 'bg-yellow-100 text-yellow-800',
            'expired': 'bg-red-100 text-red-800'
        };
        return classes[type] || 'bg-gray-100 text-gray-800';
    }

    // Event delegation para botões dinâmicos
    $(document).on('click', '.edit-btn', function() {
        const avisoId = $(this).data('id');
        openEditModal(avisoId);
    });

    $(document).on('click', '.hide-btn', async function() {
        const avisoId = $(this).data('id');
        if (confirm('Tem certeza que deseja ocultar este aviso?')) {
            await hideAviso(avisoId);
        }
    });

    $(document).on('click', '.restore-btn', async function() {
        const avisoId = $(this).data('id');
        if (confirm('Tem certeza que deseja restaurar este aviso?')) {
            await restoreAviso(avisoId);
        }
    });

    async function hideAviso(avisoId) {
        try {
            showLoading(true);
            await DatabaseManager.hideAviso(avisoId);
            showSuccess('Aviso ocultado com sucesso!');
            loadTabContent();
        } catch (error) {
            console.error('Erro ao ocultar aviso:', error);
            showError('Erro ao ocultar aviso.');
        } finally {
            showLoading(false);
        }
    }

    async function restoreAviso(avisoId) {
        try {
            showLoading(true);
            await DatabaseManager.restoreAviso(avisoId);
            showSuccess('Aviso restaurado com sucesso!');
            loadTabContent();
        } catch (error) {
            console.error('Erro ao restaurar aviso:', error);
            showError('Erro ao restaurar aviso.');
        } finally {
            showLoading(false);
        }
    }

    async function openEditModal(avisoId) {
        try {
            showLoading(true);
            const data = await DatabaseManager.getAllAvisos();
            const aviso = data.all.find(a => a.id === avisoId);
            
            if (!aviso) {
                throw new Error('Aviso não encontrado');
            }
            
            // Preencher formulário de edição
            $('#editAvisoId').val(aviso.id);
            $('#editTitulo').val(aviso.titulo);
            $('#editDescricao').val(aviso.descricao);
            $('#editCategoria').val(aviso.categoria);
            $('#editUrgencia').val(aviso.urgencia);
            
            editingAvisoId = avisoId;
            $('#editModal').removeClass('hidden');
            
        } catch (error) {
            console.error('Erro ao abrir modal de edição:', error);
            showError('Erro ao carregar dados do aviso.');
        } finally {
            showLoading(false);
        }
    }

    function closeEditModal() {
        $('#editModal').addClass('hidden');
        editingAvisoId = null;
    }

    async function handleEditSubmit(e) {
        e.preventDefault();
        
        if (!editingAvisoId) return;
        
        try {
            showLoading(true);
            
            const formData = {
                titulo: $('#editTitulo').val().trim(),
                descricao: $('#editDescricao').val().trim(),
                categoria: $('#editCategoria').val(),
                urgencia: $('#editUrgencia').val()
            };
            
            await DatabaseManager.updateAviso(editingAvisoId, formData);
            
            showSuccess('Aviso atualizado com sucesso!');
            closeEditModal();
            loadTabContent();
            
        } catch (error) {
            console.error('Erro ao atualizar aviso:', error);
            showError('Erro ao atualizar aviso.');
        } finally {
            showLoading(false);
        }
    }

    async function handleAvisoSubmit(e) {
        e.preventDefault();
        
        try {
            showLoading(true);
            
            const formData = collectFormData();
            await DatabaseManager.addAviso(formData);
            
            showSuccess('Aviso criado com sucesso!');
            clearAvisoForm();
            
        } catch (error) {
            console.error('Erro ao criar aviso:', error);
            showError('Erro ao criar aviso.');
        } finally {
            showLoading(false);
        }
    }

    function collectFormData() {
        const hasDeadline = $('#hasDeadline').is(':checked');
        let deadline = null;
        
        if (hasDeadline) {
            const deadlineDate = $('#deadlineDate').val();
            const deadlineTime = $('#deadlineTime').val();
            if (deadlineDate && deadlineTime) {
                deadline = new Date(`${deadlineDate}T${deadlineTime}`);
            }
        }

        return {
            titulo: $('#titulo').val().trim(),
            descricao: $('#descricao').val().trim(),
            categoria: $('#categoria').val(),
            urgencia: $('#urgencia').val(),
            materia: $('#materia').val(),
            dependencia: $('input[name="dependencia"]:checked').val() === 'true',
            deadline: deadline,
            informacoesAdicionais: $('#informacoesAdicionais').val().trim()
        };
    }

    function clearAvisoForm() {
        $('#avisoForm')[0].reset();
        $('#deadlineFields').addClass('hidden');
        $('#deadlineDate, #deadlineTime').prop('required', false);
    }

    function toggleDeadlineFields() {
        const hasDeadline = $('#hasDeadline').is(':checked');
        const $deadlineFields = $('#deadlineFields');
        
        if (hasDeadline) {
            $deadlineFields.removeClass('hidden');
            $('#deadlineDate, #deadlineTime').prop('required', true);
        } else {
            $deadlineFields.addClass('hidden');
            $('#deadlineDate, #deadlineTime').prop('required', false);
        }
    }

    function showLoginModal() {
        $('#loginModal').removeClass('hidden');
        $('#adminDashboard').addClass('hidden');
    }

    function showAdminDashboard() {
        $('#loginModal').addClass('hidden');
        $('#adminDashboard').removeClass('hidden');
    }

    function loadAdminInfo() {
        if (currentUser) {
            $('#adminInfo').text(`Logado como: ${currentUser.email}`);
        }
    }

    function showLoading(show) {
        if (show) {
            $('#loadingSpinner').removeClass('hidden');
        } else {
            $('#loadingSpinner').addClass('hidden');
        }
    }

    function showError(message) {
        const toast = $(`
            <div class="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                <div class="flex items-center">
                    <i class="material-icons mr-2">error</i>
                    <span>${message}</span>
                </div>
            </div>
        `);
        
        $('body').append(toast);
        
        setTimeout(() => {
            toast.fadeOut(() => toast.remove());
        }, 5000);
    }

    function showSuccess(message) {
        const toast = $(`
            <div class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                <div class="flex items-center">
                    <i class="material-icons mr-2">check_circle</i>
                    <span>${message}</span>
                </div>
            </div>
        `);
        
        $('body').append(toast);
        
        setTimeout(() => {
            toast.fadeOut(() => toast.remove());
        }, 3000);
    }
});