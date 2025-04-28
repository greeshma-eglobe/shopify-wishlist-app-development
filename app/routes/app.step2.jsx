import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Button, Text, BlockStack } from "@shopify/polaris";
import Stepper from "./app.stepper";
import { authenticate } from "../shopify.server"; // Ensure authentication import

export async function loader({ request }) {
  try {
    // Authenticate Shopify admin and get session data
    const { session } = await authenticate.admin(request);

    if (!session || !session.shop) {
      throw new Error("Shop data is missing in session.");
    }

    return json({ shop: session.shop });
  } catch (error) {
    console.error("Loader Error:", error);
    throw new Response("Failed to load shop data", { status: 500 });
  }
}

export default function Step2() {
  const { shop } = useLoaderData(); // Get shop URL dynamically

  return (
    <>
      {/* Stepper appears at the top */}
      <Stepper />

      <Page title="Wishlist Setup - Step 2">
        <Card sectioned>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Add Wishlist Button on the Product Page
            </Text>

            <Text>Follow these steps to add the button to your store:</Text>

            <Text as="h3" variant="headingSm">
              Step 1
            </Text>
            <Text>
              <a
                href={`https://${shop}/admin/themes/current/editor`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Click here
              </a>{" "}
              to add the wishlist button to your product page.
            </Text>

            <Text as="h3" variant="headingSm">
              Step 2
            </Text>
            <Text>
              You can adjust the button position by dragging it up or down, hiding, or deleting the wishlist button as needed.
            </Text>

            {/* Next Step Button */}
            <Button url="/app/step3">Next Step</Button>
          </BlockStack>
        </Card>
      </Page>
    </>
  );
}
