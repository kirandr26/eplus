/*************************
 * CONFIG
 *************************/
const API_URL = 'http://13.233.14.66:3003';
const authToken = localStorage.getItem('token');

/*************************
 * TOAST FUNCTION
 *************************/
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `mytoast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

/*************************
 * LOGIN HANDLER (SAFE)
 *************************/
const loginBtn = document.getElementById('loginBtn');

if (loginBtn) {
    loginBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;

        if (!email || !password) {
            showToast('Please enter email and password', 'error');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';

        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.error === null) {
                showToast(data.message || 'Login successful!', 'success');

                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                localStorage.setItem('isLoggedIn', 'true');

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showToast(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            showToast('Network error. Try again.', 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Log In';
        }
    });
}

/*************************
 * DASHBOARD DATA
 *************************/
async function fetchDashboardData() {
    if (!authToken) return;

    try {
        const response = await fetch(
            `${API_URL}/api/adminServices/adminDashboard/dashboard`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) throw new Error('Dashboard fetch failed');

        const result = await response.json();
        if (!result.status || !result.data) return;

        const data = result.data;

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value ?? 0;
        };

        setText('studentsCount', data.active_students || data.total_students);
        setText('teachersCount', data.active_teachers || data.total_teachers);
        setText('eventsCount', data.upcoming_holidays_count);
        setText('spresentCount', data.students_absent_today);
        setText('fpresentCount', data.teachers_absent_today);

        console.log('Dashboard loaded:', data);
    } catch (err) {
        console.error(err);
        showToast('Failed to load dashboard', 'error');
    }
}

/*************************
 * HOLIDAYS API
 *************************/
async function fetchHolidays(year, month) {
    if (!authToken) return [];

    try {
        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

        const response = await fetch(
            `${API_URL}/api/adminServices/adminDashboard/dashboard/holidays?start_date=${startDate}&end_date=${endDate}`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const result = await response.json();
        return result.status ? result.data.holidays : [];
    } catch (error) {
        console.error('Holiday fetch error', error);
        return [];
    }
}

/*************************
 * CALENDAR
 *************************/
let currentDate = new Date();

async function renderCalendar() {
    const tbody = document.getElementById('calendar-body');
    const monthLabel = document.getElementById('current-month');
    if (!tbody || !monthLabel) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ];

    monthLabel.textContent = `${monthNames[month]} ${year}`;

    // Fetch holidays
    const holidays = await fetchHolidays(year, month);
    const holidayMap = new Map();

    holidays.forEach(h => {
        let d = new Date(h.date_start);
        const end = new Date(h.date_end);
        while (d <= end) {
            holidayMap.set(d.toISOString().split('T')[0], h.name);
            d.setDate(d.getDate() + 1);
        }
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentMonth =
        today.getFullYear() === year &&
        today.getMonth() === month;

    let day = 1;
    let nextDay = 1;
    let html = '';

    for (let week = 0; week < 6; week++) {
        html += '<tr>';

        for (let dow = 0; dow < 7; dow++) {
            const cellIndex = week * 7 + dow;

            // Previous month days
            if (cellIndex < firstDay) {
                html += `
                    <td class="inactive">
                        ${prevMonthDays - firstDay + cellIndex + 1}
                    </td>
                `;
            }

           // Current month days
            else if (day <= daysInMonth) {
                const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const isHoliday = holidayMap.has(dateStr);
                const isToday = isCurrentMonth && today.getDate() === day;

                let classes = '';
                if (isHoliday) classes += ' holiday';
                if (isToday) classes += ' today';

                let holidayAttr = '';
                if (isHoliday) {
                    holidayAttr = `data-holiday="${holidayMap.get(dateStr)}"`;
                }

                // ---- UPDATED CONTENT ----
                let content = `<span class="date-number">${day}</span>`;

                if (isHoliday) {
                    content = `
                        <span class="holiday-date" title="${holidayMap.get(dateStr)}">
                            ${day}
                        </span>
                    `;
                }

                // if (isToday) {
                //     content += `
                //         <span class="today-label">Today</span>
                //     `;
                // }
                // -------------------------

                html += `
                    <td class="${classes.trim()}" ${holidayAttr}>
                        ${content}
                    </td>
                `;
                day++;
            }


            // Next month days
            else {
                html += `
                    <td class="inactive">
                        ${nextDay++}
                    </td>
                `;
            }
        }

        html += '</tr>';
        if (day > daysInMonth) break;
    }

    tbody.innerHTML = html;
}



