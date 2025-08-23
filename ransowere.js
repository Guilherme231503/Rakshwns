// === FAKE RANSOMWARE CYBERTEAM DRAMATIC ===

// Limpa tudo
document.body.innerHTML = "";
document.body.style.background = "black";
document.body.style.color = "red";
document.body.style.fontFamily = "monospace";
document.body.style.whiteSpace = "pre";
document.body.style.fontSize = "22px";
document.body.style.padding = "20px";
document.body.style.textAlign = "center";

// Caveira ASCII piscando
let skull = document.createElement("pre");
skull.innerText = `
      ██████
    ██      ██
   ██  ██  ██
   ██      ██
    ██ ██ ██
      ██ ██
      ██ ██
      ██ ██
`;
skull.style.fontSize = "24px";
document.body.appendChild(skull);

setInterval(() => {
  skull.style.visibility = (skull.style.visibility === "hidden") ? "visible" : "visible";
}, 500);

// Mensagem digitando
let msg = `
############################################
###         CYBERTEAM HAS TAKEN OVER!    ###
###         КИБЕРКОМАНДА ВЗЛОМАЛА САЙТ ###
############################################

>> Your files have been encrypted!
>> Ваши файлы зашифрованы!
>> To recover them, enter the decryption key below.
>> Для восстановления введите ключ дешифрования ниже.
`;

let container = document.createElement("div");
document.body.appendChild(container);

let i = 0;
function typeEffect() {
  if (i < msg.length) {
    container.innerHTML += msg[i];
    i++;
    setTimeout(typeEffect, 30);
  } else {
    showInput();
  }
}
typeEffect();

// Input de chave
function showInput() {
  let input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter decryption key / Введите ключ дешифрования";
  input.style.background = "black";
  input.style.color = "red";
  input.style.border = "2px solid red";
  input.style.padding = "10px";
  input.style.width = "60%";
  input.style.fontSize = "20px";
  input.style.marginTop = "20px";
  input.style.textAlign = "center";
  document.body.appendChild(input);

  let btn = document.createElement("button");
  btn.innerText = "Decrypt / Дешифровать";
  btn.style.background = "red";
  btn.style.color = "black";
  btn.style.border = "none";
  btn.style.padding = "10px 20px";
  btn.style.fontSize = "18px";
  btn.style.marginLeft = "10px";
  btn.style.cursor = "pointer";
  document.body.appendChild(btn);

  btn.onclick = () => {
    if (input.value === "jag8-po82-1327-gnsm") {
      alert("Correct key! Initiating infinite alerts... / Правильный ключ! Запускаем бесконечные уведомления...");
      // Pop-ups infinitos
      function infiniteAlerts() {
        alert("CYBERTEAM ALERT! / СООБЩЕНИЕ CYBERTEAM!");
        setTimeout(infiniteAlerts, 100);
      }
      infiniteAlerts();
    } else {
      alert("Incorrect key! Clearing localStorage... / Неверный ключ! Очищаем localStorage...");
      localStorage.clear();
    }
  };
}