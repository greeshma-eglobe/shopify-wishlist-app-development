import {
  BlockStack,
  ResourceItem,
  extension,
  Image,
  Page,
  Grid,
  GridItem,
  TextBlock,
  Button,
  Link
 } from "@shopify/ui-extensions/customer-account";
 
 export default extension("customer-account.page.render", async (root, api) => {
  const { i18n } = api;
 
  const customerId = api.authenticatedAccount?.customer?.current?.id;
  console.log("Customer ID:", customerId);
 
  const fetchShopDetails = async () => {
    try {
      const response = await api.query(
        `query {
          shop {
            name
            primaryDomain {
              url
            }
          }
        }`,
      );
 
      if (!response.data || !response.data.shop) {
        throw new Error("Failed to fetch shop details.");
      }
 
      const fullUrl = response.data.shop.primaryDomain.url;
      return new URL(fullUrl).hostname; // remove https from the url
    } catch (error) {
      console.error("Error fetching shop details:", error);
      return null;
    }
  };
  const shop = await fetchShopDetails();

// Fetch product tags configured for the shop
let configuredTagsName = [];

try {
  const tagRes = await fetch(`https://wishlist-icon.onrender.com/api/getProductTags?shop=${shop}`);
  
  if (!tagRes.ok) {
    throw new Error(`Failed to fetch tags. Status: ${tagRes.status}`);
  }

  const configuredTags = await tagRes.json();

  // Safely extract tagNames string and convert to array
  const tagNamesString = configuredTags?.productTags?.[0]?.tagNames || "";
  
  configuredTagsName = tagNamesString
    .split(",")
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0); // remove empty tags

  console.log("Configured Tags:", configuredTagsName);
} catch (error) {
  console.error("Error fetching product tags:", error);
}
  // get wishlist product from prisma
  const getWishlistProducts = async () => {
    if (!customerId || !shop) {
      console.error("Customer ID or Shop URL is missing.");
      return [];
    }
    try {
      const response = await fetch(
        `https://wishlist-icon.onrender.com/api/getwishlist?customerId=${customerId}&shop=${shop}`,
        { method: "GET" },
      );
 
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
 
      const result = await response.json();
      console.log(result);
      console.log('-----------------');
      return result && result.wishlist.length > 0
        ? await processWishlist(result.wishlist)
        : [];
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      return [];
    }
  };
 
  const processWishlist = async (wishlist) => {
    console.log(wishlist);
     const ids = wishlist.map((item) => item.variantId || item.productId).filter(Boolean);
     console.log("Fetching data for IDs:", ids);
    if (!ids.length) return [];
     try {
      const response = await api.query(
        `query ($ids: [ID!]!) {
          nodes(ids: $ids) {
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
                title
                tags
              }
            }
          }
        }`,
        { variables: { ids } }
      );
       console.log("GraphQL Response:", response);
       if (!response || !response.data || !response.data.nodes) {
        console.error("Invalid response structure:", response);
        return [];
      }
      return response.data.nodes;
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };
 
  // Fetch wishlist data
  let wishlistItems = await getWishlistProducts();
  console.log("Final Wishlist Products Data:", wishlistItems);
 
  // Root UI component
  const pageComponent = root.createComponent(Page, { title: "Wishlists" });
 
  if (wishlistItems.length > 0) {
    let grid = root.createComponent(Grid, {
      columns: ["fill", "fill", "fill"],
      rows: "auto",
      spacing: "loose",
      blockAlignment: "center",
    });
 
    const removeWishlistItem = async (productId, gridItem, variantId) => {
      console.log(customerId);
      console.log(productId);
      console.log(shop);
      if (!customerId || !shop) {
        console.error("Customer ID or Shop URL is missing.");
        return;
      }
      try {
        const action = "DELETE";
        const response = await fetch(
          "https://wishlist-icon.onrender.com/api/getwishlist",
          {
            method: "DELETE",
            body: JSON.stringify({
              customerId,
              productId,
              shop,
              action,
              variantId
            }),
          },
        );
 
        const result = await response.json();
 console.log(result);
        if (result.wishlist && result.wishlist.count > 0) {
          gridItem.remove();
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      }
    };
    const addToCart = async (product) => {
      try {
        console.log('success');
      } catch (error) {
        console.error("Error adding to cart:", error);
        alert("Failed to add product to cart.");
      }
    };
   
    function buildWishlist(wishlistItems) {
  const pageComponent = root.createComponent(BlockStack);

  // Step 1: Define configured tags
  const configuredTagsName = ['new', 'test', 'newtest'];

  // Step 2: Create group containers
  const groupedProducts = {};
  configuredTagsName.forEach(tag => {
    groupedProducts[tag] = [];
  });
  groupedProducts["others"] = [];

  // Step 3: Assign products to groups (allow multiple groups per product)
  wishlistItems.forEach((product) => {
    const tags = product.product?.tags || [];
    let matched = false;

    configuredTagsName.forEach(tag => {
      if (tags.includes(tag)) {
        groupedProducts[tag].push(product);
        matched = true;
      }
    });

    if (!matched) {
      groupedProducts["others"].push(product);
    }
  });

  // Step 4: Render each group with title and grid
  Object.entries(groupedProducts).forEach(([tagName, products]) => {
    if (products.length === 0) return;

    const groupTitle = root.createComponent(TextBlock, {
      size: "medium",
      emphasis: "bold"
    }, tagName.toUpperCase());

    const grid = root.createComponent(Grid, {
      columns: ["fill", "fill", "fill"],
      rows: "auto",
      spacing: "loose",
      blockAlignment: "center",
    });

    products.forEach((product) => {
      const variantId = product.id.split("/").pop();
      const storeUrl = `https://${shop}/products/${product.product.handle}?variant=${variantId}`;

      const gridItem = root.createComponent(GridItem, { columnSpan: 1 });

      const productImage = root.createComponent(Image, {
        source: product.featuredImage?.url || product.image?.url || "",
      });

      const productLink = root.createComponent(Link, { to: storeUrl }, productImage);

      const productTitle = root.createComponent(
        TextBlock,
        {},
        `${product.product.title} ${product.title} `
      );

      const productPrice = root.createComponent(TextBlock, { size: "small" },
        product.priceRange
          ? `${product.priceRange.minVariantPrice.amount} ${product.priceRange.minVariantPrice.currencyCode}`
          : `${product.price.amount} ${product.price.currencyCode}`
      );
      
      const addToCartButton = root.createComponent(
        Button,
        {
          kind: "primary",
          to: storeUrl,
        },
        "Add to Cart",
      );

      const removeButton = root.createComponent(
        Button,
        {
          onPress: () => removeWishlistItem(product.product.id, gridItem, product.id),
          kind: "secondary",
        },
        "Remove",
      );

      const buttonStack = root.createComponent(BlockStack);
      buttonStack.append(addToCartButton);
      buttonStack.append(removeButton);

      const wishlistItem = root.createComponent(ResourceItem);
      wishlistItem.append(productLink);
      wishlistItem.append(productTitle);
      wishlistItem.append(productPrice);
      wishlistItem.append(buttonStack);

      gridItem.append(wishlistItem);
      grid.append(gridItem);
    });

    pageComponent.append(groupTitle);
    pageComponent.append(grid);
  });

  root.append(pageComponent);
}

 
    buildWishlist(wishlistItems);
  } else {
    const noItemsMessage = root.createComponent(
      TextBlock,
      {},
      "No items in your wishlist",
    );
    pageComponent.append(noItemsMessage);
    root.append(pageComponent);
  }
 });