const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Preference } = require("mercadopago");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// 1. SEGURIDAD (CORS)
// Permite que tu dominio planazos.online y tu compu (localhost) hablen con este servidor
app.use(cors({
    origin: ["https://planazos.online", "http://localhost:5500", "http://127.0.0.1:5500"],
    methods: ["POST", "GET"],
}));

app.use(express.json());

// 2. CONEXIÓN CON MERCADO PAGO
// La clave segura viene del archivo .env
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// Ruta de prueba para saber si está vivo
app.get("/", (req, res) => {
    res.send("El Backend de Planazos está activo 🚀");
});

// 3. RUTA PARA CREAR EL PAGO
app.post("/crear-preferencia", async (req, res) => {
    try {
        const { title, price, quantity } = req.body;

        // Validamos que lleguen datos
        if (!title || !price || !quantity) {
            return res.status(400).json({ error: "Faltan datos del plan" });
        }

        const body = {
            items: [
                {
                    title: title,
                    quantity: Number(quantity),
                    unit_price: Number(price),
                    currency_id: "ARS",
                },
            ],
            // A dónde vuelve el usuario después de pagar
            back_urls: {
                success: "https://planazos.online?status=success",
                failure: "https://planazos.online?status=failure",
                pending: "https://planazos.online?status=pending",
            },
            auto_return: "approved",
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });

        // Devolvemos el ID al Frontend para abrir el checkout
        res.json({ id: result.id });

    } catch (error) {
        console.error("Error al crear preferencia:", error);
        res.status(500).json({ error: "Error al conectar con Mercado Pago" });
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
