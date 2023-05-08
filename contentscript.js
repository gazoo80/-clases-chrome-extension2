console.log("Se esta ejecutando el javascript");

function getJobsInformation() {
  const jobsElementsInformation = [
    ...document.querySelectorAll("div[id^=jobcard]"),
  ];

  const jobsInformation = jobsElementsInformation.map((jobElement) => {
    const [
      {},
      {
        children: [
          {
            children: [
              { innerText: date },
              { innerText: title },
              { innerText: salary },
            ],
          },
        ],
      },
    ] = jobElement.children;

    const ciudad = jobElement.querySelector('p[class*=zonesLinks]').innerText;

    return { title, salary: salary.replace("\n", " "), date: date.split("\n")[0], ciudad };
  });

  console.log(jobsInformation);

  const todayJobsInformation = jobsInformation.filter((job) => job.date === 'Hoy');

  return todayJobsInformation;
}

// Creamos un puerto para comunicarnos con el runtime de chrome. Se dispara el evento onConnect
// El nombre hace referencia a la direccion de la comunicacion (content_script-background)
// Necesitamos este nuevo puerto de conexion para que background pueda escuchar eventos
const portBackground = chrome.runtime.connect({name: 'content_script-background'});

// Enviamos un mensaje al background (Dispara el evento onMessage)
// Ademas enviamos un objeto con la propiedad cmd y el valor "online"
// Esto ejecutará onMessage en background, cmd=nnline en cada actualizacion de pagina
portBackground.postMessage({ cmd: 'online'});

// Cuando alquien se conecte con contentscript (que es el script que maneja el tab y navegador)
// Funcion listener que se ejecutara cuando alguien se conecte (connect)
chrome.runtime.onConnect.addListener((port) => {
    // Funcion listener que se ejecutara cuando alguien envie un argumento (postMessage)
    port.onMessage.addListener(({cmd}) => {
        if (cmd === 'scrap')  {
            // Obtenemos el resultado del scraping
            const jobsInformation = getJobsInformation();

            // Obtenemos el boton siguiente de los resultados en la pagina
            const nextButton = document.querySelector('[class*=next]');

            // Verificamos si el atributo class del biton no inclye la clase disabled.
            // Lo que quiere decir que aun hay mas paginas de resultados
            const existsNextPage = !nextButton.className.includes('disabled')

            // Enviamos un mensaje al background (Dispara el evento onMessage)
            // El mensaje contiene un comnado, el resultado del scraping y el flag que nos indica 
            // si existe o no una siguiente pagina de resultados
            portBackground.postMessage({cmd: 'getInfo', jobsInformation, existsNextPage});

            console.log(jobsInformation);
            console.log(nextButton);
            console.log(existsNextPage);
        }
    });
});