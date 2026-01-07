const form = document.querySelector('form')

form.addEventListener("submit", (e) => {
    e.preventDefault()
    const data = new FormData(form);
    const json = Object.fromEntries(data.entries())
    console.log(json);
})