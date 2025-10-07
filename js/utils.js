// Script para navegação entre páginas e configurações gerais
class Navigation {
    static showBackButton() {
        const backButton = $(`
            <div class="fixed top-4 left-4 z-50">
                <a href="index.html" class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors">
                    <i class="material-icons mr-2">arrow_back</i>
                    Voltar aos Avisos
                </a>
            </div>
        `);
        
        $('body').prepend(backButton);
    }

    static addPageIdentifier(pageName) {
        $('body').addClass(`page-${pageName}`);
    }
}

// Sistema de notificações global
class Notifications {
    static show(message, type = 'info') {
        const typeClasses = {
            'success': 'bg-green-500',
            'error': 'bg-red-500',
            'warning': 'bg-yellow-500',
            'info': 'bg-blue-500'
        };

        const icons = {
            'success': 'check_circle',
            'error': 'error',
            'warning': 'warning',
            'info': 'info'
        };

        const notification = $(`
            <div class="fixed top-4 right-4 ${typeClasses[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 notification">
                <div class="flex items-center">
                    <i class="material-icons mr-2">${icons[type]}</i>
                    <span>${message}</span>
                    <button class="ml-4 text-white hover:text-gray-200" onclick="$(this).closest('.notification').fadeOut(() => $(this).closest('.notification').remove())">
                        <i class="material-icons">close</i>
                    </button>
                </div>
            </div>
        `);

        $('body').append(notification);

        // Auto-remove após 5 segundos
        setTimeout(() => {
            notification.fadeOut(() => notification.remove());
        }, 5000);
    }

    static success(message) {
        this.show(message, 'success');
    }

    static error(message) {
        this.show(message, 'error');
    }

    static warning(message) {
        this.show(message, 'warning');
    }

    static info(message) {
        this.show(message, 'info');
    }
}

// Confirmações customizadas
class ConfirmDialog {
    static show(message, onConfirm, onCancel = null) {
        const modal = $(`
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="confirmModal">
                <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div class="flex items-center mb-4">
                        <i class="material-icons text-blue-500 text-2xl mr-3">help</i>
                        <h3 class="text-lg font-semibold text-gray-900">Confirmação</h3>
                    </div>
                    <p class="text-gray-700 mb-6">${message}</p>
                    <div class="flex justify-end space-x-3">
                        <button id="cancelBtn" class="px-4 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button id="confirmBtn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        `);

        $('body').append(modal);

        // Event handlers
        modal.find('#confirmBtn').click(() => {
            modal.remove();
            if (onConfirm) onConfirm();
        });

        modal.find('#cancelBtn').click(() => {
            modal.remove();
            if (onCancel) onCancel();
        });

        // Fechar ao clicar fora
        modal.click((e) => {
            if (e.target === modal[0]) {
                modal.remove();
                if (onCancel) onCancel();
            }
        });
    }
}

// Loading spinner global
class LoadingSpinner {
    static show() {
        if ($('#globalLoading').length === 0) {
            const spinner = $(`
                <div id="globalLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span class="text-gray-700">Carregando...</span>
                    </div>
                </div>
            `);
            $('body').append(spinner);
        }
    }

    static hide() {
        $('#globalLoading').remove();
    }
}

// Validações de formulário
class FormValidator {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validateRequired(value) {
        return value && value.trim().length > 0;
    }

    static validateMinLength(value, minLength) {
        return value && value.trim().length >= minLength;
    }

    static validateMaxLength(value, maxLength) {
        return !value || value.trim().length <= maxLength;
    }

    static validateForm(formSelector, rules) {
        const $form = $(formSelector);
        let isValid = true;
        let errors = [];

        Object.keys(rules).forEach(fieldName => {
            const field = rules[fieldName];
            const $input = $form.find(`[name="${fieldName}"], #${fieldName}`);
            const value = $input.val();

            // Limpar erros anteriores
            $input.removeClass('border-red-500');
            $input.siblings('.error-message').remove();

            // Verificar required
            if (field.required && !this.validateRequired(value)) {
                isValid = false;
                const message = field.messages?.required || 'Este campo é obrigatório';
                errors.push({ field: fieldName, message });
                this.showFieldError($input, message);
            }

            // Verificar email
            if (field.email && value && !this.validateEmail(value)) {
                isValid = false;
                const message = field.messages?.email || 'Email inválido';
                errors.push({ field: fieldName, message });
                this.showFieldError($input, message);
            }

            // Verificar minLength
            if (field.minLength && value && !this.validateMinLength(value, field.minLength)) {
                isValid = false;
                const message = field.messages?.minLength || `Mínimo ${field.minLength} caracteres`;
                errors.push({ field: fieldName, message });
                this.showFieldError($input, message);
            }

            // Verificar maxLength
            if (field.maxLength && value && !this.validateMaxLength(value, field.maxLength)) {
                isValid = false;
                const message = field.messages?.maxLength || `Máximo ${field.maxLength} caracteres`;
                errors.push({ field: fieldName, message });
                this.showFieldError($input, message);
            }
        });

        return { isValid, errors };
    }

    static showFieldError($input, message) {
        $input.addClass('border-red-500');
        $input.after(`<div class="error-message text-red-500 text-sm mt-1">${message}</div>`);
    }
}

// Utilitários para datas
class DateUtils {
    static formatDatePTBR(date) {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    static formatDateTimePTBR(date) {
        return new Date(date).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static isToday(date) {
        const today = new Date();
        const compareDate = new Date(date);
        return today.toDateString() === compareDate.toDateString();
    }

    static isExpired(deadline) {
        if (!deadline) return false;
        return new Date(deadline) < new Date();
    }

    static getDaysUntilDeadline(deadline) {
        if (!deadline) return null;
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
}

// Exportar para uso global
window.Navigation = Navigation;
window.Notifications = Notifications;
window.ConfirmDialog = ConfirmDialog;
window.LoadingSpinner = LoadingSpinner;
window.FormValidator = FormValidator;
window.DateUtils = DateUtils;