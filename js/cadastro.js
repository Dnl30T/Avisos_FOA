// JavaScript para a página de cadastro
import { DatabaseManager } from './firebase-config.js';

$(document).ready(function() {
    // Setup inicial
    setupEventListeners();
    setupDateTimeDefaults();

    function setupEventListeners() {
        // Toggle deadline fields
        $('#hasDeadline').change(toggleDeadlineFields);
        
        // Form submission
        $('#avisoForm').submit(handleFormSubmit);
        
        // Modal buttons
        $('#addAnother').click(resetForm);
        $('#goToList').click(() => window.location.href = 'index.html');
        
        // Validação em tempo real
        setupRealTimeValidation();
    }

    function setupDateTimeDefaults() {
        // Definir data mínima como hoje
        const today = new Date().toISOString().split('T')[0];
        $('#deadlineDate').attr('min', today);
    }

    function setupRealTimeValidation() {
        // Validação do título
        $('#titulo').on('input', function() {
            const value = $(this).val().trim();
            if (value.length < 5) {
                showFieldError($(this), 'Título deve ter pelo menos 5 caracteres');
            } else {
                clearFieldError($(this));
            }
        });

        // Validação da descrição
        $('#descricao').on('input', function() {
            const value = $(this).val().trim();
            if (value.length < 10) {
                showFieldError($(this), 'Descrição deve ter pelo menos 10 caracteres');
            } else {
                clearFieldError($(this));
            }
        });

        // Validação da data de deadline
        $('#deadlineDate').on('change', function() {
            const selectedDate = new Date($(this).val());
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                showFieldError($(this), 'Data do deadline não pode ser no passado');
            } else {
                clearFieldError($(this));
            }
        });
    }

    function toggleDeadlineFields() {
        const hasDeadline = $('#hasDeadline').is(':checked');
        const deadlineFields = $('#deadlineFields');
        
        if (hasDeadline) {
            deadlineFields.removeClass('hidden');
            $('#deadlineDate, #deadlineTime').prop('required', true);
        } else {
            deadlineFields.addClass('hidden');
            $('#deadlineDate, #deadlineTime').prop('required', false);
            clearFieldError($('#deadlineDate'));
            clearFieldError($('#deadlineTime'));
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            // Validar formulário
            if (!validateForm()) {
                return;
            }

            showLoading(true);

            // Coletar dados do formulário
            const formData = collectFormData();
            
            // Salvar no Firebase
            const avisoId = await DatabaseManager.addAviso(formData);
            
            console.log('Aviso salvo com sucesso! ID:', avisoId);
            
            // Mostrar modal de sucesso
            showSuccessModal();
            
        } catch (error) {
            console.error('Erro ao salvar aviso:', error);
            showError('Erro ao salvar aviso. Tente novamente.');
        } finally {
            showLoading(false);
        }
    }

    function validateForm() {
        let isValid = true;
        
        // Validar campos obrigatórios
        const requiredFields = ['#titulo', '#descricao', '#categoria', '#urgencia', '#materia'];
        
        requiredFields.forEach(field => {
            const $field = $(field);
            const value = $field.val().trim();
            
            if (!value) {
                showFieldError($field, 'Este campo é obrigatório');
                isValid = false;
            } else {
                clearFieldError($field);
            }
        });

        // Validar título (mínimo 5 caracteres)
        const titulo = $('#titulo').val().trim();
        if (titulo && titulo.length < 5) {
            showFieldError($('#titulo'), 'Título deve ter pelo menos 5 caracteres');
            isValid = false;
        }

        // Validar descrição (mínimo 10 caracteres)
        const descricao = $('#descricao').val().trim();
        if (descricao && descricao.length < 10) {
            showFieldError($('#descricao'), 'Descrição deve ter pelo menos 10 caracteres');
            isValid = false;
        }

        // Validar deadline se estiver habilitado
        if ($('#hasDeadline').is(':checked')) {
            const deadlineDate = $('#deadlineDate').val();
            const deadlineTime = $('#deadlineTime').val();
            
            if (!deadlineDate) {
                showFieldError($('#deadlineDate'), 'Data do deadline é obrigatória');
                isValid = false;
            }
            
            if (!deadlineTime) {
                showFieldError($('#deadlineTime'), 'Hora do deadline é obrigatória');
                isValid = false;
            }
            
            // Verificar se deadline não é no passado
            if (deadlineDate && deadlineTime) {
                const deadline = new Date(`${deadlineDate}T${deadlineTime}`);
                const now = new Date();
                
                if (deadline <= now) {
                    showFieldError($('#deadlineDate'), 'Deadline deve ser no futuro');
                    isValid = false;
                }
            }
        }

        return isValid;
    }

    function collectFormData() {
        const hasDeadline = $('#hasDeadline').is(':checked');
        let deadline = null;
        
        if (hasDeadline) {
            const deadlineDate = $('#deadlineDate').val();
            const deadlineTime = $('#deadlineTime').val();
            deadline = new Date(`${deadlineDate}T${deadlineTime}`);
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

    function showFieldError($field, message) {
        // Remover erro anterior
        clearFieldError($field);
        
        // Adicionar classe de erro
        $field.addClass('border-red-500 focus:border-red-500 focus:ring-red-500');
        
        // Adicionar mensagem de erro
        const errorDiv = $(`<div class="text-red-500 text-sm mt-1">${message}</div>`);
        $field.closest('div').append(errorDiv);
    }

    function clearFieldError($field) {
        // Remover classe de erro
        $field.removeClass('border-red-500 focus:border-red-500 focus:ring-red-500');
        
        // Remover mensagem de erro
        $field.closest('div').find('.text-red-500').remove();
    }

    function resetForm() {
        // Limpar formulário
        $('#avisoForm')[0].reset();
        
        // Resetar deadline fields
        $('#deadlineFields').addClass('hidden');
        $('#deadlineDate, #deadlineTime').prop('required', false);
        
        // Limpar todos os erros
        $('.border-red-500').removeClass('border-red-500 focus:border-red-500 focus:ring-red-500');
        $('.text-red-500').remove();
        
        // Fechar modal
        $('#successModal').addClass('hidden');
        
        // Focus no primeiro campo
        $('#titulo').focus();
    }

    function showSuccessModal() {
        $('#successModal').removeClass('hidden');
    }

    function showLoading(show) {
        if (show) {
            $('#loadingSpinner').removeClass('hidden');
        } else {
            $('#loadingSpinner').addClass('hidden');
        }
    }

    function showError(message) {
        // Criar toast de erro
        const toast = $(`
            <div class="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    <span>${message}</span>
                    <button class="ml-4 text-white hover:text-gray-200" onclick="$(this).parent().parent().remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `);
        
        $('body').append(toast);
        
        // Auto remover após 5 segundos
        setTimeout(() => {
            toast.fadeOut(() => toast.remove());
        }, 5000);
    }

    function showSuccess(message) {
        // Criar toast de sucesso
        const toast = $(`
            <div class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                <div class="flex items-center">
                    <i class="fas fa-check-circle mr-2"></i>
                    <span>${message}</span>
                    <button class="ml-4 text-white hover:text-gray-200" onclick="$(this).parent().parent().remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `);
        
        $('body').append(toast);
        
        // Auto remover após 3 segundos
        setTimeout(() => {
            toast.fadeOut(() => toast.remove());
        }, 3000);
    }

    // Auto-save draft (opcional)
    let draftTimer;
    function saveDraft() {
        const formData = {
            titulo: $('#titulo').val(),
            descricao: $('#descricao').val(),
            categoria: $('#categoria').val(),
            urgencia: $('#urgencia').val(),
            materia: $('#materia').val(),
            dependencia: $('input[name="dependencia"]:checked').val(),
            hasDeadline: $('#hasDeadline').is(':checked'),
            deadlineDate: $('#deadlineDate').val(),
            deadlineTime: $('#deadlineTime').val(),
            informacoesAdicionais: $('#informacoesAdicionais').val()
        };
        
        localStorage.setItem('avisoFormDraft', JSON.stringify(formData));
    }

    function loadDraft() {
        const draft = localStorage.getItem('avisoFormDraft');
        if (draft) {
            const data = JSON.parse(draft);
            
            $('#titulo').val(data.titulo || '');
            $('#descricao').val(data.descricao || '');
            $('#categoria').val(data.categoria || '');
            $('#urgencia').val(data.urgencia || '');
            $('#materia').val(data.materia || '');
            $(`input[name="dependencia"][value="${data.dependencia}"]`).prop('checked', true);
            $('#hasDeadline').prop('checked', data.hasDeadline || false);
            $('#deadlineDate').val(data.deadlineDate || '');
            $('#deadlineTime').val(data.deadlineTime || '');
            $('#informacoesAdicionais').val(data.informacoesAdicionais || '');
            
            // Trigger deadline fields visibility
            toggleDeadlineFields();
        }
    }

    // Carregar draft ao inicializar
    loadDraft();

    // Auto-save draft a cada 30 segundos
    $('#avisoForm input, #avisoForm select, #avisoForm textarea').on('input change', function() {
        clearTimeout(draftTimer);
        draftTimer = setTimeout(saveDraft, 2000); // Save after 2 seconds of inactivity
    });

    // Limpar draft quando formulário for enviado com sucesso
    $('#avisoForm').on('submit', function() {
        localStorage.removeItem('avisoFormDraft');
    });
});