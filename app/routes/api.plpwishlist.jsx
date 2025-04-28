import { json } from "@remix-run/node";
import db from "../db.server";
import { cors } from 'remix-utils/cors';

export async function loader({ request }) {
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customerId");
    const shop = url.searchParams.get("shop");
    const productIds = url.searchParams.get("productIds")?.split(","); // Convert to array

 if (!customerId || !shop || !productIds || productIds.length === 0) {
    return json(
      {
        message: "Missing data. Required: customerId, productId, shop, variantId",
        method: "GET",
      },
      { status: 400 },
    );
  }

  const wishlist = await db.wishlist.findMany({
    where: {
      customerId,
      shop,
      productId: { in: productIds }, // Fetch multiple products
    },
  });
  return cors(request, json({ wishlist }));

}

export async function action({ request }) {
  const body = await request.json(); // Extract JSON body
  const { customerId, productId, shop, action, variantId } = body;

  if (!customerId || !productId || !shop || !action || !variantId) {
    return json({
      message:
        "Missing data. Required data: customerId, productId, shop, action, variantId",
      method: action,
    });
  }

  switch (action) {
    case "CREATE":
      const wishlist = await db.wishlist.create({
        data: {
          customerId,
          productId,
          variantId,
          shop
        },
      });
      return cors(request, json({ message: "Product added to wishlist", method: action, success: true }));

    case "DELETE":
      await db.wishlist.deleteMany({
        where: {
          customerId: customerId,
          shop: shop,
          productId: productId,
          variantId: variantId
        },
      });

    // Delete wishlist item
    const response = await db.wishlist.deleteMany({
        where: { customerId, shop, productId },
      });

      return cors(request, json({ success: true, deletedCount: response.count}));

    default:
      return new Response("Method Not Allowed", { status: 405 });
  }
}
