import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import LoadingPage from "./LoadingPage"

describe("LoadingPage", () => {
    it("should render the loading text", () => {
        render(<LoadingPage />)
        expect(screen.getByRole("heading", { name: /loading puzzle/i })).toBeInTheDocument()
    })
})
