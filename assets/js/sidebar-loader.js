document.addEventListener("DOMContentLoaded", () => {

    // 1. Load sidebar.html
    fetch("sidebar.html")
        .then(response => response.text())
        .then(html => {
            document.querySelector(".sideBar").innerHTML = html;

            // 2. Initialize sidebar toggle AFTER load
            initSidebar();
             // Initialize logout AFTER sidebar is loaded
            initLogout();
        })
        .catch(err => console.error("Sidebar load failed:", err));

    function initSidebar() {
        const sidebar = document.querySelector(".sideBar");
        const toggleBtn = document.querySelector(".sideBar_toggleBtn");
        const toggleIcon = document.querySelector(".slideMenuIcon");

        if (!sidebar || !toggleBtn || !toggleIcon) return;

        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");

            toggleIcon.textContent = sidebar.classList.contains("collapsed")
                ? "chevron_right"
                : "chevron_left";
        });
    }
    function initLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (!logoutBtn) return;

        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');

            window.location.href = '/';
        });
    }
   

});
