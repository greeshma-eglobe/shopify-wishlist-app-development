import { json } from "@remix-run/node";
import { unauthenticated } from "../shopify.server";
import { cors } from "remix-utils/cors";

export async function loader({ request }) {
  
  const url = new URL(request.url);
  const idsParam = url.searchParams.get("ids");
  const ids = idsParam?.split(",").map((id) => id.trim()) ?? [];
  const shop = url.searchParams.get("shop");
  const { storefront } = await unauthenticated.storefront(shop);

  const response = await storefront.graphql(
    `
    query ($ids: [ID!]!) {
      nodes(ids: $ids) {
        __typename
        ... on ProductVariant {
          id
          title
          price {
            amount
            currencyCode
          }
          image {
            url
          }
          selectedOptions {
            name
            value
          }
          product {
            id
            title
            handle
            onlineStoreUrl
            tags
          }
        }
        ... on Product {
          id
          title
          handle
          onlineStoreUrl
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          featuredImage {
            url
          }
        }
      }
    }
    `,
    { variables: { ids } }
  );

  const data = await response.json();

  // ✅ Filter only ProductVariant nodes
  const result = data.data.nodes.filter((node) => node.__typename === "ProductVariant");
  return cors(request, json({ result }));
  
  // return json(result, {
  //   headers: {
  //     "Access-Control-Allow-Origin": "*",
  //   },
  // });
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