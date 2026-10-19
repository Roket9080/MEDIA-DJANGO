document.addEventListener("DOMContentLoaded", () => {
    if (typeof URL_CSV !== 'undefined') {
        fetch(URL_CSV)
            .then(response => response.text())
            .then(csvText => {
                // Aquí puedes procesar el texto del CSV si deseas mostrarlo en una tabla
                console.log("CSV cargado correctamente:", csvText.substring(0, 50));
            })
            .catch(err => console.log("Aviso CSV:", err));
    }
});