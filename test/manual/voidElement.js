const voidElement = document.getElementById('invalid-syntax');
const text = document.createElement('p');

text.textContent = 'This is a really bad idea...';

// Invalid syntax: void elements can't have children, except through DOM APIs
voidElement?.appendChild(text);
