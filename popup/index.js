const btnScripting = document.getElementById("btnscript");
const pMessageElement = document.getElementById("mensaje");

btnScripting.addEventListener("click", async () => {
    // Creamos un puerto para comunicarnos con el runtime de chrome. Se dispara el evento onConnect
    // El nombre hace referencia a la direccion de la comunicacion (popup-background)
    var port = chrome.runtime.connect({ name: "popup-background" });

    // Enviamos un mensaje al runtime (Dispara el evento onMessage)
    // Ademas enviamos un objeto con la propiedad cmd y el valor "start"
    port.postMessage({ cmd: "start" });

    console.log('despues de post message en popup');
    console.log(port);

    // Funcion listener que se ejecutara cuando alguien envie un mensaje (postMessage)
    // En este caso el background
    port.onMessage.addListener(({message}) => {
        pMessageElement.innerText = JSON.stringify(message, null, '\t');
    });
    
});