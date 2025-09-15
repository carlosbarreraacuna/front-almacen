# Configuración de Impresora Térmica para Facturación Electrónica

## Especificaciones Técnicas Recomendadas

### Tipo de Impresora
- **Impresora térmica de 80mm** (ancho de papel)
- Resolución mínima: 203 DPI
- Velocidad de impresión: 150-250 mm/s
- Conectividad: USB, Ethernet o Bluetooth

### Configuraciones del Driver

#### 1. Tamaño de Papel
- **Ancho**: 80mm (3.15 pulgadas)
- **Largo**: Continuo o rollo
- **Tipo**: Papel térmico sin tinta

#### 2. Configuración de Página
- **Orientación**: Vertical (Portrait)
- **Márgenes**: 
  - Superior: 5mm
  - Inferior: 5mm
  - Izquierdo: 3mm
  - Derecho: 3mm

#### 3. Configuración de Calidad
- **Densidad de impresión**: Media-Alta
- **Velocidad**: Media (para mejor calidad)
- **Modo de impresión**: Texto y gráficos

### Configuración en Windows

#### Pasos para configurar la impresora:

1. **Instalar el driver de la impresora**
   - Descargar el driver oficial del fabricante
   - Ejecutar como administrador
   - Seguir el asistente de instalación

2. **Configurar propiedades de impresión**
   - Ir a `Panel de Control > Dispositivos e impresoras`
   - Clic derecho en la impresora térmica
   - Seleccionar "Propiedades de impresión"

3. **Ajustar configuraciones específicas**
   ```
   Tamaño de papel: Personalizado (80mm x Continuo)
   Orientación: Vertical
   Calidad: 203 DPI o superior
   Tipo de papel: Térmico
   Alimentación: Rollo continuo
   ```

### Configuración del Navegador

#### Chrome/Edge:
1. Abrir configuración de impresión (Ctrl+P)
2. Seleccionar la impresora térmica
3. Configurar:
   - **Destino**: Impresora térmica configurada
   - **Páginas**: Todas
   - **Diseño**: Vertical
   - **Color**: Escala de grises
   - **Más ajustes**:
     - Tamaño de papel: Personalizado (80mm)
     - Márgenes: Mínimos
     - Escala: 100%

### Configuraciones Específicas por Marca

#### Epson TM-T20/T82/T88
```
Ancho de papel: 80mm
Velocidad: 200mm/s
Densidad: -3 a +3 (recomendado: 0)
Modo de corte: Automático
Buzzer: Desactivado
```

#### Bixolon SRP-350/380
```
Ancho de papel: 80mm
Resolución: 180 DPI
Velocidad: 220mm/s
Modo de impresión: Térmico directo
```

#### Star TSP143/650
```
Ancho de papel: 80mm
Resolución: 203 DPI
Velocidad: 250mm/s
Interfaz: USB/Ethernet
```

### Solución de Problemas Comunes

#### Problema: Texto cortado en los bordes
**Solución**: 
- Reducir márgenes a mínimos
- Verificar que el ancho del papel esté configurado correctamente
- Ajustar la escala de impresión al 95-98%

#### Problema: Impresión muy clara o borrosa
**Solución**:
- Aumentar la densidad de impresión
- Verificar que el papel térmico esté en buen estado
- Limpiar el cabezal de impresión

#### Problema: Cortes de página incorrectos
**Solución**:
- Configurar papel como "rollo continuo"
- Desactivar saltos de página automáticos
- Usar CSS `page-break-inside: avoid`

### Recomendaciones de Papel

- **Grosor**: 55-80 micrones
- **Ancho**: 80mm ± 0.5mm
- **Calidad**: Papel térmico de alta sensibilidad
- **Almacenamiento**: Lugar seco, temperatura ambiente
- **Duración**: Usar papel con vida útil mínima de 7 años

### Mantenimiento

#### Limpieza regular:
- Limpiar cabezal térmico cada 3 meses
- Usar alcohol isopropílico al 99%
- Limpiar rodillos de alimentación
- Verificar alineación del papel

#### Calibración:
- Ejecutar auto-test mensualmente
- Ajustar densidad según desgaste
- Verificar corte automático

### Configuración CSS Optimizada

El componente `ThermalPrint.tsx` ya incluye estilos optimizados:

```css
@page {
  size: 80mm auto;
  margin: 2mm;
}

@media print {
  body {
    font-family: 'Courier New', monospace;
    font-size: 11px;
    line-height: 1.2;
  }
}
```

### Contacto y Soporte

Para problemas específicos con la configuración:
1. Consultar manual del fabricante
2. Contactar soporte técnico del proveedor
3. Verificar actualizaciones de driver
4. Probar con diferentes configuraciones de densidad

---

**Nota**: Estas configuraciones han sido probadas con las marcas más comunes de impresoras térmicas de 80mm. Pueden requerir ajustes menores según el modelo específico.