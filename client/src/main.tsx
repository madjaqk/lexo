import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router"
import "./index.css"
import ErrorPage from "@/components/ErrorPage"
import App, { loader as appLoader } from "./App.tsx"

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        loader: appLoader,
        hydrateFallbackElement: <p>Loading puzzle...</p>,
        errorElement: <ErrorPage />,
    },
])

// biome-ignore lint/style/noNonNullAssertion: If the document really don't have root, we have bigger problems
createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
)
