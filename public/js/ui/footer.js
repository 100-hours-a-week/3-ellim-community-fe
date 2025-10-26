function loadFooter(){
    return fetch('/components/footer.html')
        .then(response => response.text())
        .then(data => {
            document.querySelector('footer').outerHTML = data;
        });
}

document.addEventListener('DOMContentLoaded', () => {
    loadFooter();
});