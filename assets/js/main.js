// Toggle action

const toggleBtn = document.querySelector('.sideBar_toggleBtn');
const sidebar = document.querySelector('.sideBar');
const menuLinks  = document.querySelector('.sideBar_menu ul li');
const toggleIcon = toggleBtn.querySelector('.material-symbols-outlined');

toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');

    if (sidebar.classList.contains('collapsed')) {
        toggleIcon.textContent = 'chevron_right';
    } else {
        toggleIcon.textContent = 'chevron_left';
        sidebarMenuList.add('hidden')
    }
});



const API_URL = 'http://13.233.14.66:3003';

/* TOAST FUNCTION */
function showToast(message, type = 'success') {
    const toastcontainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');

    toast.className = `mytoast ${type}`;
    toast.textContent = message;

    toastcontainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/* LOGIN HANDLER */
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');

    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
		console.log(data)
        if (data.error === null) {

            showToast(data.message || 'Login successful! Redirecting...', 'success');

            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            localStorage.setItem('isLoggedIn', 'true');

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 3000);

        } else {
            showToast(data.message || 'Login failed. Please check your credentials.', 'error');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Log In';
        }

    } catch (error) {
        showToast('Network error. Please check your connection.', 'error');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log In';
    }
});
