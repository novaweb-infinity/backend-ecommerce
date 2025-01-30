// @ts-ignore
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

/**
 * order controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController(
  'api::order.order',
  ({ strapi }) => ({
    async create(ctx) {
      // @ts-ignore

      const { products } = ctx.request.body

      try {
        const line_items = await Promise.all(
          products.map(async (product) => {
            const item = await strapi
              .service('api::product.product')
              .findOne(product.id)

            if (!item) {
              return ctx.badRequest('Producto no encontrado')
            }

            return {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: item.productName,
                },
                unit_amount: Math.round(item.price * 100),
              },
              quantity: 1,
            }
          })
        )

        const session = await stripe.checkout.sessions.create({
          shipping_address_collection: { allowed_countries: ['ES'] },
          payment_method_types: ['card'],
          mode: 'payment',
          success_url: `${process.env.FRONTEND_URL}/success`,
          cancel_url: `${process.env.FRONTEND_URL}/cancel`,
          line_items: line_items,
        })

        await strapi
          .service('api::order.order')
          .create({ data: { products, stripeId: session.id } })

        return { stripeSession: session }
      } catch (error) {
        ctx.response.status = 500
        return { error }
      }
    },
  })
)
