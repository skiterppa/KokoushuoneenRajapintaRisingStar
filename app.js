// --- 1. MOCK API ---
const MockAPI = {
  users: [
    { id: 1, username: "user1", password: "123456" },
    { id: 2, username: "user2", password: "123456" },
  ],
  initDB: function () {
    if (!localStorage.getItem("reservations")) {
      localStorage.setItem("reservations", JSON.stringify([]));
    }
  },
  login: function (username, password) {
    return new Promise((resolve, reject) => {
      const user = this.users.find(
        (u) => u.username === username && u.password === password,
      );
      if (user) resolve(user);
      else reject("Invalid credentials");
    });
  },
  getReservations: function () {
    return JSON.parse(localStorage.getItem("reservations")) || [];
  },
  addReservation: function (reservation) {
    const all = this.getReservations();
    const newStart = new Date(reservation.start).getTime();
    const newEnd = new Date(reservation.end).getTime();
    const now = new Date().getTime();

    // Validation 1: Past
    if (newStart < now)
      return { success: false, msg: "Cannot reserve in the past." };

    // Validation 2: Overlap
    const hasOverlap = all.some((r) => {
      if (r.roomId !== reservation.roomId) return false;
      const rStart = new Date(r.start).getTime();
      const rEnd = new Date(r.end).getTime();
      return newStart < rEnd && newEnd > rStart;
    });
    if (hasOverlap) return { success: false, msg: "Time slot already taken." };

    reservation.id = Date.now();
    all.push(reservation);
    localStorage.setItem("reservations", JSON.stringify(all));
    return { success: true };
  },
  deleteReservation: function (id, userId) {
    let all = this.getReservations();
    const target = all.find((r) => r.id === id);
    if (!target) return { success: false, msg: "Not found" };
    if (target.userId !== userId)
      return { success: false, msg: "Unauthorized" };
    all = all.filter((r) => r.id !== id);
    localStorage.setItem("reservations", JSON.stringify(all));
    return { success: true };
  },
};

