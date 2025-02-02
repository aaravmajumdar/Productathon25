

// Recreate alarms when extension starts
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get(['tasks', 'healthMonitorOn'], (data) => {
    if (data.tasks) {
      data.tasks.forEach(task => {
        const [hours, minutes] = task.time.split(':');
        const now = new Date();
        const taskTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        chrome.alarms.create(`task-${task.name}`, { when: taskTime.getTime() });
      });
    }
    if (data.healthMonitorOn) {
      chrome.alarms.create('waterReminder', { periodInMinutes: 60 });
    }
  });
});

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('task-')) {
    const taskName = alarm.name.replace('task-', '');
    chrome.notifications.create({
      type: 'basic',
      title: 'Task Reminder',
      message: `It's time to: ${taskName}`
    });
  } else if (alarm.name === 'waterReminder') {
    chrome.notifications.create({
      type: 'basic',
      title: 'Health Reminder',
      message: 'Time to drink some water!'
    });
  }
});
