/* ============================================================
   Portfolio JS — Task 2 (To-Do), Task 3 (GitHub API),
                  Task 4 (YouTube UI), + Navbar effects
   ============================================================ */

/* ===== NAVBAR SCROLL EFFECT ===== */
const mainNav = document.getElementById('mainNav');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
  // Scrolled class
  mainNav.classList.toggle('scrolled', window.scrollY > 50);

  // Active nav link highlighting
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 100) {
      current = sec.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});

// Close navbar on mobile link click
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    const toggler = document.querySelector('.navbar-toggler');
    const navMenu = document.getElementById('navMenu');
    if (navMenu.classList.contains('show')) {
      toggler.click();
    }
  });
});

/* ===== CONTACT FORM (simulated) ===== */
document.getElementById('sendMsgBtn').addEventListener('click', () => {
  const inputs = document.querySelectorAll('.input-custom');
  let filled = true;
  inputs.forEach(i => { if (!i.value.trim()) filled = false; });

  if (!filled) {
    inputs.forEach(i => {
      if (!i.value.trim()) i.style.borderColor = 'var(--red)';
      else i.style.borderColor = 'var(--border)';
    });
    return;
  }

  const btn = document.getElementById('sendMsgBtn');
  const success = document.getElementById('contactSuccess');
  btn.textContent = 'Sending...';
  btn.disabled = true;

  setTimeout(() => {
    success.classList.remove('d-none');
    btn.textContent = 'Send Message';
    btn.disabled = false;
    inputs.forEach(i => { i.value = ''; i.style.borderColor = 'var(--border)'; });
    setTimeout(() => success.classList.add('d-none'), 4000);
  }, 1200);
});

/* ============================================================
   TASK 2 — TO-DO LIST APP (DOM Manipulation)
   ============================================================ */
const todoInput = document.getElementById('todoInput');
const todoAddBtn = document.getElementById('todoAddBtn');
const todoList = document.getElementById('todoList');
const todoCount = document.getElementById('todoCount');
const clearDoneBtn = document.getElementById('clearDoneBtn');
const filterBtns = document.querySelectorAll('.filter-btn');

let todos = JSON.parse(localStorage.getItem('portfolio_todos') || '[]');
let currentFilter = 'all';

function saveTodos() {
  localStorage.setItem('portfolio_todos', JSON.stringify(todos));
}

function renderTodos() {
  todoList.innerHTML = '';
  const filtered = todos.filter(t => {
    if (currentFilter === 'active') return !t.done;
    if (currentFilter === 'done') return t.done;
    return true;
  });

  if (filtered.length === 0) {
    todoList.innerHTML = `<li style="text-align:center;padding:20px;color:var(--text-muted);font-size:0.88rem;">
      ${currentFilter === 'done' ? 'No completed tasks yet.' : 'No tasks here. Add one above!'}
    </li>`;
  } else {
    filtered.forEach(todo => {
      const li = document.createElement('li');
      li.className = `todo-item${todo.done ? ' done' : ''}`;
      li.dataset.id = todo.id;
      li.innerHTML = `
        <input type="checkbox" class="todo-checkbox" ${todo.done ? 'checked' : ''} />
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <button class="todo-delete" title="Delete"><i class="fas fa-trash-alt"></i></button>
      `;
      todoList.appendChild(li);
    });
  }

  // Update count
  const activeCount = todos.filter(t => !t.done).length;
  todoCount.textContent = `${activeCount} task${activeCount !== 1 ? 's' : ''} left`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) {
    todoInput.focus();
    todoInput.style.borderColor = 'var(--red)';
    setTimeout(() => todoInput.style.borderColor = 'var(--border)', 1000);
    return;
  }
  todos.unshift({ id: Date.now(), text, done: false });
  todoInput.value = '';
  saveTodos();
  renderTodos();
}

// Add todo
todoAddBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

// Toggle / delete via event delegation
todoList.addEventListener('click', e => {
  const li = e.target.closest('.todo-item');
  if (!li) return;
  const id = parseInt(li.dataset.id);

  if (e.target.closest('.todo-checkbox')) {
    const todo = todos.find(t => t.id === id);
    if (todo) { todo.done = !todo.done; saveTodos(); renderTodos(); }
  }

  if (e.target.closest('.todo-delete')) {
    li.style.opacity = '0';
    li.style.transform = 'translateX(20px)';
    li.style.transition = 'all 0.25s ease';
    setTimeout(() => {
      todos = todos.filter(t => t.id !== id);
      saveTodos();
      renderTodos();
    }, 250);
  }
});

// Filter buttons
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTodos();
  });
});

// Clear done
clearDoneBtn.addEventListener('click', () => {
  todos = todos.filter(t => !t.done);
  saveTodos();
  renderTodos();
});

// Add sample todos on first load
if (todos.length === 0) {
  todos = [
    { id: 1, text: 'Build portfolio website', done: true },
    { id: 2, text: 'Integrate GitHub API', done: false },
    { id: 3, text: 'Clone YouTube UI', done: false },
    { id: 4, text: 'Deploy to GitHub Pages', done: false },
  ];
  saveTodos();
}

