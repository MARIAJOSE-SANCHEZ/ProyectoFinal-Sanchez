const formulario = document.getElementById('formularioPrestamo');
const resultadoDiv = document.getElementById('resultado');
const historialDiv = document.getElementById('historial');
const botonBorrarHistorial = document.getElementById('borrarHistorial');
const tipoFiltro = document.getElementById('tipoFiltro');
const montoFiltro = document.getElementById('montoFiltro');
const botonAplicarFiltro = document.getElementById('aplicarFiltro');
const tipoSelect = document.getElementById('tipo');
const montoInput = document.getElementById('monto');
const mesesInput = document.getElementById('meses');

// Validar si se ingresan puntos o comas en el campo MONTO
montoInput.addEventListener('input', () => {
    const valor = montoInput.value;
    if (valor.includes('.') || valor.includes(',')) {
        Swal.fire({
            icon: 'error',
            title: 'Formato incorrecto',
            text: 'Por favor, no ingrese puntos (.) ni coma (,).'
        });
        montoInput.value = valor.replace(/[.,]/g, '');
    }
});

// Validar si se ingresan puntos o comas en el campo MESES
mesesInput.addEventListener('input', () => {
    const valor = mesesInput.value;
    if (valor.includes('.') || valor.includes(',')) {
        Swal.fire({
            icon: 'error',
            title: 'Formato incorrecto',
            text: 'Por favor, no ingrese puntos (.) ni coma (,).'
        });
        mesesInput.value = valor.replace(/[.,]/g, '');
    }
});



let tasas = {};
let historialPrestamos = JSON.parse(localStorage.getItem('historialPrestamos')) || [];

// Cargar tasas desde JSON
fetch('data/tiposPrestamo.json')
  .then(res => res.json())
  .then(data => {
    data.forEach(item => {
        tasas[item.tipo] = item.tasa;

        // Llenar los select dinámicamente
        const option = document.createElement('option');
        option.value = item.tipo;
        option.textContent = `${item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)} (${item.tasa * 100}%)`;
        tipoSelect.appendChild(option);

        const filtroOption = document.createElement('option');
        filtroOption.value = item.tipo;
        filtroOption.textContent = item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1);
        tipoFiltro.appendChild(filtroOption);
    });
  });

function calcularPrestamo(monto, meses, tipo) {
    const tasa = tasas[tipo];
    const montoTotal = monto + (monto * tasa * meses);
    const cuota = montoTotal / meses;
    return {
        montoTotal: montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 }),
        cuota: cuota.toLocaleString('es-AR', { minimumFractionDigits: 2 })
    };
}

function mostrarHistorial() {
    historialDiv.innerHTML = '';
    if (historialPrestamos.length === 0) {
        historialDiv.innerHTML = "<p>No hay simulaciones anteriores.</p>";
        return;
    }
    historialPrestamos.forEach((prestamo, index) => {
        const prestamoHTML = document.createElement('div');
        prestamoHTML.classList.add('card');
        prestamoHTML.innerHTML = `
            <p><strong>Simulación ${index + 1}</strong><br>
            Fecha: ${prestamo.fecha}<br>
            Monto: $${prestamo.monto}<br>
            Tipo: ${prestamo.tipo}<br>
            Plazo: ${prestamo.meses} meses<br>
            Cuota: $${prestamo.cuota}<br>
            Total a Pagar: $${prestamo.montoTotal}</p>
        `;
        historialDiv.appendChild(prestamoHTML);
    });
}

function guardarHistorial() {
    localStorage.setItem('historialPrestamos', JSON.stringify(historialPrestamos));
}

formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    const monto = parseFloat(document.getElementById('monto').value);
    const meses = parseInt(document.getElementById('meses').value);
    const tipo = tipoSelect.value;

    if (isNaN(monto) || monto <= 0 || isNaN(meses) || meses <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Entrada inválida',
            text: 'Por favor ingrese valores válidos.'
        });
        return;
    }

    const { montoTotal, cuota } = calcularPrestamo(monto, meses, tipo);

    resultadoDiv.innerHTML = `
    <p><strong>Resultado de la Simulación:</strong><br>
    Cuota mensual: $${cuota}<br>
    Total a pagar: $${montoTotal}</p>
    `;
    resultadoDiv.classList.add('aparecer');

    const nuevoPrestamo = {
        monto,
        meses,
        tipo,
        cuota,
        montoTotal,
        fecha: new Date().toLocaleString('es-AR')
    };

    historialPrestamos.push(nuevoPrestamo);
    guardarHistorial();
    mostrarHistorial();
    formulario.reset();
});

botonBorrarHistorial.addEventListener('click', () => {
    Swal.fire({
        title: '¿Estás seguro?',
        text: '¡Esto borrará todo el historial!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#800020',
        cancelButtonColor: '#aaa',
        confirmButtonText: 'Sí, borrar'
    }).then((result) => {
        if (result.isConfirmed) {
            historialPrestamos = [];
            guardarHistorial();
            mostrarHistorial();
            resultadoDiv.innerHTML = '';
            Swal.fire('¡Borrado!', 'El historial ha sido eliminado.', 'success');
        }
    });
});

botonAplicarFiltro.addEventListener('click', () => {
    const tipoSeleccionado = tipoFiltro.value;
    const montoMinimo = parseFloat(montoFiltro.value) || 0;

    const historialFiltrado = historialPrestamos.filter(prestamo => {
        const cumpleTipo = tipoSeleccionado === "todos" || prestamo.tipo === tipoSeleccionado;
        const cumpleMonto = parseFloat(prestamo.monto) >= montoMinimo;
        return cumpleTipo && cumpleMonto;
    });

    mostrarHistorialFiltrado(historialFiltrado);
});

function mostrarHistorialFiltrado(lista) {
    historialDiv.innerHTML = '';
    if (lista.length === 0) {
        historialDiv.innerHTML = "<p>No hay simulaciones que coincidan con el filtro.</p>";
        return;
    }
    lista.forEach((prestamo, index) => {
        const prestamoHTML = document.createElement('div');
        prestamoHTML.classList.add('card');
        prestamoHTML.innerHTML = `
            <p><strong>Simulación ${index + 1}</strong><br>
            Fecha: ${prestamo.fecha}<br>
            Monto: $${prestamo.monto}<br>
            Tipo: ${prestamo.tipo}<br>
            Plazo: ${prestamo.meses} meses<br>
            Cuota: $${prestamo.cuota}<br>
            Total a Pagar: $${prestamo.montoTotal}</p>
        `;
        historialDiv.appendChild(prestamoHTML);
    });
}

mostrarHistorial();
