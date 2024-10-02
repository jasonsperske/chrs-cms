"use client";
import React, { FormEvent, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Entry } from "@/lib/types/library/Entry";
import { AnalyzeBookResponse } from "@/lib/types/openai/AnalyzedBookResponse";
import { Input } from "./ui/input";
import { bindInput } from "@/lib/utils";

type Props = {
    onSelectVariant: (variant: Entry) => void;
};

export default function MultipleImageInput({ onSelectVariant }: Props) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [variations, setVariations] = useState<Entry[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [section, setSection] = useState("")

    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        setIsProcessing(true);
        setVariations([]);
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        fetch("/api/openai/vision", {
            method: "POST",
            body: formData,
        })
            .then((response) => response.json())
            .then((data) => {
                if (!data.success) {
                    throw new Error("Failed to process images");
                }
                const payload = data.response.choices[0].message.content;
                if (payload.startsWith("```json") && payload.endsWith("```")) {
                    const analyzedBookResponse = new AnalyzeBookResponse(JSON.parse(payload.slice(7, -3)), section)
                    setVariations(analyzedBookResponse.interpretations)
                } else {
                    throw new Error("Failed to parse response");
                }
            })
            .finally(() => setIsProcessing(false));
    }

    function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
        event.preventDefault();
        if (event.dataTransfer.items) {
            setFiles([
                ...files,
                ...Array.from(event.dataTransfer.items)
                    .filter(
                        (item) => item.kind === "file" && item.type.startsWith("image/")
                    )
                    .map((item) => item.getAsFile())
                    .filter((x) => x !== null),
            ]);
        }
    }

    function handleDragOver(event: React.DragEvent<HTMLDivElement>): void {
        event.preventDefault();
    }

    return (
        <>
            <form
                method="POST"
                action="/api/openai/vision"
                encType="multipart/form-data"
                onSubmit={handleSubmit}
                className="flex gap-2"
            >
                <div className="flex flex-col grow gap-2">
                    <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="border border-dashed border-neutral-600 rounded-sm h-22 w-22 grow p-2 gap-2"
                    >
                        <div hidden={files.length > 0}>Drop images here</div>
                        <div hidden={!isProcessing}>Analyzing...</div>
                        <div hidden={isProcessing} className="flex flex-wrap gap-4">
                            {files.map((file, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        className="h-20 w-20 object-cover rounded-xl"
                                    />
                                    <Button
                                        variant="ghost"
                                        size={"icon"}
                                        onClick={() => setFiles(files.filter((_, i) => i !== index))}
                                        className="absolute top-0 right-0 p-1 bg-transparent text-white rounded-full"
                                    >
                                        &times;
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Input value={section} onChange={bindInput(setSection)} placeholder="Section" />
                </div>
                <Button
                    disabled={files.length == 0 || isProcessing}
                    className="flex-none"
                >
                    Submit
                </Button>
            </form>
            {variations.map((variant, index) => (
                <Card
                    key={`variant-${index}`}
                    className="p-2 max-w-sm cursor-pointer"
                    onClick={() => {
                        onSelectVariant(variant);
                        setFiles([]);
                        setVariations([]);
                    }}
                >
                    <CardHeader>{variant.title} ({variant.mediaType})</CardHeader>
                    <CardContent>
                        {variant.author ? <p>by {variant.author}</p> : null}
                        <p>
                            {variant.publishedBy ? `Published by ${variant.publishedBy}` : null}
                            {' '}
                            {variant.publishedLocation}
                            {' '}
                            {variant.publishedOn ? `(${variant.publishedOn})` : null}
                        </p>
                        <p>
                            {variant.edition}{' '}{variant.editionYear ? `(${variant.editionYear})` : null}
                        </p>
                        <p>{variant.serialNumber ? `isbn:${variant.serialNumber}` : null}
                        </p>
                        <p>{variant.catalogNumber ? `catalog:${variant.catalogNumber}` : null}</p>
                    </CardContent>
                </Card>
            ))}
        </>
    );
}
