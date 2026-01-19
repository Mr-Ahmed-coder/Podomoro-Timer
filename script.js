        let currentMode = 'pomodoro';
        let timeLeft = 25 * 60;
        let totalTime = 25 * 60;
        let isRunning = false;
        let timerInterval = null;
        let pomodorosCompleted = 0;
        let totalMinutesWorked = 0;
        let autoStartBreaks = false;

        const durations = {
            pomodoro: 25,
            shortBreak: 5,
            longBreak: 15
        };

        const colors = {
            pomodoro: '#667eea',
            shortBreak: '#51cf66',
            longBreak: '#4ecdc4'
        };

        const labels = {
            pomodoro: 'Focus Time',
            shortBreak: 'Short Break',
            longBreak: 'Long Break'
        };

        function loadSettings() {
            const saved = localStorage.getItem('pomodoroSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                durations.pomodoro = settings.pomodoro || 25;
                durations.shortBreak = settings.shortBreak || 5;
                durations.longBreak = settings.longBreak || 15;
                autoStartBreaks = settings.autoStart || false;

                document.getElementById('pomodoroDuration').value = durations.pomodoro;
                document.getElementById('shortBreakDuration').value = durations.shortBreak;
                document.getElementById('longBreakDuration').value = durations.longBreak;
                
                if (autoStartBreaks) {
                    document.getElementById('autoStartToggle').classList.add('active');
                }
            }

            const stats = localStorage.getItem('pomodoroStats');
            if (stats) {
                const data = JSON.parse(stats);
                const today = new Date().toDateString();
                if (data.date === today) {
                    pomodorosCompleted = data.pomodoros || 0;
                    totalMinutesWorked = data.minutes || 0;
                    updateStats();
                }
            }

            resetTimer();
        }

        function saveSettings() {
            durations.pomodoro = parseInt(document.getElementById('pomodoroDuration').value);
            durations.shortBreak = parseInt(document.getElementById('shortBreakDuration').value);
            durations.longBreak = parseInt(document.getElementById('longBreakDuration').value);

            const settings = {
                pomodoro: durations.pomodoro,
                shortBreak: durations.shortBreak,
                longBreak: durations.longBreak,
                autoStart: autoStartBreaks
            };

            localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
            resetTimer();
        }

        function saveStats() {
            const stats = {
                date: new Date().toDateString(),
                pomodoros: pomodorosCompleted,
                minutes: totalMinutesWorked
            };
            localStorage.setItem('pomodoroStats', JSON.stringify(stats));
        }

        function toggleSettings() {
            const content = document.getElementById('settingsContent');
            const arrow = document.getElementById('settingsArrow');
            content.classList.toggle('active');
            arrow.textContent = content.classList.contains('active') ? '▲' : '▼';
        }

        function toggleAutoStart() {
            autoStartBreaks = !autoStartBreaks;
            document.getElementById('autoStartToggle').classList.toggle('active');
            saveSettings();
        }

        function setMode(mode) {
            if (isRunning) {
                if (!confirm('Timer is running. Switch mode?')) return;
                pauseTimer();
            }

            currentMode = mode;
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');

            resetTimer();
        }

        function startTimer() {
            isRunning = true;
            document.getElementById('startBtn').style.display = 'none';
            document.getElementById('pauseBtn').style.display = 'flex';

            timerInterval = setInterval(() => {
                timeLeft--;
                updateDisplay();
                updateProgress();

                if (timeLeft <= 0) {
                    completeSession();
                }
            }, 1000);
        }

        function pauseTimer() {
            isRunning = false;
            clearInterval(timerInterval);
            document.getElementById('startBtn').style.display = 'flex';
            document.getElementById('pauseBtn').style.display = 'none';
        }

        function resetTimer() {
            pauseTimer();
            timeLeft = durations[currentMode] * 60;
            totalTime = timeLeft;
            updateDisplay();
            updateProgress();
            
            const circle = document.getElementById('progressCircle');
            circle.style.stroke = colors[currentMode];
            document.getElementById('sessionLabel').textContent = labels[currentMode];
        }

        function completeSession() {
            pauseTimer();
            playSound();

            if (currentMode === 'pomodoro') {
                pomodorosCompleted++;
                totalMinutesWorked += durations.pomodoro;
                updateStats();
                saveStats();

                const nextMode = pomodorosCompleted % 4 === 0 ? 'longBreak' : 'shortBreak';
                showNotification(`Pomodoro complete! Time for a ${nextMode === 'longBreak' ? 'long' : 'short'} break.`);
                
                if (autoStartBreaks) {
                    setTimeout(() => {
                        switchModeAuto(nextMode);
                    }, 2000);
                }
            } else {
                showNotification('Break complete! Ready for another pomodoro?');
                
                if (autoStartBreaks) {
                    setTimeout(() => {
                        switchModeAuto('pomodoro');
                    }, 2000);
                }
            }
        }

        function switchModeAuto(mode) {
            currentMode = mode;
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[onclick="setMode('${mode}')"]`).classList.add('active');
            resetTimer();
            startTimer();
        }

        function updateDisplay() {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            document.getElementById('timeDisplay').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        function updateProgress() {
            const circle = document.getElementById('progressCircle');
            const radius = 140;
            const circumference = 2 * Math.PI * radius;
            const progress = (totalTime - timeLeft) / totalTime;
            const offset = circumference * (1 - progress);
            
            circle.style.strokeDasharray = circumference;
            circle.style.strokeDashoffset = offset;
        }

        function updateStats() {
            document.getElementById('pomodorosCompleted').textContent = pomodorosCompleted;
            document.getElementById('totalMinutes').textContent = totalMinutesWorked;
        }

        function showNotification(message) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.classList.add('active');
            
            setTimeout(() => {
                notification.classList.remove('active');
            }, 4000);
        }

        function playSound() {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }

        window.addEventListener('load', loadSettings);

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (isRunning) {
                    pauseTimer();
                } else {
                    startTimer();
                }
            }
        });
