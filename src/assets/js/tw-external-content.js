export class EmbeddedWebview extends HTMLElement {
  
  constructor() {
    super();
    
    console.log('within constructor', this.getAttribute('src'));
    
    // fetch('https://dicedev.tetherfi.cloud/agent-desktop/assets/external/campaign-list.html', {method: 'GET'})
    //   .then(response => {
    //     console.log(this.getAttribute('src'), response);
    //     const shadow = this.attachShadow({ mode: 'open' });
    //     shadow.innerHTML = response;
    //   },error => {
    //     console.log('Error occured====', error);
    //   });
    
  }






  connectedCallback() {
    console.log('out of constructor', this.getAttribute('src'));
    const ref = this;
    const src = this.getAttribute('src');
    fetch(src)
    .then(function(response) {
        // When the page is loaded convert it to text
        return response.text()
    })
    .then(function(html) {
      const shadowRoot = ref.attachShadow({ mode: 'open', allow: {
        scripts: true
      } });
      shadowRoot.innerHTML = html;
        console.log(shadowRoot.ownerDocument);

    // Load scripts in the order they are defined
    // Note that inserting scripts into an element using innerHTML doesnt work - hence this logic
    var scripts = ref.shadowRoot.querySelectorAll("script");
    var links =  ref.shadowRoot.querySelectorAll("link");
    
    const adExternalPath = "https://dicedev.tetherfi.cloud/agent-desktop/assets/external/";
    const adlink = window.location.href?.split('main')[0];

    
    try{
      for (var i = 0; i < scripts.length; i++) {
        const script = document.createElement('script');
        
        if (scripts[i].text) {
          script.onload = 'console.log("hooooo")';
          script.innerText = scripts[i].text.replace('\n','').replace('\t','');
          shadowRoot.appendChild(script);
        } else {
          let importedScript = scripts[i].src;
                    
                    importedScript = importedScript.split(adlink)[1];
                    
                    script.src = adExternalPath + importedScript;
                    
          fetch(adExternalPath + importedScript).then(function (data) {
            data.text().then(function (r) {
              eval(r);
            })
          });
          
        }
    //     // To not repeat the element
    // scripts[i].parentNode.removeChild(scripts[i]);
       
      }
    } catch(e) {
      console.log('Error occured on executing external widget scripts',e);
    }

    
    
    for(var i = 0; i < links.length; i++) {
      if(links[i].href.includes(window.location) && links[i].href.includes('agent-desktop')) {
        let link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        
        importedScript = links[i].href.split(adlink)[1];
        link.setAttribute('href', adExternalPath + importScripts);
        ref.shadowRoot.appendChild(link);
        link[i].parentNode.removeChild(links[i]);
      }
      
    }
    })
    .catch(function(err) {  
        console.log('Failed to fetch page: ', err);  
    });
  }
}

   
      
 customElements.define (
  'embedded-webview',
  EmbeddedWebview
);
   
  