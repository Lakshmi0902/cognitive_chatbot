async function sendMessage() {
  const userInput = document.getElementById('userInput');
  const chatBox = document.getElementById('chat-box');

  const userText = userInput.value;
  chatBox.innerHTML += `<div class='user'>You: ${userText}</div>`;
  userInput.value = '';

  const res = await fetch('http://127.0.0.1:5000/get_response', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({message: userText})
  });

  const data = await res.json();
  chatBox.innerHTML += `<div class='bot'>Bot: ${data.reply}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}
