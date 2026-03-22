document.addEventListener('DOMContentLoaded', () => {

    // --- THEME SYSTEM ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    const savedTheme = localStorage.getItem('analyzer_theme') || 'light';
    setTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        setTheme(currentTheme);
        
        if (lastAnalyzedSubjects && lastAnalyzedSubjects.length > 0 && chartInstance) {
            const currentChartType = document.getElementById('chart-type').value || 'bar';
            renderChart(lastAnalyzedSubjects, currentChartType);
        }
    });

    function setTheme(theme) {
        const themeText = document.querySelector('.theme-text');
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeIcon.textContent = '🔆';
            if (themeText) themeText.textContent = 'Light Mode';
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeIcon.textContent = '🌑';
            if (themeText) themeText.textContent = 'Dark Mode';
        }
        localStorage.setItem('analyzer_theme', theme);
    }
    // --- END THEME SYSTEM ---

    // --- AUTHENTICATION SYSTEM ---
    const authContainer = document.getElementById('auth-container');
    const mainAppContainer = document.getElementById('main-app-container');
    const teacherAppContainer = document.getElementById('teacher-app-container');
    const authForm = document.getElementById('auth-form');
    const authUsernameInput = document.getElementById('auth-username');
    const authPasswordInput = document.getElementById('auth-password');
    const authMessage = document.getElementById('auth-message');
    const btnRegister = document.getElementById('btn-register');
    const displayUsername = document.getElementById('display-username');
    const displayTeacherName = document.getElementById('display-teacher-name');

    let currentUser = sessionStorage.getItem('currentUser');
    let currentUserRole = sessionStorage.getItem('currentUserRole');

    function checkAuth() {
        if (currentUser) {
            authContainer.classList.add('hidden');
            if (currentUserRole === 'teacher') {
                if(teacherAppContainer) teacherAppContainer.classList.remove('hidden');
                if(mainAppContainer) mainAppContainer.classList.add('hidden');
                if(displayTeacherName) displayTeacherName.textContent = currentUser;
                renderTeacherData();
            } else {
                if(mainAppContainer) mainAppContainer.classList.remove('hidden');
                if(teacherAppContainer) teacherAppContainer.classList.add('hidden');
                if(displayUsername) displayUsername.textContent = currentUser;
                renderStudentNotices();
            }
        } else {
            authContainer.classList.remove('hidden');
            if(mainAppContainer) mainAppContainer.classList.add('hidden');
            if(teacherAppContainer) teacherAppContainer.classList.add('hidden');
            authForm.reset();
            authMessage.textContent = '';
        }
    }

    function showAuthMessage(msg, isSuccess) {
        authMessage.textContent = msg;
        authMessage.className = `auth-message ${isSuccess ? 'success' : ''}`;
    }

    btnRegister.addEventListener('click', () => {
        const username = authUsernameInput.value.trim();
        const password = authPasswordInput.value.trim();
        const role = document.querySelector('input[name="auth-role"]:checked').value;
        if (!username || !password) {
            showAuthMessage('Name and Password are required.', false);
            return;
        }
        
        let users = JSON.parse(localStorage.getItem('analyzer_users') || '{}');
        if (users[username]) {
            showAuthMessage('User already exists! Please login instead.', false);
            return;
        }

        users[username] = { password, role };
        localStorage.setItem('analyzer_users', JSON.stringify(users));
        showAuthMessage(`Registration successful as ${role}! You can now login.`, true);
    });

    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = authUsernameInput.value.trim();
        const password = authPasswordInput.value.trim();
        const role = document.querySelector('input[name="auth-role"]:checked').value;
        
        let users = JSON.parse(localStorage.getItem('analyzer_users') || '{}');
        if (!users[username]) {
            showAuthMessage('User not found. Please register first.', false);
            return;
        }

        const userRec = typeof users[username] === 'string' ? { password: users[username], role: 'student' } : users[username];

        if (userRec.password !== password) {
            showAuthMessage('Incorrect password.', false);
            return;
        }
        
        if (userRec.role !== role) {
            showAuthMessage(`Registered as a ${userRec.role}. Select the correct role to login.`, false);
            return;
        }

        currentUser = username;
        currentUserRole = role;
        sessionStorage.setItem('currentUser', username);
        sessionStorage.setItem('currentUserRole', role);
        checkAuth();
    });

    document.querySelectorAll('.btn-logout').forEach(btn => {
        btn.addEventListener('click', () => {
            currentUser = null;
            currentUserRole = null;
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('currentUserRole');
            checkAuth();
            const resSec = document.getElementById('result-section');
            if (resSec) resSec.classList.add('hidden');
        });
    });

    checkAuth();
    // --- END AUTHENTICATION SYSTEM ---


    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const mainAnalyzeActions = document.getElementById('main-analyze-actions');
    let currentMode = 'marks'; // 'marks', 'attendance', 'combined', 'notices'
    let lastAnalyzedSubjects = [];

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const container = btn.closest('.glass-panel');
            const btnsInContainer = container.querySelectorAll('.tab-btn');
            btnsInContainer.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const target = btn.dataset.target;

            if (container.id === 'main-app-container') {
                currentMode = target;
                
                document.getElementById('marks-section').classList.toggle('hidden', target === 'attendance' || target === 'notices');
                document.getElementById('attendance-section').classList.toggle('hidden', target === 'marks' || target === 'notices');
                const noticeSec = document.getElementById('notices-section');
                if(noticeSec) noticeSec.classList.toggle('hidden', target !== 'notices');
                
                if (target === 'marks') analyzeBtn.textContent = 'Analyze Marks';
                else if (target === 'attendance') analyzeBtn.textContent = 'Analyze Attendance';
                else if (target === 'combined') analyzeBtn.textContent = 'Analyze Both';
                
                if (target === 'notices') {
                    if(mainAnalyzeActions) mainAnalyzeActions.classList.add('hidden');
                } else {
                    if(mainAnalyzeActions) mainAnalyzeActions.classList.remove('hidden');
                }
                
                document.getElementById('result-section').classList.add('hidden');
            } else if (container.id === 'teacher-app-container') {
                container.querySelectorAll('.tab-section').forEach(sec => sec.classList.add('hidden'));
                const targetSec = document.getElementById(target + '-section');
                if (targetSec) targetSec.classList.remove('hidden');
            }
        });
    });

    const form = document.getElementById('performance-form');
    const resultSection = document.getElementById('result-section');
    const chartTypeSelector = document.getElementById('chart-type');
    
    let chartInstance = null;
    const PASSING_THRESHOLD = 40; // 40%

    // Setup Marks Subjects Logic
    const subjectsContainer = document.getElementById('subjects-container');
    const addSubjectBtn = document.getElementById('add-subject');
    addSubjectBtn.addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'subject-row';
        row.innerHTML = `
            <input type="text" class="subject-name" placeholder="Subject Name" required>
            <input type="number" class="subject-marks" placeholder="Marks" min="0" required>
            <input type="number" class="subject-max-marks" placeholder="Max" min="1" value="100" required>
            <button type="button" class="btn-icon remove-subject">&times;</button>
        `;
        subjectsContainer.appendChild(row);
        updateRemoveButtons();
    });

    subjectsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-subject')) {
            const rows = subjectsContainer.querySelectorAll('.subject-row');
            if (rows.length > 1) {
                e.target.closest('.subject-row').remove();
                updateRemoveButtons();
            }
        }
    });

    function updateRemoveButtons() {
        const rows = subjectsContainer.querySelectorAll('.subject-row');
        const buttons = subjectsContainer.querySelectorAll('.remove-subject');
        buttons.forEach(btn => btn.disabled = rows.length === 1);
    }
    updateRemoveButtons();

    // Setup Attendance Subjects Logic
    const attSubjectsContainer = document.getElementById('attendance-subjects-container');
    const addAttSubjectBtn = document.getElementById('add-att-subject');
    addAttSubjectBtn.addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'attendance-subject-row subject-row';
        row.innerHTML = `
            <input type="text" class="att-subject-name" placeholder="Subject Name" required>
            <input type="number" class="att-attended" placeholder="Attended" min="0" required>
            <input type="number" class="att-total" placeholder="Total" min="1" required>
            <button type="button" class="btn-icon remove-att-subject">&times;</button>
        `;
        attSubjectsContainer.appendChild(row);
        updateRemoveAttButtons();
    });

    attSubjectsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-att-subject')) {
            const rows = attSubjectsContainer.querySelectorAll('.attendance-subject-row');
            if (rows.length > 1) {
                e.target.closest('.attendance-subject-row').remove();
                updateRemoveAttButtons();
            }
        }
    });

    function updateRemoveAttButtons() {
        const rows = attSubjectsContainer.querySelectorAll('.attendance-subject-row');
        const buttons = attSubjectsContainer.querySelectorAll('.remove-att-subject');
        buttons.forEach(btn => btn.disabled = rows.length === 1);
    }
    updateRemoveAttButtons();

    // Handling form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Uses the authenticated user's name
        const studentName = currentUser;
        
        if (currentMode === 'marks') {
            analyzeMarks(studentName);
        } else if (currentMode === 'attendance') {
            analyzeAttendance(studentName);
        } else {
            analyzeCombined(studentName);
        }
    });

    chartTypeSelector.addEventListener('change', (e) => {
        if (lastAnalyzedSubjects.length > 0) {
            renderChart(lastAnalyzedSubjects, e.target.value);
        }
    });

    function getMarksData() {
        const subjectRows = document.querySelectorAll('.subject-row:not(.attendance-subject-row)');
        const subjects = [];
        let totalMarks = 0;
        let maxTotalMarks = 0;
        let anyFailed = false;
        let hasValidInput = true;

        subjectRows.forEach(row => {
            const nameInput = row.querySelector('.subject-name');
            const marksInput = row.querySelector('.subject-marks');
            const maxInput = row.querySelector('.subject-max-marks');
            
            if(!nameInput.value || !marksInput.value || !maxInput.value) {
                hasValidInput = false;
                return;
            }

            const name = nameInput.value;
            const marks = parseFloat(marksInput.value);
            const maxMarks = parseFloat(maxInput.value);
            
            const validMarks = Math.min(marks, maxMarks);
            const subPercentage = (validMarks / maxMarks) * 100;
            const isPass = subPercentage >= PASSING_THRESHOLD;
            
            if (!isPass) anyFailed = true;

            subjects.push({ name, marks: validMarks, maxMarks, percentage: subPercentage, isPass });
            totalMarks += validMarks;
            maxTotalMarks += maxMarks;
        });

        if (!hasValidInput || subjects.length === 0) return null;

        const overallPercentage = (totalMarks / maxTotalMarks) * 100;
        const isPass = overallPercentage >= PASSING_THRESHOLD && !anyFailed;

        return { subjects, totalMarks, maxTotalMarks, overallPercentage, isPass };
    }

    function getAttendanceData() {
        const reqInput = document.getElementById('required-attendance').value;
        if(!reqInput) return null;
        const requiredAttendance = parseFloat(reqInput);

        const attRows = document.querySelectorAll('.attendance-subject-row');
        const subjects = [];
        let totalClassesAll = 0;
        let attendedClassesAll = 0;
        let hasValidInput = true;
        let anyFailed = false;

        attRows.forEach(row => {
            const nameInput = row.querySelector('.att-subject-name');
            const attInput = row.querySelector('.att-attended');
            const totalInput = row.querySelector('.att-total');
            
            if(!nameInput.value || !attInput.value || !totalInput.value) {
                hasValidInput = false;
                return;
            }

            const name = nameInput.value;
            const total = parseFloat(totalInput.value);
            let attended = parseFloat(attInput.value);
            
            attended = Math.min(attended, total);
            const percentage = (attended / total) * 100;
            const isPass = percentage >= requiredAttendance;
            
            if (!isPass) anyFailed = true;

            subjects.push({ name, attended, total, percentage, isPass });
            attendedClassesAll += attended;
            totalClassesAll += total;
        });

        if (!hasValidInput || subjects.length === 0) return null;

        const overallPercentage = totalClassesAll > 0 ? (attendedClassesAll / totalClassesAll) * 100 : 0;
        const isPass = overallPercentage >= requiredAttendance && !anyFailed;

        return { subjects, attendedClassesAll, totalClassesAll, overallPercentage, requiredAttendance, isPass };
    }

    function analyzeMarks(studentName) {
        const data = getMarksData();
        if (!data) return;

        resultSection.classList.remove('hidden');
        document.getElementById('marks-results').classList.remove('hidden');
        document.getElementById('attendance-results').classList.add('hidden');
        
        document.getElementById('result-name').textContent = `${studentName}'s Marks Analysis`;
        const statusEl = document.getElementById('result-status');
        statusEl.textContent = data.isPass ? 'Pass' : 'Fail';
        statusEl.className = `status-badge ${data.isPass ? 'pass' : 'fail'}`;

        applyMarksDOM(data);
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    function analyzeAttendance(studentName) {
        const att = getAttendanceData();
        if (!att) return;

        resultSection.classList.remove('hidden');
        document.getElementById('attendance-results').classList.remove('hidden');
        document.getElementById('marks-results').classList.add('hidden');
        
        document.getElementById('result-name').textContent = `${studentName}'s Attendance`;
        const statusEl = document.getElementById('result-status');
        statusEl.textContent = att.isPass ? 'Good' : 'Short';
        statusEl.className = `status-badge ${att.isPass ? 'pass' : 'fail'}`;

        applyAttendanceDOM(att);
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    function analyzeCombined(studentName) {
        const marksData = getMarksData();
        const attData = getAttendanceData();
        if (!marksData || !attData) return;

        const overallPass = marksData.isPass && attData.isPass;

        resultSection.classList.remove('hidden');
        document.getElementById('marks-results').classList.remove('hidden');
        document.getElementById('attendance-results').classList.remove('hidden');
        
        document.getElementById('result-name').textContent = `${studentName}'s Comprehensive Result`;
        const statusEl = document.getElementById('result-status');
        statusEl.textContent = overallPass ? 'Pass' : 'Fail';
        statusEl.className = `status-badge ${overallPass ? 'pass' : 'fail'}`;

        applyMarksDOM(marksData);
        applyAttendanceDOM(attData);
        
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    function applyMarksDOM(data) {
        lastAnalyzedSubjects = data.subjects;
        document.getElementById('metric-total').textContent = `${data.totalMarks} / ${data.maxTotalMarks}`;
        document.getElementById('metric-percentage').textContent = `${data.overallPercentage.toFixed(1)}%`;
        renderBreakdown(data.subjects);
        generateMarksAdvice(data.subjects, data.overallPercentage, data.isPass);
        
        const chartType = document.getElementById('chart-type').value || 'bar';
        renderChart(data.subjects, chartType);
    }

    function applyAttendanceDOM(att) {
        document.getElementById('metric-attendance').textContent = `${att.overallPercentage.toFixed(1)}%`;
        document.getElementById('metric-req-att').textContent = `${att.requiredAttendance}%`;
        
        const attCard = document.getElementById('card-attendance');
        if (!att.isPass) {
            attCard.classList.add('danger');
        } else {
            attCard.classList.remove('danger');
        }

        // Render attendance breakdown
        const tbody = document.getElementById('att-breakdown-body');
        tbody.innerHTML = '';
        att.subjects.forEach(sub => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${sub.name}</strong></td>
                <td>${sub.attended}</td>
                <td>${sub.total}</td>
                <td>${sub.percentage.toFixed(1)}%</td>
                <td><span class="status-badge ${sub.isPass ? 'pass' : 'fail'}" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">${sub.isPass ? 'Good' : 'Short'}</span></td>
            `;
            tbody.appendChild(tr);
        });

        generateAttendanceAdvice(att.subjects, att.overallPercentage, att.requiredAttendance);
    }
    
    function renderBreakdown(subjects) {
        const tbody = document.getElementById('breakdown-body');
        tbody.innerHTML = '';
        
        subjects.forEach(sub => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${sub.name}</strong></td>
                <td>${sub.marks}</td>
                <td>${sub.maxMarks}</td>
                <td>${sub.percentage.toFixed(1)}%</td>
                <td><span class="status-badge ${sub.isPass ? 'pass' : 'fail'}" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">${sub.isPass ? 'Pass' : 'Fail'}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    function generateMarksAdvice(subjects, overallPercentage, isPass) {
        const adviceList = document.getElementById('marks-advice-list');
        adviceList.innerHTML = '';
        
        const failedSubjects = subjects.filter(s => !s.isPass);
        const excellentSubjects = subjects.filter(s => s.percentage >= 80);
        
        const addAdvice = (text, type = '') => {
            const li = document.createElement('li');
            li.textContent = text;
            if (type) li.className = type;
            adviceList.appendChild(li);
        };

        if (isPass) {
            addAdvice(`Great job! You passed with an overall percentage of ${overallPercentage.toFixed(1)}%.`, 'success');
        } else {
            addAdvice(`You did not meet the academic criteria. Look into the subjects below for improvement.`, 'warning');
        }

        if (failedSubjects.length > 0) {
            const names = failedSubjects.map(s => s.name).join(', ');
            addAdvice(`Focus immediately on: ${names}. These subjects are below the 40% threshold.`, 'warning');
            
            failedSubjects.forEach(s => {
                const deficit = ((s.maxMarks * 0.40) - s.marks).toFixed(1);
                addAdvice(`For ${s.name}, you need at least ${deficit} more marks to pass.`, 'warning');
            });
        }

        if (excellentSubjects.length > 0) {
            const names = excellentSubjects.map(s => s.name).join(', ');
            addAdvice(`Excellent performance in: ${names}! Keep up the great work in these areas.`, 'success');
        }
    }

    function generateAttendanceAdvice(subjects, overallPct, reqAtt) {
        const adviceList = document.getElementById('attendance-advice-list');
        adviceList.innerHTML = '';
        
        const addAdvice = (text, type = '') => {
            const li = document.createElement('li');
            li.textContent = text;
            if (type) li.className = type;
            adviceList.appendChild(li);
        };

        const reqFraction = reqAtt / 100;

        if (overallPct < reqAtt) {
            const deficit = (reqAtt - overallPct).toFixed(1);
            addAdvice(`Overall Warning: Your total attendance is ${overallPct.toFixed(1)}%, which is ${deficit}% below your required ${reqAtt}%.`, 'warning');
        } else {
            addAdvice(`Overall Good: Your total attendance is ${overallPct.toFixed(1)}%, meeting the ${reqAtt}% requirement.`, 'success');
        }

        const failedSubjects = subjects.filter(s => !s.isPass);
        if (failedSubjects.length > 0) {
            failedSubjects.forEach(s => {
                if (reqFraction === 1 && s.attended < s.total) {
                    addAdvice(`[${s.name}] Since you have missed classes, it is mathematically impossible to reach 100% attendance.`, 'danger');
                } else {
                    const requiredExtra = Math.ceil((reqFraction * s.total - s.attended) / (1 - reqFraction));
                    if (requiredExtra > 0) {
                        addAdvice(`[${s.name}] Deficit: To reach ${reqAtt}%, attend the next ${requiredExtra} consecutive classes!`, 'warning');
                    }
                }
            });
        }

        const perfectSubjects = subjects.filter(s => s.percentage === 100);
        if (perfectSubjects.length > 0) {
            const names = perfectSubjects.map(s => s.name).join(', ');
            addAdvice(`Perfect attendance maintained in: ${names}!`, 'success');
        }
    }

    function renderChart(subjects, type = 'bar') {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        if (chartInstance) chartInstance.destroy();

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        const labels = subjects.map(s => s.name);
        const data = subjects.map(s => s.percentage);
        
        const solidColors = [
            'rgba(59, 130, 246, 0.6)', 'rgba(139, 92, 246, 0.6)', 'rgba(236, 72, 153, 0.6)',
            'rgba(244, 63, 94, 0.6)', 'rgba(245, 158, 11, 0.6)', 'rgba(16, 185, 129, 0.6)'
        ];
        const borderColorsSolid = [
            'rgb(59, 130, 246)', 'rgb(139, 92, 246)', 'rgb(236, 72, 153)',
            'rgb(244, 63, 94)', 'rgb(245, 158, 11)', 'rgb(16, 185, 129)'
        ];

        const isCircular = type === 'pie' || type === 'doughnut';
        
        const bgColors = isCircular 
            ? solidColors.slice(0, data.length) 
            : data.map(pct => pct >= PASSING_THRESHOLD ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)');
            
        const borderColors = isCircular
            ? borderColorsSolid.slice(0, data.length)
            : data.map(pct => pct >= PASSING_THRESHOLD ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)');

        Chart.defaults.color = isDark ? '#94a3b8' : '#64748b';
        Chart.defaults.font.family = 'Inter';

        const datasets = [{
            label: 'Percentage Scored',
            data: data,
            backgroundColor: type === 'line' || type === 'radar' ? 
                (isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(167, 139, 250, 0.2)') : bgColors,
            borderColor: type === 'line' || type === 'radar' ? 
                (isDark ? 'rgb(59, 130, 246)' : 'rgb(167, 139, 250)') : borderColors,
            borderWidth: 2,
            borderRadius: type === 'bar' ? 4 : 0,
            fill: type === 'line' || type === 'radar',
            tension: 0.4
        }];

        if (type === 'bar' || type === 'line' || type === 'radar') {
            datasets.push({
                label: 'Passing Threshold (40%)',
                data: Array(subjects.length).fill(PASSING_THRESHOLD),
                type: type === 'radar' ? 'radar' : 'line',
                borderColor: 'rgba(234, 179, 8, 0.8)',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                backgroundColor: 'transparent'
            });
        }

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: isDark ? '#e2e8f0' : '#334155' } },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDark ? '#f8fafc' : '#1e293b',
                    bodyColor: isDark ? '#e2e8f0' : '#334155',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return (context.dataset.label ? context.dataset.label + ': ' : '') + 
                                   (context.parsed.y !== undefined && context.parsed.y !== null ? context.parsed.y.toFixed(1) + '%' : 
                                   (context.parsed.r !== undefined && context.parsed.r !== null ? context.parsed.r.toFixed(1) + '%' : 
                                   context.raw.toFixed(1) + '%'));
                        }
                    }
                }
            },
            animation: { duration: 1000, easing: 'easeOutQuart' }
        };

        if (type === 'bar' || type === 'line') {
            options.scales = {
                y: { beginAtZero: true, max: 100, title: { display: true, text: 'Percentage (%)', color: isDark ? '#94a3b8' : '#64748b' }, grid: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' } },
                x: { grid: { display: false } }
            };
        } else if (type === 'radar') {
            options.scales = {
                r: { 
                    beginAtZero: true, 
                    max: 100,
                    grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                    angleLines: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                    pointLabels: { color: isDark ? '#94a3b8' : '#64748b' },
                    ticks: { backdropColor: 'transparent', color: isDark ? '#94a3b8' : '#64748b' }
                }
            };
        }

        chartInstance = new Chart(ctx, {
            type: type,
            data: { labels: labels, datasets: datasets },
            options: options
        });
    }

    // --- TEACHER SYSTEM ---
    const formAnnounce = document.getElementById('form-announcement');
    const formAssign = document.getElementById('form-assignment');

    let announcements = JSON.parse(localStorage.getItem('analyzer_announcements') || '[]');
    let assignments = JSON.parse(localStorage.getItem('analyzer_assignments') || '[]');

    if(formAnnounce) {
        formAnnounce.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('announce-title').value;
            const body = document.getElementById('announce-body').value;
            announcements.unshift({ title, body, date: new Date().toLocaleDateString(), author: currentUser });
            localStorage.setItem('analyzer_announcements', JSON.stringify(announcements));
            formAnnounce.reset();
            renderTeacherData();
            showNoticeActionSuccess(formAnnounce, 'Announcement posted!');
        });
    }

    if(formAssign) {
        formAssign.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('assign-title').value;
            const dueDate = document.getElementById('assign-date').value;
            const imgFile = document.getElementById('assign-image').files[0];

            if (imgFile) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        const imgUrl = event.target.result;
                        saveAssignment(title, dueDate, imgUrl);
                    } catch (err) {
                        alert("Image too large to save! Please use a smaller image.");
                    }
                };
                reader.readAsDataURL(imgFile);
            } else {
                saveAssignment(title, dueDate, null);
            }
        });
    }

    function saveAssignment(title, dueDate, imgUrl) {
        try {
            assignments.unshift({ title, dueDate, author: currentUser, image: imgUrl });
            localStorage.setItem('analyzer_assignments', JSON.stringify(assignments));
            formAssign.reset();
            renderTeacherData();
            showNoticeActionSuccess(formAssign, 'Assignment posted!');
        } catch (e) {
            assignments.shift(); // revert
            alert("Storage limit exceeded. Try a smaller image or clearing old assignments.");
        }
    }
    
    function showNoticeActionSuccess(formElement, msg) {
        const btn = formElement.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = msg;
        btn.classList.add('pass');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('pass');
        }, 2000);
    }

    function renderTeacherData() {
        const annList = document.getElementById('teacher-announcements-list');
        const assList = document.getElementById('teacher-assignments-list');
        if(!annList || !assList) return;

        annList.innerHTML = announcements.map(a => `<div class="advice-card mb-4" style="padding:1rem;"><strong>${a.title}</strong><p style="font-size:0.9rem; margin-top:0.5rem; white-space:pre-wrap;">${a.body}</p><small style="color:var(--text-muted);">${a.date}</small></div>`).join('') || '<p style="color:var(--text-muted);">No announcements.</p>';
        assList.innerHTML = assignments.map(a => `<div class="advice-card mb-4" style="padding:1rem;"><strong>${a.title}</strong>${a.image ? `<div style="margin:0.75rem 0;"><img src="${a.image}" style="max-width:100%; max-height: 400px; border-radius:0.5rem; border:1px solid var(--glass-border); object-fit: contain;"></div>` : ''}<p style="font-size:0.9rem; margin-top:0.5rem; color:var(--danger)">Due: ${a.dueDate}</p></div>`).join('') || '<p style="color:var(--text-muted);">No assignments.</p>';
    }

    function renderStudentNotices() {
        const annList = document.getElementById('student-announcements-list');
        const assList = document.getElementById('student-assignments-list');
        if(!annList || !assList) return;

        let curAnn = JSON.parse(localStorage.getItem('analyzer_announcements') || '[]');
        let curAss = JSON.parse(localStorage.getItem('analyzer_assignments') || '[]');

        annList.innerHTML = curAnn.map(a => `<div class="advice-card mb-4" style="padding:1rem;"><strong>${a.title}</strong> <span class="status-badge" style="font-size:0.6em; padding: 0.2rem 0.5rem;">By Prof. ${a.author}</span><p style="font-size:0.9rem; margin-top:0.5rem; white-space:pre-wrap;">${a.body}</p><small style="color:var(--text-muted);">${a.date}</small></div>`).join('') || '<p style="color:var(--text-muted);">No announcements yet.</p>';
        
        assList.innerHTML = curAss.map(a => `<div class="advice-card mb-4" style="padding:1rem;"><strong>${a.title}</strong> <span class="status-badge" style="font-size:0.6em; padding: 0.2rem 0.5rem;">By Prof. ${a.author}</span>${a.image ? `<div style="margin:0.75rem 0;"><img src="${a.image}" style="max-width:100%; max-height:400px; border-radius:0.5rem; border:1px solid var(--glass-border); object-fit: contain;"></div>` : ''}<p style="font-size:0.9rem; margin-top:0.5rem; color:var(--danger)">Due: ${a.dueDate}</p></div>`).join('') || '<p style="color:var(--text-muted);">No assignments pending.</p>';
    }
    
});
