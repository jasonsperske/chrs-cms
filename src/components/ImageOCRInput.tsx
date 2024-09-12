'use client'
import { ChangeEvent, useEffect, useState } from "react";
import Tesseract from "tesseract.js";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "./ui/card";

export type BookVariation = {
    title: string,
    author: string,
    publisher: string,
    yearPublished: number,
    monthPublished: string,
    mediaType: string,
    serialNumber: string,
    catalogNumber: string,
    confidence: number
}

type Props = {
    onSelectVariant: (variant: BookVariation) => void
}

export default function ImageOCRInput({ onSelectVariant }: Props) {
    const [tesseract, setTesseract] = useState<Tesseract.Worker | null>(null)
    const [variations, setVariations] = useState<BookVariation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadingMessage, setLoadingMessage] = useState("")

    function initTesseract() {
        Tesseract.createWorker("eng", Tesseract.OEM.DEFAULT, {
            logger: (message) => {
                console.info(message)
                if (message.status === "recognizing text") {
                    setLoadingMessage(`Analyzing image: ${Math.floor(100 * message.progress)}%`)
                }
            },
            errorHandler: console.error
        }).then((tesseract) => {
            setTesseract(tesseract)
            setIsLoading(false)
        })
    }
    useEffect(() => {
        setLoadingMessage("Loading OCR...")
        initTesseract()
    }, [])

    async function handleImageChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
        if (tesseract == null || event.target.files == null || event.target.files.length != 1) {
            return
        }
        try {
            setLoadingMessage("Analyzing image: 0%")
            setIsLoading(true)
            const imageUrl = URL.createObjectURL(event.target.files[0])
            const result = await tesseract.recognize(imageUrl)
            const { text } = result.data
            setLoadingMessage('Analyzing with OpenAI...')
            const aiFetch = await fetch('/api/openai/ocr', {
                method: 'POST',
                body: text
            })
            const aiData = await aiFetch.json()
            if (aiData.success) {
                const { variations } = JSON.parse(aiData.response[0].text.value) as { variations: BookVariation[] }
                setVariations(variations)
            }
        } catch (err) {
            console.error(err)
        }
        setIsLoading(false)
    }

    async function handleTerminateClick(): Promise<void> {
        if (tesseract) {
            await tesseract.terminate()
            setLoadingMessage("Canceling analysis")
            setVariations([])
            initTesseract()
        }
    }

    return (
        <div className="grid grid-flow-col gap-2 justify-between">
            {isLoading ?
                <>
                    <div>{loadingMessage}</div>
                    {tesseract ? <Button variant="ghost" onClick={handleTerminateClick}>&times;</Button> : null}
                </>
                :
                <div className="flex flex-wrap">
                    <input disabled={isLoading} type="file" accept="image/png, image/jpeg" onChange={handleImageChange} className="w-full" />
                    {variations.map((variant, index) =>
                        <Card
                            key={`variant-${index}`}
                            className="p-2 max-w-sm cursor-pointer"
                            onClick={() => {
                                onSelectVariant(variant)
                                setVariations([])
                            }}>
                            <CardHeader>{variant.title}</CardHeader>
                            <CardContent>
                                {variant.author ? <p>by {variant.author}</p> : null}
                                <p>Published by {variant.publisher} {variant.yearPublished > 1800 ? `(${variant.yearPublished})` : ''}</p>
                            </CardContent>
                            <CardDescription>confidence {Math.floor(variant.confidence * 100)}%</CardDescription>
                        </Card>)
                    }
                </div>
            }
        </div>)
}