function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}



// Fetch teachers list
const table = new DataTable('#teachTable', {
    processing: true,
    serverSide: true,

    pageLength: 10,
    lengthChange: false,
    lengthMenu: [5, 10, 25, 50],
    searching: false,
    ordering: false,

    ajax: (data, callback) => {

        const page = Math.floor(data.start / data.length) + 1;
        const limit = data.length;

        fetch(`${API_URL}/api/adminServices/faculty/facultylist?page=${page}&limit=${limit}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            }
        })
        .then(res => res.json())
        .then(res => {

            const rows = res.data.faculties.map(f => ({
                employee_id: f.employee_id,
                name: f.name,
                designation: f.designation || "-",
                email: f.email,
                status: f.status,
                action: f.employee_id
            }));

            callback({
                draw: data.draw,
                recordsTotal: res.data.pagination.total,
                recordsFiltered: res.data.pagination.total,
                data: rows
            });
        })
        .catch(err => {
            console.error("API Error:", err);
            callback({
                draw: data.draw,
                recordsTotal: 0,
                recordsFiltered: 0,
                data: []
            });
        });
    },

    columns: [
        { data: "employee_id", title: "Employee ID" },
        { data: "name", title: "Name" },
        { data: "designation", title: "Designation" },
        { data: "email", title: "Email" },
        {
            data: "status",
            title: "Status",
            render: status => {
                const cls = status === "active" ? "badge-success" : "badge-danger";
                return `<span class="badge ${cls}">${status}</span>`;
            }
        },
        {
            data: "action",
            title: "Action",
            render: id => `
                <a href="/faculty/view/${id}" class="mBtn sBtn">
                    View
                </a>
            `
        }
    ],

    columnDefs: [
        {
            targets: [5],
            orderable: false
        }
    ]
});


const feeTable = new DataTable('#feeSummaryTable', {
    processing: true,
    serverSide: false, // ❗ API returns full list, no pagination params
    paging: true,

    pageLength: 10,
    lengthChange: false,
    searching: false,
    ordering: false,

    ajax: (data, callback) => {

        fetch(`${API_URL}/api/adminServices/student-fees/fee-summary?academic_year_id=1`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            }
        })
        .then(res => res.json())
        .then(res => {

            const rows = res.data.map(item => ({
                standard_name: item.standard_name,
                academic_year: item.academic_year,
                total_students: item.total_students,
                total_fee_amount: item.total_fee_amount,
                total_collected: item.total_collected,
                total_concession: item.total_concession,
                total_pending: item.total_pending,
                collection_rate: item.collection_rate,
                
            }));

            callback({
                data: rows
            });
        })
        .catch(err => {
            console.error("API Error:", err);
            callback({ data: [] });
        });
    },

    columns: [
        { data: "standard_name", title: "Standard" },
        { data: "academic_year", title: "Academic Year" },
        { data: "total_students", title: "Students" },
        {
            data: "total_fee_amount",
            title: "Total Fee",
            render: val => `₹ ${Number(val).toLocaleString()}`
        },
        {
            data: "total_collected",
            title: "Collected",
            render: val => `₹ ${Number(val).toLocaleString()}`
        },
        {
            data: "total_concession",
            title: "Concession",
            render: val => `₹ ${Number(val).toLocaleString()}`
        },
        {
            data: "total_pending",
            title: "Pending",
            render: val => `₹ ${Number(val).toLocaleString()}`
        },
        {
            data: "collection_rate",
            title: "Collection %",
            render: val => `${val}%`
        }
        
    ],

    columnDefs: [
        {
            targets: [7],
            orderable: false
        }
    ]
});



// ---- Layout Class Logic ----
function addIndexedLayoutClasses() {
    $('.dt-layout-row').each(function (index) {
        $(this)
            .removeClass(function (_, cls) {
                return (cls.match(/dt-layout-row-\d+/g) || []).join(' ');
            })
            .addClass('dt-layout-row-' + index);
    });
}

// initial run
addIndexedLayoutClasses();

// run again on redraw
table.on('draw', function () {
    addIndexedLayoutClasses();
});


/*************************
 * INIT
 *************************/
window.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
    renderCalendar();
});
