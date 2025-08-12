import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router"
import "./index.css"
import App, { loader as appLoader } from "./App.tsx"

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        loader: appLoader,
        // TODO: Add a dedicated error page component for a better user experience
        // errorElement: <ErrorPage />,
    },
])

// biome-ignore lint/style/noNonNullAssertion: If the document really don't have root, we have bigger problems
createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
)
