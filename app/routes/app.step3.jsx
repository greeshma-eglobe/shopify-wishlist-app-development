import { useLoaderData, Form } from "@remix-run/react";
import {
  Page,
  Card,
  Button,
  Text,
  BlockStack,
  RadioButton,
  TextField,
} from "@shopify/polaris";
import { useState } from "react";
import Stepper from "./app.stepper";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { json, redirect } from "@remix-run/node";

// Loader function: fetch config from DB
export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const config = await db.productTags.findFirst({
    where: { shop },
  });

  return json({ config: config || {} });
}

// Action function: save form data to DB
export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const formData = await request.formData();
  const displayByTags = formData.get("displayByTags") === "on";
  const rawTagNames = formData.get("tagNames") || "";

  const tagString = rawTagNames
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(",");

  const existingConfig = await db.productTags.findFirst({
    where: { shop },
  });

  try {
    if (existingConfig) {
        await db.productTags.update({
          where: { id: existingConfig.id },
          data: {
            displayByTags,
            tagNames: tagString,
          },
        });
      } else {
      await db.productTags.create({
        data: {
          shop,
          displayByTags,
          tagNames: tagString,
        },
      });
    }

    return redirect("/app/step4");
  } catch (error) {
    console.error("Wishlist config save error:", error);
    return new Response(
      `Error saving wishlist config: ${error.message || error}`,
      { status: 500 }
    );
  }
}

// UI component
export default function Step3() {
  const { config } = useLoaderData();

  const [groupingMode, setGroupingMode] = useState(
    config?.displayByTags ? "tags" : "all"
  );
  const [tagInput, setTagInput] = useState(config?.tagNames || "");

  return (
    <>
      <Stepper />
      <Page title="Wishlist Setup - Step 3">
        <Card sectioned>
          <Form method="post">
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Configure Wishlist Display
              </Text>

              <RadioButton
                label="Show all wishlisted products"
                id="showAll"
                name="groupingMode"
                checked={groupingMode === "all"}
                onChange={() => setGroupingMode("all")}
                value="all"
              />

              <RadioButton
                label="Group wishlist items by product tags"
                id="groupByTags"
                name="groupingMode"
                checked={groupingMode === "tags"}
                onChange={() => setGroupingMode("tags")}
                value="tags"
              />

              {groupingMode === "tags" && (
                <TextField
                  label="Enter tags to group by (comma-separated)"
                  name="tagNames"
                  value={tagInput}
                  onChange={setTagInput}
                  multiline
                />
              )}

              <input
                type="hidden"
                name="displayByTags"
                value={groupingMode === "tags" ? "on" : ""}
              />

              <Button submit>Save and Continue</Button>
            </BlockStack>
          </Form>
        </Card>
      </Page>
    </>
  );
}
