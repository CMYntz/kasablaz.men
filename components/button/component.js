const button = component.element;

let color1 = component.getAttribute('color1') || 'red';
let color2 = component.getAttribute('color2') || 'blue';
let current = false;

button.style.backgroundColor = color1;

button.addEventListener('click', () => {
    current = !current;
    button.style.backgroundColor = current ? color2 : color1;
});
