const STORAGE_KEY = 'todoTasks';
const form = document.getElementById('todo-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const remainingCount = document.getElementById('remaining-count');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterButtons = document.querySelectorAll('.filter-btn');
const projectFilterInputs = document.querySelectorAll('input[name="project-filter"]');
const projectCards = document.querySelectorAll('.project-card');
const projectLinks = document.querySelectorAll('.project-link');
const projectModal = document.getElementById('project-modal');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const modalAction = document.getElementById('modal-action');
const modalClose = document.querySelector('.modal-close');
const navToggle = document.getElementById('nav-toggle');
const pageNav = document.querySelector('nav');
const navLinks = document.querySelectorAll('nav ul li a');
const apiSearchInput = document.getElementById('api-search');
const apiRefreshButton = document.getElementById('api-refresh');
const apiStatus = document.getElementById('api-status');
const apiCards = document.getElementById('api-cards');

const projectDetails = {
    portfolio: {
        title: 'Portfolio Website',
        description: 'A clean responsive portfolio to display your skills, project highlights, and contact info. Click below to browse the project cards and explore the full portfolio section.',
        actionText: 'Browse Projects',
        actionHref: '#projects'
    },
    app: {
        title: 'To-Do App',
        description: 'A dynamic task manager with add, complete, filter, and clear actions. Click below to open the To-Do app section and start tracking your tasks.',
        actionText: 'Open To-Do App',
        actionHref: '#todo'
    },
    clone: {
        title: 'Netflix Clone',
        description: 'A modern Netflix-inspired UI clone with featured cards and streaming-style layout. Click below to jump to the Netflix clone section and preview the design.',
        actionText: 'View Netflix UI',
        actionHref: '#netflix'
    }
};

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentFilter = 'all';
let currentProjectCategory = 'all';

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getFilteredTasks() {
    return tasks.filter((task) => {
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });
}

function updateRemainingCount() {
    const remaining = tasks.filter((task) => !task.completed).length;
    remainingCount.textContent = `${remaining} task${remaining === 1 ? '' : 's'} left`;
}

function renderTasks() {
    if (!taskList) return;

    const visibleTasks = getFilteredTasks();
    taskList.innerHTML = visibleTasks.length
        ? visibleTasks.map(createTaskItem).join('')
        : '<li class="empty-state">No tasks to show. Add a new task to get started.</li>';

    updateRemainingCount();
}

function createTaskItem(task) {
    return `
        <li class="task-item ${task.completed ? 'completed' : ''}">
            <input class="task-checkbox" type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}" aria-label="Mark task complete">
            <span class="task-label ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</span>
            <div class="task-actions">
                <button type="button" class="remove-task" data-id="${task.id}" aria-label="Remove task">✕</button>
            </div>
        </li>
    `;
}

function escapeHtml(text) {
    return text.replace(/[&<>"]/g, (match) => {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;'
        }[match];
    });
}

function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    tasks.unshift({
        id: Date.now().toString(),
        text: trimmed,
        completed: false,
        createdAt: new Date().toISOString()
    });

    saveTasks();
    renderTasks();
}

function toggleTaskCompletion(taskId) {
    tasks = tasks.map((task) => task.id === taskId ? { ...task, completed: !task.completed } : task);
    saveTasks();
    renderTasks();
}

function removeTask(taskId) {
    tasks = tasks.filter((task) => task.id !== taskId);
    saveTasks();
    renderTasks();
}

function clearCompletedTasks() {
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    renderTasks();
}

function setFilter(filter) {
    currentFilter = filter;
    filterButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.filter === filter);
    });
    renderTasks();
}

function setProjectCategory(category) {
    currentProjectCategory = category;
    projectFilterInputs.forEach((input) => {
        input.parentElement.classList.toggle('active', input.value === category);
    });

    projectCards.forEach((card) => {
        const cardCategory = card.dataset.category;
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

if (projectFilterInputs.length) {
    projectFilterInputs.forEach((input) => {
        input.addEventListener('change', () => {
            if (input.checked) {
                setProjectCategory(input.value);
            }
        });
    });
}

if (projectLinks.length) {
    projectLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const projectKey = link.dataset.project;
            if (projectKey && projectDetails[projectKey]) {
                openProjectModal(projectKey);
            }
        });
    });
}

