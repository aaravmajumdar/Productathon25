const synth = window.speechSynthesis;
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;

// Function to dynamically add ARIA attributes
function enhanceAccessibility(element) {
  if (!element.hasAttribute("aria-label") && element.textContent.trim() !== "") {
    element.setAttribute("aria-label", element.textContent.trim());
  }
  
  if (!element.hasAttribute("role")) {
    if (element.tagName === "BUTTON" || element.tagName === "A") {
      element.setAttribute("role", "button");
    } else {
      element.setAttribute("role", "tooltip");
    }
  }
  
  // Add aria-live for dynamically updated content
  element.setAttribute("aria-live", "polite");
}

// Listen for mouseover events and enhance accessibility
document.addEventListener("mouseover", (event) => {
  if (event.target && event.target.nodeType === Node.ELEMENT_NODE) {
    const element = event.target;
    
    // Enhance ARIA attributes
    enhanceAccessibility(element);

    // Retrieve hover color from storage
    chrome.storage.sync.get("hoverColor", ({ hoverColor }) => {
      const originalColor = element.style.color;
      element.style.color = hoverColor || "red"; // Default to red if no color is set

      // Capture the text of the hovered element
      const textToSpeak = element.textContent.trim();

      // Create an utterance to speak the text
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      // Check if speechSynthesis is already speaking to prevent overlap
      if (!synth.speaking) {
        synth.speak(utterance);
      }

      // Stop the speech and restore the original color on mouseout
      element.addEventListener(
        "mouseout",
        () => {
          synth.cancel();  // Stop any ongoing speech
          element.style.color = originalColor;  // Restore the original color
        },
        { once: true }
      );
    });
  }
});

// Start speech recognition on a button click
document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.createElement("button");
  startButton.textContent = "Start Voice Input";
  startButton.style.position = "fixed";
  startButton.style.bottom = "10px";
  startButton.style.right = "10px";
  document.body.appendChild(startButton);

  startButton.addEventListener("click", () => {
    recognition.start();
  });

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    console.log("Recognized Speech:", transcript);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };
});

// Check if SpeechRecognition is supported
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.interimResults = true;

  // Start speech recognition when the button is clicked
  document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.createElement('button');
    startButton.textContent = 'Start Voice Input';
    startButton.style.position = 'fixed';
    startButton.style.bottom = '10px';
    startButton.style.right = '10px';
    document.body.appendChild(startButton);

    startButton.addEventListener('click', () => {
      recognition.start();
    });
  });

  // Handle speech recognition results
  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    console.log('Recognized Speech:', transcript);

    // Send the transcript to the background script
    chrome.runtime.sendMessage({ action: 'speech_result', text: transcript });
  };

  // Handle errors
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  };
} else {
  console.error('SpeechRecognition API is not supported in this browser.');
}