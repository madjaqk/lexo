import { isRouteErrorResponse, Link, useRouteError } from "react-router"
import "./ErrorPage.css"

export default function ErrorPage() {
    const error = useRouteError()
    let heading = "An error occurred!"
    let message = "Something went wrong."

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
        } else {
            heading = `Error: ${error.status}`
            message = error.statusText
        }
    } else if (error instanceof Error) {
        message = error.message
    }

    return (
        <main className="app-container">
            <div className="error-page">
                <h1>{heading}</h1>
                <p>{message}</p>
                <Link to="/" className="error-page-link">
                    Go to Today's Puzzle
                </Link>
            </div>
        </main>
    )
}
