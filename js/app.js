// App principal - Página de Visualização
import { DatabaseManager, AuthManager, Utils } from './firebase-config.js';

$(document).ready(function() {
    let currentFilters = {};
    let showingHistory = false;
    let filtersCollapsed = true; // Start collapsed by default

    // Inicialização
    init();

    async function init() {
        try {
            showLoading(true);
            
            // Verificar deadlines vencidos
            await DatabaseManager.checkExpiredDeadlines();
            
            // Carregar avisos
            await loadAvisos();
            
            // Carregar matérias para o filtro
            await loadMaterias();
            
            // Setup event listeners
            setupEventListeners();
            
            // Initialize filters display
            updateActiveFiltersDisplay();
            
        } catch (error) {
            console.error('Erro na inicialização:', error);
            showError('Erro ao carregar dados. Verifique a conexão com o Firebase.');
        } finally {
            showLoading(false);
        }
    }

    function setupEventListeners() {
        // Filtros
        $('#applyFilters').click(applyFilters);
        $('#clearFilters').click(clearFilters);
        $('#clearAllFilters').click(clearAllFilters);
        
        // Toggle filtros
        $('#toggleFilters').click(toggleFiltersCollapse);
        
        // Toggle histórico
        $('#toggleHistorico').click(toggleHistorico);
        
        // Auto-aplicar filtros quando seleções mudarem
        $('#filterCategoria, #filterUrgencia, #filterMateria, #filterDependencia').change(function() {
            applyFilters();
        });
    }

    async function loadAvisos() {
        try {
            showLoading(true);
            
            let avisos;
            if (showingHistory) {
                avisos = await DatabaseManager.getHistorico();
                renderHistorico(avisos);
            } else {
                avisos = await DatabaseManager.getAvisosAtivos(currentFilters);
                avisos = sortAvisosByPriority(avisos);
                renderAvisos(avisos);
            }
            
        } catch (error) {
            console.error('Erro ao carregar avisos:', error);
            showError('Erro ao carregar avisos.');
        } finally {
            showLoading(false);
        }
    }

    async function loadMaterias() {
        try {
            const materias = await DatabaseManager.getUniqueMatrias();
            const selectMateria = $('#filterMateria');
            
            // Limpar opções existentes (exceto a primeira)
            selectMateria.find('option:not(:first)').remove();
            
            // Adicionar matérias encontradas no banco
            materias.forEach(materia => {
                selectMateria.append(`<option value="${materia}">${materia}</option>`);
            });
            
        } catch (error) {
            console.error('Erro ao carregar matérias:', error);
        }
    }

    function sortAvisosByPriority(avisos) {
        return avisos.sort((a, b) => {
            // 1. Urgência (alta > média > baixa)
            const urgencyOrder = { 'alta': 3, 'media': 2, 'baixa': 1 };
            const urgencyDiff = urgencyOrder[b.urgencia] - urgencyOrder[a.urgencia];
            if (urgencyDiff !== 0) return urgencyDiff;

            // 2. Deadline (mais próximo primeiro)
            if (a.deadline && b.deadline) {
                const dateA = a.deadline.toDate ? a.deadline.toDate() : new Date(a.deadline);
                const dateB = b.deadline.toDate ? b.deadline.toDate() : new Date(b.deadline);
                return dateA - dateB;
            }
            if (a.deadline && !b.deadline) return -1;
            if (!a.deadline && b.deadline) return 1;

            // 3. Data de criação (mais recente primeiro)
            const createdA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const createdB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return createdB - createdA;
        });
    }

    function renderAvisos(avisos) {
        const container = $('#avisosList');
        container.empty();

        if (avisos.length === 0) {
            container.html(`
                <div class="text-center py-12">
                    <i class="material-icons text-gray-400 text-6xl mb-4">inbox</i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhum aviso ativo</h3>
                    <p class="text-gray-500">Não há avisos para exibir no momento.</p>
                </div>

            `);
            return;
        }

        avisos.forEach(aviso => {
            const card = createAvisoCard(aviso);
            card.addClass('fade-in');
            container.append(card);
        });
    }

    function renderHistorico(avisos) {
        const container = $('#historicoList');
        container.empty();

        if (avisos.length === 0) {
            container.html(`
                <div class="text-center py-12">
                    <i class="material-icons text-gray-400 text-6xl mb-4">history</i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhum histórico</h3>
                    <p class="text-gray-500">Não há avisos no histórico.</p>
                </div>
            `);
            return;
        }

        avisos.forEach(aviso => {
            const card = createHistoricoCard(aviso);
            container.append(card);
        });
    }

    function createAvisoCard(aviso) {
        const urgencyClass = `urgency-${aviso.urgencia}`;
        const categoryClass = `category-${aviso.categoria}`;
        const isNearDeadline = aviso.deadline && Utils.isDeadlineNear(aviso.deadline);
        const nearDeadlineClass = isNearDeadline ? 'deadline-near' : '';
        
        const deadlineDisplay = aviso.deadline ? 
            `<div class="text-sm text-gray-600 mt-2">
                <i class="material-icons mr-2">schedule</i>
                Prazo: ${Utils.formatDate(aviso.deadline)}
                ${isNearDeadline ? '<i class="material-icons text-red-500 ml-2">warning</i>' : ''}
            </div>` : '';

        return $(`
            <div class="bg-white rounded-lg shadow-md border ${urgencyClass} ${nearDeadlineClass} hover:shadow-lg transition-shadow">
                <div class="p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="flex-shrink-0">
                                <div class="w-10 h-10 ${categoryClass} rounded-full flex items-center justify-center">
                                    <i class="${Utils.getCategoryIcon(aviso.categoria)} text-gray-700"></i>
                                </div>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">${aviso.titulo}</h3>
                                <div class="flex items-center space-x-4 text-sm text-gray-500">
                                    <span class="capitalize">${aviso.categoria}</span>
                                    <span class="${Utils.getUrgencyColor(aviso.urgencia)} font-medium">
                                        ${Utils.getUrgencyText(aviso.urgencia)}
                                    </span>
                                    <span>${aviso.materia}</span>
                                    ${aviso.dependencia ? '<span class="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">Dependência</span>' : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <p class="text-gray-700 mb-4">${aviso.descricao}</p>
                    
                    ${aviso.informacoesAdicionais ? `<div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                        <p class="text-blue-700 text-sm">${aviso.informacoesAdicionais}</p>
                    </div>` : ''}
                    
                    <div class="flex items-center justify-between text-sm text-gray-500">
                        <span>Criado em: ${Utils.formatDate(aviso.createdAt)}</span>
                        ${deadlineDisplay}
                    </div>
                </div>
            </div>
        `);
    }

    function createHistoricoCard(aviso) {
        return $(`
            <div class="bg-gray-50 rounded-lg shadow border-l-4 border-gray-400 opacity-75">
                <div class="p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="flex-shrink-0">
                                <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <i class="${Utils.getCategoryIcon(aviso.categoria)} text-gray-600"></i>
                                </div>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-700">${aviso.titulo}</h3>
                                <div class="flex items-center space-x-4 text-sm text-gray-500">
                                    <span class="capitalize">${aviso.categoria}</span>
                                    <span>${aviso.materia}</span>
                                    ${aviso.dependencia ? '<span class="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">Dependência</span>' : ''}
                                </div>
                            </div>
                        </div>
                                                <a href="#" class="text-gray-500 hover:text-gray-700" data-filter="historico">
                            <i class="material-icons mr-1">history</i>Histórico
                        </a>
                    </div>
                    
                    <p class="text-gray-600 mb-4">${aviso.descricao}</p>
                    
                    <div class="flex items-center justify-between text-sm text-gray-500">
                        <span>Movido para histórico: ${Utils.formatDate(aviso.movedToHistoryAt)}</span>
                        ${aviso.deadline ? `<span>Deadline era: ${Utils.formatDate(aviso.deadline)}</span>` : ''}
                    </div>
                </div>
            </div>
        `);
    }

    function applyFilters() {
        currentFilters = {
            categoria: $('#filterCategoria').val(),
            urgencia: $('#filterUrgencia').val(),
            materia: $('#filterMateria').val(),
            dependencia: $('#filterDependencia').val()
        };

        // Remover filtros vazios
        Object.keys(currentFilters).forEach(key => {
            if (!currentFilters[key]) {
                delete currentFilters[key];
            }
        });

        // Update active filters display
        updateActiveFiltersDisplay();
        
        loadAvisos();
    }

    function clearFilters() {
        $('#filterCategoria, #filterUrgencia, #filterMateria, #filterDependencia').val('');
        currentFilters = {};
        updateActiveFiltersDisplay();
        loadAvisos();
    }

    function clearAllFilters() {
        clearFilters();
    }

    function toggleFiltersCollapse() {
        filtersCollapsed = !filtersCollapsed;
        const filterContent = $('#filterContent');
        const toggleIcon = $('#filterToggleIcon');
        
        if (filtersCollapsed) {
            filterContent.removeClass('expanded');
            toggleIcon.addClass('rotated');
        } else {
            filterContent.addClass('expanded');
            toggleIcon.removeClass('rotated');
        }
    }

    function updateActiveFiltersDisplay() {
        const flagsContainer = $('#activeFilterFlags');
        const clearAllBtn = $('#clearAllFilters');
        
        flagsContainer.empty();
        
        const hasActiveFilters = Object.keys(currentFilters).length > 0;
        
        if (hasActiveFilters) {
            clearAllBtn.removeClass('hidden');
            
            // Create flags for each active filter
            Object.entries(currentFilters).forEach(([filterType, filterValue]) => {
                const flag = createFilterFlag(filterType, filterValue);
                flagsContainer.append(flag);
            });
        } else {
            clearAllBtn.addClass('hidden');
        }
    }

    function createFilterFlag(filterType, filterValue) {
        const flagText = getFilterDisplayText(filterType, filterValue);
        const flagClass = getFilterFlagClass(filterType, filterValue);
        
        const flag = $(`
            <div class="filter-flag ${flagClass}" data-filter-type="${filterType}">
                <span>${flagText}</span>
                <div class="filter-flag-remove" data-filter-type="${filterType}">
                    <i class="material-icons">close</i>
                </div>
            </div>
        `);
        
        // Add click handler to remove individual filter
        flag.find('.filter-flag-remove').click(function(e) {
            e.stopPropagation();
            removeFilter(filterType);
        });
        
        return flag;
    }

    function getFilterDisplayText(filterType, filterValue) {
        const displayTexts = {
            categoria: {
                provas: 'Provas',
                trabalhos: 'Trabalhos', 
                comunicados: 'Comunicados',
                noticias: 'Notícias',
                divulgacao: 'Divulgação'
            },
            urgencia: {
                alta: 'Alta Urgência',
                media: 'Média Urgência',
                baixa: 'Baixa Urgência'
            },
            dependencia: {
                'true': 'Dependência',
                'false': 'Regular'
            }
        };

        // Para matérias, usar o valor diretamente do banco
        if (filterType === 'materia') {
            return filterValue;
        }

        return displayTexts[filterType]?.[filterValue] || filterValue;
    }

    function getFilterFlagClass(filterType, filterValue) {
        if (filterType === 'categoria') {
            return `categoria-${filterValue}`;
        }
        if (filterType === 'urgencia') {
            return `urgencia-${filterValue}`;
        }
        if (filterType === 'dependencia' && filterValue === 'true') {
            return 'dependencia';
        }
        return '';
    }

    function removeFilter(filterType) {
        // Remove from currentFilters
        delete currentFilters[filterType];
        
        // Clear the select element
        $(`#filter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`).val('');
        
        // Update display and reload
        updateActiveFiltersDisplay();
        loadAvisos();
    }

    function toggleHistorico() {
        showingHistory = !showingHistory;
        
        if (showingHistory) {
            $('#aviosAtivos').addClass('hidden');
            $('#avisoHistorico').removeClass('hidden');
            $('#toggleHistorico').html('<i class="material-icons mr-2">list</i>Avisos Ativos');
        } else {
            $('#aviosAtivos').removeClass('hidden');
            $('#avisoHistorico').addClass('hidden');
            $('#toggleHistorico').html('<i class="material-icons mr-2">history</i>Histórico');
        }
        
        loadAvisos();
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

    // Auto-atualizar a cada 5 minutos para verificar deadlines
    setInterval(async () => {
        try {
            await DatabaseManager.checkExpiredDeadlines();
            if (!showingHistory) {
                await loadAvisos();
            }
        } catch (error) {
            console.error('Erro na atualização automática:', error);
        }
    }, 5 * 60 * 1000); // 5 minutos
});