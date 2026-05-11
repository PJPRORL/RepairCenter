document.addEventListener('DOMContentLoaded', function () {
            
    const initialData = [
        { id: 81731, klant: 'Thys, Joren', lastUpdated: '2025-08-05T12:00:00.000Z', status: 'SPOED', aanwezig: false, opmerking: [] },
        { id: 81729, klant: 'Willems, Pieter', lastUpdated: '2025-08-05T11:00:00.000Z', status: 'SPOED', aanwezig: false, opmerking: ['Wacht op specifiek onderdeel'] },
        { id: 81728, klant: 'Coppens, Bart', lastUpdated: '2025-08-04T10:00:00.000Z', status: 'In behandeling', aanwezig: false, opmerking: [] },
        { id: 81727, klant: 'Peeters, Greet', lastUpdated: '2025-08-04T09:00:00.000Z', status: 'In behandeling', aanwezig: false, opmerking: [] },
        { id: 81726, klant: 'Verhoeven, An', lastUpdated: '2025-08-01T15:00:00.000Z', status: 'In behandeling', aanwezig: false, opmerking: [] },
        { id: 81725, klant: 'De Smet, Jan', lastUpdated: '2025-08-01T14:00:00.000Z', status: 'In behandeling', aanwezig: false, opmerking: [] },
        { id: 81724, klant: 'Mertens, Sofie', lastUpdated: '2025-08-01T13:00:00.000Z', status: 'In wacht', aanwezig: false, opmerking: ['Klant gecontacteerd'] },
        { id: 81723, klant: 'Claes, Tom', lastUpdated: '2025-07-31T12:00:00.000Z', status: 'In wacht', aanwezig: false, opmerking: [] },
        { id: 81722, klant: 'Wouters, Els', lastUpdated: '2025-07-31T11:00:00.000Z', status: 'Afgewerkt', aanwezig: false, opmerking: ['Klaar voor ophaling'] },
        { id: 81721, klant: 'Jacobs, Dirk', lastUpdated: '2025-07-31T10:00:00.000Z', status: 'RMA', aanwezig: false, opmerking: ['Verzonden naar fabrikant'] }
    ];

    let repairsData = [];

    const statusOptions = ['SPOED', 'In behandeling', 'In wacht', 'RMA', 'Afgewerkt'];
    const statusColors = {
        'SPOED': 'status-spoed',
        'In behandeling': 'status-in-behandeling',
        'In wacht': 'status-in-wacht',
        'RMA': 'status-rma',
        'Afgewerkt': 'status-afgewerkt'
    };

    const favicon = document.getElementById('favicon');
    const originalFaviconHref = favicon.href;
    const tableBody = document.getElementById('repairs-table-body');
    const searchInput = document.getElementById('search-input');
    const filterButtonsContainer = document.getElementById('filter-buttons');
    const noResultsMessage = document.getElementById('no-results');
    
    const addRepairBtn = document.getElementById('add-repair-btn');
    const repairModal = document.getElementById('add-repair-modal');
    const repairModalContainer = repairModal.querySelector('.modal-container');
    const closeRepairModalBtn = document.getElementById('close-repair-modal-btn');
    const addRepairForm = document.getElementById('add-repair-form');

    const commentModal = document.getElementById('add-comment-modal');
    const commentModalContainer = commentModal.querySelector('.modal-container');
    const closeCommentModalBtn = document.getElementById('close-comment-modal-btn');
    const addCommentForm = document.getElementById('add-comment-form');
    const commentRepairIdInput = document.getElementById('comment-repair-id');

    const notesList = document.getElementById('notes-list');
    const noNotesMessage = document.getElementById('no-notes');
    const printBtn = document.getElementById('print-btn');
    const notificationBanner = document.getElementById('notification-banner');
    const notificationText = document.getElementById('notification-text');

    let currentFilter = 'all';
    let chartInstance = null;

    function saveData() {
        localStorage.setItem('herstellingenData', JSON.stringify(repairsData));
    }

    function loadData() {
        const savedData = localStorage.getItem('herstellingenData');
        if (savedData) {
            repairsData = JSON.parse(savedData);
        } else {
            repairsData = initialData;
        }
    }

    function renderTable(data) {
        tableBody.innerHTML = '';
        if (data.length === 0) {
            noResultsMessage.classList.remove('hidden');
            tableBody.classList.add('hidden');
        } else {
            noResultsMessage.classList.add('hidden');
            tableBody.classList.remove('hidden');
        }

        data.forEach(repair => {
            const row = document.createElement('tr');
            const lastUpdateDate = new Date(repair.lastUpdated);
            const isOverdue = (new Date() - lastUpdateDate) / (1000 * 60 * 60 * 24) > 2;

            row.className = `bg-white border-b hover:bg-slate-50 transition ${repair.aanwezig ? 'table-row-checked' : ''}`;
            row.dataset.id = repair.id;

            const selectOptions = statusOptions.map(option =>
                `<option value="${option}" ${repair.status === option ? 'selected' : ''}>${option}</option>`
            ).join('');
            
            const statusBadgeClass = statusColors[repair.status] || 'bg-slate-200 text-slate-800';
            
            const commentsDropdown = repair.opmerking.length > 0 ?
                repair.opmerking.map((opm, index) => `
                    <li class="text-xs text-slate-600 p-1.5 bg-slate-50 rounded flex justify-between items-center">
                        <span class="mr-2">${opm}</span>
                        <button class="delete-comment-btn text-red-400 hover:text-red-600 font-bold" data-repair-id="${repair.id}" data-comment-index="${index}" title="Verwijder opmerking">&times;</button>
                    </li>
                `).join('') :
                '<li class="text-xs text-slate-400 p-1">Nog geen opmerkingen.</li>';

            row.innerHTML = `
                <td class="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">${repair.id}</td>
                <td class="px-6 py-4">${repair.klant}</td>
                <td class="px-6 py-4 ${isOverdue ? 'text-red-500 font-bold' : ''}">${lastUpdateDate.toLocaleDateString('nl-BE')}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <span class="status-badge ${statusBadgeClass}">${repair.status}</span>
                        <select class="status-select border-slate-300 rounded-md text-xs p-1" data-id="${repair.id}">
                            ${selectOptions}
                        </select>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <details class="relative">
                        <summary class="cursor-pointer font-medium text-blue-600 hover:text-blue-800">
                            ${repair.opmerking.length} opmerking(en)
                        </summary>
                        <ul class="comments-list mt-2 space-y-1 p-2 bg-white border rounded-md shadow-lg w-64 absolute z-10">
                            ${commentsDropdown}
                        </ul>
                    </details>
                </td>
                <td class="px-6 py-4 text-center">
                    <input type="checkbox" class="presence-checkbox h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" data-id="${repair.id}" ${repair.aanwezig ? 'checked' : ''}>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex justify-center items-center gap-2">
                        <button class="add-comment-btn p-1.5 rounded-md hover:bg-slate-200 transition" title="Opmerking toevoegen" data-id="${repair.id}">
                            <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        </button>
                        <button class="delete-repair-btn p-1.5 rounded-md hover:bg-red-100 transition" title="Herstelling verwijderen" data-id="${repair.id}">
                            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    function renderNotes() {
        const notesWithContent = repairsData
            .flatMap((r) => r.opmerking.map((opm, commentIndex) => ({ id: r.id, klant: r.klant, opmerking: opm, commentIndex })))
            .filter(n => n.opmerking && n.opmerking.trim() !== '');

        notesList.innerHTML = '';

        if (notesWithContent.length === 0) {
            noNotesMessage.classList.remove('hidden');
        } else {
            noNotesMessage.classList.add('hidden');
            notesWithContent.reverse().forEach(note => {
                const li = document.createElement('li');
                li.className = 'p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-start';
                li.innerHTML = `
                    <div>
                        <p class="text-slate-800">${note.opmerking}</p>
                        <p class="text-xs text-slate-500 mt-2">Herstelling #${note.id} - ${note.klant}</p>
                    </div>
                    <button class="delete-comment-btn-mainlist text-red-400 hover:text-red-600 font-bold ml-4" data-repair-id="${note.id}" data-comment-index="${note.commentIndex}" title="Verwijder opmerking">&times;</button>
                `;
                notesList.appendChild(li);
            });
        }
    }

    function updateAll() {
        saveData();
        checkOverdueRepairs();
        filterAndRender();
        updateDashboard();
        renderNotes();
    }

    function updateDashboard() {
        const total = repairsData.length;
        const urgent = repairsData.filter(r => r.status === 'SPOED').length;
        const waiting = repairsData.filter(r => r.status === 'In wacht').length;
        const checked = repairsData.filter(r => r.aanwezig).length;

        document.getElementById('total-repairs').textContent = total;
        document.getElementById('urgent-repairs').textContent = urgent;
        document.getElementById('waiting-repairs').textContent = waiting;
        document.getElementById('checked-repairs').textContent = checked;

        updateChart();
    }
    
    function updateChart() {
        const ctx = document.getElementById('repairsChart').getContext('2d');
        const chartLabels = ['SPOED', 'In behandeling', 'In wacht', 'Afgewerkt', 'RMA'];
        const data = chartLabels.map(status => repairsData.filter(r => r.status === status).length);

        if(chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Aantal Herstellingen',
                    data: data,
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.6)',
                        'rgba(59, 130, 246, 0.6)',
                        'rgba(245, 158, 11, 0.6)',
                        'rgba(34, 197, 94, 0.6)',
                        'rgba(239, 68, 68, 0.4)'
                    ],
                    borderColor: [
                        'rgba(239, 68, 68, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderWidth: 1,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#e2e8f0' },
                        ticks: { color: '#64748b', stepSize: 1 }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                          color: '#64748b',
                          maxRotation: 0,
                          minRotation: 0,
                          callback: function(value) {
                              const label = this.getLabelForValue(value);
                              if (label.length > 16) { return label.split('\n'); }
                              return label;
                          }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 12 },
                        padding: 12,
                        cornerRadius: 6,
                        displayColors: false
                    }
                }
            }
        });
    }

    function filterAndRender() {
        const searchTerm = searchInput.value.toLowerCase();
        let filteredData = [...repairsData].sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

        if (currentFilter !== 'all') {
            filteredData = filteredData.filter(r => r.status === currentFilter);
        }

        if (searchTerm) {
            filteredData = filteredData.filter(r => 
                r.klant.toLowerCase().includes(searchTerm) || 
                String(r.id).includes(searchTerm)
            );
        }
        
        renderTable(filteredData);
    }
    
    function showModal(modal, container) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            container.classList.remove('scale-95');
        }, 10);
    }

    function hideModal(modal, container) {
        modal.classList.add('opacity-0');
        container.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }

    function deleteRepair(repairId) {
        if (confirm(`Weet u zeker dat u herstelling #${repairId} wilt verwijderen?`)) {
            repairsData = repairsData.filter(r => r.id !== repairId);
            updateAll();
        }
    }

    function deleteComment(repairId, commentIndex) {
         if (confirm(`Weet u zeker dat u deze opmerking wilt verwijderen?`)) {
            const repair = repairsData.find(r => r.id === repairId);
            if (repair) {
                repair.opmerking.splice(commentIndex, 1);
                repair.lastUpdated = new Date().toISOString();
                updateAll();
            }
        }
    }

    function setNotificationFavicon() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = originalFaviconHref;
        img.onload = () => {
            ctx.drawImage(img, 0, 0, 32, 32);
            ctx.beginPath();
            ctx.arc(24, 8, 8, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
            favicon.href = canvas.toDataURL('image/png');
        };
    }

    function resetFavicon() {
        favicon.href = originalFaviconHref;
    }

    function checkOverdueRepairs() {
        const now = new Date();
        const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
        const overdueRepairs = repairsData.filter(r => {
            const lastUpdate = new Date(r.lastUpdated);
            return (now - lastUpdate) > twoDaysInMs && r.status !== 'Afgewerkt';
        });

        if (overdueRepairs.length > 0) {
            const overdueIds = overdueRepairs.map(r => `#${r.id}`).join(', ');
            notificationText.textContent = `De volgende herstellingen hebben al meer dan 2 dagen geen update gehad: ${overdueIds}.`;
            notificationBanner.classList.remove('hidden');
            setNotificationFavicon();
        } else {
            notificationBanner.classList.add('hidden');
            resetFavicon();
        }
    }

    addRepairBtn.addEventListener('click', () => showModal(repairModal, repairModalContainer));
    closeRepairModalBtn.addEventListener('click', () => hideModal(repairModal, repairModalContainer));
    repairModal.addEventListener('click', (e) => {
        if (e.target === repairModal) hideModal(repairModal, repairModalContainer);
    });

    closeCommentModalBtn.addEventListener('click', () => hideModal(commentModal, commentModalContainer));
    commentModal.addEventListener('click', (e) => {
        if (e.target === commentModal) hideModal(commentModal, commentModalContainer);
    });
    
    addRepairForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(addRepairForm);
        const newId = parseInt(formData.get('id'));

        if (repairsData.some(r => r.id === newId)) {
            alert('Dit Herstelling ID bestaat al. Kies een uniek ID.');
            return;
        }
        
        const newComment = formData.get('opmerking').trim();

        const newRepair = {
            id: newId,
            klant: formData.get('klant'),
            lastUpdated: new Date().toISOString(),
            status: formData.get('status'),
            aanwezig: false,
            opmerking: newComment ? [newComment] : []
        };
        repairsData.unshift(newRepair);
        updateAll();
        addRepairForm.reset();
        hideModal(repairModal, repairModalContainer);
    });
    
    tableBody.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.add-comment-btn');
        const deleteRepairBtn = e.target.closest('.delete-repair-btn');
        const deleteCommentBtn = e.target.closest('.delete-comment-btn');

        if (addBtn) {
            const repairId = parseInt(addBtn.dataset.id, 10);
            commentRepairIdInput.value = repairId;
            showModal(commentModal, commentModalContainer);
        }

        if (deleteRepairBtn) {
            const repairId = parseInt(deleteRepairBtn.dataset.id, 10);
            deleteRepair(repairId);
        }

        if (deleteCommentBtn) {
            const repairId = parseInt(deleteCommentBtn.dataset.repairId, 10);
            const commentIndex = parseInt(deleteCommentBtn.dataset.commentIndex, 10);
            deleteComment(repairId, commentIndex);
        }
    });

    addCommentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(addCommentForm);
        const repairId = parseInt(formData.get('id'));
        const newComment = formData.get('comment').trim();
        
        const repair = repairsData.find(r => r.id === repairId);
        if (repair && newComment) {
            repair.opmerking.push(newComment);
            repair.lastUpdated = new Date().toISOString();
            updateAll();
        }
        addCommentForm.reset();
        hideModal(commentModal, commentModalContainer);
    });
    
    notesList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-comment-btn-mainlist');
        if (deleteBtn) {
            const repairId = parseInt(deleteBtn.dataset.repairId, 10);
            const commentIndex = parseInt(deleteBtn.dataset.commentIndex, 10);
            deleteComment(repairId, commentIndex);
        }
    });

    searchInput.addEventListener('input', filterAndRender);
    
    filterButtonsContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            currentFilter = e.target.dataset.filter;
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-white', 'text-slate-700');
            });
            e.target.classList.add('bg-blue-600', 'text-white');
            e.target.classList.remove('bg-white', 'text-slate-700');
            filterAndRender();
        }
    });

    tableBody.addEventListener('change', (e) => {
        const target = e.target;
        const repairId = parseInt(target.closest('tr').dataset.id, 10);
        const repair = repairsData.find(r => r.id === repairId);
        if (!repair) return;

        if (target.classList.contains('presence-checkbox')) {
            repair.aanwezig = target.checked;
            saveData(); // Only save, no need for full re-render
            updateDashboard();
        }
        
        if (target.classList.contains('status-select')) {
            repair.status = target.value;
            repair.lastUpdated = new Date().toISOString();
            updateAll();
        }
    });

    printBtn.addEventListener('click', () => {
        window.print();
    });

    loadData();
    updateAll();
});
