const puppeteer = require('puppeteer');

let browserInstance = null;

async function getBrowser() {
    if (!browserInstance) {
        browserInstance = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }
    return browserInstance;
}

const generarTicketBuffer = async (datos) => {
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    try {
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { 
                    width: 74mm; 
                    margin: 0; 
                    padding: 2mm; 
                    font-family: 'Courier New', Courier, monospace; 
                    font-size: 12px; 
                    color: #000;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .linea { border-top: 1px dashed #000; margin: 8px 0; }
                table { width: 100%; border-collapse: collapse; }
                td { padding: 4px 0; }
                .total { font-size: 14px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="text-center">
                <h3 style="margin: 5px 0;">BARBERÍA / PELUQUERÍA</h3>
                <p style="margin: 0;"><b>COMPROBANTE DE CITA</b></p>
                <p style="margin: 4px 0 0 0;">Ticket N°: #00${datos.id}</p>
            </div>
            
            <div class="linea"></div>
            <p style="margin: 3px 0;"><b>Fecha:</b> ${datos.fecha}</p>
            <p style="margin: 3px 0;"><b>Hora del Turno:</b> ${datos.hora}</p>
            <p style="margin: 3px 0;"><b>Cliente:</b> ${datos.cliente}</p>
            <p style="margin: 3px 0;"><b>Barbero:</b> ${datos.barbero}</p>
            <div class="linea"></div>

            <table>
                <thead>
                    <tr>
                        <th align="left">Servicio Solicitado</th>
                        <th align="right">Precio</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${datos.servicio}</td>
                        <td class="text-right">$${parseFloat(datos.precio).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="linea"></div>
            <table class="total">
                <tr>
                    <td>TOTAL A PAGAR:</td>
                    <td class="text-right">$${parseFloat(datos.precio).toFixed(2)}</td>
                </tr>
            </table>
            <div class="linea"></div>

            <div class="text-center" style="margin-top: 15px;">
                <p style="margin: 0;">¡Le esperamos!</p>
                <p style="margin: 3px 0 0 0; font-size: 10px;">Por favor llegue 5 minutos antes.</p>
            </div>
        </body>
        </html>`;

        await page.setContent(htmlContent);
        
        return await page.pdf({
            width: '80mm',
            height: '160mm',
            printBackground: true,
            margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
        });
    } finally {
        if (page) await page.close();
    }
};

module.exports = { generarTicketBuffer };
