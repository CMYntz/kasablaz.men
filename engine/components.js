const componentsToRegister = ['button', 'navbar'];

class CustomComponent extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const name = this.tagName.toLowerCase().replace('custom-', ''); 
        const componentPath = `/components/${name}`;

        const storedChildren = document.createDocumentFragment();
        
        while (this.firstChild) {
            storedChildren.appendChild(this.firstChild);
        }

        try {
            const htmlResponse = await fetch(`${componentPath}/component.html`);
            const htmlText = await htmlResponse.text();

            let cssText = '';
            try {
                const cssResponse = await fetch(`${componentPath}/component.css`);
                cssText = await cssResponse.text();
            } catch (error) { /* CSS is optional */ }

            // Create a wrapper div to hold the fetched content
            const wrapper = document.createElement('div');
            wrapper.innerHTML = `
                <style>${cssText}</style>
                ${htmlText}
            `;

            // Append the wrapper's children to the component without overwriting existing content
            while (wrapper.firstChild) {
                this.appendChild(wrapper.firstChild);
            }

            // document.querySelectorAll('link[rel="stylesheet"], style').forEach(el => {
            const slot = this.querySelector('slot');
            if (slot) {
                slot.parentElement.appendChild(storedChildren);
                slot.remove();
            }

            this.element = this.children[1] // First child after <style> is the root element

            Array.from(this.attributes).forEach(attribute => {
                this.querySelectorAll(`data-${attribute.name}`).forEach(element => {
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


