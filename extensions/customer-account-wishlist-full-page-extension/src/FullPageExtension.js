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
  const appUrl = "https://wishlist-icon.onrender.com";
  const fetchShopDetails = async () => {
    try {
      const response = await api.query(`
        query {
          shop {
            name
            primaryDomain {
              url
            }
          }
        }`);
      return response.data?.shop?.primaryDomain?.url || null;
    } catch (error) {
      console.error("Error fetching shop details:", error);
      return null;
    }
  };

  const shopUrl = await fetchShopDetails();
  const shop = shopUrl ? new URL(shopUrl).hostname : null; // remove https from the url

  const fetchConfiguredTags = async () => {
    try {
      const tagRes = await fetch(`${appUrl}/api/getProductTags?shop=${shop}`);
      const tags = await tagRes.json();
      const productTags = tags?.productTags?.[0]?.tagNames?.trim()
      ? tags.productTags[0].tagNames.split(",").map(tag => tag.trim())
      : null;
    return productTags;
    } catch (error) {
      console.error("Error fetching product tags:", error);
      return [];
    }
  };

  const productTags = await fetchConfiguredTags();
  // get wishlist product from prisma
  const getWishlistProducts = async () => {
    if (!customerId || !shop) return [];
    try {
      const response = await fetch(`${appUrl}/api/getwishlist?customerId=${customerId}&shop=${shop}`);
      const result = await response.json();
      return result && result?.wishlist?.length > 0 ? await processWishlist(result.wishlist) : [];
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      return [];
    }
  };
 
  const processWishlist = async (wishlist) => {
    const ids = wishlist.map(item => item.variantId || item.productId).filter(Boolean);
    if (!ids.length) return [];
    const response = await api.query(`
      query ($ids: [ID!]!) {
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
            tags
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
              tags
            }
          }
        }
      }`, { variables: { ids } });

    return response?.data?.nodes || [];
  };
 
  // Fetch wishlist data
  let wishlistItems = await getWishlistProducts();
 
  // Root UI component
  const pageComponent = root.createComponent(Page, { title: "My Wishlist" });
 
  if (wishlistItems.length > 0) {
    let grid = root.createComponent(Grid, {
      columns: ["fill", "fill", "fill"],
      rows: "auto",
      spacing: "loose",
      blockAlignment: "center",
    });
 
    const removeWishlistItem = async (productId, gridItem, variantId) => {
      if (!customerId || !shop) return;
      try {
        const response = await fetch(`${appUrl}/api/getwishlist`, {
          method: "DELETE",
          body: JSON.stringify({ customerId, productId, shop, variantId }),
        });
        const result = await response.json();
        if (result.wishlist && result.wishlist.count > 0) {
          gridItem.remove();
        }
      } catch (error) {
        console.error("Error removing wishlist item:", error);
      }
    };
   
    const buildWishlist = (wishlistItems) => {
      const createProductComponent = (product) => {
        const variantId = product.id.split("/").pop();
        const storeUrl = `https://${shop}/products/${product.product.handle}?variant=${variantId}`;
        
        const gridItem = root.createComponent(GridItem, { columnSpan: 1 });
    
        const productImage = root.createComponent(Image, {
          source: product.featuredImage?.url || product.image?.url || "",
        });
    
        const productLink = root.createComponent(Link, { to: storeUrl }, productImage);
        const productTitle = root.createComponent(TextBlock, {}, `${product.product.title} ${product.title}`);
    
        const productPrice = root.createComponent(TextBlock, { size: "small" },
          product.priceRange
            ? `${product.priceRange.minVariantPrice.amount} ${product.priceRange.minVariantPrice.currencyCode}`
            : `${product.price.amount} ${product.price.currencyCode}`
        );
    
        const addToCartButton = root.createComponent(Button, {
          kind: "primary",
          to: storeUrl,
        }, "Add to Cart");
    
        const removeButton = root.createComponent(Button, {
          onPress: () => removeWishlistItem(product.product.id, gridItem, product.id),
          kind: "secondary",
        }, "Remove");
    
        const buttonStack = root.createComponent(BlockStack);
        buttonStack.append(addToCartButton);
        buttonStack.append(removeButton);
    
        const wishlistItem = root.createComponent(ResourceItem);
        wishlistItem.append(productLink);
        wishlistItem.append(productTitle);
        wishlistItem.append(productPrice);
        wishlistItem.append(buttonStack);
    
        gridItem.append(wishlistItem);
        return gridItem;
      };
    
      const buildGrid = (products) => {
        const grid = root.createComponent(Grid, {
          columns: ["fill", "fill", "fill"],
          rows: "auto",
          spacing: "loose",
          blockAlignment: "center",
        });
    
        products.forEach(product => grid.append(createProductComponent(product)));
        return grid;
      };
      const buildGroupedWishlist = (wishlistItems) => {
        const groupedProducts = {};
    
        // Initialize tag groups
        productTags.forEach(tag => {
          groupedProducts[tag] = [];
        });
        groupedProducts["Others"] = [];
        // Distribute products into matching tag groups
        wishlistItems.forEach(product => {
          const productTagList = product?.product?.tags || [];
          const matchingTags = productTags.filter(tag => productTagList.includes(tag));
          if (matchingTags.length > 0) {
            matchingTags.forEach(tag => groupedProducts[tag].push(product));
          } else {
            groupedProducts["Others"].push(product);
          }
        });
    
        // Render each tag group (only if it has products)
        Object.entries(groupedProducts).forEach(([tag, products]) => {
          if (products.length === 0) return;
          const sectionTitle = root.createComponent(TextBlock, { size: "large" }, tag);
          pageComponent.append(sectionTitle);
          pageComponent.append(buildGrid(products));
        });
      };
  
      // Render logic
      if (!productTags || productTags.length === 0) {
        // No tags configured – display all products flat
        const grid = buildGrid(wishlistItems);
        pageComponent.append(grid);
      } else {
        // Tags configured – display grouped by tags
        buildGroupedWishlist(wishlistItems);
      }
    
      root.append(pageComponent);
    };
    
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
