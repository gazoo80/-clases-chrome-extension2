
let jobs = [];
let start = false;
let portPopupBackground;

function addPageToUrl(url) {
    const regex = /page=(\d+)/;
    const match = url.match(regex);

    // El numero de la pagina esta en la posicion 1 del arr retornado por match
    // Si match es null page sera '1', sino tomara el valor encontrado. Esto es porque en la primera
    // aparicion de rsultados no aparece page = 1
    const page = (match && match[1]) || '1'; 

    // Sumamos 1 a la pagina extraida para ir a la sgte
    const newPage = parseInt(page) + 1;
    console.log(newPage);

    // Reemplazamos o concatenamos la pagina en la URL. En el primer resultado de la busqueda no
    // aparece el numero de pagima
    const newUrl = (url.includes('page=')) 
                   ? url.replace(regex, `page=${newPage}`) 
                   : url.concat(`?page=${newPage}`);
    
    return newUrl;
}

async function changeToNextPage(url, tabId) {
    console.log(url);

    // Reemplazaamos la pagina en la URL
    const newUrl = addPageToUrl(url);
    console.log(newUrl);
    
    // Actualizamos la pagina de resultados (la pagina que sigue)
    // Se actualizará cad vez que hacemos click en el botón "lanzar alerta con script"
    await chrome.tabs.update(tabId, {url: newUrl});
}

// Funcion listener que se ejecutara cuando alguien se conecte (connect). Obtenemos el puerto
chrome.runtime.onConnect.addListener(function (port) {
    // Funcion listener que se ejecutara cuando alguien envie argumentos (postMessage)
    // sender contiene informacion del tab, como por ejemplo la URL
    port.onMessage.addListener(async function (args, sender) {
        // OJO: sender trae info del tab activo y la URL actual cuando se hace la conexion
        // desde contentscript
        console.log(sender);

        // Obtenemos la propiedad cmd de args que pueden venir de index o contentscript  
        const { cmd } = args;

        if (cmd === "start") {
            console.log(port);
            portPopupBackground = port;
            // Iniciamos la tarea de scraping con paginado
            start = true;

            // Obtener el tab activo
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Creamos un puerto para comunicarnos con el tab activo (Dispara el evento onConnect)
            // El nombre hace referencia a la direccion de la comunicacion (background-content_script)
            const portTabActive = chrome.tabs.connect(tab.id, {name: 'background-content_script'});

            // Enviamos un mensaje al tab activo (Dispara el evento onMessage)
            // Ademas enviamos un objeto con la propiedad cmd y el valor "scrap"
            portTabActive.postMessage({cmd: 'scrap'});

            console.log('despues de post message en background');
        }

        if (cmd === "online") {

            const {sender: {tab: { url, id }}} = sender;

            if (start) {
                // Creamos un puerto para comunicarnos con el tab activo (Dispara el evento onConnect)
                // El nombre hace referencia a la direccion de la comunicacion (background-content_script)
                const portTabActive = chrome.tabs.connect(id, {name: 'background-content_script'});

                // Enviamos un mensaje al tab activo (Dispara el evento onMessage)
                // Ademas enviamos un objeto con la propiedad cmd y el valor "scrap"
                portTabActive.postMessage({cmd: 'scrap'});
            }

            console.log('despues de post message en background');
        }

        if (cmd === 'getInfo') {
            // Obtenemos las propiedades enviadas por contentscript en args
            //const { jobsInformation, existsNextPage } = args;
            let { jobsInformation, existsNextPage } = args;
            console.log(args);
            console.log(sender);

            // Concatenamos el arreglo jobs con jobsInformation para una respuesta total
            jobs = [...jobs, ...jobsInformation];

            /* Para que scrapee solo hasta la pagina 5 */
            const {sender: {tab: { url }}} = sender;
            const regex = /page=(\d+)/;
            const match = url.match(regex);
            const page = (match && match[1]) || '1'; 
            const pag = parseInt(page);
            if (pag === 5) existsNextPage = false;
            /* ***************************************** */

            // Si existe pagina siguiente, Usamos la URL en el objeto sender para cambiar de pagina
            if (existsNextPage) {
                const {sender: {tab: { url, id }}} = sender; // O const url = sender.sender.tab.url
                changeToNextPage(url, id);
            } 
            else {
                start = false; // No hay más páginas para escrapear
                console.log(portPopupBackground);
                console.log(jobs);
                // Enviamos un mensaje al index del popup (Dispara el evento onMessage)
                // El mensaje contiene el resultado del scraping
                // Usamos el puerto guardado en start
                portPopupBackground.postMessage({message: jobs});
            }             
        }
    });
});