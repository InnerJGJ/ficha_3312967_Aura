document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const contrasena = document.getElementById('Contrasena').value;
    const confirmarContrasena = document.getElementById('ConfirmarContrasena').value;

    if (contrasena !== confirmarContrasena) {
        document.getElementById('errorMessage').textContent = 'Las contraseñas no coinciden';
        return;
    }

    const data = {
        NombreUsuario: document.getElementById('NombreUsuario').value,
        Apellido: document.getElementById('Apellido').value,
        Email: document.getElementById('Email').value,
        Contrasena: contrasena,
        TipoDocumento: document.getElementById('TipoDocumento').value,
        NumeroDocumento: document.getElementById('NumeroDocumento').value,
        Telefono: document.getElementById('Telefono').value,
        Pais: document.getElementById('Pais').value,
        Direccion: document.getElementById('Direccion').value
    };

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Usuario registrado exitosamente');
            window.location.href = '/src/pages/login.html';
        } else {
            const error = await response.json();
            document.getElementById('errorMessage').textContent = error.message || 'Error al registrarse';
        }
    } catch (error) {
        document.getElementById('errorMessage').textContent = 'Error de conexión';
    }
});