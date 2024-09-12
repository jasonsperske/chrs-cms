'use client'
import { FormEvent, useState } from "react"
import { BookVariation } from "./ImageOCRInput"
import { Button } from "./ui/button"

type Props = {
    onSelectVariant: (variant: BookVariation) => void
}

export default function MultipleImageInput({ onSelectVariant }: Props) {
    const [receivingFiles, setReceivingFiles] = useState(false)

    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        throw new Error("Function not implemented.")
    }

    function handleDragEnter() {
        setReceivingFiles(true)
    }

    return (
        <form method="POST" action="/api/openai/vision" encType="multipart/form-data" onDragEnter={handleDragEnter} onSubmit={handleSubmit}>
            <div className="border border-solid border-neutral-600 rounded-sm">
                <div hidden={!receivingFiles}>Drop images here</div>
            </div>
            <Button>Submit</Button>
        </form>)
}