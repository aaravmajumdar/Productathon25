document.addEventListener("DOMContentLoaded", () => {
  // ✅ Use `window` in popup scripts (SpeechRecognition works in UI)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;

// Start recognition when button is clicked
document.getElementById("startRecognition").addEventListener("click", () => {
  recognition.start();
});

recognition.onresult = (event) => {
  let transcript = "";
  for (let i = event.resultIndex; i < event.results.length; i++) {
    transcript += event.results[i][0].transcript;
  }
  console.log("Recognized Speech:", transcript);

  // Send transcript to background script
  chrome.runtime.sendMessage({ action: "speech_result", text: transcript });

  // Show text in popup
  document.getElementById("recognizedText").textContent = transcript;
};

recognition.onerror = (event) => {
  console.error("Speech recognition error:", event.error);
};

  // Change hover color and save in storage
  chrome.storage.sync.get("hoverColor", ({ hoverColor }) => {
    hoverColorPicker.value = hoverColor || "#ff0000"; // Default red
  });

  hoverColorPicker.addEventListener("change", (event) => {
    chrome.storage.sync.set({ hoverColor: event.target.value });
  });

  // ✅ Directly handle speech recognition in popup.js (No message to background script)
  startButton.addEventListener("click", () => {
    recognition.start();
  });

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    console.log("Recognized Speech:", transcript);
    
    // ✅ Update UI with recognized text
    recognizedText.textContent = transcript;

    // ✅ Store the transcript in Chrome Storage
    chrome.storage.sync.set({ lastSpeech: transcript });
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  // Load saved tasks and health monitoring status
  loadData();
});

// Task and Health Monitoring Logic
document.getElementById('addTask').addEventListener('click', addTask);
document.getElementById('startHealthMonitor').addEventListener('click', startHealthMonitor);
document.getElementById('stopHealthMonitor').addEventListener('click', stopHealthMonitor);

// Load tasks and health monitoring status from storage
function loadData() {
  chrome.storage.sync.get(['tasks', 'healthMonitorOn'], (data) => {
    if (data.tasks) {
      const taskList = document.getElementById('taskList');
      data.tasks.forEach(task => {
        const li = document.createElement('li');
        li.textContent = `${task.name} at ${task.time}`;
        taskList.appendChild(li);
      });
    }
    if (data.healthMonitorOn) {
      document.getElementById('waterStatus').textContent = 'On';
    } else {
      document.getElementById('waterStatus').textContent = 'Off';
    }
  });
}

function addTask() {
  const task = document.getElementById('taskInput').value;
  const time = document.getElementById('taskTime').value;

  if (task && time) {
    const taskList = document.getElementById('taskList');
    const li = document.createElement('li');
    li.textContent = `${task} at ${time}`;
    taskList.appendChild(li);

    // Save the task to storage
    chrome.storage.sync.get(['tasks'], (data) => {
      const tasks = data.tasks || [];
      tasks.push({ name: task, time: time });
      chrome.storage.sync.set({ tasks: tasks }, () => {
        console.log('Task saved:', task);
      });
    });

    // Schedule a reminder
    const [hours, minutes] = time.split(':');
    const now = new Date();
    const taskTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    chrome.alarms.create(`task-${task}`, { when: taskTime.getTime() });

    // Clear input fields
    document.getElementById('taskInput').value = '';
    document.getElementById('taskTime').value = '';
  }
}

function startHealthMonitor() {
  chrome.alarms.create('waterReminder', { periodInMinutes: 60 }); // Remind every hour
  document.getElementById('waterStatus').textContent = 'On';
  chrome.storage.sync.set({ healthMonitorOn: true }, () => {
    console.log('Health monitoring started');
  });
}

function stopHealthMonitor() {
  chrome.alarms.clear('waterReminder');
  document.getElementById('waterStatus').textContent = 'Off';
  chrome.storage.sync.set({ healthMonitorOn: false }, () => {
    console.log('Health monitoring stopped');
  });
}
