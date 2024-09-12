import { NextResponse } from 'next/server'
import OpenAI from 'openai';
import * as Sharp from 'sharp'

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY']
});

export async function POST(request: Request) {
    const assistant = await openai.beta.assistants.retrieve(process.env['OPENAI_VISION_ASSISTANT']!)

    return NextResponse.json({ success: false, response: 'OpenAI responded but failed to parse' })
}