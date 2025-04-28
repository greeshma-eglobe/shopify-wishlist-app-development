import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Button, Text, BlockStack } from "@shopify/polaris";
import Stepper from "./app.stepper";
import { authenticate } from "../shopify.server"; 

// Loader function to fetch shop URL dynamically
export async function loader({ request }) {
    try {
      // Authenticate Shopify admin and get session data
      const { session } = await authenticate.admin(request);
      const { shop, accessToken } = session;
    
      console.log("Admin API Token:", accessToken);
      if (!session || !session.shop) {
        throw new Error("Shop data is missing in session.");
      }
  
      return json({ shop: session.shop });

    } catch (error) {
      console.error("Loader Error:", error);
      throw new Response("Failed to load shop data", { status: 500 });
    }
  }

export default function Step1() {
  const { shop } = useLoaderData(); // Get shop URL dynamically

  return (
    <>
      {/* Stepper appears at the top */}
      <Stepper />
      <Page title="Wishlist Setup - Step 1">
        <Card sectioned>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Activate the App
            </Text>

            <Text>Follow the steps below to activate the app properly.</Text>

            <Text>Click the button below to go to the customizer and enable our app from the embedded app list.</Text>

            {/* Open Theme Editor Button (Dynamic Shop URL) */}
            <Button
              url={`https://${shop}/admin/themes/current/editor?context=apps`}
              target="_blank"
            >
              Open Theme Editor
            </Button>

            {/* Next Step Button */}
            <Button url="/app/step2">Next Step</Button>
          </BlockStack>
        </Card>
      </Page>
    </>
  );
}
