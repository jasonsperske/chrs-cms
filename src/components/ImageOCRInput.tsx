'use client'
import { ChangeEvent, MouseEvent, SyntheticEvent, useEffect, useState } from "react";
import Tesseract, { setLogging } from "tesseract.js";
import { Button } from "./ui/button";

export default function ImageOCRInput() {
    const [tesseract, setTesseract] = useState<Tesseract.Worker | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [loadingMessage, setLoadingMessage] = useState("")
    const [inputSrc, setInputSrc] = useState("")
    const [resultText, setResultText] = useState("")

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
            setInputSrc(imageUrl)
            const result = await tesseract.recognize(imageUrl)
            const { text } = result.data
            setLoadingMessage('Analyzing with OpenAI...')
            const aiFetch = await fetch('/api/openai', {
                method: 'POST',
                body: text
            })
            const aiData = await aiFetch.json()
            setResultText(JSON.stringify(JSON.parse(aiData.response[0].text.value), undefined, 2))
        } catch (err) {
            console.error(err)
        }
        setIsLoading(false)
    }

    async function handleTerminateClick(): Promise<void> {
        if (tesseract) {
            await tesseract.terminate()
            setLoadingMessage("Canceling analysis")
            setInputSrc("")
            setResultText("")
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
                <>
                    <input disabled={isLoading} type="file" accept="image/png, image/jpeg" onChange={handleImageChange} />
                    <img className="max-h-30" src={inputSrc} />
                    <pre>{resultText}</pre>
                </>
            }
        </div>)
}