import { useState } from "react"
import { useCopyToClipboard } from "usehooks-ts"
import type { WordScore } from "@/types"
import { isMobile } from "@/utils/isMobile"
import { calculateScoreSummary, generateShareText } from "@/utils/shareableText"
import "./ShareButton.css"

interface ShareButtonProps {
    rackScores: WordScore[]
    targetScores: WordScore[]
    date: string
}

export default function ShareButton({ rackScores, targetScores, date }: ShareButtonProps) {
    const [buttonText, setButtonText] = useState("Share")
    const [_copiedText, copy] = useCopyToClipboard()

    const scoreSummary = calculateScoreSummary(rackScores, targetScores)
    const shareText = generateShareText(rackScores, scoreSummary, date)

    async function handleShare() {
        // Use the web share API on mobile; on desktop, just copy to clipboard
        const useNativeShare = "share" in navigator && isMobile()
        console.log(shareText)

        if (useNativeShare) {
            try {
                await navigator.share({
                    title: `[Tile Game Name tk] — ${date}`,
                    text: shareText,
                })
            } catch (error) {
                // User likely cancelled the share, so we can safely ignore the error.
                console.log("Web Share API was cancelled or failed.", error)
            }
        } else {
            copy(shareText)
                .then(() => {
                    setButtonText("Copied!")
                    setTimeout(() => setButtonText("Share"), 2000)
                })
                .catch((err) => {
                    console.error("Failed to copy to clipboard:", err)
                    setButtonText("Failed!")
                    setTimeout(() => setButtonText("Share"), 2000)
                })
        }
    }

    return (
        <button type="button" className="share-button" onClick={handleShare}>
            <span className="material-symbols-outlined">share</span>
            <span>{buttonText}</span>
        </button>
    )
}
