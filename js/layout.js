// ========================================================
// Appointy - Layout Renderer (Navbar & Sidebar)
// ========================================================

function renderLayout(role) {
  const adminLinks = `
    <li><a href="dashboard.html"><span class="icon">🏠</span> Dashboard</a></li>
    <li><a href="appointments.html"><span class="icon">📋</span> All Appointments</a></li>
    <li><a href="doctors-list.html"><span class="icon">👨‍⚕️</span> Doctors List</a></li>
    <li><a href="add-doctor.html"><span class="icon">➕</span> Add Doctor</a></li>
    <li><a href="users.html"><span class="icon">👥</span> All Users</a></li>
  `;

  const doctorLinks = `
    <li><a href="dashboard.html"><span class="icon">🏠</span> Dashboard</a></li>
    <li><a href="appointments.html"><span class="icon">📋</span> My Appointments</a></li>
    <li><a href="profile.html"><span class="icon">👤</span> My Profile</a></li>
  `;

  const patientLinks = `
    <li><a href="dashboard.html"><span class="icon">🏠</span> My Appointments</a></li>
    <li><a href="../index.html"><span class="icon">🔍</span> Find Doctors</a></li>
  `;

  let links = adminLinks;
  let label = 'Admin';
  let tokenKey = 'aToken';

  if (role === 'doctor') {
    links = doctorLinks;
    label = 'Doctor';
    tokenKey = 'dToken';
  } else if (role === 'patient') {
    links = patientLinks;
    label = 'Patient';
    tokenKey = 'pToken';
  }

  const token = localStorage.getItem(tokenKey);
  if (!token) {
    window.location.href = `../login.html?role=${role}`;
    return;
  }

  const userPanelBtn = `<button class="btn-userpanel" onclick="window.location.href='../index.html'">Patient Portal ↗</button>`;

  document.body.insertAdjacentHTML('afterbegin', `
    <!-- NAVBAR -->
    <nav class="navbar">
      <div class="navbar-left">
        <div class="navbar-logo" onclick="window.location.href='../index.html'" style="cursor:pointer">Appointy</div>
        <span class="role-badge">${label}</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        ${userPanelBtn}
        <button class="btn-logout" id="logout-btn">Logout</button>
      </div>
    </nav>

    <!-- SIDEBAR -->
    <aside class="sidebar">
      <ul class="sidebar-nav">${links}</ul>
    </aside>
  `);

  // Highlight active link
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  // Logout listener
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem('currentUser');
    window.location.href = '../login.html';
  });
}
