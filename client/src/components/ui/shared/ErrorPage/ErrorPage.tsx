import { isRouteErrorResponse, Link, useRevalidator, useRouteError } from "react-router"
import "./ErrorPage.css"

export default function ErrorPage() {
    const error = useRouteError()
    const revalidator = useRevalidator()
    let heading = "An error occurred!"
    let message = "Something went wrong."
    let showRetryButton = false

    if (isRouteErrorResponse(error)) {
        if (error.status === 404) {
            heading = "Puzzle Not Found"
            message = "Sorry, we couldn't find a puzzle for that date. Please try another."
        } else if (error.status === 403) {
            heading = "No spoilers!"
            message = "Please select a date that has already happened."
        } else if (error.status === 422) {
            heading = "Invalid Date Format"
            message = "The date in the URL is not valid. Please check the format (YYYY-MM-DD)."
        } else if (error.status >= 500) {
            heading = `Server Error: ${error.status}`
            message = "We're having some trouble on our end. Please try again in a moment."
            showRetryButton = true
        } else {
            heading = `Error: ${error.status}`
            message = error.statusText
        }
    } else if (error instanceof Error) {
        // This often indicates a network error where the fetch itself failed,
        // or a client-side error during rendering. Retrying is a good option.
        message = error.message
        showRetryButton = true
    }

    const isRetrying = revalidator.state === "loading"

    return (
        <main className="app-container">
            <div className="error-page">
                <h1>{heading}</h1>
                <p>{message}</p>
                <div className="error-page-actions">
                    <Link to="/" className="error-page-link">
                        Go to Today's Puzzle
                    </Link>
                    {showRetryButton && (
                        <button
                            type="button"
                            onClick={() => revalidator.revalidate()}
                            disabled={isRetrying}
                        >
                            {isRetrying ? "Retrying..." : "Try Again"}
                        </button>
                    )}
                </div>
            </div>
        </main>
    )
}
