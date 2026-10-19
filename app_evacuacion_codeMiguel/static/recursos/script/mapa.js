document.addEventListener("DOMContentLoaded", () => {
    // 1. Coordenadas exactas por defecto de la sede SENA Alto del Cauca (Popayán)
    const latSena = 2.483108; 
    const lngSena = -76.561908;

    // Verificar que el contenedor del mapa exista en el HTML
    const contenedorMapa = document.getElementById('mapa');
    if (!contenedorMapa) return;

    // Inicializamos el mapa centrado en el SENA Alto del Cauca
    const mapaIniciado = L.map('mapa').setView([latSena, lngSena], 15);
    
    // Guardamos la instancia de manera global
    window.miMapa = mapaIniciado;

    // 2. Capa visual de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapaIniciado);

    // 3. MARCADOR PRINCIPAL: SENA ALTO DEL CAUCA
    L.marker([latSena, lngSena]).addTo(mapaIniciado)
        .bindPopup("<b>SENA Alto del Cauca</b><br>Punto principal de evacuación y encuentro.")
        .openPopup();

    // 4. Cargar la ruta GeoJSON si está disponible
    if (typeof URL_GEO !== 'undefined') {
        fetch(URL_GEO)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    L.geoJSON(data, {
                        style: {
                            color: "#ef4444",      
                            weight: 5,             
                            opacity: 0.8,
                            dashArray: '6, 6'      
                        }
                    }).addTo(mapaIniciado);
                }
            })
            .catch(err => console.log("Aviso GeoJSON:", err));
    }

    // 5. Cargar los demás puntos de encuentro del JSON
    if (typeof URL_JSON !== 'undefined') {
        fetch(URL_JSON)
            .then(res => res.ok ? res.json() : null)
            .then(puntos => {
                if (puntos && Array.isArray(puntos)) {
                    puntos.forEach(p => {
                        L.marker([p.lat, p.lng]).addTo(mapaIniciado)
                            .bindPopup(`<b>📍 ${p.nombre}</b><br>${p.descripcion}`);
                    });
                }
            })
            .catch(err => console.log("Aviso Puntos JSON:", err));
    }

    // 6. SISTEMA DE RUTAS (SIN EL PANEL DE TEXTO)
    let controlRuta = null;

    function trazarRuta(origenLat, origenLng, destinoLat, destinoLng) {
        if (typeof L.Routing === 'undefined') {
            console.error("Leaflet Routing Machine no está cargado.");
            alert("La librería de enrutamiento no está disponible.");
            return;
        }

        if (controlRuta) {
            mapaIniciado.removeControl(controlRuta);
        }

        try {
            controlRuta = L.Routing.control({
                waypoints: [
                    L.latLng(origenLat, origenLng),   
                    L.latLng(destinoLat, destinoLng)  
                ],
                routeWhileDragging: false,
                language: 'es',
                router: L.Routing.osrmv1({
                    serviceUrl: 'https://router.project-osrm.org/route/v1'
                }),
                lineOptions: {
                    styles: [{ color: '#4f46e5', weight: 6, opacity: 0.8 }]
                },
                show: false, // Panel de instrucciones oculto
                createMarker: function() { return null; } 
            });

            controlRuta.addTo(mapaIniciado);

        } catch (error) {
            console.error("Error al calcular la ruta:", error);
        }
    }

    // A. Hacer clic en el mapa: Rellena automáticamente el input de lugar y traza la ruta hacia el SENA
    mapaIniciado.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        const inputLugar = document.getElementById('input-lugar');
        if(inputLugar) inputLugar.value = `Ubicación en mapa (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        trazarRuta(lat, lng, latSena, lngSena);
    });

    // B. Botón "Trazar mi Ruta Manual" (coordenadas)
    const btnManual = document.getElementById('btn-trazar-manual');
    if (btnManual) {
        btnManual.addEventListener('click', () => {
            const valOrigen = document.getElementById('input-origen').value.split(',');
            const valDestino = document.getElementById('input-destino').value.split(',');

            if (valOrigen.length !== 2 || valDestino.length !== 2) {
                alert("Por favor ingresa coordenadas válidas en formato: latitud, longitud (Ej: 2.45, -76.60)");
                return;
            }

            const oLat = parseFloat(valOrigen[0].trim());
            const oLng = parseFloat(valOrigen[1].trim());
            const dLat = parseFloat(valDestino[0].trim());
            const dLng = parseFloat(valDestino[1].trim());

            mapaIniciado.setView([oLat, oLng], 15);
            trazarRuta(oLat, oLng, dLat, dLng);
        });
    }

    // C. Botón de geolocalización original
    const btnRuta = document.getElementById("btn-ruta");
    if (btnRuta) {
        btnRuta.addEventListener("click", () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;

                    const inputLugar = document.getElementById('input-lugar');
                    if(inputLugar) inputLugar.value = "Mi ubicación actual (Geolocalización)";

                    mapaIniciado.setView([userLat, userLng], 15);
                    trazarRuta(userLat, userLng, latSena, lngSena);

                }, error => {
                    alert("No se pudo obtener tu geolocalización. Haz clic directamente en el mapa o escribe un lugar.");
                });
            } else {
                alert("Tu navegador no soporta geolocalización.");
            }
        });
    }

    // D. BÚSQUEDA INTELIGENTE USANDO EL BUSCADOR OFICIAL DE OPENSTREETMAP (NOMINATIM)
    const btnBuscarLugar = document.getElementById('btn-buscar-lugar');
    const inputLugar = document.getElementById('input-lugar');

    if (btnBuscarLugar && inputLugar) {
        btnBuscarLugar.addEventListener('click', async () => {
            const textoBusqueda = inputLugar.value.trim();
            if (!textoBusqueda) {
                alert("Por favor escribe el nombre de un barrio, sitio o dirección.");
                return;
            }

            // Buscamos el lugar acotándolo a Popayán, Colombia para mayor precisión
            const query = encodeURIComponent(`${textoBusqueda}, Popayán, Cauca, Colombia`);
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

            try {
                const respuesta = await fetch(url);
                const resultados = await respuesta.json();

                if (resultados && resultados.length > 0) {
                    const lugar = resultados[0];
                    const latEncontrada = parseFloat(lugar.lat);
                    const lngEncontrada = parseFloat(lugar.lon);

                    // Centrar mapa y trazar ruta hacia el SENA
                    mapaIniciado.setView([latEncontrada, lngEncontrada], 15);
                    trazarRuta(latEncontrada, lngEncontrada, latSena, lngSena);

                    // Colocar marcador en el lugar encontrado
                    L.marker([latEncontrada, lngEncontrada]).addTo(mapaIniciado)
                        .bindPopup(`<b>📍 Origen:</b> ${lugar.display_name}`).openPopup();
                } else {
                    alert(`No se encontró "${inputLugar.value}" en Popayán. Intenta ser más específico.`);
                }
            } catch (error) {
                console.error("Error en la búsqueda de geocodificación:", error);
                alert("Hubo un error al conectar con el buscador de mapas.");
            }
        });
    }
});