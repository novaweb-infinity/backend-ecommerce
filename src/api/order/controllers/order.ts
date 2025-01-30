const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
import { factories } from "@strapi/strapi"

export default factories.createCoreController("api::order.order", ({ strapi }) => ({
  async create(ctx) {
    const { products } = ctx.request.body

    if (!products || !Array.isArray(products)) {
      return ctx.badRequest("Se requiere un array de productos válido")
    }

    try {
      const lineItems = await Promise.all(
        products.map(async (product) => {
          const productId = parseInt(product.id)
          if (isNaN(productId)) {
            throw new Error(`ID de producto inválido: ${product.id}`)
          }

          const item = await strapi.db.query("api::product.product").findOne({ where: { id: productId } })

          if (!item) {
            throw new Error(`Producto con ID ${productId} no encontrado`)
          }

          return {
            price_data: {
              currency: "eur",
              product_data: {
                name: item.productName,
                description: item.description || undefined,
              },
              unit_amount: Math.round(item.price * 100),
            },
            quantity: product.quantity || 1,
          }
        })
      )

      const session = await stripe.checkout.sessions.create({
        shipping_address_collection: { allowed_countries: ["ES"] },
        payment_method_types: ["card"],
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/cancel`,
        line_items: lineItems,
      })

      const order = await strapi.service("api::order.order").create({
        data: {
          products,
          stripeId: session.id,
          status: "pending",
          total: session.amount_total / 100,
        },
      })

      return { stripeSession: session, order }
    } catch (error) {
      console.error("Error en la creación de la orden:", error)
      ctx.response.status = 500
      return {
        error: true,
        message: error.message || "Error al procesar la orden",
      }
    }
  },
}))