// --- 2. APP LOGIC ---
const App = {
  currentUser: null,
  viewStartDate: null, // This will be Today

  init: function () {
    MockAPI.initDB();
    this.generateTimeOptions();
    this.viewStartDate = new Date(); // Start from Today
    this.checkSession();
  },

  checkSession: function () {
    const savedUser = sessionStorage.getItem("currentUser");
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.showDashboard();
    }
  },

  login: async function () {
    const u = document.getElementById("username").value;
    const p = document.getElementById("password").value;
    const err = document.getElementById("login-error");
    try {
      const user = await MockAPI.login(u, p);
      this.currentUser = user;
      sessionStorage.setItem("currentUser", JSON.stringify(user));
      err.innerText = "";
      this.showDashboard();
    } catch (e) {
      err.innerText = e;
    }
  },

  logout: function () {
    this.currentUser = null;
    sessionStorage.removeItem("currentUser");
    document.getElementById("app-screen").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
  },

  showDashboard: function () {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("app-screen").classList.remove("hidden");
    document.getElementById("welcome-msg").innerText =
      `Welcome, ${this.currentUser.username}`;

    // --- DATE PICKER SETUP ---
    const dateInput = document.getElementById("book-date");

    // 1. Min Date: Today
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    dateInput.setAttribute("min", todayStr);
    dateInput.value = todayStr;

    // 2. Max Date: Today + 6 days (7 days total range)
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 6);
    const maxStr = maxDate.toISOString().split("T")[0];
    dateInput.setAttribute("max", maxStr);

    this.renderCalendar();
    this.renderMyList();
  },

  generateTimeOptions: function () {
    const startSel = document.getElementById("book-start");
    const endSel = document.getElementById("book-end");
    // 08:00 to 18:00
    for (let i = 8; i <= 18; i++) {
      let hour = i < 10 ? "0" + i : i;
      if (i !== 18)
        startSel.innerHTML += `<option value="${hour}:00">${hour}:00</option>`;
      if (i !== 8)
        endSel.innerHTML += `<option value="${hour}:00">${hour}:00</option>`;
      if (i !== 18) {
        startSel.innerHTML += `<option value="${hour}:30">${hour}:30</option>`;
        endSel.innerHTML += `<option value="${hour}:30">${hour}:30</option>`;
      }
    }
  },

  makeReservation: function () {
    const roomId = document.getElementById("room-selector").value;
    const dateStr = document.getElementById("book-date").value;
    const startTime = document.getElementById("book-start").value;
    const endTime = document.getElementById("book-end").value;
    const msgDiv = document.getElementById("book-msg");

    if (!dateStr || !startTime || !endTime) {
      msgDiv.innerText = "Please fill all fields.";
      return;
    }

    const startDt = new Date(`${dateStr}T${startTime}`);
    const endDt = new Date(`${dateStr}T${endTime}`);

    // --- VALIDATIONS ---

    // 1. Check Date Range (Must be within 7 days)
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    // Limit is 8 days from now (to be strictly safe against time offsets)
    // Actually, strict 7 days logic:
    const diffTime = startDt.getTime() - todayMidnight.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);

    // View shows Day 0 to Day 6. Day 7 is outside view.
    if (diffDays >= 7) {
      msgDiv.innerText = "Cannot book more than 7 days ahead.";
      return;
    }

    if (startDt >= endDt) {
      msgDiv.innerText = "End time must be after start.";
      return;
    }
    const diffMins = (endDt - startDt) / 60000;
    if (diffMins < 30) {
      msgDiv.innerText = "Min 30 minutes required.";
      return;
    }

    // Check Weekend
    const day = startDt.getDay();
    if (day === 0 || day === 6) {
      msgDiv.innerText = "No weekends allowed.";
      return;
    }

    const res = MockAPI.addReservation({
      userId: this.currentUser.id,
      userName: this.currentUser.username,
      roomId: roomId,
      start: startDt.toISOString(),
      end: endDt.toISOString(),
    });

    if (res.success) {
      msgDiv.style.color = "green";
      msgDiv.innerText = "Booked!";
      setTimeout(() => (msgDiv.innerText = ""), 3000);
      this.renderCalendar();
      this.renderMyList();
    } else {
      msgDiv.style.color = "var(--danger)";
      msgDiv.innerText = res.msg;
    }
  },

  deleteRes: function (id) {
    if (confirm("Delete this reservation?")) {
      const res = MockAPI.deleteReservation(id, this.currentUser.id);
      if (res.success) {
        this.renderCalendar();
        this.renderMyList();
      }
    }
  },

  renderMyList: function () {
    const list = document.getElementById("my-res-list");
    const all = MockAPI.getReservations();
    const mine = all
      .filter((r) => r.userId === this.currentUser.id)
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    list.innerHTML = "";
    if (mine.length === 0) {
      list.innerHTML = "<li>No reservations.</li>";
      return;
    }

    mine.forEach((r) => {
      const s = new Date(r.start);
      const e = new Date(r.end);
      const roomName = r.roomId === "room1" ? "Room 1" : "Room 2";
      const timeStr = `${s.toLocaleDateString()} ${s.getHours()}:${s.getMinutes().toString().padStart(2, "0")}-${e.getHours()}:${e.getMinutes().toString().padStart(2, "0")}`;

      const li = document.createElement("li");
      li.innerHTML = `<strong>${roomName}</strong><br>${timeStr} <button class="delete-btn" onclick="App.deleteRes(${r.id})">X</button>`;
      list.appendChild(li);
    });
  },

  renderCalendar: function () {
    const selector = document.getElementById("room-selector");
    const selectedRoomId = selector.value;
    document.getElementById("sidebar-room-name").innerText =
      selector.options[selector.selectedIndex].text;

    const headerRow = document.getElementById("calendar-header");
    const bodyContainer = document.getElementById("calendar-body");
    const timeCol = document.getElementById("time-column-labels");

    // 1. Render Time Labels (Only once or clear and re-add)
    timeCol.innerHTML = "";
    for (let i = 8; i < 18; i++) {
      const slot = document.createElement("div");
      slot.className = "time-slot";
      slot.innerText = `${i}:00`;
      timeCol.appendChild(slot);
    }

    // 2. Clear previous Day Columns (keep the time column which is first child)
    while (bodyContainer.children.length > 1) {
      bodyContainer.removeChild(bodyContainer.lastChild);
    }

    // 3. Clear Header
    headerRow.innerHTML = '<div class="grid-header">Time</div>';

    // 4. Generate 7 Days from Today
    const allReservations = MockAPI.getReservations();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < 7; i++) {
      const currentDayDate = new Date(this.viewStartDate);
      currentDayDate.setDate(this.viewStartDate.getDate() + i);

      const dayName = days[currentDayDate.getDay()];
      const dayDateStr = `${currentDayDate.getDate()}/${currentDayDate.getMonth() + 1}`;
      const isWeekend =
        currentDayDate.getDay() === 0 || currentDayDate.getDay() === 6;

      // Add Header Cell
      const th = document.createElement("div");
      th.className = "grid-header";
      th.innerHTML = `${dayName} <br> ${dayDateStr}`;
      headerRow.appendChild(th);

      // Add Body Column
      const col = document.createElement("div");
      col.className = "day-column";
      if (isWeekend) col.classList.add("weekend");

      // Filter Bookings for this Day & Room
      const daysRes = allReservations.filter((r) => {
        if (r.roomId !== selectedRoomId) return false;
        const rDate = new Date(r.start);
        return rDate.toDateString() === currentDayDate.toDateString();
      });

      // Render Bookings
      daysRes.forEach((r) => {
        const start = new Date(r.start);
        const end = new Date(r.end);

        // PIXEL MATH:
        // Row height = 60px per hour. Start hour 8:00.
        const startH = start.getHours();
        const startM = start.getMinutes();
        const endH = end.getHours();
        const endM = end.getMinutes();

        // (Hour - 8) * 60 + Minutes
        const top = (startH - 8) * 60 + startM;
        // Duration in minutes = height in pixels (since 1hr = 60mins = 60px)
        const duration = (endH - startH) * 60 + (endM - startM);

        const div = document.createElement("div");
        div.className = "booking-block";
        if (r.userId !== this.currentUser.id)
          div.classList.add("booked-by-other");

        div.style.top = top + "px";
        div.style.height = duration + "px";
        div.innerHTML = `<strong>${r.userName}</strong>`;
        div.title = `${startH}:${startM} - ${endH}:${endM}`; // Tooltip

        col.appendChild(div);
      });

      bodyContainer.appendChild(col);
    }
  },
};

App.init();