if (modalClose) {
    modalClose.addEventListener('click', closeProjectModal);
}

if (projectModal) {
    projectModal.addEventListener('click', (event) => {
        if (event.target === projectModal) {
            closeProjectModal();
        }
    });
}

if (modalAction) {
    modalAction.addEventListener('click', () => {
        closeProjectModal();
    });
}

if (navToggle && pageNav) {
    navToggle.addEventListener('click', () => {
        pageNav.classList.toggle('open');
    });
}

if (navLinks.length && pageNav) {
    navLinks.forEach((link) => {
        link.addEventListener('click', () => {
            pageNav.classList.remove('open');
        });
    });
}

window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && pageNav) {
        pageNav.classList.remove('open');
    }
});

function openProjectModal(projectKey) {
    const detail = projectDetails[projectKey];
    if (!detail || !projectModal) return;

    modalTitle.textContent = detail.title;
    modalDescription.textContent = detail.description;
    modalAction.textContent = detail.actionText;
    modalAction.href = detail.actionHref;
    projectModal.classList.add('open');
    projectModal.setAttribute('aria-hidden', 'false');
}

function closeProjectModal() {
    if (!projectModal) return;
    projectModal.classList.remove('open');
    projectModal.setAttribute('aria-hidden', 'true');
}

function setApiStatus(message, isError = false) {
    if (!apiStatus) return;
    apiStatus.textContent = message;
    apiStatus.style.color = isError ? '#f87171' : 'var(--text-muted)';
}

function createApiCard(user) {
    return `
        <article class="api-card">
            <h3>${escapeHtml(user.name)}</h3>
            <p><span>Username:</span> ${escapeHtml(user.username)}</p>
            <p><span>Email:</span> <a href="mailto:${escapeHtml(user.email)}">${escapeHtml(user.email)}</a></p>
            <p><span>City:</span> ${escapeHtml(user.address.city)}</p>
            <p><span>Company:</span> ${escapeHtml(user.company.name)}</p>
            <p><span>Website:</span> <a href="https://${escapeHtml(user.website)}" target="_blank" rel="noreferrer">${escapeHtml(user.website)}</a></p>
        </article>
    `;
}

let apiUsers = [];

function renderApiCards(users) {
    if (!apiCards) return;
    if (!users.length) {
        apiCards.innerHTML = '<p class="api-status">No results found. Try a different search.</p>';
        return;
    }

    apiCards.innerHTML = users.map(createApiCard).join('');
}

function filterApiUsers() {
    const query = apiSearchInput?.value.trim().toLowerCase() || '';
    const results = apiUsers.filter((user) => {
        const value = `${user.name} ${user.username} ${user.address.city}`.toLowerCase();
        return value.includes(query);
    });

    renderApiCards(results);
    setApiStatus(results.length ? `${results.length} results shown.` : 'No matching users found.');
}

async function loadApiData() {
    if (!apiCards) return;
    setApiStatus('Loading data...');
    apiCards.innerHTML = '';

    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        if (!response.ok) throw new Error('Failed to load API data.');
        apiUsers = await response.json();
        filterApiUsers();
    } catch (error) {
        setApiStatus('Unable to fetch API data. Please try again.', true);
        apiCards.innerHTML = '';
        console.error(error);
    }
}

if (apiSearchInput) {
    apiSearchInput.addEventListener('input', filterApiUsers);
}

if (apiRefreshButton) {
    apiRefreshButton.addEventListener('click', loadApiData);
}

if (form && taskInput) {
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        addTask(taskInput.value);
        taskInput.value = '';
        taskInput.focus();
    });
}

if (taskList) {
    taskList.addEventListener('click', (event) => {
        const target = event.target;
        const taskId = target.dataset.id;

        if (target.classList.contains('task-checkbox')) {
            toggleTaskCompletion(taskId);
        }

        if (target.classList.contains('remove-task')) {
            removeTask(taskId);
        }
    });
}

if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', () => {
        clearCompletedTasks();
    });
}

filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        setFilter(button.dataset.filter);
    });
});

window.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    setFilter(currentFilter);
    setProjectCategory(currentProjectCategory);
    loadApiData();
});
