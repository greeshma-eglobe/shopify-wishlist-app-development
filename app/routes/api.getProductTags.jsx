import { json } from "@remix-run/node";
import db from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);
   const shop = url.searchParams.get("shop");

    try {
      // Fetch wishlist items
      const productTags = await db.productTags.findMany({
        where: { shop },
      });
 
      return json(
        {  productTags: productTags },
        { headers: { "Access-Control-Allow-Origin": "*" } },
      );
  
    } catch (error) {
      return json(
        { message: "Error fetching productTags", error: error.message },
        { status: 500 }
      );
    }
}
