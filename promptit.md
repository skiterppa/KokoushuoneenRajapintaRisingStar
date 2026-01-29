# Promptit
## 1. Tehtävä
### Käyttäjä
Make script with JavaScirpt and use Mock API for reserving a room.
Don't download any packages just use what javascript offers if possible
First page is login page.
Lets make that we have in this demo project two users, names are user1 and user2 and password is "123456"

When user is logged in they can reserve a room and in this demo project there is one week schedule, no weekends. Min reserve time is 30 minutes and time when can reserve is 8-18.
Use 24 h clock.
User can also delete his reserves. 
And there is list where user can see all his reserves.
Reserves can't be in past so it need some check what time is. 

In main page there is one calendar for every room and in this demo there are two rooms.
When room is reserved show name who reserved that room, also text that say "booked".

### Gemini-3-pro
Here is a complete, single-file solution (HTML, CSS, and JavaScript) that meets all your requirements. I have built a Mock API class to simulate database operations using the browser's localStorage, so your data persists even if you refresh the page.

Save this code as index.html and open it in your browser.

HTML
```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Room Reservation Demo</title>
    <style>
        :root {
            --primary: #2c3e50;
            --accent: #3498db;
            --danger: #e74c3c;
            --light: #ecf0f1;
            --success: #27ae60;
        }

        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        
        /* Utils */
        .hidden { display: none !important; }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        button { cursor: pointer; padding: 8px 16px; border: none; border-radius: 4px; font-weight: bold; }
        .btn-primary { background-color: var(--accent); color: white; }
        .btn-danger { background-color: var(--danger); color: white; }
        input, select { padding: 8px; margin: 5px 0; border: 1px solid #ccc; border-radius: 4px; }

        /* Login Screen */
        #login-screen {
            height: 100vh; display: flex; justify-content: center; align-items: center;
            background: linear-gradient(135deg, var(--primary), var(--accent));
        }
        .login-box {
            background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            text-align: center; width: 300px;
        }
        .error-msg { color: var(--danger); margin-top: 10px; font-size: 0.9em; }

        /* Dashboard */
        header { background: var(--primary); color: white; padding: 15px 0; }
        .header-content { display: flex; justify-content: space-between; align-items: center; }
        
        .dashboard-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; margin-top: 20px; }

        /* Booking Form & List */
        .sidebar { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .my-reservations ul { list-style: none; padding: 0; }
        .my-reservations li { 
            background: var(--light); padding: 10px; margin-bottom: 10px; border-radius: 4px;
            border-left: 4px solid var(--accent); position: relative;
        }
        .delete-btn { font-size: 0.8em; background: var(--danger); color: white; border: none; padding: 2px 6px; float: right; }

        /* Calendar View */
        .calendar-section { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .calendar-controls { display: flex; justify-content: space-between; margin-bottom: 15px; }
        
        /* Visual Grid for Calendar */
        .schedule-grid {
            display: grid;
            grid-template-columns: 50px repeat(5, 1fr); /* Time col + 5 days */
            border-top: 1px solid #ddd;
            border-left: 1px solid #ddd;
        }
        .grid-header { background: var(--primary); color: white; padding: 10px; text-align: center; font-weight: bold; }
        .grid-time-label { border-bottom: 1px solid #ddd; border-right: 1px solid #ddd; padding: 5px; font-size: 0.8em; text-align: right; background: #fafafa; }
        
        /* The cells representing days */
        .day-column { border-right: 1px solid #ddd; position: relative; height: 600px; background: repeating-linear-gradient(to bottom, transparent 0 29px, #eee 29px 30px); }
        
        /* Booking Block Visuals */
        .booking-block {
            position: absolute; width: 90%; left: 5%;
            background-color: var(--success); color: white;
            border-radius: 4px; font-size: 0.75em; padding: 2px;
            overflow: hidden; text-align: center; box-shadow: 1px 1px 3px rgba(0,0,0,0.2);
            z-index: 10;
        }
        .booking-block.booked-by-other { background-color: var(--primary); }
    </style>
</head>
<body>

    <!-- 1. LOGIN SCREEN -->
    <div id="login-screen">
        <div class="login-box">
            <h2>Room Booking</h2>
            <input type="text" id="username" placeholder="Username (user1 or user2)">
            <input type="password" id="password" placeholder="Password (123456)">
            <button class="btn-primary" style="width:100%; margin-top:10px" onclick="App.login()">Login</button>
            <div id="login-error" class="error-msg"></div>
        </div>
    </div>

    <!-- 2. MAIN APP -->
    <div id="app-screen" class="hidden">
        <header>
            <div class="container header-content">
                <h2 id="welcome-msg">Welcome</h2>
                <button class="btn-danger" onclick="App.logout()">Logout</button>
            </div>
        </header>

        <div class="container dashboard-grid">
            
            <!-- LEFT: Calendar -->
            <div class="calendar-section">
                <div class="calendar-controls">
                    <h3>Room Schedule (Mon-Fri)</h3>
                    <select id="room-selector" onchange="App.renderCalendar()">
                        <option value="room1">Room 1 (Conference)</option>
                        <option value="room2">Room 2 (Huddle)</option>
                    </select>
                </div>
                
                <!-- Headers: Time + Mon Tue Wed Thu Fri -->
                <div class="schedule-grid" id="calendar-header">
                    <div class="grid-header">Time</div>
                    <div class="grid-header">Mon</div>
                    <div class="grid-header">Tue</div>
                    <div class="grid-header">Wed</div>
                    <div class="grid-header">Thu</div>
                    <div class="grid-header">Fri</div>
                </div>
                <!-- Body: Time Labels + 5 Columns -->
                <div class="schedule-grid" id="calendar-body">
                    <!-- JS generates this -->
                </div>
                <p style="font-size: 0.8em; color: #666; margin-top:5px;">*Hours: 08:00 - 18:00. Grid lines represent 30 mins.</p>
            </div>

            <!-- RIGHT: Booking Controls & List -->
            <div class="sidebar">
                <h3>Reserve a Room</h3>
                <label>Room</label>
                <select id="book-room" style="width:100%">
                    <option value="room1">Room 1</option>
                    <option value="room2">Room 2</option>
                </select>

                <label>Date (Next 7 days)</label>
                <input type="date" id="book-date" style="width:93%">

                <div style="display:flex; gap:5px;">
                    <div style="flex:1">
                        <label>Start</label>
                        <select id="book-start" style="width:100%"></select>
                    </div>
                    <div style="flex:1">
                        <label>End</label>
                        <select id="book-end" style="width:100%"></select>
                    </div>
                </div>

                <button class="btn-primary" style="width:100%; margin-top:15px" onclick="App.makeReservation()">Book Room</button>
                <div id="book-msg" class="error-msg" style="color:var(--accent)"></div>

                <hr style="margin: 20px 0;">

                <h3>My Reservations</h3>
                <div class="my-reservations">
                    <ul id="my-res-list">
                        <!-- List Items Here -->
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <script>
        /**
         * 1. MOCK API LAYER
         * Simulates a backend with a database using LocalStorage
         */
        const MockAPI = {
            users: [
                { id: 1, username: 'user1', password: '123456' },
                { id: 2, username: 'user2', password: '123456' }
            ],

            // Initialize DB if empty
            initDB: function() {
                if (!localStorage.getItem('reservations')) {
                    localStorage.setItem('reservations', JSON.stringify([]));
                }
            },

            login: function(username, password) {
                return new Promise((resolve, reject) => {
                    const user = this.users.find(u => u.username === username && u.password === password);
                    if (user) resolve(user);
                    else reject("Invalid credentials");
                });
            },

            getReservations: function() {
                return JSON.parse(localStorage.getItem('reservations')) || [];
            },

            addReservation: function(reservation) {
                const all = this.getReservations();
                
                // VALIDATIONS
                const newStart = new Date(reservation.start).getTime();
                const newEnd = new Date(reservation.end).getTime();
                const now = new Date().getTime();

                // 1. Check past
                if (newStart < now) {
                    return { success: false, msg: "Cannot reserve in the past." };
                }

                // 2. Check overlap for specific room
                const hasOverlap = all.some(r => {
                    if (r.roomId !== reservation.roomId) return false;
                    const rStart = new Date(r.start).getTime();
                    const rEnd = new Date(r.end).getTime();
                    // Overlap logic: (StartA < EndB) and (EndA > StartB)
                    return (newStart < rEnd && newEnd > rStart);
                });

                if (hasOverlap) {
                    return { success: false, msg: "Room is already booked for this time." };
                }

                reservation.id = Date.now(); // Simple ID generation
                all.push(reservation);
                localStorage.setItem('reservations', JSON.stringify(all));
                return { success: true };
            },

            deleteReservation: function(id, userId) {
                let all = this.getReservations();
                const target = all.find(r => r.id === id);
                
                if (!target) return { success: false, msg: "Not found" };
                if (target.userId !== userId) return { success: false, msg: "Unauthorized" };

                all = all.filter(r => r.id !== id);
                localStorage.setItem('reservations', JSON.stringify(all));
                return { success: true };
            }
        };

        /**
         * 2. APPLICATION LOGIC
         * Handles DOM, State, and UI Events
         */
        const App = {
            currentUser: null,
            weekStart: null, // Monday of current week

            init: function() {
                MockAPI.initDB();
                this.generateTimeOptions();
                this.setWeekStart();
                this.checkSession();
            },

            setWeekStart: function() {
                // Find current Monday
                const d = new Date();
                const day = d.getDay(); 
                const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                const monday = new Date(d.setDate(diff));
                monday.setHours(0,0,0,0);
                this.weekStart = monday;
            },

            // --- Auth Handling ---
            checkSession: function() {
                const savedUser = sessionStorage.getItem('currentUser');
                if (savedUser) {
                    this.currentUser = JSON.parse(savedUser);
                    this.showDashboard();
                }
            },

            login: async function() {
                const u = document.getElementById('username').value;
                const p = document.getElementById('password').value;
                const errDiv = document.getElementById('login-error');

                try {
                    const user = await MockAPI.login(u, p);
                    this.currentUser = user;
                    sessionStorage.setItem('currentUser', JSON.stringify(user));
                    errDiv.innerText = "";
                    this.showDashboard();
                } catch (err) {
                    errDiv.innerText = err;
                }
            },

            logout: function() {
                this.currentUser = null;
                sessionStorage.removeItem('currentUser');
                document.getElementById('app-screen').classList.add('hidden');
                document.getElementById('login-screen').classList.remove('hidden');
                document.getElementById('username').value = "";
                document.getElementById('password').value = "";
            },

            // --- View Logic ---
            showDashboard: function() {
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('app-screen').classList.remove('hidden');
                document.getElementById('welcome-msg').innerText = `Welcome, ${this.currentUser.username}`;
                
                // Set Date Picker Min to today
                const today = new Date().toISOString().split("T")[0];
                document.getElementById('book-date').setAttribute('min', today);
                document.getElementById('book-date').value = today;

                this.renderCalendar();
                this.renderMyList();
            },

            generateTimeOptions: function() {
                const startSel = document.getElementById('book-start');
                const endSel = document.getElementById('book-end');
                
                // 08:00 to 18:00 in 30 min steps
                for (let i = 8; i <= 18; i++) {
                    // Hour
                    let hour = i < 10 ? '0' + i : i;
                    
                    // 00 min
                    if (i !== 18) { // Can start at 8:00, cannot start at 18:00 (closing)
                        startSel.innerHTML += `<option value="${hour}:00">${hour}:00</option>`;
                    }
                    if (i !== 8) { // Cannot end at 8:00
                        endSel.innerHTML += `<option value="${hour}:00">${hour}:00</option>`;
                    }

                    // 30 min (skip for 18:00)
                    if (i !== 18) {
                        startSel.innerHTML += `<option value="${hour}:30">${hour}:30</option>`;
                        endSel.innerHTML += `<option value="${hour}:30">${hour}:30</option>`;
                    }
                }
            },

            // --- Booking Logic ---
            makeReservation: function() {
                const roomId = document.getElementById('book-room').value;
                const dateStr = document.getElementById('book-date').value;
                const startTime = document.getElementById('book-start').value;
                const endTime = document.getElementById('book-end').value;
                const msgDiv = document.getElementById('book-msg');

                if (!dateStr || !startTime || !endTime) {
                    msgDiv.innerText = "Please fill all fields."; return;
                }

                // Construct Date Objects
                const startDt = new Date(`${dateStr}T${startTime}`);
                const endDt = new Date(`${dateStr}T${endTime}`);

                // Client Validations
                if (startDt >= endDt) {
                    msgDiv.innerText = "End time must be after start time."; return;
                }
                const diffMins = (endDt - startDt) / 60000;
                if (diffMins < 30) {
                    msgDiv.innerText = "Minimum reservation is 30 minutes."; return;
                }
                // Check if weekend
                const day = startDt.getDay();
                if (day === 0 || day === 6) {
                    msgDiv.innerText = "Reservations allowed Mon-Fri only."; return;
                }

                // Call Mock API
                const result = MockAPI.addReservation({
                    userId: this.currentUser.id,
                    userName: this.currentUser.username,
                    roomId: roomId,
                    start: startDt.toISOString(),
                    end: endDt.toISOString()
                });

                if (result.success) {
                    msgDiv.style.color = "green";
                    msgDiv.innerText = "Booked successfully!";
                    setTimeout(() => msgDiv.innerText = "", 3000);
                    this.renderCalendar();
                    this.renderMyList();
                } else {
                    msgDiv.style.color = "var(--danger)";
                    msgDiv.innerText = result.msg;
                }
            },

            deleteRes: function(id) {
                if(confirm("Are you sure you want to delete this reservation?")) {
                    const res = MockAPI.deleteReservation(id, this.currentUser.id);
                    if(res.success) {
                        this.renderCalendar();
                        this.renderMyList();
                    } else {
                        alert(res.msg);
                    }
                }
            },

            // --- Rendering ---
            renderMyList: function() {
                const list = document.getElementById('my-res-list');
                const all = MockAPI.getReservations();
                const mine = all.filter(r => r.userId === this.currentUser.id)
                                .sort((a,b) => new Date(a.start) - new Date(b.start));

                list.innerHTML = "";
                if(mine.length === 0) {
                    list.innerHTML = "<li style='background:transparent; border:none'>No reservations found.</li>";
                    return;
                }

                mine.forEach(r => {
                    const s = new Date(r.start);
                    const e = new Date(r.end);
                    const dateStr = s.toLocaleDateString();
                    const timeStr = `${s.getHours()}:${s.getMinutes().toString().padStart(2,'0')} - ${e.getHours()}:${e.getMinutes().toString().padStart(2,'0')}`;
                    
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <strong>${r.roomId === 'room1' ? 'Room 1' : 'Room 2'}</strong><br>
                        ${dateStr} <br> ${timeStr}
                        <button class="delete-btn" onclick="App.deleteRes(${r.id})">Delete</button>
                    `;
                    list.appendChild(li);
                });
            },

            renderCalendar: function() {
                const container = document.getElementById('calendar-body');
                const selectedRoom = document.getElementById('room-selector').value;
                container.innerHTML = "";

                // 1. Render Time Labels (Left Column)
                const timeCol = document.createElement('div');
                for(let i=8; i<18; i++) {
                    const div = document.createElement('div');
                    div.className = 'grid-time-label';
                    div.style.height = '60px'; // 1 hour = 60px height
                    div.innerText = `${i}:00`;
                    timeCol.appendChild(div);
                }
                container.appendChild(timeCol);

                // 2. Render 5 Days (Mon-Fri)
                const allReservations = MockAPI.getReservations();
                
                // Helper: Get dates for Mon-Fri of current week
                for (let i = 0; i < 5; i++) {
                    const currentDayDate = new Date(this.weekStart);
                    currentDayDate.setDate(this.weekStart.getDate() + i);
                    
                    const col = document.createElement('div');
                    col.className = 'day-column';
                    // Add date header to grid header in real app, but here we keep it simple
                    
                    // Filter reservations for this room and this specific day
                    const daysRes = allReservations.filter(r => {
                        if(r.roomId !== selectedRoom) return false;
                        const rDate = new Date(r.start);
                        return rDate.toDateString() === currentDayDate.toDateString();
                    });

                    // Render Blocks
                    daysRes.forEach(r => {
                        const start = new Date(r.start);
                        const end = new Date(r.end);

                        // Calculate position
                        // Start hour is 8. So 8:00 is 0px.
                        const startHour = start.getHours();
                        const startMin = start.getMinutes();
                        const endHour = end.getHours();
                        const endMin = end.getMinutes();

                        // (Hour - 8) * 60px + Minutes
                        const top = ((startHour - 8) * 60) + startMin;
                        const durationMins = ((endHour - startHour) * 60) + (endMin - startMin);
                        
                        const div = document.createElement('div');
                        div.className = 'booking-block';
                        if (r.userId !== this.currentUser.id) {
                            div.classList.add('booked-by-other');
                        }
                        div.style.top = top + 'px';
                        div.style.height = durationMins + 'px';
                        
                        div.innerHTML = `<strong>Booked</strong><br>${r.userName}`;
                        
                        col.appendChild(div);
                    });

                    container.appendChild(col);
                }
            }
        };

        // Start App
        App.init();

    </script>
