import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router"
import "./index.css"
import "./fonts.css"
import * as Sentry from "@sentry/react"
import ErrorPage from "@/components/ui/shared/ErrorPage/ErrorPage.tsx"
import LoadingPage from "@/components/ui/shared/LoadingPage/LoadingPage.tsx"
import App, { loader as appLoader } from "./App.tsx"

Sentry.init({
    dsn: "https://c102f38130ccb3678b56bc8adbe959df@o4510007912366080.ingest.us.sentry.io/4510007917477888",
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
})

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        loader: appLoader,
        hydrateFallbackElement: <LoadingPage />,
        errorElement: <ErrorPage />,
    },
])

// biome-ignore lint/style/noNonNullAssertion: If the document really don't have root, we have bigger problems
createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
)