renderTodos();

/* ============================================================
   TASK 3 — GITHUB API (Fetch API + Loading/Error/Search)
   ============================================================ */
const ghInput = document.getElementById('ghInput');
const ghSearchBtn = document.getElementById('ghSearchBtn');
const ghLoading = document.getElementById('ghLoading');
const ghError = document.getElementById('ghError');
const ghResult = document.getElementById('ghResult');
const ghRepoList = document.getElementById('ghRepoList');

function showGhState(state) {
  ghLoading.classList.add('d-none');
  ghError.classList.add('d-none');
  ghResult.classList.add('d-none');
  ghRepoList.innerHTML = '';
  if (state === 'loading') ghLoading.classList.remove('d-none');
  if (state === 'error') ghError.classList.remove('d-none');
  if (state === 'result') ghResult.classList.remove('d-none');
}

async function searchGitHub() {
  const username = ghInput.value.trim();
  if (!username) {
    ghInput.focus();
    ghInput.style.borderColor = 'var(--red)';
    setTimeout(() => ghInput.style.borderColor = 'var(--border)', 1000);
    return;
  }

  showGhState('loading');
  ghSearchBtn.disabled = true;

  try {
    const [userRes, repoRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=6`)
    ]);

    if (!userRes.ok) {
      if (userRes.status === 404) throw new Error(`User "${username}" not found on GitHub.`);
      if (userRes.status === 403) throw new Error('GitHub API rate limit exceeded. Please try again later.');
      throw new Error(`GitHub API error: ${userRes.status}`);
    }

    const user = await userRes.json();
    const repos = await repoRes.json();

    // Populate user card
    document.getElementById('ghAvatar').src = user.avatar_url;
    document.getElementById('ghName').textContent = user.name || user.login;
    document.getElementById('ghLogin').textContent = `@${user.login}`;
    document.getElementById('ghLogin').href = user.html_url;
    document.getElementById('ghBio').textContent = user.bio || '';
    document.getElementById('ghFollowers').textContent = user.followers.toLocaleString();
    document.getElementById('ghFollowing').textContent = user.following.toLocaleString();
    document.getElementById('ghRepos').textContent = user.public_repos.toLocaleString();

    const locEl = document.getElementById('ghLocation');
    locEl.innerHTML = user.location ? `<i class="fas fa-map-marker-alt"></i> ${user.location}` : '';

    const blogEl = document.getElementById('ghBlog');
    blogEl.innerHTML = user.blog ? `<a href="${user.blog}" target="_blank" style="color:var(--accent)">${user.blog}</a>` : '';

    showGhState('result');

    // Render repos
    if (repos.length > 0) {
      const grid = document.createElement('div');
      grid.className = 'row g-3';

      repos.forEach(repo => {
        const col = document.createElement('div');
        col.className = 'col-md-6';
        col.innerHTML = `
          <div class="gh-repo-card">
            <h6><a href="${repo.html_url}" target="_blank" style="color:var(--accent);text-decoration:none">${repo.name}</a></h6>
            <p>${repo.description || 'No description provided.'}</p>
            <div class="repo-meta">
              ${repo.language ? `<span><i class="fas fa-circle" style="font-size:0.6rem;color:var(--accent)"></i> ${repo.language}</span>` : ''}
              <span><i class="fas fa-star"></i> ${repo.stargazers_count.toLocaleString()}</span>
              <span><i class="fas fa-code-branch"></i> ${repo.forks_count.toLocaleString()}</span>
            </div>
          </div>
        `;
        grid.appendChild(col);
      });

      const heading = document.createElement('h6');
      heading.style.cssText = 'color:var(--text-secondary);font-family:var(--font-mono);font-size:0.8rem;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;';
      heading.textContent = 'Top Repositories';
      ghRepoList.appendChild(heading);
      ghRepoList.appendChild(grid);
    }

  } catch (err) {
    showGhState('error');
    ghError.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${err.message}`;
  } finally {
    ghSearchBtn.disabled = false;
  }
}

ghSearchBtn.addEventListener('click', searchGitHub);
ghInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchGitHub(); });

/* ============================================================
   TASK 4 — YOUTUBE UI CLONE (Mock Data + Filter)
   ============================================================ */
