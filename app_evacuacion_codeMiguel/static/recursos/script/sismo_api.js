document.addEventListener("DOMContentLoaded", () => {
    const btnSismos = document.getElementById("btn-sismos");
    const listaSismos = document.getElementById("lista-sismos");

    if (btnSismos) {
        btnSismos.addEventListener("click", () => {
            if (listaSismos) listaSismos.innerHTML = "<p>Cargando sismos en Colombia...</p>";

            if (typeof URL_API_SISMOS !== 'undefined') {
                fetch(URL_API_SISMOS)
                    .then(response => response.json())
                    .then(data => {
                        if (listaSismos) listaSismos.innerHTML = "";
                        
                        if (!data.features || data.features.length === 0) {
                            listaSismos.innerHTML = "<p>No hay sismos recientes registrados.</p>";
                            return;
                        }

                        // Centrar el mapa de forma general en el país
                        if (window.miMapa) {
                            window.miMapa.setView([4.5709, -74.2973], 6);
                        }

                        data.features.slice(0, 15).forEach(sismo => {
                            const props = sismo.properties;
                            const coords = sismo.geometry.coordinates; // [lng, lat, profundidad]
                            const lat = coords[1];
                            const lng = coords[0];
                            const profundidad = coords[2];

                            // 1. Mostrar en la lista usando el título real de la API
                            const item = document.createElement("div");
                            item.className = "reporte";
                            item.innerHTML = `
                                <strong>🌍 ${props.title}</strong><br>
                                <small>Magnitud: <b>${props.mag}</b> | Profundidad: ${profundidad} km | <a href="${props.url}" target="_blank">Ver detalles</a></small>
                            `;
                            listaSismos.appendChild(item);

                            // 2. Pintarlo en el mapa con su ubicación real
                            if (window.miMapa) {
                                L.circleMarker([lat, lng], {
                                    radius: Math.max(props.mag * 3, 6),
                                    color: '#b91c1c',
                                    fillColor: '#ef4444',
                                    fillOpacity: 0.7,
                                    weight: 1.5
                                }).addTo(window.miMapa)
                                  .bindPopup(`<b>Epicentro:</b> ${props.title}<br><b>Magnitud:</b> ${props.mag}<br><b>Profundidad:</b> ${profundidad} km`);
                            }
                        });
                    })
                    .catch(error => {
                        console.error("Error sismos:", error);
                        if (listaSismos) listaSismos.innerHTML = "<p style='color: red;'>Error al cargar los sismos.</p>";
                    });
            }
        });
    }
});