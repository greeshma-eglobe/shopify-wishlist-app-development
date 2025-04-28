import Step1 from "./app.step1";
import { Outlet, useLocation, useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  try {
    const { session } = await authenticate.admin(request);

    if (!session?.shop) {
      throw new Error("Shop data is missing in session.");
    }

    return { shop: session.shop }; // Return plain object (no `json`)
  } catch (error) {
    console.error("Loader Error:", error);
    throw new Response("Failed to load shop data", { status: 500 });
  }
}

export default function AppLayout() {
  const location = useLocation();
  const { shop } = useLoaderData();

  return (
    <>
      {/* Render Step1 only if on "/app" */}
      {location.pathname === "/app" ? <Step1 shop={shop} /> : <Outlet />}
    </>
  );
}
