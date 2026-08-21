//const puppeteer = require('puppeteer');

const puppeteer = await import('puppeteer').then(module => module.default);

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
        const precio = Number(datos.precio || 0);
        const formatearPrecio = (valor) => `$${Number(valor).toFixed(2)}`;
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                @page {
                    size: 80mm 180mm;
                    margin: 0;
                }
                * { box-sizing: border-box; }
                body {
                    width: 80mm;
                    margin: 0;
                    padding: 0;
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background: #fff;
                    color: #1b1b1b;
                }
                .ticket {
                    width: 80mm;
                    min-height: 180mm;
                    padding: 12mm 8mm 8mm;
                    background: #ffffff;
                }
                .brand {
                    text-align: center;
                    border-bottom: 2px dashed #111;
                    padding-bottom: 8px;
                    margin-bottom: 12px;
                }
                .brand h1 {
                    margin: 0;
                    font-size: 18px;
                    letter-spacing: 1px;
                }
                .brand .sub {
                    font-size: 11px;
                    letter-spacing: 1.2px;
                    color: #333;
                    margin-top: 4px;
                }
                .title {
                    text-align: center;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    margin: 8px 0 10px;
                    text-transform: uppercase;
                }
                .info {
                    margin: 8px 0;
                    font-size: 11px;
                    line-height: 1.5;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                    margin: 4px 0;
                }
                .label {
                    font-weight: 700;
                    color: #111;
                }
                .value {
                    text-align: right;
                    color: #222;
                    font-weight: 500;
                }
                .divider {
                    border-top: 1px dashed #111;
                    margin: 10px 0;
                }
                .service-box {
                    padding: 8px 0;
                    font-size: 11px;
                }
                .service-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 6px;
                    margin: 5px 0;
                }
                .service-name {
                    flex: 1;
                    word-break: break-word;
                }
                .total-box {
                    margin-top: 8px;
                    background: #111;
                    color: white;
                    padding: 8px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 700;
                }
                .footer {
                    text-align: center;
                    font-size: 10px;
                    margin-top: 12px;
                    color: #222;
                    line-height: 1.5;
                }
                .ticket-number {
                    font-size: 11px;
                    text-align: center;
                    margin-top: 8px;
                    font-weight: 700;
                }
            </style>
        </head>
        <body>
            <div class="ticket">
                <div class="brand">
                    <h1>CORTA CLIC</h1>
                    <div class="sub">COMPROBANTE DE CITA</div>
                </div>

                <div class="ticket-number">Ticket N° #00${datos.id}</div>
                <div class="title">Servicio agendado</div>

                <div class="info">
                    <div class="info-row"><span class="label">Fecha</span><span class="value">${datos.fecha}</span></div>
                    <div class="info-row"><span class="label">Hora</span><span class="value">${datos.hora}</span></div>
                    <div class="info-row"><span class="label">Cliente</span><span class="value">${datos.cliente}</span></div>
                    <div class="info-row"><span class="label">Barbero</span><span class="value">${datos.barbero}</span></div>
                </div>

                <div class="divider"></div>

                <div class="service-box">
                    <div class="service-row">
                        <span class="service-name">${datos.servicio}</span>
                        <span>${formatearPrecio(precio)}</span>
                    </div>
                </div>

                <div class="divider"></div>

                <div class="total-box">
                    <div class="service-row">
                        <span>TOTAL</span>
                        <span>${formatearPrecio(precio)}</span>
                    </div>
                </div>

                <div class="footer">
                    <div>¡Gracias por preferirnos!</div>
                    <div>Por favor llega 5 minutos antes.</div>
                </div>
            </div>
        </body>
        </html>`;

        await page.setContent(htmlContent, { waitUntil: 'load' });

        return await page.pdf({
            width: '80mm',
            height: '180mm',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        });
    } finally {
        if (page) await page.close();
    }
};

module.exports = { generarTicketBuffer };