const ytVideos = [
  { id: 1, title: 'Build a Full-Stack App with React & Node.js', channel: 'CodeWithMe', views: '1.2M views', time: '3 days ago', duration: '45:32', color: '#6c63ff', thumb: 'https://picsum.photos/seed/v1/400/225', cat: 'coding' },
  { id: 2, title: 'Top 10 Gaming Moments of 2025', channel: 'GameZone', views: '800K views', time: '1 week ago', duration: '18:44', color: '#10b981', thumb: 'https://picsum.photos/seed/v2/400/225', cat: 'gaming' },
  { id: 3, title: 'Lofi Hip Hop Radio — Beats to Study & Relax', channel: 'ChillBeats', views: '12M views', time: '2 weeks ago', duration: 'LIVE', color: '#f59e0b', thumb: 'https://picsum.photos/seed/v3/400/225', cat: 'music' },
  { id: 4, title: 'Breaking: Global Tech Summit 2025 Recap', channel: 'TechNews Daily', views: '345K views', time: '5 hours ago', duration: '12:09', color: '#ef4444', thumb: 'https://picsum.photos/seed/v4/400/225', cat: 'news' },
  { id: 5, title: 'How to Master CSS Grid in 30 Minutes', channel: 'DevTips', views: '2.4M views', time: '1 month ago', duration: '29:55', color: '#3b82f6', thumb: 'https://picsum.photos/seed/v5/400/225', cat: 'coding' },
  { id: 6, title: 'Champions League Highlights — Quarter Finals', channel: 'SportsCentral', views: '5.1M views', time: '2 days ago', duration: '22:18', color: '#22c55e', thumb: 'https://picsum.photos/seed/v6/400/225', cat: 'sports' },
  { id: 7, title: 'Italian Pasta from Scratch — Full Tutorial', channel: 'Chef Marco', views: '987K views', time: '3 weeks ago', duration: '38:00', color: '#f97316', thumb: 'https://picsum.photos/seed/v7/400/225', cat: 'cooking' },
  { id: 8, title: 'Tokyo Travel Guide 2025 — Hidden Gems', channel: 'WanderlustVlog', views: '450K views', time: '4 days ago', duration: '24:15', color: '#ec4899', thumb: 'https://picsum.photos/seed/v8/400/225', cat: 'travel' },
  { id: 9, title: 'JavaScript Async/Await Explained Simply', channel: 'JS Mastery', views: '3.8M views', time: '6 months ago', duration: '16:42', color: '#a855f7', thumb: 'https://picsum.photos/seed/v9/400/225', cat: 'learning' },
  { id: 10, title: 'Best Indie Games You Missed in 2025', channel: 'IndiePixel', views: '210K views', time: '1 week ago', duration: '31:07', color: '#06b6d4', thumb: 'https://picsum.photos/seed/v10/400/225', cat: 'gaming' },
  { id: 11, title: 'Morning Jazz — Smooth Coffee Vibes', channel: 'JazzStation', views: '6.7M views', time: '2 months ago', duration: 'LIVE', color: '#d97706', thumb: 'https://picsum.photos/seed/v11/400/225', cat: 'music' },
  { id: 12, title: 'Spain Itinerary — 10 Days on a Budget', channel: 'BudgetTraveler', views: '730K views', time: '3 weeks ago', duration: '41:50', color: '#dc2626', thumb: 'https://picsum.photos/seed/v12/400/225', cat: 'travel' },
];

function renderYtGrid(filter = 'all') {
  const ytGrid = document.getElementById('ytGrid');
  const filtered = filter === 'all' ? ytVideos : ytVideos.filter(v => v.cat === filter);

  ytGrid.innerHTML = filtered.map(v => `
    <div class="yt-card">
      <div class="yt-thumb">
        <img src="${v.thumb}" alt="${v.title}" loading="lazy" />
        <span class="yt-duration">${v.duration}</span>
      </div>
      <div class="yt-card-meta">
        <div class="yt-channel-avatar" style="background:${v.color}">${v.channel[0]}</div>
        <div class="yt-card-info">
          <h6>${v.title}</h6>
          <div class="yt-channel-name">${v.channel}</div>
          <div class="yt-views">${v.views} · ${v.time}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// Category pill filter
document.getElementById('ytPills').addEventListener('click', e => {
  const pill = e.target.closest('.yt-pill');
  if (!pill) return;
  document.querySelectorAll('.yt-pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
  renderYtGrid(pill.dataset.cat);
});

// YouTube search filter
document.getElementById('ytSearchInput').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  if (!q) { renderYtGrid('all'); return; }
  const filtered = ytVideos.filter(v =>
    v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q)
  );
  const ytGrid = document.getElementById('ytGrid');
  ytGrid.innerHTML = filtered.length === 0
    ? `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-search" style="font-size:2rem;margin-bottom:12px;display:block"></i>No results for "${q}"</div>`
    : filtered.map(v => `
        <div class="yt-card">
          <div class="yt-thumb">
            <img src="${v.thumb}" alt="${v.title}" loading="lazy" />
            <span class="yt-duration">${v.duration}</span>
          </div>
          <div class="yt-card-meta">
            <div class="yt-channel-avatar" style="background:${v.color}">${v.channel[0]}</div>
            <div class="yt-card-info">
              <h6>${v.title}</h6>
              <div class="yt-channel-name">${v.channel}</div>
              <div class="yt-views">${v.views} · ${v.time}</div>
            </div>
          </div>
        </div>
      `).join('');
});

// Initial render
renderYtGrid();
