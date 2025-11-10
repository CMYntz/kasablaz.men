/** @type {string[]} List of components to auto-register */
const componentsToRegister = ['button', 'navbar'];

/**
 * Base class for custom web components
 * @extends HTMLElement
 */
class CustomComponent extends HTMLElement {
    /** @type {Element} Root element of the component */
    element;
    
    constructor() {
        super();
    }

    /**
     * Fetch and parse component resources
     * @param {string} path - Base path to component files
     * @returns {Promise<{html: string, css: string, js: Function}>}
     */
    async loadComponentResources(path) {
        const html = await fetch(`${path}/component.html`).then(r => r.text());
        
        const css = await fetch(`${path}/component.css`)
            .then(response => response.text())
            .catch(() => ''); // CSS is optional

        const js = await fetch(`${path}/component.js`)
            .then(async response => {
                const code = await response.text();
                return new Function('component', code);
            })
            .catch(() => ''); // JS is optional

        return { html, css, js };
    }

    /**
     * Store and handle child elements for slot support
     * @returns {DocumentFragment}
     */
    storeExistingChildren() {
        const fragment = document.createDocumentFragment();
        while (this.firstChild) {
            fragment.appendChild(this.firstChild);
        }
        return fragment;
    }

    /**
     * Apply component attributes to matching elements
     */
    applyAttributes() {
        Array.from(this.attributes).forEach(attribute => {
            this.querySelectorAll(`[data-${attribute.name}]`).forEach(element => {
                element.textContent = attribute.value;
            });
        });
    }

    /**
     * Lifecycle callback when component is added to DOM
     */
    async connectedCallback() {
        try {
            const name = this.tagName.toLowerCase().replace('custom-', '');
            const componentPath = `/components/${name}`;
            
            // Store existing children for slot support
            const storedChildren = this.storeExistingChildren();

            // Load component resources
            const { html, css, js } = await this.loadComponentResources(componentPath);

            // Create and populate component wrapper
            const wrapper = document.createElement('div');
            wrapper.innerHTML = `
                <style>${css}</style>
                ${html}
            `;

            // Transfer wrapper contents to component
            while (wrapper.firstChild) {
                this.appendChild(wrapper.firstChild);
            }

            // Handle slots if present
            const slot = this.querySelector('slot');
            if (slot) {
                slot.appendChild(storedChildren);
            }

            // Store reference to root element (after style)
            this.element = this.children[1];

            // Apply attributes to matching elements
            this.applyAttributes();

            // Execute component's JavaScript if present
            if (js) {
                js(this);
            }
        } catch (error) {
            console.error(`Error initializing component ${this.tagName}:`, error);
        }
    }
}

// Register components
for (const name of componentsToRegister) {
    const tag = `custom-${name}`;
    
    if (customElements.get(tag)) {
        console.warn(`[Component] ${tag} already registered - skipping`);
        continue;
    }
    
    customElements.define(tag, class extends CustomComponent {});
    console.log(`[Component] Registered ${tag}`);
}