</body>
</html>
```
How to use this:
1. Save the file: Create a file named index.html and paste the code above into it.
2. Open in Browser: Double-click the file to open it in Chrome, Firefox, or Edge.
3. Login:
User 1: username: user1, password: 123456
User 2: username: user2, password: 123456
4. Booking:
Use the sidebar on the right to select a room, date, and time.
Click "Book Room".
You will see the block appear on the calendar (Left side) and in "My Reservations" (Right side).
5. Multi-user test:
Book a room as user1.
Click "Logout".
Login as user2.
You will see the room is "Booked" by user1 (shown in blue), and you cannot delete it.
Try to book the same time slot; the system will show an error message.
- Features implemented:
- - Vanilla JS: No React, Vue, or jQuery used.
- - Mock API: Uses localStorage to save bookings.
- - Constraints:
Enforces 8:00 - 18:00 time limit.
Enforces Mon-Fri (no weekends).
Enforces minimum 30 minutes.
Prevents booking in the past.
Prevents overlapping bookings.
- - UI:
Login Screen.
Visual Calendar Grid (showing "Booked" and Name).
List of own reservations with Delete button.

## 2. Tehtävä
### Käyttäjä
Lets make some changes. 
First thing is that there are two dropdown menus and I would need only one.
Keep the dropdown menu above calendar and remove from "Reserve a room column" but leave there some text that updates when changes the dropdown meu

### Gemini-3-pro
Here is the updated script.

Changes made:

Removed the "Room" dropdown from the right-hand sidebar.
Added a display area in the sidebar that shows which room is currently selected.
Linked the logic: When you change the dropdown above the Calendar (left side), it updates the Calendar view AND updates the text in the sidebar so you know which room you are booking.
Save this as index.html.

- Tässä olisi HTML koodi mutta ne muutokset näkyy commiteissa --> "Päivitetty index.html dorpdownmenu"

### Käyttäjä
Looks great but there is small problem. I want the calendar show 7 days from this day because today is the first day you can book the room. Even the time is outside of the limit but use still same day as today.
Also the grid what shows the reservation doesn't match the times.

### Gemini-3-pro
Here is the updated script.

Key Changes:

7-Day View Starting Today: The calendar logic now calculates new Date() (Today) as the start point and loops for 7 days.
Grid Alignment Fix: I rewrote the CSS for the calendar grid.
I enforced box-sizing: border-box to ensure padding/borders don't break pixel math.
I matched the Time Labels height exactly with the Background Grid Lines using CSS gradients.
I increased the grid loop to 7 columns (previously 5).
Weekend Handling: Since we show 7 days from today, weekends might appear. I added a visual check: if a column is a Saturday or Sunday, it gets a gray background, and the "Book" button will block reservations on those days (per your rules).
Save this as index.html.

- Tässä olisi HTML koodi mutta ne muutokset näkyy commitissa --> "Kalenterin päivitys"

### Käyttäjä
I found a bug in code. I can book the room over this 7 days what I told to do, so add one check so I can only book rooms for the next 7 days

### Gemini-3-pro
I have updated the code to fix this bug.

Changes made:

Javascript Validation: Added a check in makeReservation to calculate if the selected date is more than 7 days from today. If it is, it stops the booking and shows an error.
UI Restriction: I updated the showDashboard function to automatically set the max attribute on the Date Picker input. Now, the calendar dropdown won't even let the user select a date outside the 7-day window.
Save this as index.html.

- Tässä olisi HTML koodi mutta ne muutokset näkyy commitissa --> "Varauksen teko max 7 päivää eteenpäin"