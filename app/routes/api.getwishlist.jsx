import { json } from "@remix-run/node";
import db from "../db.server";
import { cors } from 'remix-utils/cors';
export async function loader({ request }) {
  const url = new URL(request.url);
  const customerId = url.searchParams.get("customerId");
  const shop = url.searchParams.get("shop");
  try {
    // Fetch wishlist items
    const wishlist = await db.wishlist.findMany({
      where: { customerId, shop },
    });

    return cors(request, json({ wishlist: wishlist }));

  } catch (error) {
    return json(
      { message: "Error fetching wishlist", error: error.message },
      { status: 500 }
    );
  }
}

export async function action({ request }) {
  const body = await request.json(); // Extract JSON body
  const { customerId, productId, shop, action,variantId } = body;

  if (!customerId || !productId || !shop || !action) {
    return json({
      message:
        "Missing data. Required data: customerId, productId, shop, action",
      method: action,
    });
  }

  switch (action) {
    case "DELETE":
      const wishlist = await db.wishlist.deleteMany({
        where: {
          customerId: customerId,
          shop: shop,
          productId: productId,
          variantId: variantId
        },
      });
    
      return cors(request, json({ wishlist: wishlist }));

    default:
      return new Response("Method Not Allowed", { status: 405 });
  }
}
