const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
        if (!tema.trim()) {
            throw new Error('Por favor ingresa un tema para el debate');
        }

        console.log('📝 Enviando solicitud:', { tema, estilo, contexto });
        
        const response = await fetch('/api/generar-respuesta', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tema, estilo, contexto }),
        });

        const data = await response.json();
        console.log('✅ Respuesta recibida:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Error en la solicitud');
        }

        if (!data.success) {
            throw new Error(data.error || 'No se recibió una respuesta válida');
        }

        if (!data.respuesta || typeof data.respuesta !== 'string' || !data.respuesta.trim()) {
            throw new Error('La respuesta recibida no es válida');
        }

        setRespuesta(data.respuesta);
        
        // Si hubo un error pero tenemos una respuesta de respaldo, mostrar una notificación
        if (data.wasError) {
            setError('Se está usando una respuesta de respaldo debido a un error temporal');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        setError(error.message || 'Ocurrió un error inesperado');
        setRespuesta(''); // Limpiar respuesta anterior en caso de error
    } finally {
        setLoading(false);
    }
}; 