import { NextResponse } from 'next/server'
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY']
});

export async function POST(request: Request) {
    const content = await request.text()
    if (content.length === 0) {
        return NextResponse.json({ msg: 'Missing request body!' })
    }
    const assistant = await openai.beta.assistants.retrieve(process.env['OPENAI_ASSISTANT']!)
    const thread = await openai.beta.threads.create({
        messages: [
            {
                role: 'user',
                content
            },
        ],
    });
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: assistant.id,
    });
    if (run.status != 'completed') {
        console.log(run.last_error)
    }
    const messages = await openai.beta.threads.messages.list(thread.id);
    for (const message of messages.getPaginatedItems()) {
        if (message.assistant_id === assistant.id) {
            return NextResponse.json({ success: true, response: message.content })
        }
    }

    return NextResponse.json({ success: false, response: 'OpenAI responded but failed to parse' })
}