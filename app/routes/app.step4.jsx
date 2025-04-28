import { Page, Card, Button, Text, Icon, BlockStack, InlineStack } from "@shopify/polaris";
import Stepper from "./app.stepper"; 

export default function Step4() {
  return (
    <>
      {/* Stepper appears at the top */}
      <Stepper />

      <Page title="Wishlist Setup - Step 4">
        <Card sectioned>
          <BlockStack gap="400" alignment="center">

            {/* Success Message */}
            <Text as="h2" variant="headingLg">
              Congratulations! 
            </Text>
            
            <Text>Your wishlist app is now fully set up and ready to use.</Text>

            {/* Final Action Button */}
            <Button variant="primary" url="/app">
              Go to Dashboard
            </Button>
          </BlockStack>
        </Card>
      </Page>
    </>
  );
}
