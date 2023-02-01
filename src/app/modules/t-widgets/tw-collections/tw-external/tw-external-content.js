export class EmbeddedWebview extends HTMLElement {
  ref;
  constructor() {
    super();
    ref = this;
    console.log(this.getAttribute('src'));
    // fetch('https://dicedev.tetherfi.cloud/agent-desktop/assets/external/campaign-list.html', {method: 'GET'})
    //   .then(response => {
    //     console.log(this.getAttribute('src'), response);
    //     const shadow = this.attachShadow({ mode: 'open' });
    //     shadow.innerHTML = response;
    //   },error => {
    //     console.log('Error occured====', error);
    //   });


      fetch('https://dicedev.tetherfi.cloud/agent-desktop/assets/external/campaign-list.html')
    .then(function(response) {
        // When the page is loaded convert it to text
        return response.text()
    })
    .then(function(html) {
        // Initialize the DOM parser
        var parser = new DOMParser();

        // Parse the text
        var doc = parser.parseFromString(html, "text/html");

        // You can now even select part of that html as you would in the regular DOM 
        // Example:
        // var docArticle = doc.querySelector('article').innerHTML;

        console.log(doc);
        const shadow = ref.attachShadow({ mode: 'open' });
        shadow.append(doc);
    })
    .catch(function(err) {  
        console.log('Failed to fetch page: ', err);  
    });
  }

  test() {
    console.log('reference', this);
    
  }
}

   
      
 customElements.define (
  'embedded-webview',
  EmbeddedWebview
);
   
  