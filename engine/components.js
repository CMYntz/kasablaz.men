const componentsToRegister = ['button', 'navbar', 'blabla'];

class CustomComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        const name = this.tagName.toLowerCase().replace('custom-', ''); 
        const componentPath = `/components/${name}`;

        try {
            const htmlResponse = await fetch(`${componentPath}/component.html`);
            const htmlText = await htmlResponse.text();

            let cssText = '';
            try {
                const cssResponse = await fetch(`${componentPath}/component.css`);
                cssText = await cssResponse.text();
            } catch (error) { /* CSS is optional */ }

            this.shadowRoot.innerHTML = `
                <style>${cssText}</style>
                ${htmlText}
                <slot></slot>
            `;

            document.querySelectorAll('link[rel="stylesheet"], style').forEach(el => {
                this.shadowRoot.appendChild(el.cloneNode(true));
            });

            this.element = this.shadowRoot.children[1] // First child after <style> is the root element

            Array.from(this.attributes).forEach(attribute => {
                this.shadowRoot.querySelectorAll(`data-${attribute.name}`).forEach(element => {
                    element.textContent = attribute.value;
                });
            });

            try {
                
                const jsText = await (await fetch(`${componentPath}/component.js`)).text();
                const fn = new Function('component', jsText);
                fn(this);
            } catch (error) { /* JS is optional */ }

        } catch (error) {
            console.error(`Error loading component ${name}:`, error);
        }
    }
}

componentsToRegister.forEach(name => {
  const tag = `custom-${name}`;
  if (customElements.get(tag)) {
    console.warn(`[cc] ${tag} already defined — skipping`);
    return;
  }
  // Create a unique constructor per tag by subclassing the base
  customElements.define(tag, class extends CustomComponent {});
  console.log(`[cc] defined ${tag}`);
});


